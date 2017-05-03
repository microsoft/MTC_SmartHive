using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartHive.Models.Config
{
    public class RoomConfig : IRoomConfig
    {
      
        public RoomConfig (string Location) : base()
        {
            this.Location = Location;
            this.RoomDeviceIDs = new List<string>();
        }
        public string Location { get; set; }
        public string Title { get; set; }
        public string Title_En { get; set; }
        public string IconTop { get; set; }
        public string IconBottom { get; set; }
        public string Css { get; set; }

        public List<string> RoomDeviceIDs{
            get;
            private set;
        }

        public RoomStatus RoomStatus { get; set; }
        public string ServiceBusNamespace { get; set; }
        public string ServiceBusSubscriptionName { get; set; }
        public string ServiceBusTopic { get; set; }
        public string SasKeyName { get; set; }
        public string SasKey { get; set; }
    }
}
