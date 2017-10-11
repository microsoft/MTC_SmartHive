"use strict";

MtcScheduleBoard.Data = MtcScheduleBoard.Data || {  }; // Declare MtcScheduleBoard.Data.Settings namespace

MtcScheduleBoard.Data.Settings = {
	HttpServerUrl: "http://mtcscheduleboard.azurewebsites.net",
	WebServiceUrl: null, 
	RoomDefinitionUrl: null,
	Location: null,
	Title: "", Title_En: "",
	IconTop: "", IconBottom: "",
	Css: "",
	ScreenSaverVideoUrl: "", 
    ScreenSaverVideoCachedVideo: null,
	HideFooterDisplayMode: false,
	TableFontSize: 22,
	TableFontFamily: "Segoe UI",
	HeaderFontSize: 44,
	HeaderFontFamily: "Segoe UI",
	ClockFontSize: 72,
	ClockFontFamily: "Segoe UI",
	BackgroundColor: "#21bdee",
	TitleColumnWidth: 250,
	LocationColumnWidth: 400,
	ServiceBusNamespace: "mtcdatacenter",
	ServiceBusSubscription: getHostName(),
	ServiceBusTopic: "",
    SasKeyName: "",
    SasKey: "",
    EventExpirationAfter: 20,
    AppVersion: getAppVersion()
}; //Declare MtcScheduleBoard.Data.Settings namespace

MtcScheduleBoard.Data.LocationFilters = function () {
	if (MtcScheduleBoard.Data.Settings.Location && MtcScheduleBoard.Data.Settings.Location.length > 0) {
		return MtcScheduleBoard.Data.Settings.Location.split(';');
	} else {
		return new Array();
	}
};

MtcScheduleBoard.Data.ShowLocationColumn = function () {
	return MtcScheduleBoard.Data.LocationFilters().length > 1;
};

MtcScheduleBoard.Data.setSettings = function () {
    var _settings = Windows.Storage.ApplicationData.current.localSettings.values;
    _settings.Settings = JSON.stringify(MtcScheduleBoard.Data.Settings);
    WinJS.Application.queueEvent({ type: "settingsChanged", detail: { value: MtcScheduleBoard.Data.Settings } });
};

MtcScheduleBoard.Data.loadSettings = function () {
    var _settings = Windows.Storage.ApplicationData.current.localSettings.values;

    if (_settings.hasKey("Settings")) {
        MtcScheduleBoard.Data.Settings = JSON.parse(_settings.Settings);
        WinJS.Application.queueEvent({ type: "settingsChanged", detail: { value: MtcScheduleBoard.Data.Settings } });
    }else{
        return null;
    }

    if (MtcScheduleBoard.Data.Settings) {
       
        return MtcScheduleBoard.Data.Settings;
    } else {
        return null;
    }
};



MtcScheduleBoard.Data.Rooms = new Array();//{ Location: "", Title: "", Title_En: "", IconTop: "", IconBottom: "", Css: "" }

MtcScheduleBoard.Data.RoomDefinitionDataSource = null;

MtcScheduleBoard.Data.ServiceConnection = null;

// Compile template for roomTitle column
$.template("roomTitleTmpl", "${Title}&nbsp;${Title_En};&nbsp;");


MtcScheduleBoard.Data.FormatEngagementTime = (function (StartTime, EndTime) {
    var now = new Date();
    let timeDiffDays = (now.getTime() - EndTime.getTime()) / (1000 * 3600 * 24);
     // If event compleated after more then a day - display whole day event
    if (timeDiffDays <= -1.0)
        return "All day event";
    else 
        return Telerik.Utilities.toString(StartTime, "HH:mm") + " - " + Telerik.Utilities.toString(EndTime, "HH:mm");


});


MtcScheduleBoard.Data.FormatEngagementTitle = (function (Title, MeetingExternalLink) {

    if (!MeetingExternalLink)
        return Title;
    else
        return "<a href='" + MeetingExternalLink + "'>" + Title + "</a>";
});

