using System;
using System.Collections.Generic;
using SmartHive.Models.Events;
using SmartHive.Models.Config;

namespace SmartHive.LevelMapApp.Controllers
{

    interface ILevelMapController
    {

        void SetRoomStatus(IRoomConfig roomConfig);   

        void OnRoomSensorChanged(object sender, IRoomSensor e);
        void OnRoomScheduleStatusChanged(object sender, Appointment e);
    }
}
