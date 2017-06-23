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
using SmartHive.LevelMapApp.Controls;

namespace SmartHive.LevelMapApp
{
	public partial class MainPage : ContentPage
	{       
       LevelViewModel LevelData = new LevelViewModel();              
        public MainPage()
		{          
            InitializeComponent();
            roomsScheduleView.ItemsSource = LevelData;
            InitWebView();
        }


        internal void InitWebView()
        {

            levelMapWebView.RegisterAction(LevelView_LevelRoomClicked);
        }

        private void LevelView_LevelRoomClicked(string JsonData)
        {
            
            throw new NotImplementedException();
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

        internal void OnSettingsLoaded(object sender, bool e)
        {
            if (LevelData.Count == 0)
            {
                Xamarin.Forms.Device.BeginInvokeOnMainThread(() =>
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
