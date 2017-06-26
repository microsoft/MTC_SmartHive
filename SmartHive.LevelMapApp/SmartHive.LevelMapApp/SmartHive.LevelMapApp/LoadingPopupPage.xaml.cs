using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Xamarin.Forms;
using Xamarin.Forms.Xaml;

using Rg.Plugins.Popup.Pages;


namespace SmartHive.LevelMapApp
{
	[XamlCompilation(XamlCompilationOptions.Compile)]
	public partial class LoadingPopupPage : PopupPage
	{
		public LoadingPopupPage ()
		{
			InitializeComponent ();
		}


        protected override bool OnBackButtonPressed()
        {
            return true;
        }

    }
}