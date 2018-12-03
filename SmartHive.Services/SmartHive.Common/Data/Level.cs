using System;
using System.Collections.Generic;

namespace SmartHive.Common.Data
{
    public partial class Level
    {
        public Level()
        {
            Room = new HashSet<Room>();
        }

        public int LevelId { get; set; }
        public int OfficeId { get; set; }
        public int? LevelNumber { get; set; }
        public string LevelCode { get; set; }
        public string LevelMapUrl { get; set; }

        public Office Office { get; set; }
        public ICollection<Room> Room { get; set; }
    }
}
