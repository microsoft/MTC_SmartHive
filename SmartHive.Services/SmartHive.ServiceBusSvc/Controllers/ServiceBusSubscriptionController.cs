using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace SmartHive.ServiceBusSvc.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServiceBusSubscriptionController : ControllerBase
    {
        /*
         *   string connectionString = "Endpoint=sb://mtcdatacenter.servicebus.windows.net;SharedAccessKeyName=Infoboard.Svc;SharedAccessKey=H39ihzIiOhnE5QVZZ/WLP5WaMrpLrbhVY7drn4SH1ro=";
            NamespaceManager NamespaceMgr = NamespaceManager.CreateFromConnectionString(connectionString);

            string Topic = args[0];
            if (string.IsNullOrEmpty(Topic))
            {
                WriteCallHelp();
                Console.Out.WriteLine("topic agrument is empty");
            }

            string Subscription = args[1];
            if (string.IsNullOrEmpty(Subscription))
            {
                WriteCallHelp();
                Console.Out.WriteLine("Subscription agrument is empty");
            }


            string Filter = String.Format("Location = '{0}'",args[2]);
            if (string.IsNullOrEmpty(Filter))
            {
                WriteCallHelp();
                Console.Out.WriteLine("Filter agrument is empty");
            }

            Console.Out.WriteLine(String.Format("Topic: {0}, Sunscription {1}, Filter: {2} ", Topic, Subscription, Filter));
            SubscriptionDescription sbDesc = NamespaceMgr.CreateSubscription(Topic, Subscription, new SqlFilter(Filter));
                sbDesc.DefaultMessageTimeToLive = new TimeSpan(0, 5, 0, 0);
                sbDesc.EnableDeadLetteringOnFilterEvaluationExceptions = true;
                sbDesc.EnableDeadLetteringOnMessageExpiration = true;          
            NamespaceMgr.UpdateSubscription(sbDesc);

         */


        // GET: api/ServiceBusSubscription
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        // GET: api/ServiceBusSubscription/5
        [HttpGet("{id}", Name = "Get")]
        public string Get(int id)
        {
            return "value";
        }

        // POST: api/ServiceBusSubscription
        [HttpPost]
        public void Post([FromBody] string value)
        {
        }

        // PUT: api/ServiceBusSubscription/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody] string value)
        {
        }

        // DELETE: api/ApiWithActions/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
