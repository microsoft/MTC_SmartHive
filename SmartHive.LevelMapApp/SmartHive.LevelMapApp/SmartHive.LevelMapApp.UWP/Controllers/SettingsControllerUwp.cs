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

        private Dictionary<string, ILevelConfig> LevelConfig = new Dictionary<string, ILevelConfig>();

        public SettingsControllerUwp()
        {
            Windows.Storage.ApplicationData.Current.DataChanged += Current_DataChanged;
        }

        public event EventHandler<bool> OnSettingsLoaded;

        private void Current_DataChanged(ApplicationData sender, object args)
        {
            
        }

        public ILevelConfig GetLevelConfig(string levelId)
        {
            ILevelConfig cfg = LevelConfig.ContainsKey(levelId) ? LevelConfig[levelId] : null;

            if (cfg == null)
            {
                cfg = new LevelXmlConfig(this, levelId);
                cfg.OnSettingsLoaded += Cfg_OnSettingsLoaded;
                LevelConfig[levelId] = cfg;
            }

            return cfg;
        }

        private void Cfg_OnSettingsLoaded(object sender, bool e)
        {
            //Inform subsciber if settings sucessfully loaded
            if (OnSettingsLoaded != null)
                OnSettingsLoaded.Invoke(sender, e);
        }

        public string GetPropertyValue(string Property)
        {
            object value =ApplicationData.Current.RoamingSettings.Values[Property];
            if (value != null)
                return value.ToString();
            else
                return null;

        }

        public void SetPropertyValue(string Property, string Value)
        {
            ApplicationData.Current.RoamingSettings.Values[Property] = Value;
        }
    }
}
