using System;
using System.Collections.Generic;
using System.Text;

using SmartHive.Models.Config;
using SmartHive.Models.Events;

using Xamarin.Forms;

namespace SmartHive.LevelMapApp.Views
{
    public class RoomViewModel
    {

       public string Location {
            get {
                return this.roomConfig.Location;
            }
        }
        public string Title {
            get {
                return this.roomConfig.Title;
            }
        }
        public string Title_En {
            get
            {
                return this.roomConfig.Title_En;
            }
        }       
        public Appointment CurrentAppointment {
            get {
                return this.roomConfig.CurrentAppointment;
            }
        }
        
        private IRoomConfig roomConfig = null;

        public RoomViewModel(IRoomConfig roomConfig) 
        {
            this.roomConfig = roomConfig;            
        }

        public Color RoomStatusColor
        {
            get
            {                
                switch (roomConfig.RoomStatus)
                {
                    case RoomStatus.RoomFree:
                       return  (Color)Application.Current.Resources["RoomAvaliableColor"];                        
                    case RoomStatus.RoomScheduled:
                        return (Color)Application.Current.Resources["RoomScheduled"];
                    case RoomStatus.RoomScheduledAndOccupied:
                        return (Color)Application.Current.Resources["RoomScheduledAndOccupied"];
                    case RoomStatus.RoomOccupied:
                        return (Color)Application.Current.Resources["RoomOccupied"];
                    default:
                        return (Color)Application.Current.Resources["RoomUnknown"];
                }
            }
        }
    }

    public class RoomViewModelComparer : IComparer<RoomViewModel>
    {       
        public int Compare(RoomViewModel x, RoomViewModel y)
        {
            return Comparer<string>.Default.Compare(x.Title, y.Title);
        }
    }
}
