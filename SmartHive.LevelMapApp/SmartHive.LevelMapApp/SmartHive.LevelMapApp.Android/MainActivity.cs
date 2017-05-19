using System;

using Android.App;
using Android.Content.PM;
using Android.Runtime;
using Android.Views;
using Android.Widget;
using Android.OS;
using SmartHive.Models.Config;
using SmartHive.LevelMapApp.Droid.Controllers;

namespace SmartHive.LevelMapApp.Droid
{
	[Activity (Label = "SmartHive.LevelMapApp", Icon = "@drawable/icon", Theme="@style/MainTheme", MainLauncher = true, ConfigurationChanges = ConfigChanges.ScreenSize | ConfigChanges.Orientation)]
	public class MainActivity : global::Xamarin.Forms.Platform.Android.FormsAppCompatActivity
	{
        private ISettingsProvider settingsController;

        protected override void OnCreate (Bundle bundle)
		{
			TabLayoutResource = Resource.Layout.Tabbar;
			ToolbarResource = Resource.Layout.Toolbar; 

			base.OnCreate (bundle);

			global::Xamarin.Forms.Forms.Init (this, bundle);

            SmartHive.LevelMapApp.App app = new SmartHive.LevelMapApp.App(null);
            this.settingsController = app.settingsController;

            LoadApplication (app);
                
        }

        
	}
}

