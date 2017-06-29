using System;
using System.Collections.ObjectModel;
using System.Collections.Generic;
using System.Threading;
using System.Linq;
using System.Text;
using SmartHive.Models.Config;
using Xamarin.Forms;

namespace SmartHive.LevelMapApp.Views
{
    public class LevelViewModel : ObservableCollection<RoomTypeGroup>
    {

#if !__ANDROID__
        private Mutex updateMutex = new Mutex(false, "LevelViewModelUpdateMutex");
#endif

        internal void UpdateRoomConfig(IRoomConfig currentRoomConfig)
        {
                try
                {
#if !__ANDROID__
                    updateMutex.WaitOne(5 * 1000);
#endif
                    RoomTypeGroup existingGroup = this.FindRoomTypeGroupForRoom(currentRoomConfig);
                    

                    if (existingGroup != null)
                    {

                        RoomViewModel existingViewModel = existingGroup.FirstOrDefault<RoomViewModel>(r => r.Location.Equals(currentRoomConfig.Location));

                        // Handle update as remove and add
                        bool isSuccess = existingGroup.Remove(existingViewModel);
                        if (isSuccess && existingGroup.Count == 0)
                        { // If this is the last room in a group - remove whole group
                            this.Remove(existingGroup);
                        }
                    }

                    existingGroup = FindRoomTypeGroupForStatus(currentRoomConfig);
                    if (existingGroup == null)
                    {
                        existingGroup = new RoomTypeGroup(currentRoomConfig.RoomStatus);
                        this.Insert(0,existingGroup);                        
                    }
                    
                    existingGroup.AddSorted(new RoomViewModel(currentRoomConfig));
                

                }catch(Exception ex)
                {
                    // TODO Add logging
                    throw ex;
                }
                finally
                {
#if !__ANDROID__
                    updateMutex.ReleaseMutex();
#endif
            }

        }

        /// <summary>
        /// Find first existing room group for this room status
        /// </summary>
        /// <param name="config"></param>
        /// <returns></returns>
        private RoomTypeGroup FindRoomTypeGroupForStatus(IRoomConfig status)
        {
            RoomGroupType type = RoomTypeGroup.MapRoomStatusToGroup(status.RoomStatus);
            return this.FirstOrDefault<RoomTypeGroup>(t => t.GroupType == type);
        }
       

        /// <summary>
        /// Find first existing room group for this room (match Location)
        /// </summary>
        /// <param name="config"></param>
        /// <returns></returns>
        private RoomTypeGroup FindRoomTypeGroupForRoom(IRoomConfig room)
        {
            return this.FirstOrDefault<RoomTypeGroup>(t => t.FirstOrDefault<RoomViewModel>(r => r.Location.Equals(room.Location)) != null);
        }



    }

    public enum RoomGroupType
    {       
        FreeRooms,
        OtherRooms,        
    }

    /// <summary>
    /// Collection of RommConfigurations with the same Room Booking Status
    /// </summary>
    public class RoomTypeGroup : ObservableCollection<RoomViewModel>
    {
        public RoomGroupType GroupType { get; private set; }

        public string RoomStatusTitle { get; private set;}
        public string RoomStatusSubTitle { get; private set; }

        public Color GroupTitleBgColor { get; private set; }

        public string RoomStatusIcon { get; private set; }

        public static RoomGroupType MapRoomStatusToGroup(RoomStatus roomStatus)
        {
            switch (roomStatus)
            {
                case RoomStatus.RoomFree:
                    return RoomGroupType.FreeRooms;
                default:
                    return RoomGroupType.OtherRooms;
            }
        }

        internal RoomTypeGroup(RoomStatus roomStatus)
        {
            this.GroupType = MapRoomStatusToGroup(roomStatus);

            switch (this.GroupType)
            {
                case RoomGroupType.FreeRooms:
                    this.RoomStatusTitle = "Свободные комнаты";
                    this.GroupTitleBgColor = (Color)Application.Current.Resources["RoomAvaliableColor"];
                        //Color.FromHex("#B7F7C5");
                    break;                
                default:
                    this.RoomStatusTitle = "Помещения на этаже";
                    this.GroupTitleBgColor = (Color)Application.Current.Resources["RoomScheduledAndOccupiedColor"];
                       // Color.FromHex("#F7B1AF");
                    break;
            }
        }
        
        public void AddSorted(RoomViewModel roomViewModel)
        {
            IComparer<RoomViewModel> comparer = new RoomViewModelComparer();

            int i = 0;
            while (i < this.Count && comparer.Compare(this[i], roomViewModel) < 0)
                i++;
            this.Insert(i, roomViewModel);
        }
       
    }

}
