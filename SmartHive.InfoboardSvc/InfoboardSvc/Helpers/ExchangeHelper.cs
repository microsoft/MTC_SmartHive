using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net;
using System.Net.Security;
using System.Web;
using System.Web.Configuration;
using System.Security.Cryptography.X509Certificates;
using Microsoft.Exchange.WebServices.Data;
using Microsoft.Exchange.WebServices.Autodiscover;
using System.Security.Cryptography;
using System.IO;
using System.Diagnostics;

namespace InfoboardSvc.Helpers
{
    public static class ExchangeHelper
    {

        private static ExchangeService ExchangeServiceSingleton = null;

        private static string ADDomain = WebConfigurationManager.AppSettings["ADDomain"];
        private static string ADLogin = WebConfigurationManager.AppSettings["ADLogin"];
        private static string sExchangeServiceUrl = WebConfigurationManager.AppSettings["ExchangeServiceUrl"];

        private static string sExchangePassword = WebConfigurationManager.AppSettings["Password"];        
        private static string MailBoxAddress = WebConfigurationManager.AppSettings["EmailAddress"];


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
            try {
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
            }catch(Exception ex)
            {
                Trace.TraceError("Error connecting to excahnge mailbox:{0} ErrMsg: {1}", MailBoxAddress, ex.Message);
                throw ex;
            }

        }



        internal static FindItemsResults<Appointment> LoadCallendar()
        {
            ExchangeService service = ExchangeHelper.GetExchangeServiceConnection();

            DateTime DateForImport = String.IsNullOrEmpty(WebConfigurationManager.AppSettings["DateForImport"]) ?
            DateTime.Today : DateTime.Parse(WebConfigurationManager.AppSettings["DateForImport"]);

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


        internal static FindItemsResults<Appointment> LoadResouceCallendar(string ResourceName)
        {            
            ExchangeService service = ExchangeHelper.GetExchangeServiceConnection();

            PropertySet psPropset = new PropertySet(BasePropertySet.FirstClassProperties);
            ExtendedPropertyDefinition PidTagWlinkAddressBookEID = new ExtendedPropertyDefinition(0x6854, MapiPropertyType.Binary);
            ExtendedPropertyDefinition PidTagWlinkFolderType = new ExtendedPropertyDefinition(0x684F, MapiPropertyType.Binary);            

            psPropset.Add(PidTagWlinkAddressBookEID);
            psPropset.Add(PidTagWlinkFolderType);
            
            NameResolutionCollection resolve = service.ResolveName(ResourceName, ResolveNameSearchLocation.DirectoryOnly, false, psPropset);

            FindItemsResults<Appointment> findResults = null;
            if (resolve.Count > 0)
            {   
                try{
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
                        AppointmentSchema.Location, AppointmentSchema.Subject, AppointmentSchema.Categories, OnlineMeetingExternalLink));
            }

            return findResults;


            /*  PropertySet props = new PropertySet();
              CalendarFolder.Bind(service,WellKnownFolderName.Calendar,)*/
        }


        private static FindItemsResults<Appointment> LoadResouceCallendar(CalendarFolder calendarFolder)
        {
           

            DateTime DateForImport = String.IsNullOrEmpty(WebConfigurationManager.AppSettings["DateForImport"]) ?
            DateTime.Today : DateTime.Parse(WebConfigurationManager.AppSettings["DateForImport"]);

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