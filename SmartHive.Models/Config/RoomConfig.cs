using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartHive.Models.Events;

namespace SmartHive.Models.Config
{
    public class RoomConfig : IRoomConfig
    {
      
        public RoomConfig (string Location) : base()
        {
            this.Location = Location;
            this.RoomSensors = new List<IRoomSensor>();
            this.RoomStatus = RoomStatus.Unknown;
        }
        public string Location { get; set; }
        public string Title { get; set; }
        public string Title_En { get; set; }
        public string TitleFull {
            get {
                return String.Format("{0} {1}",this.Title,this.Title_En);
            }
        }
        public string IconTop { get; set; }
        public string IconBottom { get; set; }
        public string Css { get; set; }
        public Appointment CurrentAppointment { get; set; }
       
        public RoomStatus RoomStatus { get; set; }
        public string ServiceBusNamespace { get; set; }
        public string ServiceBusSubscription { get; set; }
        public string ServiceBusTopic { get; set; }
        public string SasKeyName { get; set; }
        public string SasKey { get; set; }

        public List<IRoomSensor> RoomSensors { get; set; }
        public string FloorMapVarName {get; set; }
        public int EventLeewaySeconds { get; set; }
    }
}
