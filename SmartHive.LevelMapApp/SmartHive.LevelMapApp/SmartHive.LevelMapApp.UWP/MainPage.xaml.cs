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
        private ISettingsProvider settingsController = null;

        public MainPage()
        {
            this.InitializeComponent();

            // Initialize Service Bus connection and set required event handlers
            IEventTransport ServiceBusEventTransport = new ServiceBusEventTransportUwp();

            SmartHive.LevelMapApp.App  mainApp = new SmartHive.LevelMapApp.App(ServiceBusEventTransport);
           
            this.settingsController = mainApp.settingsController;

            LoadApplication(mainApp);            

        }
  

        private void floorMapView_ScriptNotify(object sender, NotifyEventArgs e)
        {

        }
    }
}
