using System;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.ServiceBus;
using Microsoft.ServiceBus.Messaging;
using InfoboardSvc.Common;
using InfoboardSvc.Common.Data;
using System.Configuration;
using Microsoft.ApplicationInsights;


namespace InfoboardSvc.WebJob
{
   public class Functions
    {

        /*
         * https://azure.microsoft.com/en-us/blog/extensible-triggers-and-binders-with-azure-webjobs-sdk-1-1-0-alpha1/
         * **/
        public static void ProcessTimer([TimerTrigger("00:05:00", RunOnStartup = true)] TimerInfo infoe)
        {
            //message = info.FormatNextOccurrences(1);
            int sentCount = new ScheduleUpdateController().SendAppoinments();
            Console.WriteLine(String.Format("Sent {0} appointments at {1}", new object[] { sentCount, DateTime.Now }));

        }

        /***
         * https://github.com/Azure/azure-webjobs-sdk/wiki/EventHub-support
         */
        public static void HandleSensorsTelemetry([EventHubTrigger("YOUREVENTHUBNAME",ConsumerGroup = "YOURCONSUMERGROUPNAME")] EventData[] messages)
        {
            string instrumentationKey = ConfigurationManager.AppSettings["Microsoft.ApplicationInsights.Key"];
            TelemetryClient telemetry = null;
            if (!string.IsNullOrEmpty(instrumentationKey))
            {
                telemetry = new TelemetryClient();
                telemetry.InstrumentationKey = instrumentationKey;
                telemetry.Context.User.Id = "InfoboardSvc.WebJob.MYOFFICEID";
            }

            try
            {
                int sentCount = new SensorNotificationController().SendTelemetry(telemetry, messages);

                
                if (telemetry != null)
                    telemetry.TrackMetric("TelemetryBatchSize", sentCount);
                else
                    Console.WriteLine(String.Format("Sent {0} notifications at {1}", new object[] { sentCount, DateTime.Now }));

            }catch(Exception ex)
            {
                if (telemetry != null)
                    telemetry.TrackException(ex);
            }
            finally
            {
                if (telemetry != null)
                    telemetry.Flush();
            }
        }

    }
}
