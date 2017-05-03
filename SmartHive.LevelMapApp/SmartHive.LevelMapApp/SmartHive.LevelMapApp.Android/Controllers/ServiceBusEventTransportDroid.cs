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
using SmartHive.Models.Config;

namespace SmartHive.LevelMapApp.Droid.Controllers
{
    class ServiceBusEventTransportDroid : IEventTransport
    {
        public event EventHandler<OnNotificationEventArgs> OnNotification;
        public event EventHandler<string> OnServiceBusConnected;
        public event EventHandler<OnScheduleUpdateEventArgs> OnScheduleUpdate;
        public event EventHandler<OnEvenLogWriteEventArgs> OnEventLog;

        public void Connect(ILevelConfig SettingsProvider)
        {
            throw new NotImplementedException();
        }

        public void Connect(IRoomConfig SettingsProvider)
        {
            throw new NotImplementedException();
        }
    }
}