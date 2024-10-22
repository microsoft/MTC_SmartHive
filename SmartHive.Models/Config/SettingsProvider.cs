﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartHive.Models.Config;
using Plugin.Settings;
using Plugin.Settings.Abstractions;


namespace SmartHive.Models.Config
{
    public class SettingsProvider : ISettingsProvider
    {

        private static SettingsProvider appSettings = null;
        public static ISettingsProvider AppSettings
        {
            get
            {
                if (appSettings == null)
                    appSettings = new SettingsProvider();

                return appSettings;
            }
        }

        private Dictionary<string, ILevelConfig> LevelConfig = new Dictionary<string, ILevelConfig>();

        private static readonly string SettingsDefault = string.Empty;

        ISettings applicationSettings = null;
        private SettingsProvider()
        {
            this.applicationSettings = CrossSettings.Current;
        }

        public event EventHandler<bool> OnSettingsLoaded;

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
            return this.applicationSettings.GetValueOrDefault(Property, SettingsDefault);
        }

        public void SetPropertyValue(string Property, string Value)
        {
            this.applicationSettings.AddOrUpdateValue(Property, Value);
        }
    }
}
