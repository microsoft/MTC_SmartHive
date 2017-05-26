using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Threading.Tasks;
using System.Net.Http;
using System.Xml;
using System.Reflection;

namespace SmartHive.Models.Config
{
    public class LevelXmlConfig : ILevelConfig
    {

        private ISettingsProvider config = null;
        private Dictionary<string, IRoomConfig> LevelRooms = null;
        public IEnumerator<IRoomConfig> RoomsConfig
        {
            get
            {
                if (this.LevelRooms.Count > 0)
                    return this.LevelRooms.Values.GetEnumerator();
                else
                    return null;
            }
        }
        public LevelXmlConfig(ISettingsProvider settings, string levelId)
        {
                this.LevelId = levelId;
                this.isLoaded = false;
                this.config = settings;
                this.LevelRooms = new Dictionary<string, IRoomConfig>();
                Task.Run(() => Load());
            
        }

        

        public async void Load()
        {
                try
                {
                    using (HttpClient client = new HttpClient())
                    {
                        string configUrl = config.GetPropertyValue(SettingsConst.LevelConfigUrl_PropertyName);
                        Stream xmlInStream = await client.GetStreamAsync(configUrl);
                            using (XmlReader reader = XmlReader.Create(xmlInStream))
                            {
                                reader.ReadStartElement();
                                while (reader.ReadToFollowing(SettingsConst.RoomConfigSections_XmlElementName))
                                {
                                    RoomConfig room = ParseRoomConfigNode(reader);
                                    // If this room related to our level - store config in memory
                                    if (this.LevelId.Equals(room.ServiceBusTopic))
                                    {
                                        this.LevelRooms.Add(room.Location, room);
                                        if (string.IsNullOrEmpty(this.ServiceBusNamespace))
                                            {
                                                this.SasKey = room.SasKey;
                                                this.SasKeyName = room.SasKeyName;
                                                this.ServiceBusNamespace = room.ServiceBusNamespace;
                                                this.ServiceBusSubscription = room.ServiceBusSubscription;
                                                this.ServiceBusTopic = room.ServiceBusTopic;
                                            }
                                    }
                                }

                            }
                            // Inform listeners we sucessfuly load settings
                            if (this.OnSettingsLoaded != null)
                            {
                                this.isLoaded = true;
                                this.OnSettingsLoaded.Invoke(this, true);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        // Inform listeners about an error
                        if (this.OnSettingsLoaded != null)
                        {
                            this.OnSettingsLoaded.Invoke(this, false);
                            this.isLoaded = false;
                        }
                    }
        }


        public event EventHandler<bool> OnSettingsLoaded;

        private void parseRoomConfigTag(RoomConfig roomConfig, string TagName, string TagValue)
        {
            
                var propertyInfo = typeof(RoomConfig).GetRuntimeProperty(TagName);
                if (propertyInfo != null)
                    propertyInfo.SetValue(roomConfig, TagValue);
           
        }

        private RoomConfig ParseRoomConfigNode(XmlReader roomReader)
        {
            string RoomId = roomReader[SettingsConst.RoomId_PropertyName];
            RoomConfig roomConfig = new RoomConfig(RoomId);
            roomConfig.EventLeewaySeconds = this.EventLeewaySeconds;

            roomReader.ReadToDescendant(SettingsConst.RoomTitle_XmlElementName);

            do{
                if (SettingsConst.Sensors_XmlElementName.Equals(roomReader.LocalName))
                {
                    ParseSensorsNode(roomReader, roomConfig);
                    roomReader.ReadEndElement();
                }
                else
                {
                    parseRoomConfigTag(roomConfig, roomReader.LocalName, roomReader.ReadElementContentAsString());
                }
                roomReader.Read();
            } while(!SettingsConst.RoomConfigSections_XmlElementName.Equals(roomReader.LocalName) && roomReader.ReadState != ReadState.EndOfFile);

            return roomConfig;
        }

        private void ParseSensorsNode(XmlReader roomReader, RoomConfig roomConfig)
        {
            if (roomReader.ReadToDescendant(SettingsConst.Sensor_XmlElementName))
            {
                do
                {
                    RoomSensor sensor = new RoomSensor();
                    sensor.DeviceId = roomReader[SettingsConst.DeviceId_PropertyName];
                    sensor.Telemetry = roomReader[SettingsConst.Telemetry_XmlAttributeName];
                    roomConfig.RoomSensors.Add(sensor);
                } while (roomReader.ReadToNextSibling(roomReader.LocalName));
            }
        }

        public string LevelId { get; set;}
        public string ServiceBusNamespace { get; set; }

        private string sbSubscriptionName = null;
        public string ServiceBusSubscription {
            get {
                if (string.IsNullOrEmpty(sbSubscriptionName))
                    return "FloorMap";
                else
                    return null;
            }
            set {
                sbSubscriptionName = value;
            }
        }
        public string ServiceBusTopic { get; set; }
        public string SasKeyName { get; set; }
        public string SasKey { get; set; }
                
        public bool isLoaded {
            get;
            private set;
        }

        // Assume 10 minutes default time for Event Leeway
        private int eventLeewaySeconds = 60 * 10;
        public int EventLeewaySeconds {
            get { return this.eventLeewaySeconds; }
            set{ this.eventLeewaySeconds = value; }
        }

        IEnumerable<IRoomConfig> ILevelConfig.RoomsConfig {
            get
            {
                return this.LevelRooms.Values;
            }
        }

        public IRoomConfig GetRoomConfig(string RoomId)
        {
            if (this.LevelRooms.ContainsKey(RoomId))
                return this.LevelRooms[RoomId];
            else
                return null;
        }

        public IRoomConfig GetRoomConfigForSensorDeviceId(string DeviceId)
        {
            if (this.LevelRooms.Count == 0)
                return null;

            return this.LevelRooms.Values.FirstOrDefault<IRoomConfig>(room => room.RoomSensors.Any<IRoomSensor>(sensor => DeviceId.Equals(sensor.DeviceId)));
        }

    }
}
