using System;
using System.Collections.Generic;
using System.Text;

namespace SmartHive.Models.Config
{
    public interface ISettingsProvider
    {
        event EventHandler<bool> OnSettingsLoaded;        

        string GetPropertyValue(string Property);

        string GetValueOrDefault(string Property, string SettingsDefault);

        void SetPropertyValue(string Property, string Value);

        ILevelConfig GetLevelConfig(string levelId);

    }
}
