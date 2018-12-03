using System;
using System.Collections.Generic;

namespace SmartHive.Common.Data
{
    public partial class Telemetry
    {
        public Telemetry()
        {
            Sensor = new HashSet<Sensor>();
            TelemetryValues = new HashSet<TelemetryValues>();
        }

        public string Telemetry1 { get; set; }
        public string ValueType { get; set; }
        public string ValueUnits { get; set; }

        public ICollection<Sensor> Sensor { get; set; }
        public ICollection<TelemetryValues> TelemetryValues { get; set; }
    }
}
