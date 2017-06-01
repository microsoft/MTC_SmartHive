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
using SmartHive.LevelMapApp.Controls;
using SmartHive.Models.Config;
using Xamarin.Forms.Platform.UWP;

// The User Control item template is documented at https://go.microsoft.com/fwlink/?LinkId=234236

namespace SmartHive.LevelMapApp.UWP.Controls
{
    public sealed partial class LevelMapView : UserControl, ILevelMapViewControl
    {
        public LevelMapView()
        {
                      
        }

        public event EventHandler<IRoomConfig> LevelRoomClicked;

         private void LevelMapView_ScriptNotify(object sender, NotifyEventArgs e)
        {

        }
    }
}
