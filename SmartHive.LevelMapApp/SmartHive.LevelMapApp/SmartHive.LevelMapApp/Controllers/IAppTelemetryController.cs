using System;
using System.Collections.Generic;
using System.Text;
using SmartHive.Models.Events;

namespace SmartHive.LevelMapApp.Controllers
{
    public interface IAppTelemetryController
    {

        void TrackAppEvent(string EventName);

        void TrackAppEvent(IEventBase smartHiveEvent);

        void TrackAppException(Exception ex);

        void TrackPageView(string ViewName);
    }
}
