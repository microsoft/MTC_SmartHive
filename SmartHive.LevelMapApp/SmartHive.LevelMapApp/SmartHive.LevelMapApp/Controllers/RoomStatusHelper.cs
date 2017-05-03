using System;
using System.Collections.Generic;
using System.Text;
using SmartHive.Models.Config;
using SmartHive.Models.Events;

namespace SmartHive.LevelMapApp.Controllers
{
    static class RoomStatusHelper
    {


        internal static RoomStatus CalculateRoomStatus(IRoomConfig roomCfg, string PiRSensorValue)
        {
            //TODO: Add implementation
            return RoomStatus.RoomFree;
            /*
             * if (PiRSensorValue.StartsWith("1"))
                { // PiR is ON
                    if ()
                    roomStatus = RoomStatus.RoomFree;
                }
                else
                {

                }*/
        }

    }
}
