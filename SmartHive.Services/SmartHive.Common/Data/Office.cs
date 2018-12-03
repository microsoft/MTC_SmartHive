using System;
using System.Collections.Generic;

namespace SmartHive.Common.Data
{
    public partial class Office
    {
        public Office()
        {
            Level = new HashSet<Level>();
        }

        public int OfficeId { get; set; }
        public string OfficeCode { get; set; }
        public string OfficeAddress { get; set; }
        public string Latitude { get; set; }
        public string Longitude { get; set; }

        public ICollection<Level> Level { get; set; }
    }
}
