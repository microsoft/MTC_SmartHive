﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Schema;
using System.Globalization;

namespace SmartHive.Models.Events
{
    public sealed class OnScheduleUpdateEventArgs : IEventBase
    {
        public const string DateTimeFormat = @"dd\/MM\/yyyy HH:mm";
        public OnScheduleUpdateEventArgs()
        {
            RoomId = string.Empty;
            Schedule = new Appointment[0];
        }
        public string RoomId { get; set; }
        public Appointment[] Schedule { get; set; }

        public System.DateTimeOffset ParseDateString(string sDate)
        {
            return System.DateTimeOffset.ParseExact(sDate, DateTimeFormat, CultureInfo.InvariantCulture);
        }
    }

    public sealed class Appointment
    {
        public Appointment()
        {
            StartTime = string.Empty;
            EndTime = string.Empty;
            Location = string.Empty;
            Title = string.Empty;
            MeetingExternalLink = string.Empty;
        }
        public string StartTime { get; set; }
        public DateTime StartDateTime
        {
            get
            {
                return DateTime.ParseExact(this.StartTime, OnScheduleUpdateEventArgs.DateTimeFormat, CultureInfo.InvariantCulture);
            }
        }
        public string EndTime { get; set; }
        public DateTime EndDateTime
        {
            get
            {
                return DateTime.ParseExact(this.EndTime, OnScheduleUpdateEventArgs.DateTimeFormat, CultureInfo.InvariantCulture);
            }
        }
        public string Location { get; set; }
        public string Title { get; set; }
        public string Category { get; set; }
        public string MeetingExternalLink { get; set; }
        public string DecodedTitle
        {
            get
            {
                if (!string.IsNullOrEmpty(Title))
                    return System.Net.WebUtility.HtmlDecode(Title);
                else
                    return null;
            }
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
                JObject jObject = JObject.Parse(json);
                return jObject.IsValid(schemaJson);
        }
    }

   public class AppointmentComparer : IEqualityComparer<Appointment>
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
