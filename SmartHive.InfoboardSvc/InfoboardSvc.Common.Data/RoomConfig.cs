using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InfoboardSvc.Common
{
    public sealed class RoomConfig
    {
        public string Location { get; set; }
	    public string ServiceBusTopic { get; set;}
        public string FloorMapVarName { get; set; }
        /// <summary>
        /// TODO Can be many sensors in the single room
        /// </summary>
        public string DeviceID { get; set; }
        /*     public string Title { get; set;}
        public string Title_En { get; set; }
        public string IconTop { get; set; }
        public string IconBottom { get; set; }
        public string Css { get; set; }*/
    }
}