MtcScheduleBoard.Data.MapRoom = (function (RoomId) {
    // Remove all email adressess
    var re = new RegExp("([^.@\\s]+)(\\.[^.@\\s]+)*@([^.@\\s]+\\.)+([^.@\\s]+)");
    RoomId = RoomId.replace(re, "").trim();

    var arRooms = RoomId.split(";"); // Engagement can be scaduled for multiple rooms
    if (arRooms.length == 0) 
        return RoomId; //Nothing to show
    var RoomMatched = new Array();

    for (var i = 0, len = arRooms.length; i < len; i++) {
        var room = arRooms[i].trim();
        var roomTitle = $.grep(MtcScheduleBoard.Data.Rooms, function (e) {
            return e.Location == room;
        });
        if (roomTitle.length > 0)
            RoomMatched.push(roomTitle[0]);
    }

    if (RoomMatched.length == 0) {
        // not found
        return RoomId;
    } else {        
        var returnValue = $.tmpl('roomTitleTmpl', RoomMatched);
        //returnValue = $.tmpl('roomTitlesCellTmpl', returnValue);
        return returnValue[0].textContent;
        ;
        //RoomMatched[0].Title + " " + RoomMatched[0].Title_En;
    }


});


/// TimeOut  Id for LoadApplicationConfiguration
var LoadApplicationConfigurationTimeOutId = null;

/// TimeOut  Id for InitServiceConnection
var InitServiceConnectionTimeOutId = null;

// IntervalId for periodic read message
var readMessageTimeOutId = null;


var page = WinJS.UI.Pages.define("/default.html", {
    ready: function (element, options) {      
        // Load configuration in one second
        LoadApplicationConfigurationTimeOutId = setTimeout(LoadApplicationConfiguration, 1 * 1000);
    }
});
/*
    Read application config via connection string and start furture initalization
*/
function LoadApplicationConfiguration() {
    
    MtcScheduleBoard.UI.StatusControl.trackAppInsightsEvent("LoadApplicationConfiguration");

    // Read room configuration and init datasource
    var _settings = MtcScheduleBoard.Data.loadSettings();
    ConfigureRoomsDatasource();

    var netInfo = Windows.Networking.Connectivity.NetworkInformation;
    
                if (netInfo.getInternetConnectionProfile() != null) {

                    netInfo.onnetworkstatuschanged = OnNetworkStatusChanged;

                    if (MtcScheduleBoard.Data.Settings.RoomDefinitionUrl != null) {
                        // Try downalod configuration
                        MtcScheduleBoard.Data.RoomDefinitionDataSource.read();
                        return;
                    }
                }
                else {
                    // No network connectivity. Report error status
                    WinJS.Application.queueEvent({
                        type: "connectionEvent", detail: {
                            value: {
                                eventType: "Error",
                                message: "No internet connection detetcted",
                                description: "Internet connection required to access Microsoft Azure."
                            }
                        }
                    });
                }

        /*   - we don't have connection to settings neither seved configuration
            - looks like clean start 
            - wait for configuration and settings to came
        */
       //Try connect in one minute*/
       LoadApplicationConfigurationTimeOutId =  setTimeout(LoadApplicationConfiguration, 1 * 60 * 1000); 
        
       
}


function OnNetworkStatusChanged() {


    var netInfo = Windows.Networking.Connectivity.NetworkInformation;

    if (netInfo.getInternetConnectionProfile() != null) {
            // Internet connection restored
        LoadApplicationConfigurationTimeOutId = setTimeout(LoadApplicationConfiguration, 1 * 1000);
        MtcScheduleBoard.UI.StatusControl.trackAppInsightsTrace("ConnectionRestored", MtcScheduleBoard.Data.Settings);
    } else {
           // Internet connection dropped
        WinJS.Application.queueEvent({
            type: "connectionEvent", detail: {
                value: {
                    eventType: "Error",
                    message: "Internet connection lost",
                    description: "Internet connection required to access Microsoft Azure."
                }
            }
        });

        MtcScheduleBoard.UI.StatusControl.trackAppInsightsTrace("ConnectionLost", MtcScheduleBoard.Data.Settings);

    }


    
}

function ConfigureRoomsDatasource() {
	MtcScheduleBoard.Data.RoomDefinitionDataSource = new Telerik.Data.DataSource({
		transport: {
			read: {
				url: MtcScheduleBoard.Data.Settings.RoomDefinitionUrl,
				dataType: "xml",
				cache: false
			},
		},
		schema: {
			parse: parseRoomDefinitionResponse
		}
    });

	MtcScheduleBoard.Data.RoomDefinitionDataSource.onerror = RoomDefinitionDownloadError;
}

