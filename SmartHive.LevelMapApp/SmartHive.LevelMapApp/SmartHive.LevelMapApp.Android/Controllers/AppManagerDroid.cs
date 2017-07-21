using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Android.App;
using Android.Content;
using Android.OS;
using Android.Runtime;
using Android.Views;
using Android.Widget;

using SmartHive.LevelMapApp.Controllers;
using SmartHive.Models.Events;
using HockeyApp.Android;


namespace SmartHive.LevelMapApp.Droid.Controllers
{
    class AppManagerDroid : IAppController
    {

        internal AppManagerDroid()
        {
           
        }

        public void BeginInvokeOnMainThread(Action action)
        {
            throw new NotImplementedException();
        }

        public void TrackAppEvent(string EventName)
        {
            throw new NotImplementedException();
        }

        public void TrackAppEvent(IEventBase smartHiveEvent)
        {
            throw new NotImplementedException();
        }

        public void TrackAppException(Exception ex)
        {
            throw new NotImplementedException();
        }

        public void TrackPageView(string ViewName)
        {
            throw new NotImplementedException();
        }
    }
}