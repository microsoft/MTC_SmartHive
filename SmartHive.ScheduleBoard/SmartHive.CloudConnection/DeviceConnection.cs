using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.Azure.Devices.Client;
using Microsoft.Azure.Devices.Shared;
using Newtonsoft.Json;

using SmartHive.CloudConnection.Events;

using Windows.ApplicationModel.Background;
using Windows.System.Threading;
using Windows.Storage;

namespace SmartHive.CloudConnection
{
    public sealed class DeviceConnection : IBackgroundTask
    {

        static string DeviceConnectionString = "HostName=<yourIotHubName>.azure-devices.net;DeviceId=<yourIotDeviceName>;SharedAccessKey=<yourIotDeviceAccessKey>";
        static DeviceClient Client = null;        
        static TwinCollection reportedProperties = new TwinCollection();
        
        

        BackgroundTaskCancellationReason _cancelReason = BackgroundTaskCancellationReason.Abort;
        volatile bool _cancelRequested = false;
        BackgroundTaskDeferral _deferral = null;
        ThreadPoolTimer _periodicTimer = null;       
        IBackgroundTaskInstance _taskInstance = null;

        private static bool ServiceBusInitialized = false;
        
        private void BusConnection_OnNotification(object sender, OnNotificationEventArgs e)
        {
            
        }

        private void BusConnection_OnServiceBusConnected(object sender, string e)
        {
            
        }

        /// <summary>
        /// Store last time of schedule update notification
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void BusConnection_OnScheduleUpdate(object sender, IList<Appointment> e)
        {
            
        }

        public void InitClient()
        {
            try
            {
              //  Console.WriteLine("Connecting to hub");
                Client = DeviceClient.CreateFromConnectionString(DeviceConnectionString, TransportType.Mqtt);
            }
            catch (Exception ex)
            {
                LogEvent(EventTypeConsts.Error, "DeviceClient error", ex.Message);
               
            }
        }

         void LogEvent(EventTypeConsts eventType, string Message, string Description)
        {
            if (ServiceBusConnection.Connection != null)
            {
                ServiceBusConnection.Connection.LogEvent(eventType, Message, Description);
            }
        }


        public async void InitTelemetry()
        {
            try
            {
                string serializedSettings = JsonConvert.SerializeObject(Windows.Storage.ApplicationData.Current.LocalSettings.Values);


                 TwinCollection telemetryConfig = new TwinCollection();
                
                telemetryConfig["configId"] = "0";
                telemetryConfig["sendFrequency"] = "24h";
                reportedProperties["telemetryConfig"] = telemetryConfig;
                LogEvent(EventTypeConsts.Info, "Initial config", serializedSettings);

                

                await Client.UpdateReportedPropertiesAsync(reportedProperties);
            }
            catch (AggregateException ex)
            {
                foreach (Exception exception in ex.InnerExceptions)
                {
                    LogEvent(EventTypeConsts.Error, "Init Telemetry Error", ex.Message);
                }
            }
            catch (Exception ex)
            {
                LogEvent(EventTypeConsts.Error, "Init Telemetry Error", ex.Message);
            }
        }

        
        /**
         * Entry point for the background task
         **/
        public void Run(IBackgroundTaskInstance taskInstance)
        {
            LogEvent(EventTypeConsts.Info, "DeviceConnection task starting", taskInstance.Task.Name);
            
            //
            // Query BackgroundWorkCost
            // TODO: If BackgroundWorkCost is high, then perform only the minimum amount
            // of work in the background task and return immediately.
            //
            var cost = BackgroundWorkCost.CurrentBackgroundWorkCost;

            //
            // Associate a cancellation handler with the background task.
            //
            taskInstance.Canceled += new BackgroundTaskCanceledEventHandler(OnCanceled);


            //
            // Get the deferral object from the task instance, and take a reference to the taskInstance;
            //
            _deferral = taskInstance.GetDeferral();
            _taskInstance = taskInstance;

            _periodicTimer = ThreadPoolTimer.CreatePeriodicTimer(new TimerElapsedHandler(PeriodicDeviceTaskCallback), 
                TimeSpan.FromSeconds(60));
           
        }


        //
        // Handles background task cancellation.
        //
        private void OnCanceled(IBackgroundTaskInstance sender, BackgroundTaskCancellationReason reason)
        {
            //
            // Indicate that the background task is canceled.
            //
            _cancelRequested = true;
            _cancelReason = reason;
            
            //TODO: Report to IoT Hub

            LogEvent(EventTypeConsts.Info, "Background " + sender.Task.Name + " Cancel Requested...", reason.ToString());
            
        }

        //
        // Simulate the background task activity.
        //
        private void PeriodicDeviceTaskCallback(ThreadPoolTimer timer)
        {
            if (_cancelRequested == false) 
            {

                // Do work
                if (ServiceBusConnection.Connection != null)
                {
                    if (ServiceBusInitialized)
                    {
                        ServiceBusConnection.keepConnection();
                    }
                    else
                    {
                        ServiceBusConnection.Connection.OnScheduleUpdate += BusConnection_OnScheduleUpdate;
                        ServiceBusConnection.Connection.OnServiceBusConnected += BusConnection_OnServiceBusConnected;
                        ServiceBusConnection.Connection.OnNotification += BusConnection_OnNotification;
                        ServiceBusInitialized = true;
                    }
                }

            }
            else
            {
                _periodicTimer.Cancel();

                var key = _taskInstance.Task.Name;

                //
                // Record that this background task ran.
                //
                //String taskStatus = (_progress < 100) ? "Canceled with reason: " + _cancelReason.ToString() : "Completed";
                //var settings = ApplicationData.Current.LocalSettings;
                //settings.Values[key] = taskStatus;
                LogEvent(EventTypeConsts.Info, "Background task " + _taskInstance.Task.Name + "canceled", 
                    "Canceled with reason: " + _cancelReason.ToString());

                //
                // Indicate that the background task has completed.
                //
                _deferral.Complete();
            }
        }
    }
}
