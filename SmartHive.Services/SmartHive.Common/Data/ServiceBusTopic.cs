using System;
using System.Collections.Generic;

namespace SmartHive.Common.Data
{
    public partial class ServiceBusTopic
    {
        public ServiceBusTopic()
        {
            DeviceSettings = new HashSet<DeviceSettings>();
            Room = new HashSet<Room>();
        }

        public int TopicId { get; set; }
        public string Namespace { get; set; }
        public string TopicName { get; set; }
        public string SasKeyName { get; set; }
        public string SasKey { get; set; }

        public ServiceBusNamespace NamespaceNavigation { get; set; }
        public ICollection<DeviceSettings> DeviceSettings { get; set; }
        public ICollection<Room> Room { get; set; }
    }
}
