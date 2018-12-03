using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Schema;

namespace SmartHive.Common.Data
{

    public sealed class OnNotificationEventArgs
    {
        public string DeviceId { get; set; }
        public string Time { get; set; }
        public string ValueLabel { get; set; }
        public string ValueUnits { get; set; }
        public string Type { get; set; }
        public string Value { get; set; }

    }

    public static class NotificationEventSchema
    {

        public const string PirSensorValueLabel = "Sensor";

        private static JSchema schemaJson = JSchema.Parse(@"{  
                      'type': 'object',
                      'properties': {
                        'DeviceId': {
                          'type': 'string'
                        },
                        'Time': {
                          'type': 'string'
                        },
                        'ValueLabel': {
                          'type': 'string'
                        },
                        'Type': {
                          'type': 'string'
                        },
                        'ValueUnits': {
                          'type': 'object'
                        },
                        'Value': {
                          'type': 'number'
                        },
                        'EventProcessedUtcTime': {
                          'type': 'string'
                        },
                        'PartitionId': {
                          'type': 'integer'
                        },
                        'EventEnqueuedUtcTime': {
                          'type': 'string'
                        },
                        'IoTHub': {
                          'type': 'object',
                          'properties': {
                            'MessageId': {
                              'type': 'null'
                            },
                            'CorrelationId': {
                              'type': 'null'
                            },
                            'ConnectionDeviceId': {
                              'type': 'string'
                            },
                            'ConnectionDeviceGenerationId': {
                              'type': 'string'
                            },
                            'EnqueuedTime': {
                              'type': 'string'
                            },
                            'StreamId': {
                              'type': 'null'
                            }
                          },
                          'required': [
                            'MessageId',
                            'CorrelationId',
                            'ConnectionDeviceId',
                            'ConnectionDeviceGenerationId',
                            'EnqueuedTime',
                            'StreamId'
                          ]
                        }
                      },
                      'required': [
                        'DeviceId',
                        'Time',
                        'ValueLabel',
                        'Type',
                        'ValueUnits',
                        'Value'
                      ]
                    }");


        public static bool IsValid(string json)
        {
            try
            {
                JObject jObject = JObject.Parse(json);
                return jObject.IsValid(schemaJson);
            }
            catch
            {
                return false;
            }
        }
    }

}
