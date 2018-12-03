using System;
using System.Collections.Generic;

namespace SmartHive.Common.Data
{
    public partial class Room
    {
        public Room()
        {
            Sensor = new HashSet<Sensor>();
            ViewStyle = new HashSet<ViewStyle>();
        }

        public int RoomId { get; set; }
        public int LevelId { get; set; }
        public int TopicId { get; set; }
        public string ExchangeName { get; set; }
        public string Title { get; set; }
        public string TitleEn { get; set; }

        public Level Level { get; set; }
        public ServiceBusTopic Topic { get; set; }
        public ICollection<Sensor> Sensor { get; set; }
        public ICollection<ViewStyle> ViewStyle { get; set; }
    }
}
