using System;
using System.Collections.Generic;
using System.Text;
#if !__ANDROID__

/// This is for Windows UWP including kiosk mode
    using Windows.ApplicationModel.Core;
    using Windows.UI.Core;
#endif

namespace SmartHive.LevelMapApp.Controllers
{
     public class AbstractController
    {
        public IAppController AppController
        {
            get
            {
                return ((SmartHive.LevelMapApp.App)App.Current).appController;
               
            }
        }

    }


}
