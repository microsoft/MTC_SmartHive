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
        private ISettingsProvider SettingsController;

        protected override void OnCreate (Bundle bundle)
		{
			TabLayoutResource = Resource.Layout.Tabbar;
			ToolbarResource = Resource.Layout.Toolbar; 

			base.OnCreate (bundle);

			global::Xamarin.Forms.Forms.Init (this, bundle);
			LoadApplication (new SmartHive.LevelMapApp.App ());

            string attr = SmartHive.LevelMapApp.Droid.Helpers.Settings.GeneralSettings;

            if (string.IsNullOrEmpty(attr))
                SmartHive.LevelMapApp.Droid.Helpers.Settings.GeneralSettings = "http://mtcscheduleboard.azurewebsites.net/test/rooms.xml";

           /* this.SettingsController = SettingsControllerDroid.AppSettings;

            //Set some settings for debugging
            if (this.SettingsController.GetPropertyValue(SettingsConst.LevelConfigUrl_PropertyName) == null)
                this.SettingsController.SetPropertyValue(SettingsConst.LevelConfigUrl_PropertyName, "http://mtcscheduleboard.azurewebsites.net/test/rooms.xml");
            if (this.SettingsController.GetPropertyValue(SettingsConst.DefaultLevel_PropertyName) == null)
                this.SettingsController.SetPropertyValue(SettingsConst.DefaultLevel_PropertyName, "wgoc");
                */
        }

        
	}
}

