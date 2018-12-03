using System;
using System.Collections.Generic;

namespace SmartHive.Common.Data
{
    public partial class ViewStyle
    {
        public ViewStyle()
        {
            DeviceSettings = new HashSet<DeviceSettings>();
        }

        public int Id { get; set; }
        public int RoomId { get; set; }
        public string IconTop { get; set; }
        public string IconBottom { get; set; }
        public string Css { get; set; }
        public string FloorMapVarName { get; set; }

        public Room Room { get; set; }
        public ICollection<DeviceSettings> DeviceSettings { get; set; }
    }
}
