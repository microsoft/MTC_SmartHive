using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;

namespace InfoboardSvc
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // Web API configuration and services
            
            // Web API routes
            config.MapHttpAttributeRoutes();
            
            config.Routes.MapHttpRoute(
                name: "ScheduleApi",
                routeTemplate: "api/{controller}/{room}",
                defaults: new { room = RouteParameter.Optional }
           );
            config.Routes.MapHttpRoute("ScheduleUpdate", "{controller}.ashx",
                defaults: new { controller = "ScheduleUpdate" }
           );

        }
    }
}
