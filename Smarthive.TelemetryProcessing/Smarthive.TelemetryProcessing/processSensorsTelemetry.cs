
using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.Extensions.Logging;
using Microsoft.Azure.EventHubs;
using Microsoft.Extensions.Configuration;
using System.Data.SqlClient;
using System.Text;
using System.Net.Http;

namespace Smarthive.TelemetryProcessing
{

   
    public static class processSensorsTelemetry
    {
        private const string InsertSensorDataSql = "INSERT INTO DeviceTelemetry (RowKey, Timestamp, TelemetryTime,DeviceId, IoTHubDeviceId,ValueLabel,ValueUnits, Type,Value) " +
        "VALUES( @RowKey, @Timestamp, @TelemetryTime, @DeviceId,@IoTHubDeviceId, @ValueLabel,@ValueUnits, @Type,@Value)";

        [FunctionName("processSensorsTelemetry")]
        public static void Run([EventHubTrigger("%IoTHubName%", Connection = "EventHubConnection",
            ConsumerGroup = "%ConsumerGroup%")]EventData deviceIoTHubMessage, 
            ILogger log, ExecutionContext context)
        {
            try
            {
                if (deviceIoTHubMessage == null ||
                   (deviceIoTHubMessage.Body == null || deviceIoTHubMessage.Body.Array == null))
                    return;

                var config = new ConfigurationBuilder()
                    .SetBasePath(context.FunctionAppDirectory)
                    .AddJsonFile("local.settings.json", optional: true, reloadOnChange: true)
                    .AddEnvironmentVariables()
                    .Build();

                var DeviceID = deviceIoTHubMessage.SystemProperties["iothub-connection-device-id"] as string;
                //var sMessageId = deviceIoTHubMessage.SystemProperties["iothub-connection-auth-generation-id"] as string;
                string jsonBody = Encoding.UTF8.GetString(deviceIoTHubMessage.Body.Array);
                DateTime Timestamp = (DateTime) deviceIoTHubMessage.SystemProperties["iothub-enqueuedtime"];
                log.LogInformation(String.Format("device: {0} message: {1}", DeviceID, jsonBody));
                                
                // Parse message
                OnNotificationEventArgs eventData = JsonConvert.DeserializeObject<OnNotificationEventArgs>(jsonBody);
                var str = config.GetConnectionString("TelemetryTableConnection");
                DateTime eventDataTime = DateTime.Parse(eventData.Time);

                using (SqlConnection conn = new SqlConnection(str))
                {
                    conn.Open();
                    using (SqlCommand insertCommand = new SqlCommand(InsertSensorDataSql, conn)) {
                        // Execute the command and log the # rows affected.
                       // insertCommand.Parameters.AddWithValue("@PartitionKey", eventDataTime.ToString("yyyy-MM"));
                        insertCommand.Parameters.AddWithValue("@RowKey", Guid.NewGuid().ToString());
                        insertCommand.Parameters.AddWithValue("@Timestamp", Timestamp);
                        insertCommand.Parameters.AddWithValue("@TelemetryTime", eventDataTime);
                        insertCommand.Parameters.AddWithValue("@DeviceId", eventData.DeviceId);
                        insertCommand.Parameters.AddWithValue("@IoTHubDeviceId", DeviceID);
                        insertCommand.Parameters.AddWithValue("@ValueLabel", eventData.ValueLabel);
                        insertCommand.Parameters.AddWithValue("@ValueUnits", eventData.ValueUnits);
                        insertCommand.Parameters.AddWithValue("@Type", eventData.Type);
                        insertCommand.Parameters.AddWithValue("@Value", eventData.Value);
                        
                        var rows = insertCommand.ExecuteNonQuery();
                        log.LogInformation($"{rows} rows were inserted");                        
                    }
                }
            }
            catch (Exception ex)
            {
                log.LogError("Processing error: ", ex);
                return;
            }
        }
    }

    public class OnNotificationEventArgs
    {
        public string DeviceId { get; set; }
        public string Time { get; set; }
        public string ValueLabel { get; set; }
        public string ValueUnits { get; set; }
        public string Type { get; set; }
        public string Value { get; set; }

    }
}