using System;
using SmartHive.Models.Events;
using SmartHive.Models.Config;
using System.Text;


namespace SmartHive.LevelMapApp.Controllers
{
    public interface IEventTransport
    {
        event EventHandler<OnNotificationEventArgs> OnNotification;
        event EventHandler<string> OnServiceBusConnected;
        event EventHandler<OnScheduleUpdateEventArgs> OnScheduleUpdate;
        event EventHandler<OnEvenLogWriteEventArgs> OnEventLog;
        /// <summary>
        /// Perform initialization and conenct to datasource
        /// </summary>
        void Connect(ISettingsProvider SettingsProvider);

    }
}
