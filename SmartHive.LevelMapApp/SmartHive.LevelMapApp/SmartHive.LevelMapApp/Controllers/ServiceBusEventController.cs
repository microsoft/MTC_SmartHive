using System;
using SmartHive.Models.Config;
using SmartHive.Models.Events;
using System.Collections.Generic;
using System.Threading;
using System.Globalization;
using System.Linq;
using System.Text;

namespace SmartHive.LevelMapApp.Controllers
{
    public  class ServiceBusEventController : AbstractController
    {
        private IEventTransport transport;
        private ILevelMapController mapController;
        private ILevelConfig levelConfig;

        public event EventHandler<IRoomSensor> OnRoomSensorChanged;
        public event EventHandler<Appointment> OnRoomScheduleStatusChanged;

        private Dictionary<string, Appointment[]> LevelSchedule = new Dictionary<string, Appointment[]>();

        private bool BackgroundStatusUpdateEnabled = true;
        private TimeSpan taskScheduleCheckInterval = TimeSpan.FromMinutes(10);

#if !__ANDROID__
        private Mutex updateMutex = new Mutex(false, "LevelViewModelUpdateMutex");
#endif
        public ServiceBusEventController(IEventTransport transport, ISettingsProvider settingsProvider)
        {
            //TODO : Add Factory method to choose map provider
            this.mapController = new WireGeoRoomController(settingsProvider);
            this.OnRoomSensorChanged += this.mapController.OnRoomSensorChanged;
            this.OnRoomScheduleStatusChanged += this.mapController.OnRoomScheduleStatusChanged;

            string levelId = settingsProvider.GetPropertyValue(SettingsConst.DefaultLevel_PropertyName);
            this.levelConfig = settingsProvider.GetLevelConfig(levelId);

            this.transport = transport;            
            
            // Check if settings loaded or wait until Configuration will be ready for that
            if (this.levelConfig.isLoaded)
                InitTransport();
            else
                this.levelConfig.OnSettingsLoaded += LevelConfig_OnSettingsLoaded;


            StartUpdateTimer();
        }       

        private void StartUpdateTimer()
        {
            Xamarin.Forms.Device.StartTimer(taskScheduleCheckInterval, () =>
            {
                this.AppController.TrackAppEvent("Update cached rooms. Cached rooms count: " + LevelSchedule.Keys.Count);
                if (LevelSchedule.Keys.Count > 0)
                { // Update runs only if we have cached data (connection works well)
                    foreach (IRoomConfig room in this.levelConfig.RoomsConfig)
                    {
                        try
                        {
#if !__ANDROID__
                                    updateMutex.WaitOne(5 * 1000);                                    
#endif
                            UpdateRoomStatus(room, null);
                            this.AppController.BeginInvokeOnMainThread(() =>
                            {

                                this.OnRoomScheduleStatusChanged(room, room.CurrentAppointment);
                            });
                        }
                        catch (Exception ex)
                        {
                            this.AppController.TrackAppException(ex);
                        }
                        finally
                        {
#if !__ANDROID__
                                    updateMutex.ReleaseMutex();
#endif
                        }
                    }
                }
                return BackgroundStatusUpdateEnabled;
            });
        }

        internal Appointment[] RoomSchedule(string RoomId)
        {
            if (LevelSchedule.ContainsKey(RoomId))
            {
                return LevelSchedule[RoomId];
            }
            else
            {
                return null;
            }

        }

        private void InitTransport()
        {
            this.transport.OnServiceBusConnected += Transport_OnServiceBusConnected;            
            this.transport.Connect(this.levelConfig);
        }

        private void LevelConfig_OnSettingsLoaded(object origin, bool isSuccess)
        {
            //Configuration loaded sucessfully
            if (isSuccess)
            {
                this.AppController.TrackAppEvent("LevelConfig_OnSettingsLoaded");
                InitTransport();
            }
            else
            {
                //Error loading configuration - exception is in origin
                if (origin is Exception)
                {
                    this.AppController.TrackAppException(origin as Exception);
                }
            }
        }

        private void Transport_OnServiceBusConnected(object sender, string e)
        {
            this.AppController.TrackAppEvent("Transport_OnServiceBusConnected");
            this.transport.OnScheduleUpdate += Transport_OnScheduleUpdate;
            this.transport.OnNotification += Transport_OnNotification;
        }

        private void Transport_OnNotification(object sender, OnNotificationEventArgs e)
        {
            try
            {
#if !__ANDROID__
                  updateMutex.WaitOne(5 * 1000);                        
#endif
                // Log this event
                this.AppController.TrackAppEvent(e);

                IRoomConfig roomConfig = this.levelConfig.GetRoomConfigForSensorDeviceId(e.DeviceId);
                if (roomConfig != null)
                {
                    var sensor = roomConfig.RoomSensors.FirstOrDefault<IRoomSensor>(s => s.DeviceId.Equals(e.DeviceId) && s.Telemetry.Equals(e.ValueLabel));

                    bool IsChanged = false;

                    if (sensor != null)
                    {
                        // Check if value was changed
                        IsChanged = sensor.LastMeasurement == null || (!string.IsNullOrEmpty(sensor.LastMeasurement.Value) && !sensor.LastMeasurement.Value.Equals(e.Value));
                        sensor.LastMeasurement = e;
                        if (IsChanged && this.OnRoomSensorChanged != null)
                        {
                            UpdateRoomStatus(roomConfig, sensor);
                            this.AppController.BeginInvokeOnMainThread(() =>
                            {
                                this.OnRoomSensorChanged.Invoke(roomConfig, sensor);
                            });
                        }
                    }
                }
                else
                {
                    this.AppController.TrackAppEvent("Error: no config found for " + e.DeviceId);
                }          
            }catch(Exception ex)
            {
                this.AppController.TrackAppEvent("Transport_OnNotification Error");
                this.AppController.TrackAppException(ex);
            }
            finally
            {
                #if !__ANDROID__
                                    updateMutex.ReleaseMutex();
                 #endif
            }
        }

