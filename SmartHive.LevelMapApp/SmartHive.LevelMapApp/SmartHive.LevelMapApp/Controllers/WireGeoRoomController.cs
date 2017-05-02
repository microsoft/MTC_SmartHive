using System;
using System.Net.Http;
using SmartHive.Models.Config;
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

        public void SetRoomStatus(string RoomId, RoomStatus roomStatus)
        {
            throw new NotImplementedException();
        }

        public void SetRoomStatus(IRoomConfig roomConfig, string roomStatus)
        {

        }
    }
}
