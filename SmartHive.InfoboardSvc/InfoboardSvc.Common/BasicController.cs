using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using InfoboardSvc.Common.Data;
using System.Xml.Linq;
using System.Xml;

namespace InfoboardSvc.Common
{
    public class BasicController
    {

        private static Dictionary<string, RoomConfig> _roomConfig = null;
        public static Dictionary<string, RoomConfig> RoomConfigurations
        {
            get
            {
                if (_roomConfig == null)
                {

                    string roomsConfig = Environment.CurrentDirectory + @"\rooms.xml";

                    XDocument doc = XDocument.Load(roomsConfig);

                    //Run query
                    var qRooms = from rooms in doc.Descendants(@"Room")
                                 select new RoomConfig
                                 {
                                     Location = rooms.Attribute("Location").Value,
                                     ServiceBusTopic = rooms.Descendants("ServiceBusTopic").FirstOrDefault<XElement>() != null ?
                                                              rooms.Descendants("ServiceBusTopic").FirstOrDefault<XElement>().Value :
                                                              null,
                                     FloorMapVarName = rooms.Descendants("FloorMapVarName").FirstOrDefault<XElement>() != null ?
                                                              rooms.Descendants("FloorMapVarName").FirstOrDefault<XElement>().Value :
                                                              null,
                                     DeviceID = rooms.Descendants("DeviceId").FirstOrDefault<XElement>() != null ?
                                                              rooms.Descendants("DeviceId").FirstOrDefault<XElement>().Value :
                                                              null
                                 };
                    _roomConfig = new Dictionary<string, RoomConfig>();
                    foreach (RoomConfig cfg in qRooms)
                    {
                        _roomConfig.Add(cfg.Location, cfg);
                    }
                }
                return _roomConfig;
            }
        }

        public static RoomConfig GetRoomConfigForDevice(string deviceId)
        {
            return RoomConfigurations.Values.Where<RoomConfig>(
                              r => deviceId.Equals(r.DeviceID,StringComparison.InvariantCultureIgnoreCase))
                                        .FirstOrDefault<RoomConfig>();
        }
    }
}
