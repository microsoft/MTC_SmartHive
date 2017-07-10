using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;

using Xamarin.Forms;
using Xamarin.Forms.Xaml;

using Rg.Plugins.Popup.Pages;
using Rg.Plugins.Popup.Services;
using Rg.Plugins.Popup.Extensions;

using SmartHive.Models.Config;
using SmartHive.Models.Events;

namespace SmartHive.LevelMapApp
{
    public partial class RoomDetailPopupPage : PopupPage
    {

       public IRoomConfig CurrentRoom
        {
            get;
            private set;
        }

        public string CurrentDate
        {
            get;
            private set;
        }

        public Appointment[] RoomSchedule
        {
            get
            {
                 return  ((SmartHive.LevelMapApp.App)App.Current).serviceBusEventController.RoomSchedule(CurrentRoom.Location);
               // return new Appointment[] { new Appointment {StartTime = "10:00", EndTime ="11:00", Title="Совте директоров"} };
              
            }
        }

        public RoomDetailPopupPage(IRoomConfig roomViewModel)
        {
            InitializeComponent();

            this.CurrentRoom = roomViewModel;
            this.CurrentDate = "Расписание на " + DateTime.Now.ToString("dd/MM/yyyy ddd");
            BindingContext = this;
            
            Appointment[] scheduleData = this.RoomSchedule;
            if (scheduleData != null && scheduleData.Length > 0)
            {
                this.roomScheduleListView.ItemsSource = scheduleData;
                this.roomScheduleListView.IsVisible = true;                
            }
        }

        protected override void OnAppearing()
        {
            base.OnAppearing();

            FrameContainer.HeightRequest = -1;

            CloseImage.Rotation = 30;
            CloseImage.Scale = 0.3;
            CloseImage.Opacity = 0;

          /*  LoginButton.Scale = 0.3;
            LoginButton.Opacity = 0;

            UsernameEntry.TranslationX = PasswordEntry.TranslationX = -10;
            UsernameEntry.Opacity = PasswordEntry.Opacity = 0;*/
        }

        protected async override Task OnAppearingAnimationEnd()
        {
            var translateLength = 400u;

          /*  await Task.WhenAll(
               UsernameEntry.TranslateTo(0, 0, easing: Easing.SpringOut, length: translateLength),
                UsernameEntry.FadeTo(1),
                (new Func<Task>(async () =>
                {
                    await Task.Delay(200);
                    await Task.WhenAll(
                        PasswordEntry.TranslateTo(0, 0, easing: Easing.SpringOut, length: translateLength),
                        PasswordEntry.FadeTo(1));

                }))());*/

            await Task.WhenAll(
                CloseImage.FadeTo(1),
                CloseImage.ScaleTo(1, easing: Easing.SpringOut),
                CloseImage.RotateTo(0) /*,
               LoginButton.ScaleTo(1),
                LoginButton.FadeTo(1)*/);
        }

        protected async override Task OnDisappearingAnimationBegin()
        {
            var taskSource = new TaskCompletionSource<bool>();

            var currentHeight = FrameContainer.Height;

         /*   await Task.WhenAll(
                UsernameEntry.FadeTo(0),
                PasswordEntry.FadeTo(0),
                LoginButton.FadeTo(0));

            FrameContainer.Animate("HideAnimation", d =>
            {
                FrameContainer.HeightRequest = d;
            },
            start: currentHeight,
            end: 170,
            finished: async (d, b) =>
            {
                await Task.Delay(300);
                taskSource.TrySetResult(true);
            });

            await taskSource.Task;*/
        }

   /*     private async void OnLogin(object sender, EventArgs e)
        {
            var loadingPage = new LoadingPopupPage();
            await Navigation.PushPopupAsync(loadingPage);
            await Task.Delay(2000);
            await Navigation.RemovePopupPageAsync(loadingPage);
            await Navigation.PushPopupAsync(new RoomDetailPopupPage());
        }*/

        private void OnCloseButtonTapped(object sender, EventArgs e)
        {
            CloseAllPopup();
        }

        protected override bool OnBackgroundClicked()
        {
            CloseAllPopup();

            return false;
        }

        private async void CloseAllPopup()
        {
            await Navigation.PopAllPopupAsync();
        }

        private void Handle_ItemTapped(object sender, ItemTappedEventArgs e)
        {

        }
    }
}