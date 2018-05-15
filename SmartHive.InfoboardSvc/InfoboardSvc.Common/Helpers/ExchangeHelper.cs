using System;
using System.Collections;
using System.Collections.Specialized;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net;
using System.Web;
using System.Security.Cryptography.X509Certificates;
using Microsoft.Exchange.WebServices.Data ;
using System.Configuration;
using Microsoft.Exchange.WebServices.Autodiscover;
using System.Security.Cryptography;
using System.IO;
using System.Diagnostics;
using data = InfoboardSvc.Common.Data;

namespace InfoboardSvc.Common.Helpers
{
    public static class ExchangeHelper
    {

        private static ExchangeService ExchangeServiceSingleton = null;

        private static string ADDomain = ConfigurationManager.AppSettings["ADDomain"];
        private static string ADLogin = ConfigurationManager.AppSettings["ADLogin"];
        private static string sExchangeServiceUrl = ConfigurationManager.AppSettings["ExchangeServiceUrl"];

        private static string sExchangePassword = ConfigurationManager.AppSettings["Password"];
        private static string MailBoxAddress = ConfigurationManager.AppSettings["EmailAddress"];
        private static string ClientTimeZone = ConfigurationManager.AppSettings["ClientTimeZone"];


        // OnlineMeetingExternalLink element is an optional element that contains a URL for an online meeting. It is defined as an element in the Calendar namespace.
        internal static ExtendedPropertyDefinition OnlineMeetingExternalLink = new ExtendedPropertyDefinition(DefaultExtendedPropertySet.PublicStrings, "OnlineMeetingExternalLink",
            MapiPropertyType.String);

        #region Property Methods


        #endregion

        private static ExchangeService GetExchangeServiceConnection()
        {

            if (ExchangeServiceSingleton == null || ExchangeServiceSingleton.Url == null)
            {
                InitExchangeServiceConnection();
            }

            return ExchangeServiceSingleton;
        }


        private static void InitExchangeOffice365Connection()
        {


            ServicePointManager.ServerCertificateValidationCallback = CallbackMethods.CertificateValidationCallBack;
            ExchangeServiceSingleton = new ExchangeService(ExchangeVersion.Exchange2010_SP2);

            // Get the information of the account.

            ExchangeServiceSingleton.AutodiscoverUrl(MailBoxAddress, CallbackMethods.RedirectionUrlValidationCallback);

            //ExchangeServiceSingleton.Url = new Uri(sExchangeServiceUrl);
            // This is because by default, .NET checks whether SSL certificates are signed by a certificate from the Trusted Root Certificate store. 
            ServicePointManager.ServerCertificateValidationCallback = (sender, certificate, chain, sslPolicyErrors) => true;           

        }


        private static void InitExchangeServiceConnection()
        {
            try
            {
                ServicePointManager.ServerCertificateValidationCallback = CallbackMethods.CertificateValidationCallBack;
                ExchangeServiceSingleton = new ExchangeService(ExchangeVersion.Exchange2013);

                if (string.IsNullOrEmpty(ADLogin) || string.IsNullOrEmpty(ADDomain))
                {
                    /// Office 365 Exchange
                    ExchangeServiceSingleton.Credentials = new WebCredentials(MailBoxAddress, sExchangePassword);
                }
                else
                {
                    /// On-premises Exchange with AD integrated login
                    ExchangeServiceSingleton.Credentials = new WebCredentials(ADLogin, sExchangePassword, ADDomain);
                }

                SetExchangeServiceHttpHeader(ExchangeServiceSingleton, "X-AnchorMailbox", MailBoxAddress);

                // ExchangeServiceSingleton.Url = new Uri("https://emea.cloudmail.microsoft.com/ews/Exchange.asmx");
                if (string.IsNullOrEmpty(sExchangeServiceUrl))
                {
                    ExchangeServiceSingleton.AutodiscoverUrl(MailBoxAddress, CallbackMethods.RedirectionUrlValidationCallback);
                }
                else
                {
                    ExchangeServiceSingleton.Url = new Uri(sExchangeServiceUrl);
                }

               
                //ExchangeServiceSingleton.Url = new Uri(sExchangeServiceUrl);
                // This is because by default, .NET checks whether SSL certificates are signed by a certificate from the Trusted Root Certificate store. 
                ServicePointManager.ServerCertificateValidationCallback = (sender, certificate, chain, sslPolicyErrors) => true;
            }
            catch (Exception ex)
            {
                Trace.TraceError("Error connecting to excahnge mailbox:{0} ErrMsg: {1}", MailBoxAddress, ex.Message);
                throw ex;
            }

        }