/* Initialize connection to Azure Service Bus and listening for incomming events*/
function InitServiceConnection() {

    try {
        
        // Cancel reading message task
        if (readMessageTimeOutId)
            clearTimeout(readMessageTimeOutId);

       
        // Cancel TimeOut if any
        if (InitServiceConnectionTimeOutId)
            clearTimeout(InitServiceConnectionTimeOutId);
        
        MtcScheduleBoard.Data.ServiceConnectiont = null; // explicitly release old reference

        if (MtcScheduleBoard.Data.Settings.SasKeyName && MtcScheduleBoard.Data.Settings.SasKey) {
            // Initialize service bus connection component           

            MtcScheduleBoard.Data.ServiceConnectiont = new SmartHive.CloudConnection.ServiceBusConnection(MtcScheduleBoard.Data.Settings.ServiceBusNamespace,
                                            MtcScheduleBoard.Data.Settings.ServiceBusSubscription, MtcScheduleBoard.Data.Settings.ServiceBusTopic,
                                            MtcScheduleBoard.Data.Settings.SasKeyName, MtcScheduleBoard.Data.Settings.SasKey);
                                            
        } else {
            // Initialize Http connection
            MtcScheduleBoard.Data.ServiceConnectiont = new SmartHive.CloudConnection.HttpConnection(MtcScheduleBoard.Data.Settings.WebServiceUrl);          
        }


            MtcScheduleBoard.Data.ServiceConnectiont.addEventListener("oneventlog", function (eventTypeName, onEvenLogWriteEventArgs) {
                WinJS.Application.queueEvent({
                    type: "connectionEvent", detail: {
                        value: {
                            eventType: eventTypeName.eventType,
                            message: eventTypeName.message,
                            description: eventTypeName.description
                        }
                    }
                });
            });

            //waiting for service bus connected event args
            MtcScheduleBoard.Data.ServiceConnectiont.addEventListener("onservicebusconnected", function (sensor, subscriptionAddress) {            
                WinJS.Application.queueEvent({
                    type: "serviceBusConnected", detail: {
                        value: sensor.target
                    }
                });
            });

            MtcScheduleBoard.Data.ServiceConnectiont.initSubscription();

            if (MtcScheduleBoard.Data.ServiceConnectiont instanceof SmartHive.CloudConnection.HttpConnection) {
                // Legacy approach for HTTP - continusly query 
                readMessage();
            }
            

    } catch (e) {       
        InitServiceConnectionTimeOutId = setTimeout(InitServiceConnection, 1 * 60 * 1000); //Try connect in one minute

        throw new WinJS.ErrorFromName(e.message, "Read message error:" +
            "ServiceBusNamespace: " + MtcScheduleBoard.Data.Settings.ServiceBusNamespace + '\n' + 
            "ServiceBusSubscription: " + MtcScheduleBoard.Data.Settings.ServiceBusSubscription + '\n' +
            "ServiceBusTopic" + MtcScheduleBoard.Data.Settings.ServiceBusTopic + '\n' +
            "SasKeyName" + MtcScheduleBoard.Data.Settings.SasKeyName + '\n' +
            "SasKey" + MtcScheduleBoard.Data.Settings.SasKey
            );

    }
}

var readsCountUntilReconnect = 1000;
function readMessage(){      

    try {
       
        if (MtcScheduleBoard.Data.Settings.Location) {
            MtcScheduleBoard.Data.Settings.EventExpirationAfter = MtcScheduleBoard.Data.Settings.EventExpirationAfter ? MtcScheduleBoard.Data.Settings.EventExpirationAfter : 20;

            MtcScheduleBoard.Data.ServiceConnectiont.readMessageAsync(MtcScheduleBoard.Data.Settings.Location, MtcScheduleBoard.Data.Settings.EventExpirationAfter);
           
        } else {
            MtcScheduleBoard.UI.StatusControl.trackAppInsightsTrace("RoomId not set", "Please specify Location property in the rooms.xml");
        }

        readsCountUntilReconnect--;

        // read message each two minutes
        if (readsCountUntilReconnect > 0) {
            readMessageTimeOutId = setTimeout(readMessage, 2 * 60 * 1000);
        } else {
            readsCountUntilReconnect = 1000; // restore counters
            LoadApplicationConfigurationTimeOutId = setTimeout(LoadApplicationConfiguration, 1 * 1000);
            MtcScheduleBoard.UI.StatusControl.trackAppInsightsEvent("Refresh connection");
        }

    } catch (ex) {

        MtcScheduleBoard.UI.StatusControl.trackAppInsightsError(ex, "Message reading error.");
        LoadApplicationConfigurationTimeOutId = setTimeout(LoadApplicationConfiguration, 1 * 1000);
        throw ex;
    }
    // Reload data from service each minute
    /*if (readMessageTimeOutId)
        clearTimeout(readMessageTimeOutId);*/

    
}

