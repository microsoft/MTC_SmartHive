using System;

using Android.App;
using Android.Content.PM;
using Android.Runtime;
using Android.Views;
using Android.Widget;
using Android.OS;
using SmartHive.Models.Config;
using SmartHive.LevelMapApp.Droid.Controllers;
using HockeyApp.Android;

namespace SmartHive.LevelMapApp.Droid
{
	[Activity (Label = "SmartHive.LevelMapApp", Icon = "@drawable/icon", Theme="@style/MainTheme", MainLauncher = true, ConfigurationChanges = ConfigChanges.ScreenSize | ConfigChanges.Orientation)]
	public class MainActivity : global::Xamarin.Forms.Platform.Android.FormsAppCompatActivity
	{
        private ISettingsProvider settingsController;
        private AppManagerDroid telemetryController;
        protected override void OnCreate (Bundle bundle)
		{
			TabLayoutResource = Resource.Layout.Tabbar;
			ToolbarResource = Resource.Layout.Toolbar; 

			base.OnCreate (bundle);

			global::Xamarin.Forms.Forms.Init (this, bundle);
            
            this.telemetryController = new AppManagerDroid();

            CrashManager.Register(this, "b707dfb571d74c0b9d55a9a7a1c6b5c5");
            SmartHive.LevelMapApp.App app = new SmartHive.LevelMapApp.App(null, this.telemetryController);
            this.settingsController = app.settingsController;
          
            LoadApplication (app);
                
        }

        
	}
}

