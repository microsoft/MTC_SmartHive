//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
	"use strict";
	var page = WinJS.UI.Pages.define("/html/SettingsFlyout-Design.html", {

		ready: function (element, options) {

			document.getElementById("designSettingsFlyout").addEventListener("keydown", handleKeys);

			hideFooterToggle.winControl.checked = !MtcScheduleBoard.Data.Settings.HideFooterDisplayMode;
			hideFooterToggle.addEventListener("change", onDisplayModeChanged);
									
				// Font size for schedule table chooser
				var tableFontSizeChooserElement = document.getElementById("tableFontSizeChooser");
				var tableFontSizeChooserControl = tableFontSizeChooserElement.winControl;
				tableFontSizeChooserControl.value = MtcScheduleBoard.Data.Settings.TableFontSize;
				tableFontSizeChooserControl.addEventListener("change", this.onTableFontSizeChooserChanged);
		
				//
				var titleColumnWidthChooserElement = document.getElementById("TitleColumnWidthChooser");
				var titleColumnWidthChooserControl = titleColumnWidthChooserElement.winControl;
				titleColumnWidthChooserControl.value = MtcScheduleBoard.Data.Settings.TitleColumnWidth;
				titleColumnWidthChooserControl.addEventListener("change", this.onTitleColumnWidthChooserChanged);

				var locationColumnWidthChooserElement = document.getElementById("LocationColumnWidthChooser");
				if (MtcScheduleBoard.Data.ShowLocationColumn()) {
					var locationColumnWidthChooserControl = locationColumnWidthChooserElement.winControl;
					locationColumnWidthChooserControl.value = MtcScheduleBoard.Data.Settings.LocationColumnWidth;
					locationColumnWidthChooserControl.addEventListener("change", this.onLocationColumnWidthChooser);
				} else {
					var locationSettings = locationColumnWidthChooserElement.parentElement;
					locationSettings.parentElement.removeChild(locationSettings);
				}

				// find the color picker control from the host element's winControl property
				var colorPickerElement = document.getElementById("BgColorPicker");
				var colorPickerControl = colorPickerElement.winControl;
				colorPickerControl.value = MtcScheduleBoard.Data.Settings.BackgroundColor;
				colorPickerControl.previousColor = MtcScheduleBoard.Data.Settings.BackgroundColor;
				colorPickerControl.addEventListener("change", this.onBgColorChanged);
		},
		unload: function () {
			// Remove the handlers for dismissal
			document.getElementById("designSettingsFlyout").removeEventListener("keydown", handleKeys);
			this.removeEventListener("beforehide", this.onFlyoutHide);
		},
		onBgColorChanged: function (e) {
			MtcScheduleBoard.Data.Settings.BackgroundColor = e.target.value;
			MtcScheduleBoard.Data.setSettings();
		},
		onTableFontSizeChooserChanged: function (e) {
			MtcScheduleBoard.Data.Settings.TableFontSize = e.target.value;
			MtcScheduleBoard.Data.setSettings();
		},
		onTitleColumnWidthChooserChanged: function (e) {
			MtcScheduleBoard.Data.Settings.TitleColumnWidth = e.target.value;
			MtcScheduleBoard.Data.setSettings();
		},
		onLocationColumnWidthChooser: function (e) {
			MtcScheduleBoard.Data.Settings.LocationColumnWidth = e.target.value;
			MtcScheduleBoard.Data.setSettings();
		}
	});


	function handleKeys(evt) {
		// Handles Alt+Left and backspace key in the control and dismisses it
		if ((evt.altKey && evt.key === 'Left') || (evt.key === 'Backspace')) {
			WinJS.UI.SettingsFlyout.show();
		}
	};

	
	/// 
	function onDisplayModeChanged(evt) {
		MtcScheduleBoard.Data.Settings.HideFooterDisplayMode = !evt.srcElement.winControl.checked;
		MtcScheduleBoard.Data.setSettings();
	}


	})();