function parseRoomDefinitionResponse(response) {

    try{
        
        var items = response.querySelectorAll("Room");
        if (!items) {
            return; // TODO: error
        }
   
        MtcScheduleBoard.Data.Rooms = []; //Clean 

        var SelectedItemIndex = -1;

        var settingWasUpdated = false; // We'll try update applcation settings from server each time

        jQuery.each(items,function (i, item)    
        {        
            if (item) {
                //Initialize item with defaul setings and read settings from response if any
                var roomData = jQuery.extend({}, MtcScheduleBoard.Data.Settings);
                roomData.Location = item.attributes["Location"] ? item.attributes["Location"].textContent : "";

                // read all settingfrom http server response
                jQuery.each(roomData, function (settingName, value) {
                    if (item.querySelector(settingName))
                        roomData[settingName] = item.querySelector(settingName).textContent;
                });

                // Add rooom settings into array (we may need for Connection settings)
                MtcScheduleBoard.Data.Rooms.push(roomData);

                // Update application settings from server
                if (MtcScheduleBoard.Data.Settings.Location === roomData.Location) {
            
                    // update all tablet settings from http server response
                    jQuery.each(roomData, function (settingName, value) {                	              
                        if (roomData[settingName] && roomData[settingName] !== MtcScheduleBoard.Data.Settings[settingName]) {                	                 
                            MtcScheduleBoard.Data.Settings[settingName] = roomData[settingName];
                            settingWasUpdated = true;
                        }
                    });
                           
                }

            }
        }        
    );

        WinJS.Application.queueEvent({ type: "settingsLoaded", detail: { value: MtcScheduleBoard.Data.Settings } });

        // cancel any repeats
        if (LoadApplicationConfigurationTimeOutId)
                clearTimeout(LoadApplicationConfigurationTimeOutId);


        if (settingWasUpdated)
            MtcScheduleBoard.Data.setSettings();

        return MtcScheduleBoard.Data.Rooms;
    } catch (err) {

           LoadApplicationConfigurationTimeOutId = setTimeout(LoadApplicationConfiguration, 1 * 1000);

            throw new WinJS.ErrorFromName(e.message, "Read message error:" +
          "ServiceBusNamespace: " + MtcScheduleBoard.Data.Settings.ServiceBusNamespace + '\n' +
          "ServiceBusSubscription: " + MtcScheduleBoard.Data.Settings.ServiceBusSubscription + '\n' +
          "ServiceBusTopic" + MtcScheduleBoard.Data.Settings.ServiceBusTopic + '\n' +
          "SasKeyName" + MtcScheduleBoard.Data.Settings.SasKeyName + '\n' +
          "SasKey" + MtcScheduleBoard.Data.Settings.SasKey
          );

    }
};


function getHostName() {
    var hostNamesList = Windows.Networking.Connectivity.NetworkInformation
    .getHostNames();

    for (var i = 0; i < hostNamesList.length; i++) {
        var entry = hostNamesList[i];

        if (entry.type === Windows.Networking.HostNameType.domainName) {
            return entry.canonicalName;
        }
    }

    return null;
}


function getAppVersion() {
    var p = Windows.ApplicationModel.Package.current.id.version;
    return p.major + "." + p.minor + "." + p.build + "." + p.revision;
}

function RoomDefinitionDownloadError(err) {

    //Display toast notofocation with error information
    var errTitle = "Rooms definition download error:" + err.status;
    var errDescription = "Url: " + err.sender.transport.options.read.url + ", request status: " + err.xhr.status;

    /// repeat configuration loading in 30 sec.
    LoadApplicationConfigurationTimeOutId = setTimeout(LoadApplicationConfiguration, 30 * 1000);

    throw new WinJS.ErrorFromName(errTitle, errDescription);
}

