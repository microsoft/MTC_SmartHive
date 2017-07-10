using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Xamarin.Forms.Platform.UWP;
using Windows.UI.Xaml.Controls;

using SmartHive.LevelMapApp.Controls;
using SmartHive.LevelMapApp.UWP.Controls;

[assembly:ExportRenderer(typeof(HybridWebView), typeof(HybridWebViewRenderer))]
namespace SmartHive.LevelMapApp.UWP.Controls
{
    public class HybridWebViewRenderer : ViewRenderer<HybridWebView, Windows.UI.Xaml.Controls.WebView>
    {
        const string JavaScriptFunction = "function invokeCSharpAction(data){window.external.notify(data);}";

        protected async override void OnElementChanged(ElementChangedEventArgs<HybridWebView> e)
        {
            base.OnElementChanged(e);
            if (Control == null)
            {
                await Windows.UI.Xaml.Controls.WebView.ClearTemporaryWebDataAsync();
                Windows.UI.Xaml.Controls.WebView levelMapView = new Windows.UI.Xaml.Controls.WebView();                
                SetNativeControl(levelMapView);
            }
            if (e.OldElement != null)
            {
                Control.NavigationCompleted -= LevelMapView_NavigationCompleted;
                Control.ScriptNotify -= LevelMapView_ScriptNotify;
            }
            if (e.NewElement != null)
            {
                Control.NavigationCompleted += LevelMapView_NavigationCompleted;
                Control.ScriptNotify += LevelMapView_ScriptNotify;
                Control.Source = new Uri(Element.Uri);
            }
        }

        async void LevelMapView_NavigationCompleted(WebView sender, WebViewNavigationCompletedEventArgs args)
        {
            if (args.IsSuccess)
            {
                // Inject JS script
                await Control.InvokeScriptAsync("eval", new[] { JavaScriptFunction });
            }
        }

        void LevelMapView_ScriptNotify(object sender, NotifyEventArgs e)
        {
            Element.InvokeAction(e.Value);
        }
    }
}
