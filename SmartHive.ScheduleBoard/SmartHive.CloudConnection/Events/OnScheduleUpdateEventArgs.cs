using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Schema;
using System.Globalization;

namespace SmartHive.CloudConnection.Events
{
    public sealed class OnScheduleUpdateEventArgs
    {
        internal const string DateTimeFormat = @"dd\/MM\/yyyy HH:mm";
        public OnScheduleUpdateEventArgs()
        {
            this.RoomId = string.Empty;
            this.Schedule = new Appointment[0];
        }
        public string RoomId { get; set; }
        public Appointment[] Schedule { get; set; }

        public static System.DateTimeOffset ParseDateString(string sDate)
        {
            return System.DateTimeOffset.ParseExact(sDate, DateTimeFormat, CultureInfo.InvariantCulture);
        }
    }

    public sealed class Appointment
    {        
        public Appointment()
        {
            this.StartTime = string.Empty;
            this.EndTime = string.Empty;
            this.Location = string.Empty;
            this.Title = string.Empty;
            this.Category = string.Empty;
            this.MeetingExternalLink = string.Empty;
        }
        public string StartTime { get; set; }
        public string EndTime { get; set; }
        public string Location { get; set; }
        public string Title { get; set; }
        public string Category { get; set; }
        public string MeetingExternalLink { get; set; }

        public System.DateTimeOffset ParseDateString(string sDate)
        {
            return OnScheduleUpdateEventArgs.ParseDateString(sDate);
        }
    }

    public static class ScheduleUpdateEventSchema
    {
        private static JSchema schemaJson = JSchema.Parse(
                        @"{  
                              'type': 'object',
                              'properties': {
                                'RoomId': {
                                  'type': 'string'
                                },
                                'Schedule': {
                                  'type': 'array',
                                  'items': {}
                                }
                              },
                              'required': [
                                'RoomId',
                                'Schedule'
                              ]
                            }");
        //   new Newtonsoft.Json.Schema.Generation.JSchemaGenerator().Generate(typeof(OnScheduleUpdateEventArgs[]));

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

    class AppointmentComparer : IEqualityComparer<Appointment>
    {
        public bool Equals(Appointment x, Appointment y)
        {
            if (Object.ReferenceEquals(x, y)) return true;

            if (Object.ReferenceEquals(x, null) || Object.ReferenceEquals(y, null))
                return false;

            return string.Compare(x.StartTime,y.StartTime,StringComparison.CurrentCultureIgnoreCase) == 0 &&
                   string.Compare(x.EndTime, y.EndTime, StringComparison.CurrentCultureIgnoreCase) == 0 &&
                   string.Compare(x.Location, y.Location, StringComparison.CurrentCultureIgnoreCase) == 0 &&
                    string.Compare(x.Title, y.Title, StringComparison.CurrentCultureIgnoreCase) == 0;

        }

        public int GetHashCode(Appointment appointment)
        {
            if (Object.ReferenceEquals(appointment, null)) return 0;

           string appointmentHashName = string.Concat(appointment.StartTime, appointment.EndTime, appointment.Title, appointment.Location);
           return string.IsNullOrEmpty(appointmentHashName) ? 0 : appointmentHashName.GetHashCode();
        }
    }

}
