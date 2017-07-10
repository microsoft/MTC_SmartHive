using System;
using System.Net.Http;
using SmartHive.Models.Config;
using SmartHive.Models.Events;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text;
using Newtonsoft.Json;


namespace SmartHive.LevelMapApp.Controllers
{
    public class WireGeoRoomController : AbstractController, ILevelMapController
    {

        private string ApiToken = string.Empty;

        public const string WireGeoApiToken_PropertyName = "WireGeoApiToken";
        public const string WireGeoApiUrl_PropertyName = "WireGeoApiUrl";

        private string ApiUrl = string.Empty;
        private HttpClient httpClient = null;


        public WireGeoRoomController(ISettingsProvider settingsProvider)
        {
            this.ApiToken = settingsProvider.GetPropertyValue(WireGeoApiToken_PropertyName);
            this.ApiUrl = settingsProvider.GetPropertyValue(WireGeoApiUrl_PropertyName);
            this.httpClient = new HttpClient();
        }


        public void SetRoomStatus(IRoomConfig roomConfig)
        {
            SetVariable(roomConfig.FloorMapVarName, (int)roomConfig.RoomStatus);
        }

        public void OnRoomSensorChanged(object sender, IRoomSensor e)
        {                
           SetRoomStatus(sender as IRoomConfig);
            
        }

        public void OnRoomScheduleStatusChanged(object sender, Appointment e)
        {
           SetRoomStatus(sender as IRoomConfig);
        }

        private async void SetVariable(string VarName, int Value)
        {
            try
            {
                string RestUrl = ApiUrl + @"variables/ByName/" + VarName;

                this.TelemetryLog.TrackAppEvent("Set Variable rest call " + RestUrl);

                VarValue value = new VarValue();
                value.Token = ApiToken;
                value.Value = Value;
                value.Name = VarName;
                value.Parent = String.Empty;

                // Serialize our concrete class into a JSON String
                var stringValue = JsonConvert.SerializeObject(value);

                var httpContent = new StringContent(stringValue, Encoding.UTF8, "application/json");

                var httpResponse = await this.httpClient.PutAsync(RestUrl, httpContent);
                httpResponse.EnsureSuccessStatusCode();

                // If the response contains content we want to read it!
                if (httpResponse.Content != null)
                {
                    var responseContent = await httpResponse.Content.ReadAsStringAsync();

                    // From here on you could deserialize the ResponseContent back again to a concrete C# type using Json.Net
                }
            }catch(HttpRequestException ex)
            {
                this.TelemetryLog.TrackAppException(ex);
            }
        }
    }

    public class VarValue
    {
        [JsonProperty("token")]
        public string Token { get; set; }

        [JsonProperty("value")]
        public int Value { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("parent")]
        public string Parent { get; set; }
    }
}
