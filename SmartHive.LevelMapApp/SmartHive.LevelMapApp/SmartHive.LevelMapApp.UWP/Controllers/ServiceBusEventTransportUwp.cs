using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartHive.LevelMapApp.Controllers;
using SmartHive.Models.Events;
using SmartHive.Models.Config;
using SmartHive.Controllers;

namespace SmartHive.LevelMapApp.UWP.Controllers
{
    /// <summary>
    /// Service Bus Event transport implementation for UWP
    /// </summary>
    class ServiceBusEventTransportUwp : IEventTransport
    {
        public event EventHandler<OnNotificationEventArgs> OnNotification;
        public event EventHandler<string> OnServiceBusConnected;
        public event EventHandler<OnScheduleUpdateEventArgs> OnScheduleUpdate;
        public event EventHandler<OnEvenLogWriteEventArgs> OnEventLog;

        private ServiceBusConnection connection;
        private ILevelConfig levelConfig;

        public void Connect(IRoomConfig SettingsProvider)
        {
            throw new NotImplementedException();
        }
        public void Connect(ILevelConfig levelConfig)
        {
            this.levelConfig = levelConfig;
            if (this.levelConfig.isLoaded) // Check if settings ready 
            {
                Connect();
            }
            else
            {
                this.levelConfig.OnSettingsLoaded += LevelConfig_OnSettingsLoaded;
            }
            
        }

        private void LevelConfig_OnSettingsLoaded(object sender, bool e)
        {
            Connect();
        }

        private void Connect()
        {
            this.connection = new ServiceBusConnection(levelConfig.ServiceBusNamespace, levelConfig.SasKeyName, levelConfig.SasKey);
            this.connection.OnServiceBusConnected += Connection_OnServiceBusConnected;
            this.connection.OnEventLog += Connection_OnEventLog;
            this.connection.InitSubscription(levelConfig.ServiceBusTopic, levelConfig.ServiceBusSubscription, 10);
        }


        private void Connection_OnServiceBusConnected(object sender, string e)
        {
            this.connection.OnNotification += Connection_OnNotification;
            this.connection.OnScheduleUpdate += Connection_OnScheduleUpdate;
             if (this.OnServiceBusConnected != null)
            {
                this.OnServiceBusConnected.Invoke(sender, e);
            }
        }

        private void Connection_OnScheduleUpdate(object sender, Models.Events.OnScheduleUpdateEventArgs e)
        {
            //Schedule updated
            if (this.OnScheduleUpdate != null)
            {
                this.OnScheduleUpdate.Invoke(sender,e);
            }
        }

        private void Connection_OnNotification(object sender, Models.Events.OnNotificationEventArgs e)
        {
            // Sensor notification
            if (this.OnNotification != null)
            {
                this.OnNotification.Invoke(sender, e);
            }

        }

        private void Connection_OnEventLog(object sender, Models.Events.OnEvenLogWriteEventArgs e)
        {
            if (this.OnEventLog != null)
            {
                this.OnEventLog.Invoke(sender, e);
            }
        }

        
    }
}
