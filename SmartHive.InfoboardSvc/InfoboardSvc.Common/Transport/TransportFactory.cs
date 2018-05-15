using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InfoboardSvc.Common.Transport
{
    public class TransportFactory
    {
        private static ITransport _transport = null;
        public static ITransport Transport
        {
            get{
                if (_transport == null)
                {
                    //TODO: Examinate Connection Transport= and load correct implementation
                    _transport = new ServiceBusTransport();
                }

                return _transport;
            }
        }
    }
}
