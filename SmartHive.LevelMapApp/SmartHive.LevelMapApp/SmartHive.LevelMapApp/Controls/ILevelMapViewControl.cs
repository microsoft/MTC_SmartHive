using System;
using System.Collections.Generic;
using System.Text;
using SmartHive.Models.Config;

namespace SmartHive.LevelMapApp.Controls
{
    
    interface ILevelMapViewControl 
    {
        event EventHandler<IRoomConfig> LevelRoomClicked;
    }
}
