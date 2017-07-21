using System;
using System.Collections.ObjectModel;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xamarin.Forms;
using SmartHive.Models.Events;
using SmartHive.Models.Config;
using SmartHive.LevelMapApp.Views;
using SmartHive.LevelMapApp.Controllers;

namespace SmartHive.LevelMapApp
{
	public partial class MainPage : ContentPage
	{
        
        LevelViewModel LevelData = new LevelViewModel();              
        MainPageController controller = null;

        public MainPage()
		{
            this.controller = new MainPageController(this);
            InitializeComponent();
            this.roomsScheduleView.ItemsSource = LevelData;
            this.roomsScheduleView.ItemTapped += this.controller.roomsScheduleView_ItemTapped;

            this.levelMapWebView.RegisterAction(this.controller.LevelView_LevelRoomClicked);
        }

   

        internal void OnRoomScheduleStatusChanged(object sender, Appointment e)
        {
            var roomConfig = sender as RoomConfig;
            if (roomConfig == null)
                return;
            
            LevelData.UpdateRoomConfig(roomConfig);
        }

        internal void OnRoomSensorChanged(object sender, IRoomSensor e)
        {
            var roomConfig = sender as RoomConfig;
            if (roomConfig == null)
                return;

            LevelData.UpdateRoomConfig(roomConfig);

        }

        internal void OnSettingsLoaded(object sender, bool isSuccess)
        {
            if (isSuccess && LevelData.Count == 0)
            {
                this.controller.AppController.BeginInvokeOnMainThread(() =>
                {
                    // Initialize all rooms when Settings loaded
                    var levelConfig = sender as ILevelConfig;
                    if (levelConfig != null)
                    {
                        foreach (IRoomConfig roomCfg in levelConfig.RoomsConfig)
                        {
                            LevelData.UpdateRoomConfig(roomCfg);
                        }
                    }
                });
            }
            
        }

       
    }
}
