using System;
using System.Collections.Generic;
using System.Text;
using SmartHive.Models.Config;

namespace SmartHive.LevelMapApp.Controllers
{

    interface ILevelMapController
    {

        void SetRoomStatus(IRoomConfig roomConfig, RoomStatus roomStatus);   

        void OnRoomSensorChanged(object sender, IRoomSensor e);
        
    }
}
