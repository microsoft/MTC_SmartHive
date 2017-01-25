using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Windows.ApplicationModel.Core;
using Windows.UI.Core;


namespace SmartHive.CloudConnection
{
    internal static class DispatcherHelper
    {

        internal static CoreDispatcher GetDispatcher
        {
            get
            {
                /*
                 * https://msdn.microsoft.com/windows/hardware/drivers/partnerapps/create-a-kiosk-app-for-assigned-access
                 * The lock framework renders the kiosk app’s main view in a new secondary view- it’s transparent to the app. 
                 * This means that there are actually two views to your app when it's running in above lock mode.
                 */
                if (!CoreApplication.GetCurrentView().IsMain)
                {
                    // App is in kiosk mode (assigned acess)
                    return CoreApplication.GetCurrentView().Dispatcher;
                }
                else
                {
                    return CoreApplication.MainView.CoreWindow.Dispatcher;
                }
            }
        }

    }
}
