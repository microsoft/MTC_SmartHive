using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.ServiceBus;
using Microsoft.ServiceBus.Messaging;
using InfoboardSvc.Common.Data;
using System.Configuration;
using Newtonsoft.Json;

namespace InfoboardSvc.Common.Transport
{
    /**
     * Send scedule information into ServiceBus Topic topic
      */
    public class ServiceBusTransport : ITransport
    {
        private NamespaceManager namespaceManager;
        private string connectionString;

        internal ServiceBusTransport()
        {
            // Create the topic if it does not exist already.
            this.connectionString = ConfigurationManager.AppSettings["Microsoft.ServiceBus.ConnectionString"];
            this.namespaceManager = NamespaceManager.CreateFromConnectionString(connectionString);
           

        }
        public void SendAppointments(ScheduleData roomSchedule, RoomConfig config)
        {
            if (roomSchedule == null || roomSchedule.Schedule == null || roomSchedule.Schedule.Length == 0)
                return;

            if (config.ServiceBusTopic == null)
                throw new ArgumentException(String.Format("No ServiceBusTopic configured for the room {0}", config.Location));

            string rawJson = JsonConvert.SerializeObject(roomSchedule);

            this.SendJson(rawJson, config);

        }

        public void SendJson(string rawJson, RoomConfig config)
        {
            if (!namespaceManager.TopicExists(config.ServiceBusTopic))
            {
                namespaceManager.CreateTopic(config.ServiceBusTopic);
            }

            TopicClient Client = TopicClient.CreateFromConnectionString(connectionString, config.ServiceBusTopic);
            BrokeredMessage message = new BrokeredMessage(rawJson);
                            message.Properties.Add("Location", config.Location);
            // message.TimeToLive = TimeSpan.FromMinutes(5);
            Client.Send(message);
        }

    }
}
