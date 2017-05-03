using System;
using System.Net.Http;
using SmartHive.Models.Config;
using SmartHive.Models.Events;
using System.Collections.Generic;
using System.Text;

namespace SmartHive.LevelMapApp.Controllers
{
    public class WireGeoRoomController : ILevelMapController
    {

        private string ApiToken = null;
        public const string WireGeoApiToken_PropertyName = "WireGeoApiToken";
        
        private HttpClient httpClient = null;


        public WireGeoRoomController(ISettingsProvider settingsProvider)
        {
            this.ApiToken = settingsProvider.GetPropertyValue(WireGeoApiToken_PropertyName);
            this.httpClient = new HttpClient();
        }

        private void SetRoomStatus(string RoomId, string roomStatus)
        {
           // TODO: Perform call
        }

        public void SetRoomStatus(IRoomConfig roomConfig, RoomStatus roomStatus)
        {
                SetRoomStatus(roomConfig.FloorMapVarName, "0");
             //TODO: Map Status
        }

        public void OnRoomSensorChanged(object sender, IRoomSensor e)
        {
            var roomConfig = sender as IRoomConfig;            
            if (roomConfig != null && NotificationEventSchema.PirSensorValueLabel.Equals(e.Telemetry))// PiR sensor changed
            {
                RoomStatus status = RoomStatusHelper.CalculateRoomStatus(roomConfig, e.LastMeasurement.Value);
                SetRoomStatus(roomConfig, status);
            }
        }
    }
}