        internal static FindItemsResults<Appointment> LoadCallendar()
        {
            ExchangeService service = ExchangeHelper.GetExchangeServiceConnection();

            DateTime DateForImport = String.IsNullOrEmpty(ConfigurationManager.AppSettings["DateForImport"]) ?
            DateTime.Today : DateTime.Parse(ConfigurationManager.AppSettings["DateForImport"]);

            // Берем с часу ночи, чтобы не попадали мероприятия предидущего дня
            DateTime startDate = DateForImport.AddHours(1);
            DateTime endDate = startDate.AddDays(1);

            const int NUM_APPTS = 25; // FindItem results should be requested in batches of 25.

            // Initialize the calendar folder object with only the folder ID. 
            //CalendarFolder calendar = CalendarFolder.Bind(service, WellKnownFolderName.Calendar);

            // Set the start and end time and number of appointments to retrieve.
            CalendarView cView = new CalendarView(startDate, endDate, NUM_APPTS);


            // Limit the properties returned to the appointment's subject, start time, and end time.
            cView.PropertySet = new PropertySet(BasePropertySet.IdOnly);

            // Retrieve a collection of appointments by using the calendar view.
            // FindItemsResults<Appointment> appointments = calendar.FindAppointments(cView);
            FindItemsResults<Appointment> findResults = service.FindAppointments(WellKnownFolderName.Calendar, cView);

            if (findResults != null && findResults.TotalCount > 0)
            {
                service.LoadPropertiesForItems(from Item item in findResults select item,
                    new PropertySet(BasePropertySet.IdOnly, AppointmentSchema.Start, AppointmentSchema.End,
                        AppointmentSchema.Location, AppointmentSchema.Subject, AppointmentSchema.Categories));
            }

            return findResults;

        }


        private static void SetExchangeServiceHttpHeader(ExchangeService service, string headerName, string headerValue)
        {
            if (service.HttpHeaders.Keys.Contains(headerName))
            {
                service.HttpHeaders[headerName] = headerValue;                
            }
            else
            {
                service.HttpHeaders.Add(headerName, headerValue);
            }

        }

        public static data.ScheduleData LoadResouceCallendar(string ResourceName)
        {
            ExchangeService service = ExchangeHelper.GetExchangeServiceConnection();

            SetExchangeServiceHttpHeader(service, "X-AnchorMailbox", MailBoxAddress);

            PropertySet psPropset = new PropertySet(BasePropertySet.FirstClassProperties);
            ExtendedPropertyDefinition PidTagWlinkAddressBookEID = new ExtendedPropertyDefinition(0x6854, MapiPropertyType.Binary);
            ExtendedPropertyDefinition PidTagWlinkFolderType = new ExtendedPropertyDefinition(0x684F, MapiPropertyType.Binary);

            psPropset.Add(PidTagWlinkAddressBookEID);
            psPropset.Add(PidTagWlinkFolderType);
            
            NameResolutionCollection resolve = service.ResolveName(ResourceName, ResolveNameSearchLocation.DirectoryOnly, false, psPropset);

            FindItemsResults<Appointment> findResults = null;
            if (resolve.Count > 0)
            {
                try
                {
                    SetExchangeServiceHttpHeader(service, "X-AnchorMailbox", resolve[0].Mailbox.Address);
                  //  service.HttpHeaders.Add("X-AnchorMailbox", resolve[0].Mailbox.Address);
                    FolderId SharedCalendarId = new FolderId(WellKnownFolderName.Calendar, resolve[0].Mailbox.Address);
                    CalendarFolder cf = CalendarFolder.Bind(service, SharedCalendarId);
                    findResults = LoadResouceCallendar(cf);
                }
                catch (Microsoft.Exchange.WebServices.Data.ServiceResponseException ex)
                {
                    Trace.TraceError("Error reading calendar for resource {0} ErrMsg: {1}", ResourceName, ex.Message);
                    throw ex;
                }
                //Folder SharedCalendaFolder = Folder.Bind(service, SharedCalendarId);
            }
            else
            {
                throw new ApplicationException(String.Format("Error resolving resource name in GAL: {0}", ResourceName));
            }




            if (findResults != null && findResults.TotalCount > 0)
            {
                service.LoadPropertiesForItems(from Item item in findResults select item,
                    new PropertySet(BasePropertySet.IdOnly, AppointmentSchema.Start, AppointmentSchema.End,
                        AppointmentSchema.Location, AppointmentSchema.Subject, AppointmentSchema.Categories, OnlineMeetingExternalLink, 
                        AppointmentSchema.IsAllDayEvent, AppointmentSchema.Sensitivity, AppointmentSchema.Organizer));
            }

            return new data.ScheduleData { RoomId = ResourceName, Schedule = ConvertToSerializable(findResults, ResourceName) };            

            /*  PropertySet props = new PropertySet();
              CalendarFolder.Bind(service,WellKnownFolderName.Calendar,)*/
        }

