using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartHive.Models.Config
{
    public interface ILevelConfig
    {
        string LevelId { get; set; }
        string SbNamespace { get; set; }

        string SbSubscriptionName { get; set; }

        string SbTopicName { get; set; }

        string SasKeyName { get; set; }

        string SasKey { get; set; }

        IRoomConfig GetRoomConfig(string RoomId);

        IEnumerator<IRoomConfig> RoomsConfig { get; }

        IRoomConfig FindRoomForSensorDeviceId(string DeviceId);


    }
}
