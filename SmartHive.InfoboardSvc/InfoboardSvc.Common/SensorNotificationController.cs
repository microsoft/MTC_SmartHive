using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using Newtonsoft.Json;
using InfoboardSvc.Common.Data;
using InfoboardSvc.Common.Transport;
using Microsoft.ServiceBus.Messaging;
using Microsoft.ApplicationInsights;
using System.Configuration;
using System.Globalization;

namespace InfoboardSvc.Common
{
    public class SensorNotificationController : BasicController
    {
        protected static string ClientTimeZone = ConfigurationManager.AppSettings["ClientTimeZone"];
        protected static TimeZoneInfo clientTimeZoneInfo = string.IsNullOrEmpty(ClientTimeZone) ? 
                                                    TimeZoneInfo.Local : TimeZoneInfo.FindSystemTimeZoneById(ClientTimeZone);

        public int SendTelemetry(TelemetryClient appInsights, EventData[] notifications)
        {
            int sentCount = 0;
            ITransport transport = TransportFactory.Transport;
            foreach (EventData message in notifications)
            {
                string jsonBody = Encoding.UTF8.GetString(message.GetBytes());

               // if (!string.IsNullOrEmpty(jsonBody))
                try {
                   //     jsonBody = jsonBody.Replace("DeviceID", "DeviceId");

                    OnNotificationEventArgs eventData = JsonConvert.DeserializeObject<OnNotificationEventArgs>(jsonBody);
                    
                    if (!string.IsNullOrEmpty(eventData.DeviceId) )
                    {
                       // double delay = NotificationDelay(eventData.Time);
                      //  if (delay >= -10.0 && delay < 60.0)
                      //  {
                            RoomConfig config = GetRoomConfigForDevice(eventData.DeviceId);

                            if (config != null)
                            {
                                
                                transport.SendJson(jsonBody, config);
                                sentCount++;
                            if (appInsights != null)
                            {
                                this.TimeToProcessMetric(appInsights, eventData);
                                appInsights.TrackEvent(eventData.ValueLabel);
                            }
                            else
                                Console.Out.WriteLine(string.Format("Sucessfully sent {0}  device ID {1} location {2} ", eventData.ValueLabel, eventData.DeviceId, config.Location));
                            }
                            else
                            {
                                Console.Out.WriteLine("No configuration for device id {0}", eventData.DeviceId);
                                if (appInsights != null)
                                {
                                    appInsights.TrackEvent("TelemetryNoDeviceConfig", toDictionary(eventData));
                                }
                            }
                        /*}
                        else
                        {
                            Console.Out.WriteLine("Telemetry is too old. Telemetry time: {0}", eventData.Time);
                            if (appInsights != null)
                            {
                                appInsights.TrackEvent("TelemetryExpired", toDictionary(eventData));
                            }
                        }*/
                    }else
                    {
                        string errMsg = String.Format("No device id in the message {0}", jsonBody);
                        Console.Out.WriteLine(errMsg);

                        if (appInsights != null)
                        {                            
                                appInsights.TrackTrace(errMsg);                           
                        }
                        
                    }
                }
                catch(Exception ex) 
                {
                    string errMsg = String.Format("Error {0} for message {1}", ex.Message, jsonBody);
                    Console.Out.WriteLine(errMsg);
                    if (appInsights != null)
                    {
                        appInsights.TrackException(ex);
                        appInsights.TrackTrace(errMsg);
                    }
                    
                }

               
            }

            return sentCount;
        }



        protected Dictionary<string,string> toDictionary( OnNotificationEventArgs eventData)
        {
            Dictionary<string, string> retValue = new Dictionary<string, string>(6);
            retValue.Add("DeviceId", eventData.DeviceId);
            retValue.Add("Time", eventData.Time);
            retValue.Add("ValueLabel", eventData.ValueLabel);
            retValue.Add("ValueUnits", eventData.ValueUnits);
            retValue.Add("Type", eventData.Type);
            retValue.Add("Value", eventData.Value);
           
            return retValue;
        }

       protected void TimeToProcessMetric(TelemetryClient appInsights, OnNotificationEventArgs eventData)
        {
            // Calculate time to process 
            if (!string.IsNullOrEmpty(ClientTimeZone))
            {

                DateTime eventTime = DateTime.Parse(eventData.Time);
                DateTime convertedNow = TimeZoneInfo.ConvertTime(DateTime.Now, TimeZoneInfo.Local, clientTimeZoneInfo);
                TimeSpan timeToProcess = convertedNow - eventTime;

                appInsights.TrackMetric("TelemetryTimeToProcess", timeToProcess.Seconds, toDictionary(eventData));
            }
        }


        /// <summary>
        /// Calculates time difference between Now and notification enqueue time
        /// Negative values less then -100  means an error
        /// </summary>
        /// <param name="NotificationTime"></param>
        /// <returns></returns>
        private double NotificationDelay(string NotificationTime)
        {
            DateTime eventDateTime;
            if (DateTime.TryParse(NotificationTime, out eventDateTime))
            {
                TimeSpan difference = DateTime.Now - eventDateTime;
                return difference.TotalMinutes;
            }
            return -100;
        }
    }
}
