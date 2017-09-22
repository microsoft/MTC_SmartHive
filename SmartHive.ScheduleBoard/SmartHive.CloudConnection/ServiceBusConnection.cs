using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net.Http;
using System.Threading.Tasks;
using Windows.System.Threading;
using Windows.ApplicationModel.Core;
using System.Threading;
using Newtonsoft.Json;
using Windows.Foundation;
using SmartHive.CloudConnection.Events;
using System.Globalization;

using ppatierno.AzureSBLite;
using ppatierno.AzureSBLite.Messaging;
using System.Xml;
using System.Runtime.Serialization;

namespace SmartHive.CloudConnection
{

    public sealed class ServiceBusConnection 
    {
        
       internal string ServiceBusNamespace { get; set; }
       internal string SasKeyName { get; set; }

       internal string SasKey { get; set; }       
        internal string TopicName { get; set; }
        internal string SubscriptionName { get; set; }
        
        private SubscriptionClient subscriptionClient = null;


       // private static IHockeyClientConfigurable HockeyAppConfig = null;

        /** */
        public event EventHandler<OnNotificationEventArgs> OnNotification;
        public event EventHandler<string> OnServiceBusConnected;
        public event EventHandler<OnScheduleUpdateEventArgs> OnScheduleUpdate;
        public event EventHandler<OnEvenLogWriteEventArgs> OnEventLog;

        public ServiceBusConnection(string ServiceBusNamespace, string SubscriptionName, string TopicName, string SasKeyName, string SasKey)
        {
            try
            {

                this.ServiceBusNamespace = ServiceBusNamespace;
                this.SasKeyName = SasKeyName;
                this.SasKey = SasKey;
                this.TopicName = TopicName;
                this.SubscriptionName = SubscriptionName;
                

                // Ensure our background task remains running
                // taskDeferral = taskInstance.GetDeferral();

                // Mutex will be used to ensure only one thread at a time is talking to the httpClient
                // this.mutex = new Mutex(false, mutexId);

                /*     this.baseAddressHttp = "https://" + ServiceBusNamespace + ".servicebus.windows.net/";
                     this.topicAddress = baseAddressHttp + TopicName;
                     this.subscriptionAddress = topicAddress + "/Subscriptions/" + SubscriptionName;

                     if (HttpHelper == null)
                     {
                         HttpHelper = new HttpClientHelper(this);                    
                     }
                     */

            }
            catch(Exception ex)
            {
             
                this.LogEvent(EventTypeConsts.Error,"Service bus error", ex.Message);
                throw ex;
            }
        }

        public async void InitSubscription()
        {

            ServiceBusConnectionStringBuilder builder = new ServiceBusConnectionStringBuilder(String.Format("Endpoint=sb://{0}.servicebus.windows.net/;", ServiceBusNamespace));
            builder.SharedAccessKeyName = this.SasKeyName;
            builder.SharedAccessKey = this.SasKey;
            builder.TransportType = TransportType.Amqp;

            MessagingFactory factory = MessagingFactory.CreateFromConnectionString(builder.ToString());


            this.subscriptionClient = factory.CreateSubscriptionClient(TopicName, SubscriptionName);

            this.subscriptionClient.OnMessage(this.OnMessageAction, new OnMessageOptions { AutoComplete = true });

        }

        private void OnMessageAction(BrokeredMessage brokeredMessage)
        {
            byte[] message = brokeredMessage.GetBytes();

            string sBody = GetMessageText(message);//Encoding.UTF8.GetString(message, 0, message.Length);
            if (!string.IsNullOrEmpty(sBody))
            {

                ProcessMessage(sBody, 100);
                
            }
            else
            {
                /// Unknow schema - probably an error
                this.LogEvent(EventTypeConsts.Error, "Unknown messagen format", sBody);
            }

        }

        private static string GetMessageText(byte[] body)
        {
            if (body == null)
                return null;

            using (XmlDictionaryReader xmlReader = XmlDictionaryReader.CreateBinaryReader(body, XmlDictionaryReaderQuotas.Max))
            {
                DataContractSerializer dataContractSerializer = new DataContractSerializer(typeof(string));
                return dataContractSerializer.ReadObject(xmlReader, false) as string;
            }
        } 

        private async void ProcessMessage(string sBody, int eventsExpiration)
        {
                // Check if this is sensort notification
                if (NotificationEventSchema.IsValid(sBody))
                {
                    OnNotificationEventArgs eventData = JsonConvert.DeserializeObject<OnNotificationEventArgs>(sBody);

                    if (eventData != null && OnNotification != null)
                    {
                        var dispatcher = DispatcherHelper.GetDispatcher;
                        await dispatcher.RunAsync(Windows.UI.Core.CoreDispatcherPriority.High, () =>
                        {
                            double fValue = 0.0;
                            if (double.TryParse(eventData.Value, out fValue))
                            {
                                eventData.Value = fValue.ToString("F1");
                            }

                            OnNotification.Invoke(sBody, eventData);
                        });


                    }
                }
                else if (ScheduleUpdateEventSchema.IsValid(sBody))
                {
                OnScheduleUpdateEventArgs eventData = JsonConvert.DeserializeObject<OnScheduleUpdateEventArgs>(sBody);

                    Appointment[] filteredList = this.FilterAppointments(eventData, eventsExpiration);

                    if (filteredList != null && OnScheduleUpdate != null)
                    {
                        var dispatcher = DispatcherHelper.GetDispatcher;
                        await dispatcher.RunAsync(Windows.UI.Core.CoreDispatcherPriority.Normal, () =>
                        {

                            OnScheduleUpdate.Invoke(sBody, eventData);
                        });
                    }
                }
                else
                {
                    /// Unknow schema - probably an error
                    this.LogEvent(EventTypeConsts.Error, "Unknown json format", sBody);
                }
            
        }

        private Appointment[] FilterAppointments(OnScheduleUpdateEventArgs eventData,  int eventsExpiration)
        {
            if (eventData == null || eventData.Schedule == null)
                return new Appointment[0];

                DateTime expirationTime = DateTime.Now.AddMinutes(eventsExpiration * -1);
                //return all engagements  and not finished yet or finished not leater then eventsExpiration minutes
                Appointment[] retVal = eventData.Schedule.Where<Appointment>(a => 
                        expirationTime.CompareTo(DateTime.ParseExact(a.EndTime, OnScheduleUpdateEventArgs.DateTimeFormat, CultureInfo.InvariantCulture)) <= 0).ToArray<Appointment>();

                return retVal;        
        }

        internal async void LogEvent(EventTypeConsts eventType, string Message, string Description)
        {
            string EventTypeName = Enum.GetName(typeof(EventTypeConsts), eventType);

            if (OnEventLog != null)
            {
                var dispatcher = DispatcherHelper.GetDispatcher;
                await dispatcher.RunAsync(Windows.UI.Core.CoreDispatcherPriority.Normal, () =>
                {
                    OnEventLog.Invoke(EventTypeName, new OnEvenLogWriteEventArgs()
                    {
                        EventType = EventTypeName,
                        Message = Message,
                        Description = Description
                    });
                });
            }else
            {
                MessageHelper.ShowToastMessage(Message, Description);
            }
        }
       
    }
   
}
