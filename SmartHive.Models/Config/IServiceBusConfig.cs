using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartHive.Models.Config
{
    public interface IServiceBusConfig
    {
        string ServiceBusNamespace { get; set; }

        string ServiceBusSubscription { get; set; }

        string ServiceBusTopic { get; set; }

        string SasKeyName { get; set; }

        string SasKey { get; set; }
    }
}
