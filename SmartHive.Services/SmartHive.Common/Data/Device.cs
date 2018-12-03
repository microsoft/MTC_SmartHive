using System;
using System.Collections.Generic;

namespace SmartHive.Common.Data
{
    public partial class Device
    {
        public Device()
        {
            Sensor = new HashSet<Sensor>();
        }

        public string DeviceId { get; set; }
        public int RoomId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }

        public DeviceSettings DeviceSettings { get; set; }
        public ICollection<Sensor> Sensor { get; set; }
    }
}
