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
using SmartHive.FloorMap.WireGeo;

namespace InfoboardSvc.Common
{
    public class FloorMapController : SensorNotificationController
    {

        private static ApiHelper api = ApiHelper.Init("t3ij3nwcwet88fnmhb0337haugkqlmv5");

        public void SetFloorMapVariable(TelemetryClient appInsights, OnNotificationEventArgs eventData)
        {

            try { 
                        
                        RoomConfig config = GetRoomConfigForDevice(eventData.DeviceId);

                        if (config != null)
                        {

                            api.SetVariable(config.FloorMapVarName, eventData.Value.StartsWith("1") ? "3" : "1");

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
                                    
                }
                catch (Exception ex)
                {
                    string errMsg = String.Format("Error {0} for message {1}", ex.Message, JsonConvert.SerializeObject(eventData));
                    Console.Out.WriteLine(errMsg);
                    if (appInsights != null)
                    {
                        appInsights.TrackException(ex);
                        appInsights.TrackTrace(errMsg);
                    }

                }


            }
        }
}
