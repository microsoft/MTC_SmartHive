using System;
using SmartHive.Models.Config;
using System.Collections.Generic;
using System.Text;

namespace SmartHive.LevelMapApp.Controllers
{
    public  class ServiceBusEventController
    {
        private IEventTransport transport;
        private ILevelMapController mapController;
        private ILevelConfig levelConfig;
        public ServiceBusEventController(IEventTransport transport, ISettingsProvider settingsProvider)
        {
            //TODO : Add Factory method to choose map provider
            this.mapController = new WireGeoRoomController(settingsProvider);

            string levelId = settingsProvider.GetPropertyValue(SettingsConst.DefaultLevel_PropertyName);
            this.levelConfig = settingsProvider.GetLevelConfig(levelId);
            
            this.transport = transport;            
            this.transport.OnServiceBusConnected += Transport_OnServiceBusConnected;
            this.transport.OnEventLog += Transport_OnEventLog;
            this.transport.Connect(settingsProvider);
        }
      

        private void Transport_OnServiceBusConnected(object sender, string e)
        {
            this.transport.OnScheduleUpdate += Transport_OnScheduleUpdate;
            this.transport.OnNotification += Transport_OnNotification;
        }

        private void Transport_OnNotification(object sender, Models.Events.OnNotificationEventArgs e)
        {
            // This is presence sensor change
            if (Models.Events.NotificationEventSchema.PirSensorValueLabel.Equals(e.ValueLabel, StringComparison.CurrentCultureIgnoreCase));
            {
                IRoomConfig roomConfig = this.levelConfig.FindRoomForSensorDeviceId(e.DeviceId);
                this.mapController.SetRoomStatus(roomConfig, e.Value);               
            }
            
            
        }

        private void Transport_OnScheduleUpdate(object sender, Models.Events.OnScheduleUpdateEventArgs e)
        {
            
        }

        private void Transport_OnEventLog(object sender, Models.Events.OnEvenLogWriteEventArgs e)
        {
            throw new NotImplementedException();
        }
    }
}
