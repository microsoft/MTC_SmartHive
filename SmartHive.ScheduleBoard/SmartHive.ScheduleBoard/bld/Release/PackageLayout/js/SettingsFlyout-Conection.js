//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
    "use strict";
    var page = WinJS.UI.Pages.define("/html/SettingsFlyout-Connection.html", {
        ready: function (element, options) {
                    
            $('#version').html(MtcScheduleBoard.Data.Settings.AppVersion);

            //restore controls state from settings
        	txtWebServiceUrl.value = MtcScheduleBoard.Data.Settings.HttpServerUrl;
        	txtWebServiceUrl.onchange = handleWebServiceUrlChange;
        	if (MtcScheduleBoard.Data.Settings.HttpServerUrl) {
        	    downloadSettingsUpdate(MtcScheduleBoard.Data.Settings.HttpServerUrl);
        	}


        	if (MtcScheduleBoard.Data.Settings.WebServiceUrl) {
        		setHref("aWebServiceStatus", MtcScheduleBoard.Data.Settings.WebServiceUrl);
        		document.getElementById("txtCheckUrlLbl").style.display = "block";        		
        	}
			
        	btnReloadDefinition.addEventListener("click", this.onReload);
            
            var comboBox = document.getElementById("txtRoomFilter");
            comboBox.addEventListener("change", this.onRoomFilterChanged);

            MtcScheduleBoard.Data.RoomDefinitionDataSource.addEventListener("error", this.onRoomDatasourceError);

            // Init room selection combobox and update each time we reload settings from server
            buildRoomCombobox();
        	WinJS.Application.addEventListener("settingsLoaded", buildRoomCombobox);

        /*	if (MtcScheduleBoard.Data.Settings.RoomDefinitionUrl) {        		
        		setHref("aRoomDefinitionStatus", MtcScheduleBoard.Data.Settings.RoomDefinitionUrl);        		
                MtcScheduleBoard.Data.RoomDefinitionDataSource.read().then(function () {
                    buildRoomCombobox(); // reload combobox after sucessfull data read
                });
            } else {
                buildRoomCombobox(); // draw empty default
            }*/
			
        	if (MtcScheduleBoard.Data.Settings.ScreenSaverVideoUrl)
        		setHref("aScreenSaverStatus", MtcScheduleBoard.Data.Settings.ScreenSaverVideoUrl);
            
                       
        },
        unload: function () {

            MtcScheduleBoard.Data.RoomDefinitionDataSource.removeEventListener("error", this.onRoomDatasourceError);
            
            if (settingsWasChanged) {
                // Create the message dialog and set its content
                var messageDialog = new Windows.UI.Popups.MessageDialog("Please restart application to apply all new preferences", "Setings was changed");
                // Show the message dialog
                messageDialog.showAsync();
            }
        	        	
        },     
        onRoomDatasourceError: function (e) {
        	if (MtcScheduleBoard.Data.Settings.RoomDefinitionUrl) {
        		displayMessage("Error download room configuration from " + MtcScheduleBoard.Data.Settings.RoomDefinitionUrl);
        		setHref("aWebServiceStatus", "");
        		setHref("aRoomDefinitionStatus", "");
        		setHref("aScreenSaverStatus", "");
        	}
        },
        onReload: function (e){
            // Reload button pressed - download configuration file from the server and update application settings
            if (!downloadSettingsUpdate(txtWebServiceUrl.value)) {
                return; // Do nothing if URL update fails
            }           
        },
        onRoomFilterChanged: function (e) {
            // Room filter changed - update application settings based on selected room
            loadRoomSettings();
        },
    });
    
    var settingsWasChanged = false;

    /**
    **  Bind room selection combobox to the datasource
     */
    function buildRoomCombobox(e){
        var comboBox = document.getElementById("txtRoomFilter");
        
        //clear combobox and load new values
        if (comboBox.options)
            comboBox.options.length = 0;
        
       
              
            // If no room data loaded - display message
            var defaultOption = document.createElement("option");
            defaultOption.text = "No filter defined";
            defaultOption.value = "";
            defaultOption.selected = true;
            comboBox.add(defaultOption);
            comboBox.disabled = true;
           
    //Check if we have predefined filters
        if (MtcScheduleBoard.Data.RoomDefinitionDataSource == null || MtcScheduleBoard.Data.RoomDefinitionDataSource.data == null) {
            return;
        }

        // read all settingfrom http server response
        jQuery.each(MtcScheduleBoard.Data.Rooms, function (i, roomSettings) {
            var newOption = document.createElement("option");
            newOption.text = roomSettings.Title_En;
            newOption.value = roomSettings.Location;
            if (MtcScheduleBoard.Data.Settings.Location && MtcScheduleBoard.Data.Settings.Location == roomSettings.Location) {
                // Room filter already specified
                newOption.selected = true;
            }
            comboBox.add(newOption);
        });

 /*       	MtcScheduleBoard.Data.RoomDefinitionDataSource.data.forEach(function (value, i) {
            
            // Check if this is unique option and add int combobox
            var ifExist = $(comboBox).filter('[value==' + value.Location + ']');
            if (ifExist == null || ifExist.length == 0) {
                var newOption = document.createElement("option");
                newOption.text = value.Title_En;
                newOption.value = value.Location;
                if (MtcScheduleBoard.Data.Settings.Location && MtcScheduleBoard.Data.Settings.Location == value.Location) {
                    // Room filter already specified
                    newOption.selected = true;
                }
                comboBox.add(newOption);
            }
        });*/
        
        if (MtcScheduleBoard.Data.RoomDefinitionDataSource.data.length > 0) {
            comboBox.disabled = false;
            btnReloadDefinition.disabled = false;
        } else {
            comboBox.disabled = true;
            btnReloadDefinition.disabled = true;
        }

    }
    
    /* User update URL of web services*/
    function handleWebServiceUrlChange(evt) {

        if (!downloadSettingsUpdate(evt.srcElement.value))
            return; // do nothing if URL validation fail

    }
    
    
    function validateServiceURL(Url){
        
        // Ignore empty values
        if (!Url) {
            displayMessage("URL is empty: " + Url);
            return false;
        }

        var re = new RegExp("((https?|http):\/\/)[-A-Za-z0-9+&@#\/%?=~_|!:,.;]+[-A-Za-z0-9+&@#\/%=~_|]");
        
        if (!re.test(Url)) {
            displayMessage("Wrong URL format: " + Url);
            return false;
        }
        return true;
    }
    
    function downloadSettingsUpdate(Url){
        
        if (validateServiceURL(Url) != true)
            return false;

        MtcScheduleBoard.Data.Settings.HttpServerUrl = Url;
        
        MtcScheduleBoard.Data.Settings.WebServiceUrl = Url + "/ScheduleUpdate.ashx";
        MtcScheduleBoard.Data.Settings.RoomDefinitionUrl = Url + "/rooms.xml";

        MtcScheduleBoard.Data.Settings.ScreenSaverVideoUrl = Url + "/DefaultScreenSaver.mp4";

        setHref("aWebServiceStatus", MtcScheduleBoard.Data.Settings.WebServiceUrl);
        setHref("aRoomDefinitionStatus", MtcScheduleBoard.Data.Settings.RoomDefinitionUrl);
        setHref("aScreenSaverStatus", MtcScheduleBoard.Data.Settings.ScreenSaverVideoUrl);

        MtcScheduleBoard.Data.setSettings();
        settingsWasChanged = true;

        LoadApplicationConfiguration();


       /* if (MtcScheduleBoard.Data.RoomDefinitionDataSource.view.length < 1) {
            displayMessage("rooms.xml is empty. please specify room definitions");
            return false;
        }*/

       

        return true;
    }
    
    /* Load selected room settings from RoomDefinitionDataSource*/
    function loadRoomSettings(){
        //var comboBox = document.getElementById("txtRoomFilter");
        
        //No selection made
        if (!comboBox || comboBox.selectedIndex < 0)
            return;
        
        var selectedItem = comboBox[comboBox.selectedIndex];
        if (!selectedItem) {
            displayMessage("No room selection made.");
            return;
        }
        
        //Try to find corresponding item in datasource array
        var ifExistArray = MtcScheduleBoard.Data.RoomDefinitionDataSource.data.filter(function (itemTemp) {
            return (itemTemp.Location === selectedItem.value);
        });
        
        
        //First item is always no filter
        if (ifExistArray.length > 0) {
            // Choosen from combobox
            var item = ifExistArray[0];
            
            MtcScheduleBoard.Data.Settings = item;
        } else {
            //Filter removed
            MtcScheduleBoard.Data.Settings.Location = "";
            MtcScheduleBoard.Data.Settings.Title = "";
            MtcScheduleBoard.Data.Settings.Title_En = "";
            MtcScheduleBoard.Data.Settings.IconTop = "";
            MtcScheduleBoard.Data.Settings.IconBottom = "";
            MtcScheduleBoard.Data.Settings.Css = "";
        }

        MtcScheduleBoard.Data.setSettings();
        
        settingsWasChanged = true;
        
    }

    function setHref(elmntId, Url) {
    	if (!Url)
    		return;

    	var Title;
    	switch (elmntId){
    		case "aWebServiceStatus":
    			Title = "Click to check service"
    			break;
    		case "aRoomDefinitionStatus":
    			Title = "Click to check room config"
    			break;
    		case "aScreenSaverStatus":
    			Title = "Click to check screensaver"
    			break;
    		default:
				Title = Url;
		}
    	var aElm = document.getElementById(elmntId);
    	aElm.innerText = Title;
    	aElm.href = Url;    	    	
    }

    function displayMessage(msgText) {
    	var msgDiv = document.getElementById("txtCheckUrlLbl");
    	if (!msgDiv)
    		return;
    	msgDiv.style.display = "block";
    	msgDiv.innerText = msgText;

	}

})();

