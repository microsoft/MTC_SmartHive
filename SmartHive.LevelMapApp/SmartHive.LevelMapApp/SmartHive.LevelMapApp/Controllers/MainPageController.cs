using System;
using System.Collections.Generic;
using System.Text;
using SmartHive.Models.Events;
using SmartHive.Models.Config;
using Xamarin.Forms;
using Newtonsoft.Json;
using SmartHive.LevelMapApp.Views;
using Rg.Plugins.Popup.Extensions;

namespace SmartHive.LevelMapApp.Controllers
{
    internal class MainPageController : AbstractController
    {
        private RoomDetailPopupPage roomDetailPopup;
        private ContentPage mainPage;

        internal MainPageController(ContentPage mainPage)
        {
            this.mainPage = mainPage;
        }

        private ILevelConfig CurrentLevel
        {
            get
            {
                ISettingsProvider settingsProvider = ((SmartHive.LevelMapApp.App)App.Current).settingsController;
                string levelId = settingsProvider.GetPropertyValue(SettingsConst.DefaultLevel_PropertyName);
                return settingsProvider.GetLevelConfig(levelId);
            }
        }

        internal void LevelView_LevelRoomClicked(string JsonData)
        {

            
            JavaScriptAreaEvent eventParams = (JavaScriptAreaEvent)JsonConvert.DeserializeObject(JsonData, typeof(JavaScriptAreaEvent));

            foreach (IRoomConfig roomCfg in CurrentLevel.RoomsConfig)
            {
                if (roomCfg.FloorMapVarName.Equals(eventParams.Variable))
                {
                    ShowRoomDetailPopup(roomCfg);
                    TelemetryLog.TrackPageView(roomCfg.Location);
                    return;
                }
            }
            // This looks like incorrect behavior
            TelemetryLog.TrackAppEvent("no page view handler: " + JsonData);
        }

        private async void ShowRoomDetailPopup(IRoomConfig config)
        {
            this.roomDetailPopup = new RoomDetailPopupPage(config);
            await this.mainPage.Navigation.PushPopupAsync(this.roomDetailPopup);
        }

       internal void roomsScheduleView_ItemTapped(object sender, ItemTappedEventArgs e)
        {
            RoomViewModel rv = e.Item as RoomViewModel;
            if (rv == null)
                return;
            IRoomConfig config = CurrentLevel.GetRoomConfig(rv.Location);
            ShowRoomDetailPopup(config);
        }
    }

    public class JavaScriptAreaEvent
    {
        [JsonProperty("area_name")]
        public string Name { get; set; }

        [JsonProperty("area_variable")]
        public String Variable { get; set; }

 
    }
}
