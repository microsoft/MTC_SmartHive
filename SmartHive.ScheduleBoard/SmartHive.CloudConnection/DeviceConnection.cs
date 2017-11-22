using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

//using Microsoft.Azure.Devices.Client;



using Newtonsoft.Json;

using SmartHive.CloudConnection.Events;


using Windows.System.Threading;
using Windows.Storage;

namespace SmartHive.CloudConnection
{
    public sealed class DeviceConnection
    {

        //const string DeviceConnectionString = "HostName=MTCScheduleBoard.azure-devices.net;DeviceId={0};SharedAccessKey={1}";
       // static DeviceClient Client = null;        
       // static TwinCollection reportedProperties = new TwinCollection();

        private ServiceBusConnection Connection = null;

        ThreadPoolTimer _periodicTimer = null;



        internal DeviceConnection(ServiceBusConnection busConnection)
        {
            this.Connection = busConnection;

            _periodicTimer = ThreadPoolTimer.CreatePeriodicTimer(new TimerElapsedHandler(PeriodicDeviceTaskCallback),
                TimeSpan.FromMinutes(1*10));

            this.Connection.OnScheduleUpdate += BusConnection_OnScheduleUpdate;
            this.Connection.OnServiceBusConnected += BusConnection_OnServiceBusConnected;
            this.Connection.OnNotification += BusConnection_OnNotification;

          //  InitClient();
          //  InitTelemetry();
        }
        
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

  /*      public void InitClient()
        {
            try
            {
                //  Console.WriteLine("Connecting to hub");
                string connStr = String.Format(DeviceConnectionString, Connection.SubscriptionName, Connection.SasKey);

                Client = DeviceClient.CreateFromConnectionString(connStr, TransportType.Mqtt);
            }
            catch (Exception ex)
            {
                LogEvent(EventTypeConsts.Error, "DeviceClient error", ex.Message);
               
            }
        }*/

         void LogEvent(EventTypeConsts eventType, string Message, string Description)
        {
            if (this.Connection != null)
            {
                this.Connection.LogEvent(eventType, Message, Description);
            }
        }

/*
        public async void InitTelemetry()
        {
            try
            {
                //string serializedSettings = JsonConvert.SerializeObject(Windows.Storage.ApplicationData.Current.LocalSettings.Values);
                var twin = await Client.GetTwinAsync();

                TwinCollection telemetryConfig = new TwinCollection();

                  telemetryConfig["last_notification_time"] = "0";
                  telemetryConfig["last_scheduleupdate_time"] = "0";
                


                reportedProperties["telemetryConfig"] = telemetryConfig;
                
              //  reportedProperties["telemetryConfig"] = serializedSettings;
              //  LogEvent(EventTypeConsts.Info, "Initial config", serializedSettings);

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
*/
        
        //
        // Simulate the background task activity.
        //
        private void PeriodicDeviceTaskCallback(ThreadPoolTimer timer)
        {
            
            if (this.Connection != null)
            {
                    this.Connection.keepConnection();
            }                                
        }
    }
}
