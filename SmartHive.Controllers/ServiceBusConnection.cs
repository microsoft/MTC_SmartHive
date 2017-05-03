using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net.Http;
using System.Threading.Tasks;
using System.Threading;
using System.Runtime.Serialization;
using Newtonsoft.Json;
using ppatierno.AzureSBLite.Messaging;
using SmartHive.Models.Events;
using System.Globalization;
using System.Xml;

//using Microsoft.HockeyApp;

namespace SmartHive.Controllers
{

    public sealed class ServiceBusConnection
    {

        internal string ServiceBusConnectionString { get; set; }

        private const int MaxMessageBatchCount = 10;
        private int eventsExpiration = 10; // minutes after calendar event counted as expired

        private SubscriptionClient subscriptionClient;


        CancellationTokenSource cancellationTokenSource = new CancellationTokenSource();

        /** */
        public event EventHandler<OnNotificationEventArgs> OnNotification;
        public event EventHandler<string> OnServiceBusConnected;
        public event EventHandler<OnScheduleUpdateEventArgs> OnScheduleUpdate;
        public event EventHandler<OnEvenLogWriteEventArgs> OnEventLog;

        public ServiceBusConnection(string ServiceBusNamespace, string SasKeyName, string SasKey)
        {
            try
            {

                this.ServiceBusConnectionString = String.Format(@"Endpoint=sb://{0}.servicebus.windows.net/;SharedAccessKeyName={1};SharedAccessKey={2};",
                    ServiceBusNamespace, SasKeyName, SasKey);

            }
            catch (Exception ex)
            {
                //DC.Trace(ex.Message + ex.StackTrace);
                this.LogEvent(EventTypeConsts.Error, "Service bus error", ex.Message);
                throw ex;
            }
        }

        public void InitSubscription(string TopicName, string SubscriptionName, int eventsExpiration)
        {
            this.eventsExpiration = eventsExpiration;

            try
            {

                MessagingFactory factory = MessagingFactory.CreateFromConnectionString(this.ServiceBusConnectionString);
                this.subscriptionClient = SubscriptionClient.CreateFromConnectionString(this.ServiceBusConnectionString, TopicName, SubscriptionName, ReceiveMode.ReceiveAndDelete);

                this.subscriptionClient.OnMessage(this.OnNewMessage);

                if (OnServiceBusConnected != null)
                {
                    OnServiceBusConnected.Invoke(this.subscriptionClient.Name, this.subscriptionClient.TopicPath);
                    this.LogEvent(EventTypeConsts.Info, "Binding done", "Servicebus handler listining for messages.");
                }
                else
                {
                    this.LogEvent(EventTypeConsts.Error, "Error", "OnServiceBusConnected handlers not set");

                }
            }
            catch (Exception ex)
            {
                this.LogEvent(EventTypeConsts.Error, "subscription init error", ex.Message);

            }
        }

        private void OnNewMessage(BrokeredMessage message)
        {

            try
            {
                string sBody = String.Empty;

                using (XmlDictionaryReader xmlReader = XmlDictionaryReader.CreateBinaryReader(message.GetBytes(), XmlDictionaryReaderQuotas.Max))
                {
                    DataContractSerializer dataContractSerializer = new DataContractSerializer(typeof(string));
                    sBody = dataContractSerializer.ReadObject(xmlReader, false) as string;
                }


                ProcessMessage(sBody);

            }
            catch (Exception ex)
            {
                //  DC.Trace(ex.Message + ex.StackTrace);
                // some wrong message format - report and igore
                this.LogEvent(EventTypeConsts.Error, "Message processing error", String.Format("{0} MessageId={0}", ex.Message, message.MessageId));
            }
        }

        private void ProcessMessage(string sBody)
        {
            // Check if this is sensort notification
            if (NotificationEventSchema.IsValid(sBody))
            {
                OnNotificationEventArgs eventData = JsonConvert.DeserializeObject<OnNotificationEventArgs>(sBody);

                if (eventData != null && OnNotification != null)
                {
                    OnNotification.Invoke(sBody, eventData);
                }
            }
            else if (ScheduleUpdateEventSchema.IsValid(sBody))
            {
                OnScheduleUpdateEventArgs eventData = JsonConvert.DeserializeObject<OnScheduleUpdateEventArgs>(sBody);

                eventData.Schedule = this.FilterAppointments(eventData, eventsExpiration);
                if (eventData != null && OnScheduleUpdate != null)
                {
                    OnScheduleUpdate.Invoke(sBody, eventData);
                }
            }
            else
            {
                /// Unknow schema - probably an error
                this.LogEvent(EventTypeConsts.Error, "Unknown json format", sBody);
            }

        }

        private Appointment[] FilterAppointments(OnScheduleUpdateEventArgs eventData, int eventsExpiration)
        {
            if (eventData == null || eventData.Schedule == null)
                return new Appointment[0];

            DateTime expirationTime = DateTime.Now.AddMinutes(eventsExpiration * -1);
            //return all engagements  and not finished yet or finished not leater then eventsExpiration minutes
            Appointment[] retVal = eventData.Schedule.Where<Appointment>(a =>
                    expirationTime.CompareTo(DateTime.ParseExact(a.EndTime, OnScheduleUpdateEventArgs.DateTimeFormat, CultureInfo.InvariantCulture)) <= 0).ToArray<Appointment>();

            return retVal;
        }

        internal void LogEvent(EventTypeConsts eventType, string Message, string Description)
        {
            string EventTypeName = Enum.GetName(typeof(EventTypeConsts), eventType);

            if (OnEventLog != null)
            {
                OnEventLog.Invoke(EventTypeName, new OnEvenLogWriteEventArgs()
                {
                    EventType = EventTypeName,
                    Message = Message,
                    Description = Description
                });
            }
            else
            {
                // TO DO: Do something if event handler is not set     
            }

        }
    }
   
}
