using System;
using System.Collections.Generic;

namespace SmartHive.Common.Data
{
    public partial class TelemetryValues
    {
        public int Id { get; set; }
        public string TelemetryId { get; set; }
        public int SensorId { get; set; }
        public DateTime SourceTimestamp { get; set; }
        public int? ValueInt { get; set; }
        public double? ValueDouble { get; set; }
        public bool? ValueBool { get; set; }
        public string ValueStr { get; set; }

        public Telemetry Telemetry { get; set; }
    }
}
