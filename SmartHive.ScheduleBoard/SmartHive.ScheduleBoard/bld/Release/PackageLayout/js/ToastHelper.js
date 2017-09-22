MtcScheduleBoard.ToastHelper = MtcScheduleBoard.ToastHelper || {};

	var LockNotifications = false;

	MtcScheduleBoard.ToastHelper.AddMessageToast = (function AddMessageToast(titleText, messageText) {
		
		var notifications = Windows.UI.Notifications;
		var toastNotifier = notifications.ToastNotificationManager.createToastNotifier();

		if (LockNotifications) 
			return; // reject message if not timed out

		var template = notifications.ToastTemplateType.toastText02;
		var toastXml = notifications.ToastNotificationManager.getTemplateContent(template);

		var toastTextElements = toastXml.selectNodes("/toast/visual/binding/text");
			toastTextElements[0].appendChild(toastXml.createTextNode(titleText));
			toastTextElements[1].appendChild(toastXml.createTextNode(messageText)); //

			var toastNode = toastXml.selectSingleNode("/toast");
			toastNode.setAttribute("duration", "long");
			toastNode.setAttribute("launch", '{"reason": "Toast", "error": "' + titleText+ '"}');

			var toast = new notifications.ToastNotification(toastXml);

			
			toastNotifier.show(toast);
			
			LockNotifications = true;
			setTimeout(function unlock() { LockNotifications = false; }, 1000 * 60); // Unlock in a minute


	});


(function () {
	"use strict";
	function DisplayMessageToast() {

	}

});