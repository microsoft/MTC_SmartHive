/* Open link in a new window using jQuery  */
$(document).ready(function () {
    $('a[rel="external"]').click(function () {
        window.open($(this).attr('href'));
        return false;
    });
});

/* Enabling twipsy */
$(function () {
	$("ul.thumbnails li a").tooltip();
});

/* Twitter widget */
$(function () {
	if ($("#twtr-widget").length > 0) {
		var twitterAccount = $('#twtr-widget').attr('data-user');
		var script = '//api.twitter.com/1/statuses/user_timeline/' + twitterAccount + '.json?callback=twitterCallback2&count=3&include_rts=t';
		$.getScript(script, function () {
			console.log('Twitter widget was loaded.');
		});
	}
});

// twitter callback
function twitterCallback2(twitters) {

	var statusHTML = [];
	for (var i = 0; i < twitters.length; i++) {
		var username = twitters[i].user.screen_name;
		var status = twitters[i].text.replace(/((https?|s?ftp|ssh)\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!])/g, function (url) {
			return '<a href="' + url + '">' + url + '</a>';
		}).replace(/\B@([_a-z0-9]+)/ig, function (reply) {
			return reply.charAt(0) + '<a href="http://twitter.com/' + reply.substring(1) + '">' + reply.substring(1) + '</a>';
		});
		statusHTML.push('<li><span>' + status + '</span> <a class="label" href="http://twitter.com/' + username + '/statuses/' + twitters[i].id_str + '">' + relative_time(twitters[i].created_at) + '</a><hr/></li>');
	}
	document.getElementById('twtr-widget').innerHTML = statusHTML.join('');
}

function relative_time(time_value) {
	var values = time_value.split(" ");
	time_value = values[1] + " " + values[2] + ", " + values[5] + " " + values[3];
	var parsed_date = Date.parse(time_value);
	var relative_to = (arguments.length > 1) ? arguments[1] : new Date();
	var delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
	delta = delta + (relative_to.getTimezoneOffset() * 60);

	if (delta < 60) {
		return 'less than a minute ago';
	} else if (delta < 120) {
		return 'about a minute ago';
	} else if (delta < (60 * 60)) {
		return (parseInt(delta / 60)).toString() + ' minutes ago';
	} else if (delta < (120 * 60)) {
		return 'about an hour ago';
	} else if (delta < (24 * 60 * 60)) {
		return 'about ' + (parseInt(delta / 3600)).toString() + ' hours ago';
	} else if (delta < (48 * 60 * 60)) {
		return '1 day ago';
	} else {
		return (parseInt(delta / 86400)).toString() + ' days ago';
	}
}

// G+ recommend
$(function () {
	if ($("div.g-plusone").length > 0) {
		var lang = $('div.g-plusone').attr('data-lang');
		$.getScript('//apis.google.com/js/plusone.js', function () {
			window.___gcfg = { lang: lang };
			console.log('Google+ widget was loaded.');
		});
	}
});

// Facebook recommend
$(function () {
	if ($("div.fb-like").length > 0) {
		var e = document.createElement('script');
		e.async = true;
		e.src = '//connect.facebook.net/' + $('#fb-root').attr('data-lang') + '/all.js#xfbml=1';
		document.getElementById('fb-root').appendChild(e);
	}
});

/* Enabling  Unobtrusive Client Side Validation */
$(function () {
	if ($("form.validate").length > 0) {
		var validator = $.data($('form.validate')[0], 'validator');
		var settngs = validator.settings;
		settngs.highlight = function (element) {
			$(element).parents("div.control-group").addClass("error");
		};
		settngs.unhighlight = function (element) {
			$(element).parents("div.control-group").removeClass("error");
		};
	}
});
