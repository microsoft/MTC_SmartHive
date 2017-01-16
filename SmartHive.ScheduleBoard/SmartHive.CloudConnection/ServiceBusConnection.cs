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
//using Microsoft.HockeyApp;

namespace SmartHive.CloudConnection
{

    public sealed class ServiceBusConnection 
    {
        
       internal string ServiceBusNamespace { get; set; }
       internal string SasKeyName { get; set; }

       internal string SasKey { get; set; }

        private const int MaxMessageBatchCount = 10;
        private HttpClientHelper HttpHelper = null;
        private string baseAddressHttp;
        private string topicAddress;
        private string subscriptionAddress;

        CancellationTokenSource cancellationTokenSource = new CancellationTokenSource();


        private ThreadPoolTimer SASTokenRenewTimer;

        Mutex ReaderMutex = new Mutex(false);
        TimeSpan MutexWaitTime = TimeSpan.FromMinutes(1);


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
                // Ensure our background task remains running
                // taskDeferral = taskInstance.GetDeferral();

                // Mutex will be used to ensure only one thread at a time is talking to the httpClient
                // this.mutex = new Mutex(false, mutexId);

                this.baseAddressHttp = "https://" + ServiceBusNamespace + ".servicebus.windows.net/";
                this.topicAddress = baseAddressHttp + TopicName;
                this.subscriptionAddress = topicAddress + "/Subscriptions/" + SubscriptionName;

                if (HttpHelper == null)
                {
                    HttpHelper = new HttpClientHelper(this);                    
                }


            }
            catch(Exception ex)
            {
                //DC.Trace(ex.Message + ex.StackTrace);
                this.LogEvent(EventTypeConsts.Error,"Service bus error", ex.Message);
                throw ex;
            }
        }


        private void  RenewSASToken(ThreadPoolTimer timer)
        {
            try
            {
                string newToken = HttpHelper.UpdateToken(ServiceBusNamespace, true, SasKeyName, SasKey);
            }catch(Exception ex)
            {
                this.LogEvent(EventTypeConsts.Error, "RenewSASToken error", ex.Message);
            }
          
        }

       public async void InitSubscription()
        {
            ReaderMutex.WaitOne(MutexWaitTime); // Wait one minute for mutex
            // Query topic.
            try
            {

                byte[] queryTopicResponse = await HttpHelper.GetEntity(this.topicAddress);

                if (queryTopicResponse == null)
                    return;

                this.LogEvent(EventTypeConsts.Info, "Topic exists", this.topicAddress);


                // Query subscription.
                while (checkSubscription() == null)
                {
                    this.LogEvent(EventTypeConsts.Error, "Error reading subscription", this.subscriptionAddress);
                    await Task.Delay(TimeSpan.FromSeconds(60));
                }

                // Create a timer-initiated ThreadPool task to renew SAS token regularly
                SASTokenRenewTimer = ThreadPoolTimer.CreatePeriodicTimer(RenewSASToken, TimeSpan.FromMinutes(15));

                var dispatcher = CoreApplication.MainView.CoreWindow.Dispatcher;
                await dispatcher.RunAsync(Windows.UI.Core.CoreDispatcherPriority.Normal, () =>
                {
                    Task.Delay(TimeSpan.FromSeconds(5));
                    if (OnServiceBusConnected != null)
                    {
                        OnServiceBusConnected.Invoke(this.subscriptionAddress, this.subscriptionAddress);
                        this.LogEvent(EventTypeConsts.Info, "Binding done", "Servicebus handler listining for messages.");
                    }
                    else
                    {
                        this.LogEvent(EventTypeConsts.Error, "Error", "OnServiceBusConnected handlers not set");

                    }

                });


            }
            finally
            {
                ReaderMutex.ReleaseMutex();
            }
        }

        private async Task<string> checkSubscription()
        {
            try
            {
                byte[] querySubscriptionResponse = await HttpHelper.GetEntity(this.subscriptionAddress);

                if (querySubscriptionResponse != null)
                {
                    this.LogEvent(EventTypeConsts.Info, "Subscription exists", this.subscriptionAddress);
                    return Encoding.UTF8.GetString(querySubscriptionResponse, 0, querySubscriptionResponse.Length);
                }
                else
                {
                    this.LogEvent(EventTypeConsts.Error, "Error querying subscription.", this.subscriptionAddress);
                    return null;
                }                               
            }
            catch (System.ObjectDisposedException)
            {
                // Create subscription if it not exists with default settings.
                this.LogEvent(EventTypeConsts.Warinig, "Subscription not exists. Trying create.", this.subscriptionAddress);
                try {
                    createSubscription();
                }catch(HttpRequestException ex)
                {
                    this.LogEvent(EventTypeConsts.Error, "Create subscription http error:", ex.Message + '\n' + this.subscriptionAddress);
                    return null;
                }
            }catch(HttpRequestException ex)
            {
                this.LogEvent(EventTypeConsts.Error,"Query subscriptions http error:", ex.Message + '\n' + this.subscriptionAddress);
                return null;
            }
            return null;
        }


        private async void createSubscription()
        {
              byte[] subscriptionDescription = Encoding.UTF8.GetBytes("<entry xmlns='http://www.w3.org/2005/Atom'><content type='application/xml'>"
             + "<SubscriptionDescription xmlns:i=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns=\"http://schemas.microsoft.com/netservices/2010/10/servicebus/connect\">"
             + "</SubscriptionDescription></content></entry>");

              await HttpHelper.CreateEntity(this.subscriptionAddress, subscriptionDescription);
        }

        public async void ReadMessageAsync(string Location, int eventsExpiration)
        {           
            try
                {
                ReaderMutex.WaitOne(MutexWaitTime); // Wait one minute for mutex
                
                ServiceBusHttpMessage receiveMessage = await HttpHelper.ReceiveAndDeleteMessage(this.subscriptionAddress);
                int countInBatch = 0;
                // Read messages in batches (10 messages or nothing)
                while (receiveMessage != null)
                {
                        countInBatch++;

                        string sBody = receiveMessage.GetMessageText();
                        if (!string.IsNullOrEmpty(sBody))
                        {
                            ProcessMessage(sBody, eventsExpiration);
                        }else {
                            /// Unknow schema - probably an error
                        this.LogEvent(EventTypeConsts.Error, "Unknown messagen format", sBody);
                        }

                    if (countInBatch < MaxMessageBatchCount)
                    {
                        receiveMessage = await HttpHelper.ReceiveAndDeleteMessage(this.subscriptionAddress);
                        if (receiveMessage != null)
                        {
                            /// wait a little bit before we'll process next message
                            await Task.Yield();
                        }
                    }
                    else
                    {
                        break; // Limith count of messages in single batch
                    }
                }
                
                }
                catch (Exception ex)
                {
                    //  DC.Trace(ex.Message + ex.StackTrace);
                    // some wrong message format - report and igore
                    this.LogEvent(EventTypeConsts.Error,"Message error", ex.Message);
                   
                }
                finally
                {
                    ReaderMutex.ReleaseMutex();
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
                        var dispatcher = CoreApplication.MainView.CoreWindow.Dispatcher;
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

                    eventData.Schedule = this.FilterAppointments(eventData, eventsExpiration);

                    if (eventData != null && OnScheduleUpdate != null)
                    {
                        var dispatcher = CoreApplication.MainView.CoreWindow.Dispatcher;
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
                var dispatcher = CoreApplication.MainView.CoreWindow.Dispatcher;
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
