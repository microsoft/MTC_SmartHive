using System;
using Windows.Data.Xml.Dom;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using SmartHive.CloudConnection.Events;
using Windows.ApplicationModel.Core;
using System.Globalization;
using System.Net.Http;

namespace SmartHive.CloudConnection
{
    public sealed class HttpConnection  
    {
#pragma warning disable CS0067 // The event 'HttpConnection.OnNotification' is never used
        public event EventHandler<OnNotificationEventArgs> OnNotification;
#pragma warning restore CS0067 // The event 'HttpConnection.OnNotification' is never used
        public event EventHandler<string> OnServiceBusConnected;
        public event EventHandler<OnScheduleUpdateEventArgs> OnScheduleUpdate;
        public event EventHandler<OnEvenLogWriteEventArgs> OnEventLog;
        private HttpClient HttpHelper = null;

        private string UrlAddress = null;
        public HttpConnection(string ServiceUrl)
        {
            this.UrlAddress = ServiceUrl;
        }

        public async void InitSubscription()
        {
            try
            {
                this.HttpHelper = new HttpClient();
                var dispatcher = CoreApplication.GetCurrentView().Dispatcher;
                    //CoreApplication.MainView.CoreWindow.Dispatcher; -- Windows 8.1
                await dispatcher.RunAsync(Windows.UI.Core.CoreDispatcherPriority.Normal, () =>
                {                    
                    if (OnServiceBusConnected != null)
                    {
                        OnServiceBusConnected.Invoke(this.UrlAddress, this.UrlAddress);
                        this.LogEvent(EventTypeConsts.Info, "Binding done", "Web service handler listining for messages.");
                    }
                    else
                    {
                        this.LogEvent(EventTypeConsts.Error, "Error", "WebService handler not set");

                    }

                });
            }
            catch (Exception ex)
            {
                this.LogEvent(EventTypeConsts.Error, "Webservice request error", ex.Message + " " + ex.StackTrace);
            }
        }

        private Appointment[] FilterAppointments(Appointment[] Schedule, string Location, int eventsExpiration)
        {
            if (Schedule == null || Schedule.Length == 0 || string.IsNullOrWhiteSpace(Location)) {
                return new Appointment[0];
            } else
            {

                //return all engagements where matched location and not finished yet or finished not leater then eventsExpiration minutes
                DateTime expirationTime = DateTime.Now.AddMinutes(eventsExpiration * -1);
                //return all engagements  and not finished yet or finished not leater then eventsExpiration minutes
                Appointment[] retVal = Schedule.Where<Appointment>(a => !string.IsNullOrEmpty(a.Location) && a.Location.Contains(Location) &&
                        expirationTime.CompareTo(DateTime.ParseExact(a.EndTime, OnScheduleUpdateEventArgs.DateTimeFormat, CultureInfo.InvariantCulture)) <= 0).ToArray<Appointment>();

                return retVal;
            }

        }

        public async void ReadMessageAsync(string Location, int eventsExpiration)
        {
            if (string.IsNullOrEmpty(Location)) {
                this.LogEvent(EventTypeConsts.Error, "Invalid argument Locaton", " value is null or empty");
                return;
            }

            string[] Locations = Location.Split(';');

            OnScheduleUpdateEventArgs eventData = new OnScheduleUpdateEventArgs() { RoomId = Location };

            List<Appointment> Appointments = new List<Appointment>();
            foreach (string tmpLocation in Locations)
            {
                Appointment[] roomAppointments = await ReadEventForLocationAsync(tmpLocation, eventsExpiration);
                if (roomAppointments != null)
                {
                    Appointments.AddRange(roomAppointments);
                }
            }

            eventData.Schedule = Appointments.ToArray();

            var dispatcher = CoreApplication.GetCurrentView().Dispatcher;
            await dispatcher.RunAsync(Windows.UI.Core.CoreDispatcherPriority.Normal, () =>
            {
                if (OnScheduleUpdate != null)
                    OnScheduleUpdate.Invoke("", eventData);
            });

        }

        private async Task<Appointment[]> ReadEventForLocationAsync(string Location, int eventsExpiration)
        {
            try
            {               

                string sXml = await this.HttpHelper.GetStringAsync(new Uri(this.UrlAddress));

                if (!string.IsNullOrEmpty(sXml))
                {
                    XmlDocument doc = new XmlDocument();
                    doc.LoadXml(sXml);

                    XmlNodeList eventsNodes = doc.SelectNodes("Appointments/Appointment");

                    var result = from IXmlNode eventNode in eventsNodes
                                 select (new Appointment()
                                 {
                                     StartTime = eventNode.SelectSingleNode("StartTime").InnerText,
                                     EndTime = eventNode.SelectSingleNode("EndTime").InnerText,
                                     Title = eventNode.SelectSingleNode("Title").InnerText,
                                     Location = eventNode.SelectSingleNode("Location").InnerText, //appointment.Location,  
                                     Category = eventNode.SelectSingleNode("Category").InnerText
                                 });


                    if (result.Count<Appointment>() > 0)
                    {
                        return this.FilterAppointments(result.ToArray<Appointment>(), Location, eventsExpiration);
                    }

                }
                else
                {
                    this.LogEvent(EventTypeConsts.Error, "Empty response from WebService", this.UrlAddress);
                }

                return null;
            }
            catch (Exception ex)
            {
                this.LogEvent(EventTypeConsts.Error, "Webservice request error", ex.Message + " " + ex.StackTrace);
            }
                return null;
        }

        internal async void LogEvent(EventTypeConsts eventType, string Message, string Description)
        {
            string EventTypeName = Enum.GetName(typeof(EventTypeConsts), eventType);

            if (OnEventLog != null)
            {
                var dispatcher = CoreApplication.GetCurrentView().Dispatcher;
                await dispatcher.RunAsync(Windows.UI.Core.CoreDispatcherPriority.Normal, () =>
                {
                    OnEventLog.Invoke(EventTypeName, new OnEvenLogWriteEventArgs()
                    {
                        EventType = EventTypeName,
                        Message = Message,
                        Description = Description
                    });
                });
            }
            else
            {
                MessageHelper.ShowToastMessage(Message, Description);
            }
        }
    }
}
