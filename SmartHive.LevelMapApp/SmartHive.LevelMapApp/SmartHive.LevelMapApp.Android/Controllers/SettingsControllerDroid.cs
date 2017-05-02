using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Android.App;
using Android.Content;
using Android.OS;
using Android.Runtime;
using Android.Views;
using Android.Widget;

using SmartHive.LevelMapApp.Controllers;
using SmartHive.Models.Config;

namespace SmartHive.LevelMapApp.Droid.Controllers
{
    class SettingsControllerDroid : ISettingsProvider
    {
        public ILevelConfig GetLevelConfig(string levelId)
        {
            throw new NotImplementedException();
        }

        public string GetPropertyValue(string Parameter)
        {
            throw new NotImplementedException();
        }

        public void SetPropertyValue(string Proeperty, string Value)
        {
            throw new NotImplementedException();
        }
    }
}