using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.Azure.Devices.Client;
using Microsoft.Azure.Devices.Shared;
using Newtonsoft.Json;

using SmartHive.CloudConnection.Events;

namespace SmartHive.CloudConnection
{
    public sealed class DeviceConnection
    {

        static string DeviceConnectionString = "HostName=<yourIotHubName>.azure-devices.net;DeviceId=<yourIotDeviceName>;SharedAccessKey=<yourIotDeviceAccessKey>";
        static DeviceClient Client = null;        
        static TwinCollection reportedProperties = new TwinCollection();

        public event EventHandler<OnEvenLogWriteEventArgs> OnEventLog;

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

        async void LogEvent(EventTypeConsts eventType, string Message, string Description)
        {
            string EventTypeName = Enum.GetName(typeof(EventTypeConsts), eventType);

            if (OnEventLog != null)
            {
                var dispatcher = DispatcherHelper.GetDispatcher;
                await dispatcher.RunAsync(Windows.UI.Core.CoreDispatcherPriority.Normal, () =>
                {
                    OnEventLog.Invoke(EventTypeName, new OnEvenLogWriteEventArgs()
                    {
                        EventType = EventTypeName,
                        Message = Message,
                        Description = Description
                    });
                });
            }
            else
            {
                MessageHelper.ShowToastMessage(Message, Description);
            }
        }


        public async void InitTelemetry()
        {
            try
            {
               
                TwinCollection telemetryConfig = new TwinCollection();

                telemetryConfig["configId"] = "0";
                telemetryConfig["sendFrequency"] = "24h";
                reportedProperties["telemetryConfig"] = telemetryConfig;
                LogEvent(EventTypeConsts.Info, "Initial config", JsonConvert.SerializeObject(reportedProperties));

                

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
    }
}
