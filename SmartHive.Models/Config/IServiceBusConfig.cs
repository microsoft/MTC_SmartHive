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

        /// <summary>
        /// Time allowanse in seconds
        /// Room assumed as sceduled before this amount of seconds 
        /// And assumed as free after this this amount of seconds after end of event
        /// </summary>
        int EventLeewaySeconds { get; set; }
    }
}
