(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/html/Header.html", {
        ready: function (element, options) {
            WinJS.Application.addEventListener("settingsChanged", function () { 
                    if (MtcScheduleBoard.Data.Settings.Title)
                    document.getElementById("Title").innerHTML = MtcScheduleBoard.Data.Settings.Title;

                    if (MtcScheduleBoard.Data.Settings.Title_En)
                    document.getElementById("TitleEn").innerHTML = MtcScheduleBoard.Data.Settings.Title_En;

                    if (MtcScheduleBoard.Data.Settings.IconTop)
                    document.getElementById("IconTop").src = MtcScheduleBoard.Data.Settings.IconTop;
            });
        },
    });

})();