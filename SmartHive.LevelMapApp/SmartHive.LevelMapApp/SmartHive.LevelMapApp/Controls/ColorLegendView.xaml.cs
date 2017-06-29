using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Xamarin.Forms;
using Xamarin.Forms.Xaml;

namespace SmartHive.LevelMapApp.Controls
{
	[XamlCompilation(XamlCompilationOptions.Compile)]
	public partial class ColorLegendView : ContentView
	{
		public ColorLegendView ()
		{
			InitializeComponent ();
		}
	}
}