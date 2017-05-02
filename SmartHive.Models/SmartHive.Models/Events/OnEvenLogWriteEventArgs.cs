using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartHive.Models.Events
{

    public enum EventTypeConsts
    {
       Info,Warinig, Error
    }

    public sealed class OnEvenLogWriteEventArgs
    {
        public string EventType { get; set; }
        public string Message { get; set; }
        public string Description { get; set; }
    }
}
