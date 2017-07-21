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
using Windows.ApplicationModel.Core;
using Windows.UI.Core;
using HockeyApp;

namespace SmartHive.LevelMapApp.UWP.Controllers
{
    public class AppManagerUwp : IAppController
    {
        CoreDispatcher dispatcher = null;

        internal AppManagerUwp()
        {
            
            if (!CoreApplication.GetCurrentView().IsMain)
            {
                // App is in kiosk mode (assigned acess)
                this.dispatcher = CoreApplication.GetCurrentView().Dispatcher;
            }
            else
            {
                this.dispatcher = CoreApplication.MainView.CoreWindow.Dispatcher;
            }

            
        }
        public async void BeginInvokeOnMainThread(Action action)
        {
            if (dispatcher == null)
                Xamarin.Forms.Device.BeginInvokeOnMainThread(action);
            else
            {
                if (dispatcher.HasThreadAccess)
                {
                    //already in UI thread
                    action();
                }
                else
                {
                    await dispatcher
                        .RunAsync(CoreDispatcherPriority.Normal, () => action());
                }
            }
            /*
                * https://msdn.microsoft.com/windows/hardware/drivers/partnerapps/create-a-kiosk-app-for-assigned-access
                * The lock framework renders the kiosk app’s main view in a new secondary view- it’s transparent to the app. 
                * This means that there are actually two views to your app when it's running in above lock mode.
                */
            /*    CoreDispatcher dispatcher = null;
                if (!CoreApplication.GetCurrentView().IsMain)
                {
                    // App is in kiosk mode (assigned acess)
                    dispatcher = CoreApplication.GetCurrentView().Dispatcher;
                }
                else
                {
                    dispatcher = CoreApplication.MainView.CoreWindow.Dispatcher;
                }

                await dispatcher.RunAsync(Windows.UI.Core.CoreDispatcherPriority.Normal, () => {
                    action.Invoke();
                });
                */
        }
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
