using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartHive.Common.Data
{
    public class ScheduleData
    {
        public string RoomId { get; set; }
        public Appointment[] Schedule { get; set; }
    }
    public class Appointment
    {
         public string StartTime { get; set; }
         public string EndTime { get; set; }
         public string Location { get; set; }
		 public string Title { get; set; }			
		 public string Category { get; set; }
        public string MeetingExternalLink { get; set; }

    }
}
