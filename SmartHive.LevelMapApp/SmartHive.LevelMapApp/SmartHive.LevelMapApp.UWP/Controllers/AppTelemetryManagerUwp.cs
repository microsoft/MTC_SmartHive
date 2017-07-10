using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartHive.LevelMapApp.Controllers;
using Microsoft.HockeyApp;
using Microsoft.HockeyApp.DataContracts;
using SmartHive.Models.Events;
using System.Reflection;
using HockeyApp;

namespace SmartHive.LevelMapApp.UWP.Controllers
{
    public class AppTelemetryManagerUwp : IAppTelemetryController
    {
        public void TrackAppEvent(string EventName)
        {
           EventTelemetry evt = new EventTelemetry(EventName);            
           HockeyClient.Current.TrackEvent(evt);
            
        }

        public void TrackAppEvent(IEventBase smartHiveEvent)
        {

            
            try
            {
                Dictionary<string, string> propsDictionary = smartHiveEvent.GetType().GetProperties(BindingFlags.Instance | BindingFlags.Public)
                    .ToDictionary<PropertyInfo, string, string>(prop => prop.Name, prop => prop.GetValue(smartHiveEvent, null).ToString());
                HockeyClient.Current.TrackEvent(smartHiveEvent.GetType().Name, propsDictionary);
                return;

            }
            catch(Exception ex)
            {
                this.TrackAppException(ex);
            }
            HockeyClient.Current.TrackEvent(smartHiveEvent.GetType().Name);

        }

        public void TrackAppException(Exception ex)
        {
            HockeyClient.Current.TrackException(ex);

        }

        public void TrackPageView(string ViewName)
        {
            /*
             *  PageViewTelemetry pvt = new PageViewTelemetry();
            pvt.Name = "Scenario1_Crashes_PageViewTelemetry";
            pvt.Properties.Add("Property1", "Value1");
             */
            HockeyClient.Current.TrackPageView(ViewName);
        }
    }
}
