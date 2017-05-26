using System;
using System.Collections.ObjectModel;
using System.Collections.Generic;
using System.Threading;
using System.Linq;
using System.Text;
using SmartHive.Models.Config;

namespace SmartHive.LevelMapApp.Views
{
    public class LevelViewModel : ObservableCollection<RoomTypeGroup>
    {

        private Mutex updateMutex = new Mutex(false, "LevelViewModelUpdateMutex");

        internal void UpdateRoomConfig(RoomConfig currentConfig)
        {
                try
                {
                    updateMutex.WaitOne(5 * 1000);
                    RoomTypeGroup existingGroup = this.FindRoomTypeGroupForRoom(currentConfig);

                    if (existingGroup != null)
                    {
                        // Handle update as remove and add
                        bool isSuccess = existingGroup.Remove(currentConfig);
                    }

                    existingGroup = FindRoomTypeGroupForStatus(currentConfig.RoomStatus);
                    if (existingGroup == null)
                    {
                        existingGroup = new RoomTypeGroup(currentConfig.RoomStatus);
                        this.Add(existingGroup);
                    }
                    existingGroup.Add(currentConfig);
                }
                finally
                {
                updateMutex.ReleaseMutex();
                }
            
        }

        /// <summary>
        /// Find first existing room group for this room status
        /// </summary>
        /// <param name="config"></param>
        /// <returns></returns>
        private RoomTypeGroup FindRoomTypeGroupForStatus(RoomStatus status)
        {           
            return this.FirstOrDefault<RoomTypeGroup>(t => t.RoomStatus == status);
        }


        /// <summary>
        /// Find first existing room group for this room (match Location)
        /// </summary>
        /// <param name="config"></param>
        /// <returns></returns>
        private RoomTypeGroup FindRoomTypeGroupForRoom(RoomConfig room)
        {
            return this.FirstOrDefault<RoomTypeGroup>(t => t.FirstOrDefault<RoomConfig>(r => r.Location.Equals(room.Location)) != null);
        }



    }


    /// <summary>
    /// Collection of RommConfigurations with the same Room Booking Status
    /// </summary>
    public class RoomTypeGroup : ObservableCollection<RoomConfig>
    {
        public RoomStatus RoomStatus { get; private set; }

        public string RoomStatusTitle { get; private set;}
        public string RoomStatusSubTitle { get; private set; }

        public string RoomStatusIcon { get; private set; }

        internal RoomTypeGroup(RoomStatus roomStatus)
        {
            this.RoomStatus = roomStatus;

            switch (roomStatus)
            {
                case RoomStatus.RoomFree:
                    this.RoomStatusTitle = "Свободные комнаты";
                    //this.RoomStatusIcon = "http://";
                    break;
                case RoomStatus.RoomScheduled:
                    this.RoomStatusTitle = "Забронированные комнаты";
                    break;
                case RoomStatus.RoomScheduledAndOccupied:
                    this.RoomStatusTitle = "Забронированые и занятые комнаты";
                    break;
                case RoomStatus.RoomOccupied:
                    this.RoomStatusTitle = "Занятые комнаты";
                    break;
                default:
                    this.RoomStatusTitle = "Помещения без статуса";
                    break;

            }
        }
        
       
    }
}
