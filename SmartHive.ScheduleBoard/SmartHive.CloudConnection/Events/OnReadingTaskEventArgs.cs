using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartHive.CloudConnection.Events
{
    public sealed class OnReadingTaskEventArgs
    {
        public string subscriptionAddress { get; set; }
    }
}
