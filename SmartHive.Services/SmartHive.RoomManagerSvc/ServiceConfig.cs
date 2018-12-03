using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Configuration;
using Microsoft.Extensions.Configuration;

namespace SmartHive.RoomManagerSvc
{
    public class ServiceConfig
    {
        public static IConfiguration AppSettings { get; internal set; }

        public static string ConnectionString
        {
            get
            {
                return AppSettings["ConnectionStrings:DefaultConnection"];
            }
        }
    }
}
