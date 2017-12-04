(function () {
    "use strict";


    var page = WinJS.UI.Pages.define("/html/viewModeControl.html", {
        ready: function (element, options) {
            $('#viewModeBoxWrapper').hide();

            WinJS.Application.addEventListener("settingsChanged", function () {
                
                if (!MtcScheduleBoard.Data.Settings.LevelMapUrl)
                    return;

                    $('#viewModeBoxWrapper').show();
                    $('#viewModeBoxWrapper').click(onModeBoxClick);

                    var mapFrame = document.createElement("x-ms-webview");
                    mapFrame.id = "levelMapIFrame";
                    mapFrame.src = MtcScheduleBoard.Data.Settings.LevelMapUrl;
                    mapFrame.style.display = 'none';
                    mapFrame.style.position = 'absolute';
                    mapFrame.style.top = $('#header').height();
                    document.body.appendChild(mapFrame);
            });

            
        },
    });

    var isScheduleViewMode = true;
        function onModeBoxClick(event) {
            if (isScheduleViewMode) {                
                $('#modeIcon').attr('src', "/images/SmartHive/modeEvents.png");
              //  $('#viewModeBoxLargeText').text("Events");
                // $('viewModeBoxLowerRightText').text("Events");
                showIFrameMap();
                isScheduleViewMode = false;

            } else {
                $('#modeIcon').attr('src', '/images/SmartHive/modeMap.png');
               // $('#viewModeBoxLargeText').text("Map");
                showEventView();
                isScheduleViewMode = true;
            }
        }

        var footerStatus = "show";
        function showIFrameMap() {
            // save footer status
            footerStatus = $('#footer').css('display');

            // hide footer and content controls
            $('#footer').hide();
            $('#content').hide();
            // show Iframe
            alignIFrameControl();
            $('#levelMapIFrame').show();
        }

        function showEventView() {

            // hide Iframe
            $('#levelMapIFrame').hide();

            // restore schedule
            if (footerStatus != 'none') {
                $('#footer').show();
            }

            $('#content').show();

        }

        function alignIFrameControl() {
            $('#levelMapIFrame').height(function () {
                return jQuery(window).height() - $('#header').height();
            });
            $('#levelMapIFrame').width(function () {
                return jQuery(window).width();
            });
        }
})();