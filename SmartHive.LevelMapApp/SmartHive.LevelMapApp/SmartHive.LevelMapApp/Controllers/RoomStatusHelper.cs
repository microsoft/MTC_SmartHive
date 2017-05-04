using System;
using System.Collections.Generic;
using System.Linq;
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


        private static RoomStatus (IRoomConfig roomCfg)

        /// <summary>
        /// Check if we have any engagements 
        /// </summary>
        /// <param name="roomCfg"></param>
        /// <param name="e"></param>
        /// <returns></returns>
        internal static RoomStatus CalculateRoomStatus(IRoomConfig roomCfg, OnScheduleUpdateEventArgs e)
        {
            if (e.Schedule == null || roomCfg == null || e.Schedule.Length == 0)
                return RoomStatus.Unknown;

            Appointment currentAppointment = e.Schedule.SingleOrDefault<Appointment>(a => DateTime.Parse(a.StartTime) >= DateTime.Now && DateTime.Parse(a.EndTime) <= DateTime.Now);

            if (currentAppointment != null)
                roomCfg.CurrentAppointment = currentAppointment;
        }

    }
}
