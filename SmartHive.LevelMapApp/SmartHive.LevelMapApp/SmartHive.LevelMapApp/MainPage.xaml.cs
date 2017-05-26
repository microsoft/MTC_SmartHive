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

namespace SmartHive.LevelMapApp
{
	public partial class MainPage : ContentPage
	{
       LevelViewModel LevelData = new LevelViewModel();              
        public MainPage()
		{          
            InitializeComponent();
            roomsScheduleView.ItemsSource = LevelData;
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
    }
}
