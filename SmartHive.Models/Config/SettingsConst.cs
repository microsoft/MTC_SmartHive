using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartHive.Models.Config
{
     public static class SettingsConst
    {

        public const string DefaultLevel_PropertyName = "DefaultLevel";

        public const string LevelConfigUrl_PropertyName = "LevelConfigUrl";

        public const string RoomId_PropertyName = "Location";

        internal const string DeviceId_PropertyName = "DeviceId";

        /**
         * XML Configurations rooms.xml parsing staff
         */
        internal const string RoomConfigSections_XmlElementName = "Room";

        internal const string RoomTitle_XmlElementName = "Title";

        internal const string Sensors_XmlElementName = "Sensors";

        internal const string Sensor_XmlElementName = "Sensor";

        internal const string Telemetry_XmlAttributeName = "Telemetry";


    }
}
