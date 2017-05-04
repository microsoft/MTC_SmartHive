using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.WindowsRuntime;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Data;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;
using SmartHive.Models.Config;
using SmartHive.LevelMapApp.Controllers;
using SmartHive.LevelMapApp.UWP.Controllers;

namespace SmartHive.LevelMapApp.UWP
{
    public sealed partial class MainPage
    {

        private ServiceBusEventController serviceBusEventController = null;
        private ISettingsProvider SettingsController;

        public MainPage()
        {
            this.InitializeComponent();

            this.Loaded += MainPage_Loaded;

            this.SettingsController = new SettingsControllerUwp();
            
            //Set some settings for debugging
            if (this.SettingsController.GetPropertyValue(SettingsConst.LevelConfigUrl_PropertyName) == null)
                this.SettingsController.SetPropertyValue(SettingsConst.LevelConfigUrl_PropertyName, "http://mtcscheduleboard.azurewebsites.net/test/rooms.xml");
            if (this.SettingsController.GetPropertyValue(SettingsConst.DefaultLevel_PropertyName) == null)
                this.SettingsController.SetPropertyValue(SettingsConst.DefaultLevel_PropertyName, "wgoc");

            if (this.SettingsController.GetPropertyValue(WireGeoRoomController.WireGeoApiUrl_PropertyName) == null)
                this.SettingsController.SetPropertyValue(WireGeoRoomController.WireGeoApiUrl_PropertyName, "https://cloud.wiregeo.com/api/v1/");

            if (this.SettingsController.GetPropertyValue(WireGeoRoomController.WireGeoApiToken_PropertyName) == null)
                this.SettingsController.SetPropertyValue(WireGeoRoomController.WireGeoApiToken_PropertyName, "t3ij3nwcwet88fnmhb0337haugkqlmv5");

        //    this.connection = new ServiceBusConnection("mtcdatacenter", );
        //    this.connection.InitSubscription("wgoc", "FloorMap");
        //  LoadApplication(new SmartHive.LevelMapApp.App());
    }

        private void MainPage_Loaded(object sender, RoutedEventArgs e)
        {
            // Initialize Service Bus connection and set required event handlers
            IEventTransport ServiceBusEventTransport = new ServiceBusEventTransportUwp();
            this.serviceBusEventController = new LevelMapApp.Controllers.ServiceBusEventController(ServiceBusEventTransport, this.SettingsController);
            
        }
  

        private void floorMapView_ScriptNotify(object sender, NotifyEventArgs e)
        {

        }
    }
}
