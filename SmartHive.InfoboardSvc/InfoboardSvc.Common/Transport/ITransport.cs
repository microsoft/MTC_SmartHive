using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using InfoboardSvc.Common.Data;
using Microsoft.Exchange.WebServices.Data;

namespace InfoboardSvc.Common.Transport
{
    public interface ITransport
    {
        void SendAppointments(ScheduleData roomSchedule, RoomConfig config);
        void SendJson(string Json, RoomConfig config);

    }
}
