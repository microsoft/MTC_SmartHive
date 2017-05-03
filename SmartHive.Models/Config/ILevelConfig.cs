using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartHive.Models.Config
{
    public interface ILevelConfig : IServiceBusConfig
    {   
        bool isLoaded { get; }
        event EventHandler<bool> OnSettingsLoaded;
        string LevelId { get; set; }

        void Load();

        IRoomConfig GetRoomConfig(string RoomId);

        IEnumerator<IRoomConfig> RoomsConfig { get; }

        IRoomConfig GetRoomConfigForSensorDeviceId(string DeviceId);


    }
}