        private static data.Appointment[] ConvertToSerializable(FindItemsResults<Appointment> exchangeAppointments, string ResourceName)
        {
            if (exchangeAppointments == null || exchangeAppointments.TotalCount == 0)
                return new data.Appointment[] { };

            var result = from Appointment appointment in exchangeAppointments
                             /* 
                              We may need filter on clients              
                               where appointment.Categories.Count > 0 &
                               !appointment.Categories.Contains("Remote access") &
                               !appointment.Categories.Contains("MTC all")*/
                         orderby appointment.Start
                         select (new data.Appointment()
                         {
                             StartTime = ConvertTime(appointment.Start),
                             EndTime = ConvertTime(appointment.End),
                             Title = FormatTitle(appointment.Subject, appointment.Sensitivity, appointment.Organizer),
                             Location = ResourceName, //appointment.Location,
                             Category = CategoriesToString(appointment.Categories)
                         });

            return result.ToArray<data.Appointment>();
        }

        private static string FormatTitle(string subject, Sensitivity sensitivity, EmailAddress organizer)
        {
            if (sensitivity != Sensitivity.Normal)
            { // This is personal or private meeting
                if (organizer != null && !string.IsNullOrEmpty(organizer.Name))
                    return organizer.Name;
                else
                    return "Private meeting";


            }else
            {
                if (!string.IsNullOrEmpty(subject))
                    return WebUtility.HtmlEncode(subject);                        
                else
                        return "";
            }
        }

        /// <summary>
        /// Service method for conversion datetime to client's time zone
        /// </summary>
        /// <param name="inTime"></param>
        /// <returns></returns>
        private static string ConvertTime(DateTime inTime)
        {
            TimeZoneInfo clientTimeZoneInfo = string.IsNullOrEmpty(ClientTimeZone) ? TimeZoneInfo.Local : TimeZoneInfo.FindSystemTimeZoneById(ClientTimeZone);
            DateTime ClientTime = TimeZoneInfo.ConvertTime(inTime, TimeZoneInfo.Local, clientTimeZoneInfo);
            return ClientTime.ToString(ScheduleUpdateController.DateTimeFormat);
        }

        static string CategoriesToString(StringList items)
        {
            StringBuilder sb = new StringBuilder();
            foreach (String Category in items)
            {
                if (sb.Length > 0)
                {
                    sb.AppendFormat(", {0}", Category);
                }
                else
                {
                    sb.Append(Category);
                }
            }
            return sb.ToString();
        }

        private static FindItemsResults<Appointment> LoadResouceCallendar(CalendarFolder calendarFolder)
        {


            DateTime DateForImport = String.IsNullOrEmpty(ConfigurationManager.AppSettings["DateForImport"]) ?
            DateTime.Today : DateTime.Parse(ConfigurationManager.AppSettings["DateForImport"]);

            // Берем с часу ночи, чтобы не попадали мероприятия предидущего дня
            DateTime startDate = DateForImport.AddHours(1);
            DateTime endDate = startDate.AddDays(1);

            const int NUM_APPTS = 25; // FindItem results should be requested in batches of 25.

            // Initialize the calendar folder object with only the folder ID. 
            //CalendarFolder calendar = CalendarFolder.Bind(service, WellKnownFolderName.Calendar);

            // Set the start and end time and number of appointments to retrieve.
            CalendarView cView = new CalendarView(startDate, endDate, NUM_APPTS);

            // Limit the properties returned to the appointment's subject, start time, and end time.
            cView.PropertySet = new PropertySet(BasePropertySet.IdOnly);

            // Retrieve a collection of appointments by using the calendar view.
            // FindItemsResults<Appointment> appointments = calendar.FindAppointments(cView);
            return calendarFolder.FindAppointments(cView);
            //service.FindAppointments(calendarFolder.Id, cView);

        }
    }
}