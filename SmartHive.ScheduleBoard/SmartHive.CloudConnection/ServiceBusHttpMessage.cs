

using System;
using System.Xml;
using System.Collections.Generic;
using System.Runtime.Serialization;
using System.IO;

namespace SmartHive.CloudConnection
{
    class ServiceBusHttpMessage 
    {
        public byte[] body;
        public string location;
        public BrokerProperties brokerProperties;       
        public IDictionary<string, string> customProperties;
        

        public ServiceBusHttpMessage()
        {
            brokerProperties = new BrokerProperties();
            customProperties = new Dictionary<string, string>();            
        }

        /// <summary>
        /// Reads the content of serialized Message as string.
        /// </summary>        
        /// <returns>The content of the BrokeredMessage.</returns>
        public string GetMessageText()
        {
            if (this.body == null)
                return null;

            using (XmlDictionaryReader xmlReader = XmlDictionaryReader.CreateBinaryReader(this.body, XmlDictionaryReaderQuotas.Max))
            {
                DataContractSerializer dataContractSerializer = new DataContractSerializer(typeof(string));
                return dataContractSerializer.ReadObject(xmlReader,false) as string;                    
            }
        }
    }
    
}