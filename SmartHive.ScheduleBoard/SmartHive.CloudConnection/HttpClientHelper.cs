//---------------------------------------------------------------------------------
// Copyright (c) 2014, Microsoft Corporation
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//---------------------------------------------------------------------------------

using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Runtime.Serialization.Json;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using SmartHive.CloudConnection.Events;
using PCLWebUtility;


namespace SmartHive.CloudConnection
{
    class HttpClientHelper
    {
        const string ApiVersion = "&api-version=2012-03"; // API version 2013-03 works with Azure Service Bus and all versions of Service Bus for Windows Server.

        private HttpClient httpClient;
        private string token;
        private ServiceBusConnection sbConn = null;

        // Create HttpClient object, get ACS token, attach token to HttpClient Authorization header.
        public HttpClientHelper(ServiceBusConnection conn)
        {
            this.sbConn = conn;
            
            this.httpClient = new HttpClient();           

            UpdateToken(this.sbConn.ServiceBusNamespace, true, this.sbConn.SasKeyName, this.sbConn.SasKey);            
            httpClient.DefaultRequestHeaders.Add("ContentType", "application/atom+xml;type=entry;charset=utf-8");
        }

        public HttpClientHelper(HttpConnection conn)
        {
            this.httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Add("ContentType", "application/atom+xml;type=entry;charset=utf-8");
        }
        public async Task<string> GetStringResponse(string address)
        {
            HttpResponseMessage response = null;
            try
            {
                response = await this.httpClient.GetAsync(address);
                response.EnsureSuccessStatusCode();
            }
            catch (HttpRequestException ex)
            {
                this.sbConn.LogEvent(EventTypeConsts.Error, "GetEntity failed: ", ex.Message + " \n " + address);
                throw ex;
            }
            string entityDescription = await response.Content.ReadAsStringAsync();
            return entityDescription;
        }

        public string UpdateToken(string serviceNamespace, bool useSas, string keyName, string key)
        {
            if (useSas)
            {
                this.token = GetSasToken(serviceNamespace, keyName, key);
            }
            else
            {
                this.token = GetAcsToken(serviceNamespace, keyName, key).Result;
            }
            httpClient.DefaultRequestHeaders.Remove("Authorization");
            httpClient.DefaultRequestHeaders.Add("Authorization", this.token);

            return this.token;
        }


        // Create a SAS token. SAS tokens are described in http://msdn.microsoft.com/en-us/library/windowsazure/dn170477.aspx.
       private string GetSasToken(string uri, string keyName, string key)
        {
            // Set token lifetime to 20 minutes.
            DateTime origin = new DateTime(1970, 1, 1, 0, 0, 0, 0);
            TimeSpan diff = DateTime.Now.ToUniversalTime() - origin;
            uint tokenExpirationTime = Convert.ToUInt32(diff.TotalSeconds) + 20 * 60;

            string stringToSign = WebUtility.UrlEncode(uri) + "\n" + tokenExpirationTime;
            HMACSHA256 hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));

            string signature = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(stringToSign)));
            string token = String.Format(CultureInfo.InvariantCulture, "SharedAccessSignature sr={0}&sig={1}&se={2}&skn={3}",
                WebUtility.UrlEncode(uri), WebUtility.UrlEncode(signature), tokenExpirationTime, keyName);
          
            return token;
        }

        // Call ACS to get a token.
        private async Task<string> GetAcsToken(string serviceNamespace, string issuerName, string issuerSecret)
        {
            var postData = new List<KeyValuePair<string, string>>();
            postData.Add(new KeyValuePair<string, string>("wrap_name", issuerName));
            postData.Add(new KeyValuePair<string, string>("wrap_password", issuerSecret));
            postData.Add(new KeyValuePair<string, string>("wrap_scope", "http://" + serviceNamespace + ".servicebus.windows.net/"));
            HttpContent postContent = new FormUrlEncodedContent(postData);
            HttpResponseMessage response = null;
            try
            {
                response = await httpClient.PostAsync("https://" + serviceNamespace + "-sb.accesscontrol.windows.net/WRAPv0.9/", postContent);
                response.EnsureSuccessStatusCode();
            }
            catch (HttpRequestException ex)
            {
                this.sbConn.LogEvent(EventTypeConsts.Error,"GetAcsToken failed: ", ex.Message + "\n" + serviceNamespace);
            }
            string responseBody = await response.Content.ReadAsStringAsync();

            var responseProperties = responseBody.Split('&');
            var tokenProperty = responseProperties[0].Split('=');
            var token = Uri.UnescapeDataString(tokenProperty[1]);
            
            return "WRAP access_token=\"" + token + "\"";
        }
 
    }
}
