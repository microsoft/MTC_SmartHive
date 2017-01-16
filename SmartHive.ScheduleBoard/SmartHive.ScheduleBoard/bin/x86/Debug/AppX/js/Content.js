
(function () {
    "use strict";    

   

    var page = WinJS.UI.Pages.define("/html/Content.html", {
        ready: function (element, options) {
            WinJS.Application.addEventListener("settingsChanged", this.onApplicationSettingsChanged);
            WinJS.Application.addEventListener("videoCached", this.screenSaverVideoCached);
            WinJS.Application.addEventListener("serviceBusConnected", function (ServiceConnection) {
                connectToSchedule();
                MtcScheduleBoard.UI.StatusControl.pageStatusControl.setStatusLabel("Schedule bounded.");
            });

            // The resize event is raised when the view enters or exits full screen mode. 
            window.addEventListener("resize", onResize);

            setInterval(checkScreenSaver, 10 * 60 * 1000); //refresh schedule grid each 10 min to remove old engagements

        },
        unload: function () {
            WinJS.Application.removeEventListener("settingsChanged", this.onApplicationSettingsChanged);
            WinJS.Application.removeEventListener("videoCached", this.onApplicationSettingsChanged);
        },
        onApplicationSettingsChanged: function (e) {
            createGridView();
        },
        screenSaverVideoCached: function (evt) {
            try{
                var theScreenSaver = document.getElementById ("screenSaver");
                theScreenSaver.addEventListener("error", ScreenSaverPlayBackError);
                theScreenSaver.addEventListener("suspend", ScreenSaverPlayBackError);

                var videoUrl = MtcScheduleBoard.Data.Settings.ScreenSaverVideoUrl; // Initialize with internet URL

                ///     Extract video from request and cache it and fire an event when ready                       
                if (MtcScheduleBoard.Data.Settings.ScreenSaverVideoCachedVideo &&
                            MtcScheduleBoard.Data.Settings.ScreenSaverVideoCachedVideo.cachedfile) {

                    var file = MtcScheduleBoard.Data.Settings.ScreenSaverVideoCachedVideo.cachedfile;
                    videoUrl = window.URL.createObjectURL(file);               
                }

                theScreenSaver.src = videoUrl;
                theScreenSaver.play();

                checkScreenSaver();
                alignScreenSaver();
            } catch (ex) {
                ScreenSaverPlayBackError(ex);
            }
        }                                             
    });
    
    var grid = null;    
    
    var removeOutdatedEventAfter_Hours = 1;
   
   
    /// Handle schedule update eventds from service bus
    function connectToSchedule() {
       
        //   WinJS.Binding.processAll();

        MtcScheduleBoard.Data.ServiceConnectiont.addEventListener("onscheduleupdate", function (schedule, OnScheduleUpdateEventArgs) {
  
            MtcScheduleBoard.Data.Appointments = [];

            if (!schedule)
                return;

            if (schedule.schedule && schedule.schedule.length > 0){
            
                for (var i = 0; i < schedule.schedule.length; i++) {
                    MtcScheduleBoard.Data.Appointments.push({
                        startTime: schedule.parseDateString(schedule.schedule[i].startTime),
                        endTime: schedule.parseDateString(schedule.schedule[i].endTime),
                        location: MtcScheduleBoard.Data.Settings.Location,//schedule.schedule[i].location,
                        title: schedule.schedule[i].title,
                        category: schedule.schedule[i].category,
                        meetingExternalLink: ""
                    });

                }
               
            }            
            
            checkScreenSaver();
           
        });
      
    }
  

    function onResize() {
        alignScreenSaver();
    }


    function createGridView() {
            
        var filters = null;
        if (MtcScheduleBoard.Data.ShowLocationColumn())
            bindMultipleRoomGridView();
        else
            bindSingleRoomGridView();

    }

    /* Create and Bind grid for multiple room display mode*/
    function bindMultipleRoomGridView() {
    	
        // define grid
        grid = new Telerik.UI.RadGrid(document.getElementById("scheduleGrid"), {
            dataSource: MtcScheduleBoard.Data.CalendarDataSource,
            // height: 500,
            columns: [                     
                {
                    title: 'Time', width: MtcScheduleBoard.Data.Settings.TitleColumnWidth,
                    template: '#=MtcScheduleBoard.Data.FormatEngagementTime(startTime, endTime)#',
                    attributes: {
                        style: 'font-size: ' + MtcScheduleBoard.Data.Settings.TableFontSize + 'pt;'
                    },
                },
                {
                    field: 'Title', title: 'Engagement',
                    template: "#=MtcScheduleBoard.Data.FormatEngagementTitle(Title, MeetingExternalLink)#",
                    attributes: {
                        style: 'font-size: ' + MtcScheduleBoard.Data.Settings.TableFontSize + 'pt;'
                    },
                },
                {
                    title: "Location", width: MtcScheduleBoard.Data.Settings.LocationColumnWidth,
                    template: '#=MtcScheduleBoard.Data.MapRoom(Location)#',
                    attributes: {
                        style: 'font-size: ' + MtcScheduleBoard.Data.Settings.TableFontSize + 'pt;'
                    },
                }
            ],
        });

        grid.dataSource.sort = [{ field: "StartTime", dir: "asc" }];

     /*   var filters = MtcScheduleBoard.Data.LocationFilters();
        if (filters) {
            grid.dataSource.filter = { logic: "or", filters: [{}] };

            //Add all rooms as filter creteria
            for (var i = 0, len = filters.length; i < len; i++) {
                grid.dataSource.filter.filters.push({ field: "Location", operator: "Contains", value: filters[i] });
            }

        }*/
    }

    function ScreenSaverPlayBackError(error) {

        if (error.target && error.target.error) {
            // Ерш is specific player error
                var errTitle = "PlayBackError: " + error.target.error.code;
                var errObject = { detail: { message: "" } };
                switch (error.target.error.code) {
                    case error.target.error.MEDIA_ERR_ABORTED:
                        errObject.detail.message = "You aborted the video playback.";
                        break;
                    case error.target.error.MEDIA_ERR_NETWORK:
                        errObject.detail.message = "A network error caused the video download to fail part-way.";
                        break;
                    case error.target.error.MEDIA_ERR_DECODE:
                        errObject.detail.message = "The video playback was aborted due to a corruption problem or because the video used features your browser did not support.";
                        break;
                    case error.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errObject.detail.message =
					        "The video could not be loaded, either because the server or network failed or because the format is not supported.";
                        break;
                    default:
                        errObject.detail.message = "An unknown error occurred.";
                        break;
                }
                MtcScheduleBoard.UI.StatusControl.pageStatusControl.applicationError(errObject);
        } else {
            // This is some other error
            MtcScheduleBoard.UI.StatusControl.pageStatusControl.applicationError(error);
        }

        // Hide videoplayer
        var theScreenSaver = $("#screenSaver");
        if (theScreenSaver.css('display') !== 'none') {

            var player= document.getElementById("screenSaver");
            player.pause();
            player.src = "";
            
            theScreenSaver.hide();            
            $('#status').show();
            // raise event and try reload settings
            WinJS.Application.queueEvent({ type: "settingsLoaded", detail: { value: MtcScheduleBoard.Data.Settings } });                       
        }
           
    }

    /* Create and Bind grid for single room display mode*/
    function bindSingleRoomGridView() {
        grid = new Telerik.UI.RadGrid(document.getElementById("scheduleGrid"), {
            dataSource: MtcScheduleBoard.Data.Appointments,
            columns: [
                             {
                                 title: 'Time', width: MtcScheduleBoard.Data.Settings.TitleColumnWidth,
                                 template: '#=MtcScheduleBoard.Data.FormatEngagementTime(startTime, endTime)#',
                                 attributes: {
                                     style: 'font-size: ' + MtcScheduleBoard.Data.Settings.TableFontSize + 'pt;'
                                 },
                             },
                            {
                                field: 'Title', title: 'Engagement',
                                template: "#=MtcScheduleBoard.Data.FormatEngagementTitle(title, meetingExternalLink)#",
                                attributes: {
                                    style: 'font-size: ' + MtcScheduleBoard.Data.Settings.TableFontSize + 'pt;'
                                },
                            }
            ],

        });
        if (grid.dataSource) {
            grid.dataSource.sort = [{ field: "StartTime", dir: "asc" }];
         //   grid.dataSource.filter = { filters: [{}] };
         //   grid.dataSource.filter.filters.push({ field: "Location", operator: "contains", value: MtcScheduleBoard.Data.Settings.Location });
        }
      
    }

    /* Position videoplayer at center of the screen*/
    function alignScreenSaver(){
        
        // Check if screensaver loaded 
        if (!MtcScheduleBoard.Data.Settings.ScreenSaverVideoUrl || $('#screenSaver').css('display') == "none") // screensaver hidden
            return;


        $('#screenSaver').height(function () {
            return jQuery(window).height() - $('#header').height() - $('#footer').height();
        });

        $('#screenSaver').css("margin-left", function (index) {
            var offsetLeft = ((jQuery(window).width() - $('#screenSaver').width()) / 2) + $(window).scrollLeft() + "px";
            return offsetLeft;
        });
    }

    function checkScreenSaver() {

        var theScreenSaver = $('#screenSaver');

           if (MtcScheduleBoard.Data.Appointments && MtcScheduleBoard.Data.Appointments.length > 0) {
                    createGridView();

                    if ($('#status').css('display') != 'none') {
                        $('#status').hide();
                    }
                   
                    // Hide screensaver
                    if (theScreenSaver.css('display') != 'none') {                        
                        $('#screenSaver').hide();                       
                    }

                    // Show the grid 
                    if ($('#scheduleGrid').css('display') == 'none') {
                        $('#scheduleGrid').show();
                        MtcScheduleBoard.UI.StatusControl.trackAppInsightsPage("scheduleGrid");
                    }
                    
                   

                    return;                
           }else //We don't have rows - show video
               if (theScreenSaver && theScreenSaver.attr('src')) {
                    
                    if ($('#status').css('display') != 'none') {
                        $('#status').hide();
                    }                   

                    if ($('#screenSaver').css('display') == 'none') {
                        $('#screenSaver').show();
                        // Align screensaver 
                        alignScreenSaver();
                        MtcScheduleBoard.UI.StatusControl.trackAppInsightsPage("screenSaver");
                    }

                    if ($('#scheduleGrid').css('display') != 'none') {
                        $('#scheduleGrid').hide();
                    }
                   
            }
        
    }
})();