        /// <summary>
        /// Calculate IRoomConfig.RoomStatus property based on last events
        /// </summary>
        /// <param name="roomConfig"></param>
        /// <param name="sensor"></param>
        private void UpdateRoomStatus(IRoomConfig roomConfig, IRoomSensor sensor)
        {
            if (roomConfig == null)
                return; // Nothing to do;

            // If this is PiR a sensor telemetry 
            IRoomSensor piRSensor = null;
            if (sensor != null && NotificationEventSchema.PirSensorValueLabel.Equals(sensor.Telemetry)) 
            {
                piRSensor = sensor;
            }
            else if (roomConfig.RoomSensors != null)
            {
                // If Not - extract sensor from Room Config
                piRSensor = roomConfig.RoomSensors.FirstOrDefault<IRoomSensor>(s => NotificationEventSchema.PirSensorValueLabel.Equals(s.Telemetry));
            }

            DateTime leeWayEndTime = DateTime.Now.AddSeconds(roomConfig.EventLeewaySeconds);
            // Remove outdated appointments
            // TODO? Perform this check for all rooms ?
            if (roomConfig.CurrentAppointment != null && leeWayEndTime >= roomConfig.CurrentAppointment.EndDateTime)
            { // Check if room appointment expired
                roomConfig.CurrentAppointment = null;
            }
           

            bool isPirOn = false;

            if (piRSensor != null && piRSensor.LastMeasurement != null 
                && !Boolean.TryParse(piRSensor.LastMeasurement.Value, out isPirOn))// PiR sensor changed
            {
                // Pir Sensor can be a number value in some case
                double PiR = -1.0;
                if (Double.TryParse(piRSensor.LastMeasurement.Value, out PiR))
                {
                    isPirOn = PiR > 0.0;
                }                
            }

            if (isPirOn) //Presense detected
            {
                if (roomConfig.CurrentAppointment != null)
                    roomConfig.RoomStatus = RoomStatus.RoomScheduledAndOccupied;
                else
                    roomConfig.RoomStatus = RoomStatus.RoomOccupied;
            }
            else // No presence in the room
            {
                if (roomConfig.CurrentAppointment != null)
                    roomConfig.RoomStatus = RoomStatus.RoomScheduled;
                else
                    roomConfig.RoomStatus = RoomStatus.RoomFree;
            }
        }

        private void Transport_OnScheduleUpdate(object sender, OnScheduleUpdateEventArgs e)
        {

            try
            {
#if !__ANDROID__
                        updateMutex.WaitOne(5 * 1000);                        
#endif


                // Log this event
                this.AppController.TrackAppEvent(e);

                IRoomConfig roomConfig = this.levelConfig.GetRoomConfig(e.RoomId);
                if (roomConfig == null)
                {
                    // Log this event
                    this.AppController.TrackAppEvent("Error: no config for RoomId:" + e.RoomId);
                    return;
                }

                Appointment currentAppointment = null;
                if (e.Schedule != null && e.Schedule.Length > 0)
                {
                    //Assume event started early to add leeway
                    DateTime leeWayStartTime = DateTime.Now.AddSeconds(roomConfig.EventLeewaySeconds);
                    currentAppointment = e.Schedule.FirstOrDefault<Appointment>(a => leeWayStartTime >= a.StartDateTime);
                }

                // save Schedule information for the room
                if (this.LevelSchedule.ContainsKey(e.RoomId))
                    this.LevelSchedule[e.RoomId] = e.Schedule;
                else
                    this.LevelSchedule.Add(e.RoomId, e.Schedule);

                bool IsChanged = false;
                if (roomConfig.CurrentAppointment != null)
                {
                    IsChanged = !new AppointmentComparer().Equals(roomConfig.CurrentAppointment, currentAppointment);
                }
                else
                {
                    IsChanged = roomConfig.CurrentAppointment != currentAppointment;
                }

                if (currentAppointment != null)
                    roomConfig.CurrentAppointment = currentAppointment;
                else
                    roomConfig.CurrentAppointment = null;

                if (IsChanged && this.OnRoomScheduleStatusChanged != null)
                {
                    UpdateRoomStatus(roomConfig, null);
                    this.AppController.BeginInvokeOnMainThread(() =>
                    {
                        this.OnRoomScheduleStatusChanged(roomConfig, currentAppointment);
                    });


                }
            }
            catch (Exception ex)
            {
                this.AppController.TrackAppEvent("Transport_OnScheduleUpdate Error");
                this.AppController.TrackAppException(ex);
            }
            finally
            {
#if !__ANDROID__
                                    updateMutex.ReleaseMutex();
#endif
            }
        }

    }
}
