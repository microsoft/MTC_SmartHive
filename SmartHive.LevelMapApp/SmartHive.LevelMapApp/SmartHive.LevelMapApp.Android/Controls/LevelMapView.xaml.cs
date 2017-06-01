using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartHive.LevelMapApp.Controls;
using SmartHive.Models.Config;
using Xamarin.Forms;

namespace SmartHive.LevelMapApp.Droid.Controls
{
    public partial class LevelMapView : ContentView, ILevelMapViewControl
    {
        public LevelMapView()
        {
            InitializeComponent();
        }

        public event EventHandler<IRoomConfig> LevelRoomClicked;
    }
}
