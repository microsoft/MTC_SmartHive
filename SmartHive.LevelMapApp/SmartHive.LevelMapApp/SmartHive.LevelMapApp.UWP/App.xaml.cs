﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.WindowsRuntime;
using Windows.ApplicationModel;
using Windows.ApplicationModel.Activation;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Data;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;
using Popup = Rg.Plugins.Popup.Windows.Popup;
using HockeyApp;
using Microsoft.HockeyApp;
using Windows.System.Display;

namespace SmartHive.LevelMapApp.UWP
{
    /// <summary>
    /// Provides application-specific behavior to supplement the default Application class.
    /// </summary>
    sealed partial class App : Application
    {

        private static DisplayRequest appDisplayRequest = new DisplayRequest();
        /// <summary>
        /// Initializes the singleton application object.  This is the first line of authored code
        /// executed, and as such is the logical equivalent of main() or WinMain().
        /// </summary>
        public App()
        {
            this.InitializeComponent();
            this.Suspending += OnSuspending;
            this.UnhandledException += App_UnhandledException;            
            HockeyClient.Current.Configure("b707dfb571d74c0b9d55a9a7a1c6b5c5",
                new TelemetryConfiguration() { EnableDiagnostics = true })
                .SetContactInfo("Maxim Khlupnov", "m.khlupnov@inbox.ru")
                .SetExceptionDescriptionLoader((Exception ex) =>
                {
                        return "Exception HResult: " + ex.HResult.ToString();
                });            
        }

  

        /// <summary>
        /// ToDo: Log unhandled exception
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void App_UnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            IDictionary<string,string> exParams = new Dictionary<string, string>();
            exParams.Add("Message", e.Message);
            exParams.Add("Handle", e.Handled.ToString());

            HockeyClient.Current.TrackException(e.Exception, exParams);
            
            e.Handled = true;
        }

        /// <summary>
        /// Invoked when the application is launched normally by the end user.  Other entry points
        /// will be used such as when the application is launched to open a specific file.
        /// </summary>
        /// <param name="e">Details about the launch request and process.</param>
        protected override void OnLaunched(LaunchActivatedEventArgs e)
        {

#if DEBUG
            if (System.Diagnostics.Debugger.IsAttached)
            {
                this.DebugSettings.EnableFrameRateCounter = true;
            }
#endif

            Frame rootFrame = Window.Current.Content as Frame;

            // Do not repeat app initialization when the Window already has content,
            // just ensure that the window is active
            if (rootFrame == null)
            {
                // Create a Frame to act as the navigation context and navigate to the first page
                rootFrame = new Frame();

                rootFrame.NavigationFailed += OnNavigationFailed;

                // Need that .NET Native has worked
                Xamarin.Forms.Forms.Init(e, Popup.GetExtraAssemblies());

                if (e.PreviousExecutionState == ApplicationExecutionState.Terminated)
                {
                    //TODO: Load state from previously suspended application
                }

                // Place the frame in the current Window
                Window.Current.Content = rootFrame;
            }

            if (rootFrame.Content == null)
            {
                // When the navigation stack isn't restored navigate to the first page,
                // configuring the new page by passing required information as a navigation
                // parameter
                rootFrame.Navigate(typeof(MainPage), e.Arguments);
            }
            // Ensure the current window is active
            Window.Current.Activate();

            if (appDisplayRequest != null)
            {
                appDisplayRequest.RequestActive();
            }
                      
        }

        /// <summary>
        /// Invoked when Navigation to a certain page fails
        /// </summary>
        /// <param name="sender">The Frame which failed navigation</param>
        /// <param name="e">Details about the navigation failure</param>
        void OnNavigationFailed(object sender, NavigationFailedEventArgs e)
        {
            HockeyClient.Current.TrackEvent("NavigationFailed " + e.SourcePageType);
            HockeyClient.Current.TrackException(e.Exception);

            e.Handled = true;
        }

        /// <summary>
        /// Invoked when application execution is being suspended.  Application state is saved
        /// without knowing whether the application will be terminated or resumed with the contents
        /// of memory still intact.
        /// </summary>
        /// <param name="sender">The source of the suspend request.</param>
        /// <param name="e">Details about the suspend request.</param>
        private void OnSuspending(object sender, SuspendingEventArgs e)
        {
            var deferral = e.SuspendingOperation.GetDeferral();
            //TODO: Save application state and stop any background activity
            HockeyClient.Current.TrackEvent("OnSuspending " + e.SuspendingOperation.Deadline);            


            deferral.Complete();
        }
    }
}
