/*!
  To learn more about how to write your Action, see the following documentation:
  http://go.microsoft.com/fwlink/?LinkId=313673
*/
(function () {
    "use strict";


    var page = WinJS.UI.Pages.define("/html/Footer.html", {
        ready: function (element, options) {
            WinJS.Application.addEventListener("settingsChanged", function () {
                if (MtcScheduleBoard.Data.Settings.IconBottom && document.getElementById("footerLogo"))
                    document.getElementById("footerLogo").src = MtcScheduleBoard.Data.Settings.IconBottom;
            });

            WinJS.Application.addEventListener("serviceBusConnected", function (ServiceConnection) {                
                connectToIoTHub();
                MtcScheduleBoard.UI.StatusControl.pageStatusControl.setStatusLabel("Sensors bounded.");
            });
        },
    });

	var hubTile = null;

	function connectToIoTHub(ServiceConnection) {
        
	    MtcScheduleBoard.Data.ServiceConnectiont.addEventListener("onnotification", function (sensor, OnNotificationEventArgs) {
	    
            /// We can recieve notifications from sensors - show sensors data tile control
	        if (hubTile == null) {
	            var contentDiv = document.createElement("div");
	            $("#footerLogo").hide();
	            $('#roomSensor').show();
	        }

	        var valueLabel = sensor.valueLabel;
	        var value = sensor.value;

	        var updateTile = false;
	        if (valueLabel) {

	            if (valueLabel === "Sensor") {
	                MtcScheduleBoard.UI.SensorData.Pir = (value === "1.0") || (value === "True");//;

	                if (MtcScheduleBoard.UI.SensorData.Pir)
	                    $('div.t-tile').css('background', 'red');
	                else
	                    $('div.t-tile').css('background', 'green');

	                updateTile = true;
	            } 

	        }
	        MtcScheduleBoard.UI.StatusControl.trackAppInsightsTrace("SensorNotification", sensor);	        

	    });	    
	}
})();