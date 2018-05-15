using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Web;
using System.Diagnostics;
using Microsoft.Exchange.WebServices.Data;
using InfoboardSvc.Common.Helpers;
using InfoboardSvc.Common.Data;
using InfoboardSvc.Common.Transport;

namespace InfoboardSvc.Common
{
    public class ScheduleUpdateController : BasicController
    {

        internal const string DateTimeFormat = @"dd\/MM\/yyyy HH:mm";

        public int SendAppoinments()
        {
           // string[] rooms = ScheduleUpdateController.GetWatchingRooms();

            int sentCount = 0;
            ITransport transport = TransportFactory.Transport;
            foreach (RoomConfig room in RoomConfigurations.Values)
            {
                try
                {
                    ScheduleData roomSchedule = ExchangeHelper.LoadResouceCallendar(room.Location);
                    if (roomSchedule != null && roomSchedule.Schedule != null)
                    {
                        transport.SendAppointments(roomSchedule, room);
                        sentCount += roomSchedule.Schedule.Length;
                        Console.Out.WriteLine("Sucessfully sent {0} appointments for the room {1}", new object[] { roomSchedule.Schedule.Length, room.Location });
                    }
                    else
                    {
                        Console.Out.WriteLine("Nothing sent for the room {0}", room.Location);
                    }
                }catch(Exception ex)
                {
                    Console.Out.WriteLine(String.Format("Error {0} sending data for room {1}", new object[] { ex.Message, room.Location }));                    
                }
            }

            return sentCount;

        }
    }

  
}
