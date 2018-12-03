using System;
using System.Collections.Generic;

namespace SmartHive.Common.Data
{
    public partial class Sensor
    {
        public int Id { get; set; }
        public int RoomId { get; set; }
        public string Telemetry { get; set; }
        public string DeviceId { get; set; }

        public Device Device { get; set; }
        public Room Room { get; set; }
        public Telemetry TelemetryNavigation { get; set; }
    }
}
