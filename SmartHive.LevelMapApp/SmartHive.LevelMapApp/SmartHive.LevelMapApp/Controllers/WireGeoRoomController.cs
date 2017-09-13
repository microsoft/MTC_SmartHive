using System;
using System.Net.Http;
using SmartHive.Models.Config;
using SmartHive.Models.Events;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Collections;
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

        private static Hashtable statusCache = new Hashtable();

        public WireGeoRoomController(ISettingsProvider settingsProvider)
        {
            this.httpClient = new HttpClient();
            this.httpClient.Timeout = new TimeSpan(0, 1, 0); // Configure timeout value

            this.ApiToken = settingsProvider.GetPropertyValue(WireGeoApiToken_PropertyName);
            this.ApiUrl = settingsProvider.GetPropertyValue(WireGeoApiUrl_PropertyName);        
        }


        public void SetRoomStatus(IRoomConfig roomConfig)
        {
            if (roomConfig == null) { 
                this.AppController.TrackAppEvent("Error: trying set room status for null room reference");
                return;
            }else if (roomConfig.FloorMapVarName == null)
            {
                this.AppController.TrackAppEvent(String.Format("Error: no FloorMapVarName specified in config file for room location {0}", roomConfig.Location));
                return;
            }


            if (statusCache[roomConfig.FloorMapVarName] == null)
                {
                    statusCache[roomConfig.FloorMapVarName] = (int)roomConfig.RoomStatus;
                }
                else if ((int)statusCache[roomConfig.FloorMapVarName] == (int)roomConfig.RoomStatus) { 
                    // status stays the same - ignore
                    return;
                }
                else
                {
                    // update current status
                    statusCache[roomConfig.FloorMapVarName] = (int)roomConfig.RoomStatus;
                }


                    Task.Run(() =>
                    {
                        SetVariable(roomConfig.FloorMapVarName, (int)roomConfig.RoomStatus);
                    });
           
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
            if (string.IsNullOrEmpty(VarName))
            {
                this.AppController.TrackAppEvent("Error: trying set room status for null or empty room reference");
                return;
            }

            try
            {
                string RestUrl = ApiUrl + @"variables/ByName/" + VarName;

                this.AppController.TrackAppEvent("Http call " + RestUrl);

                VarValue value = new VarValue();
                value.Token = ApiToken;
                value.Value = Value;
                value.Name = VarName;
                value.Parent = String.Empty;

                // Serialize our concrete class into a JSON String
                var stringValue = JsonConvert.SerializeObject(value);

                var httpContent = new StringContent(stringValue, Encoding.UTF8, "application/json");


                await httpClient.PutAsync(RestUrl, httpContent)
                   .ContinueWith(task =>
                   {
                       if (task.Status != TaskStatus.RanToCompletion)
                       {
                           this.AppController.TrackAppEvent(String.Format("Error Http request {0} task status {1}", RestUrl, task.Status));
                       }
                       else
                       {
                           var respMsg = task.Result;
                                   // If request faild - log this
                                   if (respMsg != null && !respMsg.IsSuccessStatusCode)
                           {
                               this.AppController.TrackAppEvent("Http req. " + RestUrl + " error: " + respMsg.StatusCode);
                           }
                       }
                   });

            }
            catch(Exception ex)
            {
                this.AppController.TrackAppException(ex);
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
