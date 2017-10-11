// For an introduction to the Fixed Layout template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232508

var MtcScheduleBoard = MtcScheduleBoard || {}; // Define global namespace

(function () {
    "use strict";    
var promises = [];
    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var appDisplayRequest = new Windows.System.Display.DisplayRequest;
    var promises = [];
    
	app.addEventListener("error", function (err) {
        
	    var message = err.detail.message ?  err.detail.message : err.detail.errorMessage;	   

	    MtcScheduleBoard.ToastHelper.AddMessageToast(message, err.detail.description);

        if (err.detail.stack) {
            MtcScheduleBoard.ToastHelper.AddMessageToast("Err trace", err.detail.stack);
        }

        return true; // only if error is handled
	});
	app.addEventListener("settingsChanged", onApplicationSettingsChanged);
	app.addEventListener("settingsLoaded", onApplicationSettingsLoaded);
	/*
       Event lifecycle
        "settingsChanged" / "settingsLoaded" -> "serviceBusConnected" -> "onscheduleupdate" / "onnotification"
    */
    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            
            args.setPromise(WinJS.UI.processAll());

            WinJS.Application.onsettings = function (e) {
            	e.detail.applicationcommands = {
            		"SetConnection": { title: "Connection", href: "/html/SettingsFlyout-Connection.html" },
					"SetDesign": { title: "Design", href: "/html/SettingsFlyout-Design.html" }
            	};            	
                WinJS.UI.SettingsFlyout.populateSettings(e);
            };

            WinJS.Application.start();
        }

        if (args.detail.previousExecutionState === activation.ApplicationExecutionState.terminated) {
            args.setPromise(MtcScheduleBoard.UI.StatusControl.trackAppInsightsEvent("application" + args.detail.previousExecutionState));
        }

        appDisplayRequest.requestActive();

        GalaSoft.MvvmLight.Threading.DispatcherHelper.Initialize();
       
    };
    

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call

        args.setPromise(function handleCheckpoint() {

            if (!appDisplayRequest) {
                appDisplayRequest = new Windows.System.Display.DisplayRequest;
            }
            appDisplayRequest.requestActive();

            MtcScheduleBoard.UI.StatusControl.trackAppInsightsEvent("applicationSuspended");
        });
    };

    WinJS.Namespace.define("MtcScheduleBoard.UI", {
       StatusControl: WinJS.Class.define(
            function (element, options) {
                var ControlContainer = element;
                ControlContainer.winControl = this;
               
                MtcScheduleBoard.UI.StatusControl.pageStatusControl = this;
                                                
                var StatusLabel = options.status;
                this.StatusLabel = StatusLabel;
                                
                this.StatusLabelControl = ControlContainer.children["statusText"];
                this.StatusLabelControl.innerHTML = this.StatusLabel;
                
                // Initialize file logging
                this.startFileLog().then(function (logger) {
                    if (WinJS.log)
                        WinJS.log('\r\n' + "StatusControl loaded", "ScheduleBoard", "Info");
                });

                // set event handlers for display status /logging
                app.addEventListener("serviceBusConnected", this.serviceBusConnected.bind(this));
                app.addEventListener("settingsChanged", this.settingsChanged.bind(this));
                app.addEventListener("settingsLoaded", this.settingsLoaded.bind(this));
                app.addEventListener("error", this.applicationError.bind(this));
                app.addEventListener("serviceBusConnected", this.serviceBusConnected.bind(this));
                app.addEventListener("connectionEvent", this.connectionEvent.bind(this));
                
            }, {
                settingsChanged: function (element, options) {
                    // Event fired when application setings load compleated
                    MtcScheduleBoard.UI.StatusControl.pageStatusControl.setStatusLabel("application settings was updated");
                    MtcScheduleBoard.UI.StatusControl.trackAppInsightsEvent("settingsChanged");                   
                },
                settingsLoaded: function (element, options) {
                    // Event fired when application setings load compleated
                    MtcScheduleBoard.UI.StatusControl.pageStatusControl.setStatusLabel("application settings loaded sucessfull");

                    MtcScheduleBoard.UI.StatusControl.trackAppInsightsEvent("settingsLoaded");
                    
                    if (MtcScheduleBoard.Data.Settings.ServiceBusSubscription) {
                        window.appInsights.setAuthenticatedUserContext(MtcScheduleBoard.Data.Settings.ServiceBusSubscription);
                        if (window.appInsights.context) {
                            window.appInsights.context.device.id = MtcScheduleBoard.Data.Settings.ServiceBusSubscription;
                        }
                    }
                },
                setStatusLabel: function (text) {
                    $('#statusText').css('color', '#21bdee');
                    this.StatusLabelControl.innerHTML = text;

                    //Display toast notofication if status is hidden
                    if ($('#status').css('display') == 'none') {
                        MtcScheduleBoard.ToastHelper.AddMessageToast("Schedule: ", text);
                    }

                    if (WinJS.log)
                        WinJS.log(text, "ScheduleBoard", "Info");

                },
                connectionEvent: function (eventParams) {
                    let eventData = eventParams.detail.value;
                    if (eventData) {

                        this.StatusLabelControl.innerText = eventData.message + '\n' + eventData.description;

                        if (eventData.eventType === "Error") {
                            $('#statusText').css('color', 'red');
                        } 
                    }
                    MtcScheduleBoard.UI.StatusControl.trackAppInsightsEvent("connectionEvent");
                },
                applicationError: function (err) {
                    
                    var errMessage  = null;
                    if (err.message){
                        errMessage = err.message;
                    }else if (err.detail){
                        errMessage = err.detail.message ? err.detail.message : err.detail.errorMessage;

                        if (err.detail.stack)
                            errMessage += "<br>Err trace:<br>" + err.detail.stack;

                    } else {
                        errMessage = err.detail.error;
                    }
                                            
                   
                    if (!errMessage)
                        errMessage = "Unknown error";
                                       
                    MtcScheduleBoard.UI.StatusControl.pageStatusControl.setStatusLabel(errMessage);
                    $('#statusText').css('color', 'red');

                    //Display toast notofication if status is hidden
                    if ($('#status').css('display') == 'none') {
                        MtcScheduleBoard.ToastHelper.AddMessageToast("Error", errMessage);

                        $('#screenSaver').show(); // And show status
                    }
                  
                    MtcScheduleBoard.UI.StatusControl.trackAppInsightsError(err, errMessage);
                    
                                      
                },
                /// Create log file for this session
                startFileLog: function () {
                        
                        // choose where the file will be stored:
                        var fileDestination = Windows.Storage.ApplicationData.current.localFolder;
                        var writesCount = 0;
                        var isLocked = false;
                        var sBuffer = new Array();
                        var logger = new WinJS.Promise(function (complete) {
                            var logfilename = new Date().toISOString().replace(/[:-]/g, "");
                            logfilename = "log-" + logfilename + ".log";
                            fileDestination.createFileAsync(logfilename, Windows.Storage.CreationCollisionOption.generateUniqueName)
                                  .done(function (file) {
                                      complete(file);                                     
                                  });
                        });

                        var actionFn = function (message, tag, type) {
                            logger.then(function (file) {

                                if (!file)
                                    return; // looks like this some writes after archiving

                                if (!tag || tag == 'winjs scheduler') 
                                    return; // avoid spaming by scheduler

                                var m = new Date().toLocaleString() + " " + WinJS.Utilities.formatLog(message, tag, type);
                                sBuffer.push(m);
                                if (!isLocked) {
                                    isLocked = true;
                                    let tmpBuf = sBuffer.splice(0, sBuffer.length);
                                    Windows.Storage.FileIO.appendLinesAsync(file, tmpBuf).done(
                                                function () {
                                                    writesCount++;
                                                    // check each 5000 writes if we need copy log to archive and reopen it
                                                    if (writesCount > 5000) { 
                                                        writesCount = 0;
                                                        file.getBasicPropertiesAsync().done(
                                                                 function (basicProperties) {
                                                                     // Check file size properties
                                                                     var size = basicProperties.size;          
                                                                     if (size > 20000000) { // copy log to archive each 20 Mb 
                                                                         WinJS.Utilities.stopLog();
                                                                         file.renameAsync("archive.log", Windows.Storage.NameCollisionOption.replaceExisting).done(
                                                                                    function (file) {
                                                                                        MtcScheduleBoard.UI.StatusControl.pageStatusControl.startFileLog();
                                                                                    });
                                                                     }
                                                                 }
                                                        );
                                                    }
                                                    isLocked = false;
                                                }
                                        );
                                }// if
                            });

                        };
                        
                        WinJS.Utilities.startLog({ action: actionFn });

                        return logger;
                },
                serviceBusConnected: function (ServiceConnection){                  
                    // Hide loading 
                    MtcScheduleBoard.UI.StatusControl.pageStatusControl.setStatusLabel("Sucessfully connected to:<br>" + ServiceConnection.detail.value);
                    MtcScheduleBoard.UI.StatusControl.trackAppInsightsEvent("serviceBusConnected");
                    MtcScheduleBoard.Data.ServiceConnectiont.addEventListener("onscheduleupdate", this.scheduleUpdateMessage.bind(this));
                   
                },
                scheduleUpdateMessage: function (schedule, OnScheduleUpdateEventArgs) {
                   
                    MtcScheduleBoard.UI.StatusControl.trackAppInsightsEvent("onscheduleupdate");
                    if (schedule && schedule.schedule)
                        window.appInsights.trackMetric("Total events", schedule.schedule.length);
                },
                videoDownloadProgress: function () {
                    if (!MtcScheduleBoard.Data.Settings.ScreenSaverVideoCachedVideo ||
                         !MtcScheduleBoard.Data.Settings.ScreenSaverVideoCachedVideo.download) {
                        MtcScheduleBoard.UI.StatusControl.pageStatusControl.setStatusLabel("Video downalod progress called for empty downalod object");
                        return;
                    }

                    var progress = MtcScheduleBoard.Data.Settings.ScreenSaverVideoCachedVideo.download.progress;

                    if (progress && progress.bytesReceived && progress.totalBytesToReceive) {
                        var prgogressPercents = progress.bytesReceived * 100 / progress.totalBytesToReceive;
                        MtcScheduleBoard.UI.StatusControl.pageStatusControl.setStatusLabel("Screen saver video cache progress " + prgogressPercents.toFixed(1) + "%");
                    }
                }
                },{
                    pageStatusControl: null,                   
                    // Report telemetry event to Application insights
                    trackAppInsightsEvent: function (eventName) {
                        window.appInsights.trackEvent(eventName, {
                            Subscription: MtcScheduleBoard.Data.Settings.ServiceBusSubscription,
                            Location: MtcScheduleBoard.Data.Settings.Location
                        });                        
                        window.appInsights.flush();

                        if (WinJS.log)
                            WinJS.log(eventName, "ScheduleBoard", "Info");

                    },
                    trackAppInsightsTrace: function (title, properties) {

                        if (window.appInsights)
                            window.appInsights.trackTrace(title, properties);
                        
                        if (WinJS.log)
                            WinJS.log(title + " " + JSON.stringify(properties), "ScheduleBoard", "Info");
                    },
                    trackAppInsightsError: function (err, errMessage) {

                        if (window.appInsights) {
                            window.appInsights.trackTrace(errMessage, MtcScheduleBoard.Data.Settings);
                            window.appInsights.trackException(err, MtcScheduleBoard.Data.Settings);
                        }

                        if (WinJS.log)
                            WinJS.log(err + " " + errMessage, "ScheduleBoard", "Error");
                       
                    },
                    trackAppInsightsPage: function (pageName) {
                        window.appInsights.trackPageView(pageName);
                    }
            }
         )
    });

    app.start();
  
    function trackPromise(p) { promises.push(p); }
    function untrackPromise(p) { promises.slice(promises.indexOf(p), 1); }

    /*
        Extract CSS text from request and inject it into application HEAD tag
    */
    function processCSS(request) {

        if (request.status !== 200) {
            return;
        }

        var cssText = request.responseText;
        if (!cssText)
            return;
        var css = document.createElement("style");
        css.type = "text/css";
        if ("textContent" in css)
            css.textContent = cssText;
        else
            css.innerText = cssText;
        document.head.appendChild(css);

    }

    var downloader = null;
    /* Catch after rooms.xml downloaded and parsed*/
    function onApplicationSettingsLoaded() {
                InitServiceConnection();
                startScreenSaverVideoDownload();                            
    }

    function onApplicationSettingsChanged() {
    	if (MtcScheduleBoard.Data.Settings.BackgroundColor) {
    		$("#header").css("background-color", MtcScheduleBoard.Data.Settings.BackgroundColor);
    		$("#footer").css("background-color", MtcScheduleBoard.Data.Settings.BackgroundColor);
    		$("#MtcLogo").css("background-color", MtcScheduleBoard.Data.Settings.BackgroundColor);
    	}
    	if (MtcScheduleBoard.Data.Settings.HideFooterDisplayMode) {
    		// Todo hide footer control and show different header control
    		$("#footer").remove();
    	}

        //Apply Css settings
    	if (MtcScheduleBoard.Data.Settings.Css) {
    	    startCssDownload();
    	}
    	    	
    };

    /*  Download custom CSS styles from server to apply custom branding*/
    function startCssDownload() {
        // load custom CSS definition from the server
        var promise = WinJS.xhr({ url: MtcScheduleBoard.Data.Settings.Css, headers: { "If-Modified-Since": "Mon, 27 Mar 1972 00:00:00 GMT" } });
        trackPromise(promise);
        promise.then(processCSS.bind(), cssDownloadError.bind()).done(function () {            
            untrackPromise(promise);
            MtcScheduleBoard.UI.StatusControl.trackAppInsightsEvent("css downloaded");
        })
    }

    /*   Download and cache ScreenSaver Video */
    function startScreenSaverVideoDownload() {
      
           // If we don't have settings or in progress
        if (!MtcScheduleBoard.Data.Settings.ScreenSaverVideoUrl || downloader) 
            return;

            // start Background data transfer for download screensaver video from the server and cache
            downloader = new Windows.Networking.BackgroundTransfer.BackgroundDownloader();
            var sto = Windows.Storage;
            var localFolder = sto.KnownFolders.videosLibrary;
            var promise = localFolder.createFileAsync("ScreenSaver.mp4", sto.CreationCollisionOption.replaceExisting);
            //WinJS.xhr({ url: MtcScheduleBoard.Data.Settings.ScreenSaverVideoUrl, headers: { "If-Modified-Since": "Mon, 27 Mar 1972 00:00:00 GMT" } });
            trackPromise(promise);

            promise.
                then(function (file) {

                    var uri = new Windows.Foundation.Uri(MtcScheduleBoard.Data.Settings.ScreenSaverVideoUrl);

                    MtcScheduleBoard.Data.Settings.ScreenSaverVideoCachedVideo = {
                        cachedfile: file,
                        download: downloader.createDownload(uri, file),
                    };

                    return MtcScheduleBoard.Data.Settings.ScreenSaverVideoCachedVideo.download.startAsync();
                }
                ).then(
                        function () {
                            setTimeout(function () {
                                //wait for 30 seconds for HDD buffer and raise compleated event
                                WinJS.Application.queueEvent({ type: "videoCached", detail: {} });
                            }, 10 * 1000);
                            
                        },
                        videoDownloadError.bind(),
                        function () {
                            MtcScheduleBoard.UI.StatusControl.pageStatusControl.videoDownloadProgress();
                        }
                ).done(function () {
                    untrackPromise(promise);
                    MtcScheduleBoard.UI.StatusControl.trackAppInsightsEvent("video downloaded");                    
                    downloader = null;                    
                })

    }

    function cssDownloadError(err) {

        setTimeout(startCssDownload, 1 * 60 * 1000); //repeat css download in one minute

        throw new WinJS.ErrorFromName("CSS downlaod error", "Http Error:" + err.status + " for " + MtcScheduleBoard.Data.Settings.Css);

    }

    function videoDownloadError(err) {
        var status = Windows.Networking.BackgroundTransfer.BackgroundTransferError.getStatus(err.number);

        setTimeout(startScreenSaverVideoDownload, 1 * 60 * 1000); //repeat video download in one minute

        throw new WinJS.ErrorFromName("Video downlaod error", "Http Error:" + err.number + "; " + err.description);    
    }




})();
 

  
