using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartHive.Models.Events
{
    public sealed class OnReadingTaskEventArgs : IEventBase
    {
        public string subscriptionAddress { get; set; }
    }
}
