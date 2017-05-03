using System;
using SmartHive.Models.Config;
using SmartHive.Models.Events;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace SmartHive.LevelMapApp.Controllers
{
    public  class ServiceBusEventController
    {
        private IEventTransport transport;
        private ILevelMapController mapController;
        private ILevelConfig levelConfig;

        event EventHandler<IRoomSensor> OnRoomSensorChanged;
        public ServiceBusEventController(IEventTransport transport, ISettingsProvider settingsProvider)
        {
            //TODO : Add Factory method to choose map provider
            this.mapController = new WireGeoRoomController(settingsProvider);
            this.OnRoomSensorChanged += this.mapController.OnRoomSensorChanged;

            string levelId = settingsProvider.GetPropertyValue(SettingsConst.DefaultLevel_PropertyName);
            this.levelConfig = settingsProvider.GetLevelConfig(levelId);

            this.transport = transport;            
            
            // Check if settings loaded or wait until Configuration will be ready for that
            if (this.levelConfig.isLoaded)
                InitTransport();
            else
                this.levelConfig.OnSettingsLoaded += LevelConfig_OnSettingsLoaded;
        }       

        private void InitTransport()
        {
            this.transport.OnServiceBusConnected += Transport_OnServiceBusConnected;            
            this.transport.Connect(this.levelConfig);
        }

        private void LevelConfig_OnSettingsLoaded(object sender, bool e)
        {
            InitTransport();
        }

        private void Transport_OnServiceBusConnected(object sender, string e)
        {
            this.transport.OnScheduleUpdate += Transport_OnScheduleUpdate;
            this.transport.OnNotification += Transport_OnNotification;
        }

        private void Transport_OnNotification(object sender, OnNotificationEventArgs e)
        {
            IRoomConfig roomConfig = this.levelConfig.GetRoomConfigForSensorDeviceId(e.DeviceId);
            if (roomConfig != null)
            {
                var sensor = roomConfig.RoomSensors.FirstOrDefault<IRoomSensor>(s => s.DeviceId.Equals(e.DeviceId) && s.Telemetry.Equals(e.ValueLabel));

                bool IsChanged = false;
                                                
                if (sensor != null)
                {
                    // Check if value was changed
                    IsChanged = sensor.LastMeasurement == null|| (!string.IsNullOrEmpty(sensor.LastMeasurement.Value) && !sensor.LastMeasurement.Value.Equals(e.Value)); 
                    sensor.LastMeasurement = e;
                    if (IsChanged && this.OnRoomSensorChanged != null)
                        this.OnRoomSensorChanged.Invoke(roomConfig, sensor);
                }
            }
        }
        


        private void Transport_OnScheduleUpdate(object sender, OnScheduleUpdateEventArgs e)
        {
            
        }
      
    }
}
