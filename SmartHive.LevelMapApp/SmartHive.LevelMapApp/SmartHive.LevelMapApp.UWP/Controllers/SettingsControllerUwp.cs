using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Windows.Storage;
using SmartHive.Models.Config;
using SmartHive.LevelMapApp.Controllers;

namespace SmartHive.LevelMapApp.UWP.Controllers
{
    class SettingsControllerUwp : ISettingsProvider
    {
        public SettingsControllerUwp()
        {
            Windows.Storage.ApplicationData.Current.DataChanged += Current_DataChanged;
        }

        private void Current_DataChanged(ApplicationData sender, object args)
        {
            throw new NotImplementedException();
        }

        public ILevelConfig GetLevelConfig(string levelId)
        {
            throw new NotImplementedException();
        }

        public string GetPropertyValue(string Parameter)
        {
            object value =ApplicationData.Current.RoamingSettings.Values[Parameter];
            if (value != null)
                return value.ToString();
            else
                return null;

        }

        public void SetPropertyValue(string Proeperty, string Value)
        {
            throw new NotImplementedException();
        }
    }
}
