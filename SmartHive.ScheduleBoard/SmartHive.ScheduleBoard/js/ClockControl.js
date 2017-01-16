"use strict";

WinJS.Namespace.define("MtcScheduleBoard.UI", {
    ClockControl: WinJS.Class.define(
    function (element, options) {

        var ControlContainer = element || document.getElementById("ClockControl");
        ControlContainer.winControl = this;
        this.element = ControlContainer;

        var Hours = document.createElement("span");
        this.Hours = Hours;
        Hours.className = "Hours";
        Hours.innerHTML = "00";
        ControlContainer.appendChild(Hours);


        var TickSeparator = document.createElement("span");
        this.TickSeparator = TickSeparator;
        TickSeparator.className = "TickSeparator";
        TickSeparator.innerText = ":";
        ControlContainer.appendChild(TickSeparator);

        var Mins = document.createElement("span");
        this.Mins = Mins;
        Mins.className = "Mins";
        Mins.innerHTML = "00";
        ControlContainer.appendChild(Mins);

        setTimeout(this._drowtime.bind(this), 0);
        setInterval(this._tick.bind(this), 1000);
        setInterval(this._drowtime.bind(this), 10000); // redraw once per 10 sec
    },
    {
        _drowtime: function () {
            var now = new Date();
            var hours = now.getHours();
            var mins = now.getMinutes();
            if (mins < 10) mins = "0" + mins;
            this.Hours.innerHTML = hours
            this.Mins.innerHTML = mins;
        },
        _tick: function () {
            if (this.TickSeparator.style.visibility == 'visible')
                this.TickSeparator.style.visibility = 'hidden';
            else
                this.TickSeparator.style.visibility = 'visible';
        },
    }),
    DateControl: WinJS.Class.define(
        function (element, options) {
            var ControlContainer = element || document.getElementById("DateControl");
            ControlContainer.winControl = this;
            this.element = ControlContainer;
            var Date = document.createElement("span");
            this.Date = Date;
            Date.className = "Date";
            Date.innerHTML = "00.00";
            ControlContainer.appendChild(Date);
            setTimeout(this._drowdate.bind(this), 0);
            setInterval(this._drowdate.bind(this), 1000 * 3600); // redraw once per hour
        },
        {
            _drowdate: function () {
                var now = new Date();

                var langs = Windows.System.UserProfile.GlobalizationPreferences.languages;
                var m_datefmt1 = new Windows.Globalization.DateTimeFormatting.DateTimeFormatter("day month", langs);
                this.Date.innerHTML = m_datefmt1.format(now);
            }

        }),
    SensorData: WinJS.Class.define(
        function (element, options) {
            var ControlContainer = element;
            ControlContainer.winControl = this;

            var ValueLabel = options.valueLabel;
            this.ValueLabel = ValueLabel;

            // var ValueControl = document.createElement("span");
            this.ValueControl = ControlContainer;
            this.ValueControl.innerHTML = "0.0";

            //ControlContainer.appendChild(ValueControl);
            WinJS.Application.addEventListener("serviceBusConnected", this.onServiceBusConnected.bind(this));

        }, {
            onServiceBusConnected: function (connection) {
                MtcScheduleBoard.Data.ServiceConnectiont.addEventListener("onnotification", this.onnotification.bind(this));
            },
            onnotification: function (sensor, OnNotificationEventArgs) {
                var valueLabel = sensor.valueLabel;

                if (valueLabel === this.ValueLabel) {
                    this.ValueControl.innerHTML = sensor.value + " " + sensor.valueUnits;
                }
            }
        }, {
            Pir: false
        }

     )
});
