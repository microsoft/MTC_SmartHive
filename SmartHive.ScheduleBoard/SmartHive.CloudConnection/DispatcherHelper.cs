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

        private static CoreDispatcher dispathcher = null;

        internal static CoreDispatcher GetDispatcher
        {
            get
            {
                if (dispathcher == null )
                {
                    /*
                     * https://msdn.microsoft.com/windows/hardware/drivers/partnerapps/create-a-kiosk-app-for-assigned-access
                     * The lock framework renders the kiosk app’s main view in a new secondary view- it’s transparent to the app. 
                     * This means that there are actually two views to your app when it's running in above lock mode.
                     */
                    if (!CoreApplication.GetCurrentView().IsMain)
                    {
                        // App is in kiosk mode (assigned acess)
                        dispathcher = CoreApplication.GetCurrentView().Dispatcher;
                    }
                    else
                    {
                        dispathcher = CoreApplication.MainView.CoreWindow.Dispatcher;
                    }
                }
                return dispathcher;
            }
        }

        public async static void CheckBeginInvokeOnUI(Action action)
        {
            if (action == null)
            {
                return;
            }

          
            if (dispathcher.HasThreadAccess)
            {
                action();
            }
            else
            {
                await dispathcher.RunAsync(CoreDispatcherPriority.Normal, () => action());
            }
        }

    }
}
