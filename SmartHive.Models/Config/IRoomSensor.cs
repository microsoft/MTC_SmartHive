using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartHive.Models.Events;

namespace SmartHive.Models.Config
{
    public interface IRoomSensor
    {
        string DeviceId { get; set; }
        /**
         * Name of telemetry paremter to track (Temperature, Pir etc). 
         * Usually ValueLabel 
         */
        string Telemetry { get; set; }

        OnNotificationEventArgs LastMeasurement { get; set; }
    }
}
