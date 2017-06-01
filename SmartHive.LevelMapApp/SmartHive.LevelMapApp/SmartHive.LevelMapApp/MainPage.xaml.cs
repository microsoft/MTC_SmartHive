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
#if __ANDROID__
using Xamarin.Forms.Platform.Android;
using SmartHive.LevelMapApp.Droid.Controls;
#else       
//UWP
using Xamarin.Forms.Platform.UWP;
using Windows.UI.Xaml.Controls;
using SmartHive.LevelMapApp.UWP.Controls;          
#endif

namespace SmartHive.LevelMapApp
{
	public partial class MainPage : ContentPage
	{
        ILevelMapViewControl levelView = null;
       LevelViewModel LevelData = new LevelViewModel();              
        public MainPage()
		{          
            InitializeComponent();
            roomsScheduleView.ItemsSource = LevelData;
            InitWebView();
        }


        internal void InitWebView()
        {


#if __ANDROID__
            SmartHive.LevelMapApp.Droid.Controls.LevelMapView droidLevelView = new SmartHive.LevelMapApp.Droid.Controls.LevelMapView();
            this.levelView = droidLevelView;
            this.levelMapLayout.Children.Add(droidLevelView);
#else    //UWP            
            SmartHive.LevelMapApp.UWP.Controls.LevelMapView uwpLevelView = new SmartHive.LevelMapApp.UWP.Controls.LevelMapView();           
            this.levelView = uwpLevelView;
            this.levelMapLayout.Children.Add(uwpLevelView);
#endif
            if (levelView == null)
                return;

            levelView.LevelRoomClicked += LevelView_LevelRoomClicked;
        }

        private void LevelView_LevelRoomClicked(object sender, IRoomConfig e)
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
