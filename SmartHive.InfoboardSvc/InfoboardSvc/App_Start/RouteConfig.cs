using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace InfoboardSvc
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.MapPageRoute("Rooms", "rooms.xml", "~/rooms.xml");
            routes.MapPageRoute("DefaultScreenSaver", "DefaultScreenSaver.mp4", "~/DefaultScreenSaver.mp4");
            //routes.MapPageRoute("ScheduleUpdate", "{controller}.ashx", "~/ScheduleUpdate.ashx");

            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");
            
            //routes.IgnoreRoute("{resource}.ashx/{*pathInfo}");
           /* routes.MapRoute(
                  name: "Default",
                  url: "{controller}/{action}/{id}",
                  defaults: new { controller = "Home", action = "Index", id = UrlParameter.Optional }
                 // defaults: new { controller = "ScheduleUpdate", action = "Get", id = UrlParameter.Optional }
              );*/
            

        }
    }
}
