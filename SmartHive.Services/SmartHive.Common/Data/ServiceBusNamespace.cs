using System;
using System.Collections.Generic;

namespace SmartHive.Common.Data
{
    public partial class ServiceBusNamespace
    {
        public ServiceBusNamespace()
        {
            ServiceBusTopic = new HashSet<ServiceBusTopic>();
        }

        public string Namespace { get; set; }

        public ICollection<ServiceBusTopic> ServiceBusTopic { get; set; }
    }
}
