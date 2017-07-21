using System;
using System.Collections.Generic;
using System.Text;
using SmartHive.Models.Events;

namespace SmartHive.LevelMapApp.Controllers
{
    public interface IAppController
    {
        /// <summary>
        /// Invokes an action in UI main thread with Lock screen mode support in Windows UWP
        /// </summary>        
        void BeginInvokeOnMainThread(Action action);

        void TrackAppEvent(string EventName);

        void TrackAppEvent(IEventBase smartHiveEvent);

        void TrackAppException(Exception ex);

        void TrackPageView(string ViewName);
    }
}
