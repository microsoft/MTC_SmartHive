using System;
using System.Collections.Generic;
using System.Text;

namespace SmartHive.LevelMapApp.Controllers
{
     public class AbstractController
    {
        protected IAppTelemetryController TelemetryLog
        {
            get
            {
                return ((SmartHive.LevelMapApp.App)App.Current).telemetryLogger;
            }
        }
    }
}
