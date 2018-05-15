using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Text;
using System.Xml;
using System.IO;
using System.Diagnostics;
using System.Web.Caching;
using Microsoft.Exchange.WebServices;
using Microsoft.Exchange.WebServices.Data;
using InfoboardSvc.Common.Helpers;
using data = InfoboardSvc.Common.Data;
using System.Web.Configuration;

namespace InfoboardSvc.Controllers
{
    public class ScheduleUpdateController : ApiController
    {

        private static string CacheTimeOut = WebConfigurationManager.AppSettings["CacheTimeOut"];

        private static bool isError = false;        

        public HttpResponseMessage Get()
        {

            string cachedXml = System.Web.HttpRuntime.Cache[CacheKey] as string;

            if (string.IsNullOrEmpty(cachedXml))
            {
                // Not found in the cache
                using (StringWriter textWriter = new StringWriter())
                {
                    using (XmlTextWriter xmlWriter = new XmlTextWriter(textWriter))
                    {

                        WriteAppointments(xmlWriter);
                        xmlWriter.Close();
                    }
                    textWriter.Close();
                    cachedXml = textWriter.ToString();
                }
                int iCacheTimeOut = 10; // Default time 
                int.TryParse(WebConfigurationManager.AppSettings["CacheTimeOut"], out iCacheTimeOut);

                if (!isError)
                    System.Web.HttpRuntime.Cache.Insert(CacheKey, cachedXml, null, DateTime.Now.AddMinutes(iCacheTimeOut), TimeSpan.Zero);

            }
          

                return new HttpResponseMessage()
                {
                    Content = new StringContent(cachedXml, Encoding.UTF8, "application/xml")                    
                };
           
        }

        public HttpResponseMessage Get(string room)
        {
           
            return new HttpResponseMessage()
            {
                Content = new StringContent("<Appointments></Appointments>", Encoding.UTF8, "application/xml")
            };
        }




        public static string[] GetWatchingRooms()
        {
           string FilePath = System.Web.HttpContext.Current.Server.MapPath("~/rooms.xml");
            XmlDocument doc = new XmlDocument();
            doc.Load(FilePath);

            XmlNodeList locations = doc.SelectNodes("/Rooms/Room/@Location");
            List<string> ReturnValue = new List<string>();
            foreach(XmlNode location in locations)
            {
                if (!string.IsNullOrEmpty(location.Value) && !string.IsNullOrWhiteSpace(location.Value))
                {
                    //Multiple rooms can be stored in single item
                    string[] roomsInRecord = location.Value.Split(new char[] { ';' });
                    foreach (string roomName in roomsInRecord)
                    {
                        if (!ReturnValue.Contains(roomName))
                            ReturnValue.Add(roomName); /// Add if this room is new
                    }
                }
            }
            return ReturnValue.ToArray<string>();

        }

        static void WriteAppointments(XmlTextWriter xmlWriter)
        {
            string[] rooms = GetWatchingRooms();

            xmlWriter.WriteStartDocument();
            xmlWriter.WriteStartElement("Appointments");
            xmlWriter.WriteElementString("ImportTime", DateTime.Now.ToString());

            isError = false;

            foreach (string room in rooms)
            {
                try
                {
                    data.ScheduleData roomAppointments = ExchangeHelper.LoadResouceCallendar(room);
                    WriteRoomXml(roomAppointments, xmlWriter);
                }
                catch (Exception ex)
                {
                    isError = true; // Set error flag to prevent caching
                    Trace.TraceError("Error writing appointments for room {0} ErrMsg: {1}", room, ex.Message);
                        xmlWriter.WriteStartElement("Error");
                            xmlWriter.WriteAttributeString("Room", room);                        
                            xmlWriter.WriteStartElement("Message", ex.Message);
                            xmlWriter.WriteStartElement("Trace");
                                xmlWriter.WriteCData(ex.StackTrace);
                             xmlWriter.WriteEndElement();                    
                        xmlWriter.WriteEndElement();
                }
            }

            xmlWriter.WriteEndElement();
            xmlWriter.WriteEndDocument();
           
        }

        /// <summary>
        /// Export appointments into xml file
        /// </summary>
        /// <param name="Appointments"></param>
        static void WriteRoomXml(data.ScheduleData roomSchedule, XmlTextWriter writer)
        {
            
                foreach (data.Appointment appointment in roomSchedule.Schedule)
                // foreach (Appointment appointment in Appointments)
                {
                    
                    writer.WriteStartElement("Appointment");
                    writer.WriteElementString("StartTime", appointment.StartTime);
                    writer.WriteElementString("EndTime", appointment.EndTime);
                    writer.WriteElementString("Title", appointment.Title);
                    writer.WriteElementString("Location", appointment.Location);
                    writer.WriteElementString("Category", appointment.Category);
                    
                    // Try to read Lync meeting URL                   

                writer.WriteEndElement();
                }
     
        }

 

        const string CacheKey = "Appointments";
        const string DateTimeFormat = @"dd\/MM\/yyyy HH:mm";


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

    }
}
