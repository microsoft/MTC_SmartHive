using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SmartHive.Models.Config;
using SmartHive.LevelMapApp.Controllers;

using Xamarin.Forms;

namespace SmartHive.LevelMapApp
{
	public partial class App : Application
	{
       
       public ServiceBusEventController serviceBusEventController = null;
       public ISettingsProvider settingsController = null;
       public IEventTransport transport = null;

        public App (IEventTransport transport) : base()
		{

			InitializeComponent();

            this.transport = transport;

            // Handle when your app starts
            this.settingsController = SettingsController.AppSettings;

            //Set some settings for debugging
            if (string.IsNullOrEmpty(this.settingsController.GetPropertyValue(SettingsConst.LevelConfigUrl_PropertyName)))
                this.settingsController.SetPropertyValue(SettingsConst.LevelConfigUrl_PropertyName, "http://mtcscheduleboard.azurewebsites.net/test/rooms.xml");
            if (string.IsNullOrEmpty(this.settingsController.GetPropertyValue(SettingsConst.DefaultLevel_PropertyName)))
                this.settingsController.SetPropertyValue(SettingsConst.DefaultLevel_PropertyName, "wgoc");

            if (string.IsNullOrEmpty(this.settingsController.GetPropertyValue(WireGeoRoomController.WireGeoApiUrl_PropertyName)))
                this.settingsController.SetPropertyValue(WireGeoRoomController.WireGeoApiUrl_PropertyName, "https://cloud.wiregeo.com/api/v1/");

            if (string.IsNullOrEmpty(this.settingsController.GetPropertyValue(WireGeoRoomController.WireGeoApiToken_PropertyName)))
                this.settingsController.SetPropertyValue(WireGeoRoomController.WireGeoApiToken_PropertyName, "t3ij3nwcwet88fnmhb0337haugkqlmv5");


            MainPage = new SmartHive.LevelMapApp.MainPage();


            this.settingsController.OnSettingsLoaded += ((SmartHive.LevelMapApp.MainPage)this.MainPage).OnSettingsLoaded;            
        }

        protected override void OnStart ()
		{
            if (transport == null)
                return; 

            this.serviceBusEventController = new LevelMapApp.Controllers.ServiceBusEventController(transport, this.settingsController);
            this.serviceBusEventController.OnRoomScheduleStatusChanged +=
                ((SmartHive.LevelMapApp.MainPage)this.MainPage).OnRoomScheduleStatusChanged;

            this.serviceBusEventController.OnRoomSensorChanged += ((SmartHive.LevelMapApp.MainPage)this.MainPage).OnRoomSensorChanged;
        }

      

        protected override void OnSleep ()
		{
			// Handle when your app sleeps
		}

		protected override void OnResume ()
		{
			// Handle when your app resumes
		}
	}
}
