THIS REPO HAS BEEN ARCHIVED AND IS NO LONGER MAINTAINED April 5, 2021


SmartHive is smart meeting room solution for enterprise. 
<ul>
  <li>Smart hive makes room usage efficient and transparent.</li>
  <li>Each visitor can easily find location of there meeting room via room schedule displayed at wall-mounted tablet by the door.</li>
  <li>Wireless sensors monitors room condition (temperature, humidity, lightening) and physical usage.</li>
  <li>If people not actually come to  the meeting and nobody actually uses the room, we can send a Skype message to a meeting organizer and ask for cancelation in Exchange. </li>
  <li>Facility managers can monitor and predict room usage.</li>
</ul>
<img src="Docs/Images/Architecture.jpg"/>
Meeting rooms is expensive resource for every organization.
With SmartHive you can digitally transform your facility into single smart room management system that:
<ul>
  <li>Schedule a meeting via Exchange online as usual.</li>
  <li>Display room schedule on Windows tablets mounted by each meeting room. It's easy to find your meeting room in the office.</li>
  <li>If people not actually coming to the meeting ask owner to cancel booking - others can use this resource.</li>
  <li>Provide detailed meeting room usage statistic for facility manager.</li>
</ul>
SmartHive is a set of three projects:
<ul>
	<li><a href="SmartHive.ScheduleBoard">SmartHive.ScheduleBoard</a> - an application for schedule board tablet to display meeting room schedule and conditions (presence, temperature, humidity etc.) </li>
	<li><a href="SmartHive.InfoboardSvc">SmartHive.InfoboardSvc</a> - cloud hosted services for working with sensors telemetry, room schedule and insights</li>
	<li><a href="SmartHive.SensorsGateway">SmartHive.SensorsGateway</a> - IoT protocol gateway for collecting room sensors data and sending telemetry to the cloud</li>
</ul>
