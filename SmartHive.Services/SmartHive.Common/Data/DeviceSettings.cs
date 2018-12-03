using System;
using System.Collections.Generic;

namespace SmartHive.Common.Data
{
    public partial class DeviceSettings
    {
        public string DeviceId { get; set; }
        public string DeviceSubscription { get; set; }
        public int TopicId { get; set; }
        public int? ViewStyleId { get; set; }

        public Device Device { get; set; }
        public ServiceBusTopic Topic { get; set; }
        public ViewStyle ViewStyle { get; set; }
    }
}
