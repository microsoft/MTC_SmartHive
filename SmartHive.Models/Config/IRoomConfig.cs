using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartHive.Models.Config
{

    public enum RoomStatus
    {
        Unknown,
        RoomFree,
        RoomScheduled,
        RoomOccupied,
        RoomScheduledAndOccupied,
    }
    public interface IRoomConfig : IServiceBusConfig
    {     
      string Location {get; set;}     
      string Title { get; set; }
      string Title_En { get; set; }
      string IconTop { get; set; }
      string IconBottom { get; set; }
      string Css { get; set; }
    
      
      List<string> RoomDeviceIDs { get; }

      RoomStatus RoomStatus { get; set; }
    }
}
