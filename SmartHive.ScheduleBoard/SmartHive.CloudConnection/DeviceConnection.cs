using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.HockeyApp;
using System.Diagnostics;
using Newtonsoft.Json;

using SmartHive.CloudConnection.Events;


using Windows.System.Threading;
using Windows.Storage;

namespace SmartHive.CloudConnection
{
    public sealed class DeviceConnection
    {


        public void Init() {
            Microsoft.HockeyApp.HockeyClient.Current.Configure("794fe9f3e0f64f739a9238cae720dee4",
                 new TelemetryConfiguration() {                    
                     EnableDiagnostics = true });
           

#if DEBUG
                ((HockeyClient)HockeyClient.Current).OnHockeySDKInternalException += (sender, args) =>
                {
                    if (Debugger.IsAttached) { Debugger.Break(); }
                };
            #endif
        }

        public async void  SendCrashes()
        {
            await HockeyClient.Current.SendCrashesAsync();
            
        }

    /*    private void populateProperty(Dictionary<string, string> reportedProps, string PropertyName)
        {
            var propertyValue = ApplicationData.Current.LocalSettings.Values[PropertyName] as String;
            if (propertyValue != null)
            {
                reportedProps.Add(PropertyName, propertyValue);
            }else
            {
                reportedProps.Add(PropertyName, "NULL");
            }
        }

        public void TrackEvent(string eventName)
        {
            Dictionary<string, string> reportedProps = new Dictionary<string, string>();
            populateProperty(reportedProps, "Subscription");                
            populateProperty(reportedProps, "Location");
                        
            Microsoft.HockeyApp.HockeyClient.Current.TrackTrace(eventName);            
        }

        public void TrackException(Exception ex, IDictionary<string, string> properties)
        {
            Microsoft.HockeyApp.HockeyClient.Current.TrackException(ex, properties);
            Microsoft.HockeyApp.HockeyClient.Current.Flush();
        }

        public void TrackMetric(string name, double value)
        {
            Microsoft.HockeyApp.HockeyClient.Current.TrackMetric(name, value);
        }

        public void TrackPageView(string name)
        {
            Microsoft.HockeyApp.HockeyClient.Current.TrackPageView(name);
        }

        public void TrackTrace(string message, IDictionary<string, string> properties)
        {
            Microsoft.HockeyApp.HockeyClient.Current.TrackTrace(message,properties);
        }
        */
    }
}
