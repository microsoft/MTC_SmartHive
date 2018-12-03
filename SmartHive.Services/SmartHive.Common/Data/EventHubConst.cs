using System;
using System.Configuration;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartHive.Common.Data
{
    public class EventHubConst
    {
        public static string IotHubconnectionString = ConfigurationManager.AppSettings["Microsoft.IoTHub.ConnectionString"];
        public const string EventHubName = "mtcdatacenter";//ConfigurationManager.AppSettings["Microsoft.IoTHub.Name"];
    }
}
