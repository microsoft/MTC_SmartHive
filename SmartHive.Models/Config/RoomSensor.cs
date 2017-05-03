using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartHive.Models.Events;

namespace SmartHive.Models.Config
{
    public class RoomSensor : IRoomSensor
    {
        public string DeviceId { get; set; }
        public string Telemetry { get; set; }
        public OnNotificationEventArgs LastMeasurement { get; set; }
    }
}
