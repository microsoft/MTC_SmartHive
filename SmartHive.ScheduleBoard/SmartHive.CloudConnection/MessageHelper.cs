using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Notifications;
using Windows.Data.Xml.Dom;

namespace SmartHive.CloudConnection
{
    public sealed class MessageHelper
    {
        static ToastNotifier toastNotifier = ToastNotificationManager.CreateToastNotifier();
       
        static XmlDocument toastXml = ToastNotificationManager.GetTemplateContent(ToastTemplateType.ToastText02);
        internal static void ShowToastMessage(string titleText, string messageText) {
            try
            {
               
                if (!string.IsNullOrEmpty(messageText) && messageText.Length > 50)
                {
                    messageText = messageText.Substring(0, 30); //Message toast length can't be norte then 47 characters
                }

                var toastTextElements = toastXml.SelectNodes("/toast/visual/binding/text");
                IXmlNode node = toastTextElements[0].AppendChild(toastXml.CreateTextNode(titleText));
                toastTextElements[1].AppendChild(toastXml.CreateTextNode(messageText)); //

                var toastNode = toastXml.SelectSingleNode("/toast");
                //toastNode.Attributes.["duration"] = "long";
                // toastNode.SetAttribute("launch", '{"reason": "Toast", "error": "' + titleText + '"}');

                var toast = new ToastNotification(toastXml);


                toastNotifier.Show(toast);
#pragma warning disable CS0168 // The variable 'ex' is declared but never used
            }catch(Exception ex)
#pragma warning restore CS0168 // The variable 'ex' is declared but never used
            {
                //MessageHelper.showToastMessage("Message error", ex.Message);                
            }
        }
    }
}
