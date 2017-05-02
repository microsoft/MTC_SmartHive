<%@ Control Language="C#" CodeBehind="Installer.ascx.cs" Inherits="Bootstrap.Installer.UserControls.Installer" %>
<%@ Register TagPrefix="UmbracoControls" Namespace="umbraco.uicontrols" Assembly="controls" %>

<div style="padding: 10px 10px 0;">

	<p>Bootstrap installer</p>

    <UmbracoControls:Feedback runat="server" ID="Feedback" type="success" Text="Bootstrap successfully installed!" />

    <h2>You're done!</h2>
    <h3>Language packs</h3>
    <p>uBootstrap has installed three root nodes: with English, Spanish and Hebrew site. If you don't need one of them, go to the content tree and remove the root node and then remove the language from settings > languages tree.</p>
    <h3>Setting the domain and the not found page</h3>
    <p>uBootstrap has already set up the domain(s) for the site(s). If you want to change this, go to the Content > Home > right click and select 'Manage hostnames' > and modify the host name. You might also want to use the domain prefixes by setting it to true in the umbracoSettings.config</p>
    <pre>&lt;useDomainPrefixes&gt;true&lt;/useDomainPrefixes&gt;</pre>
    <p>If you want to set up a friendly not found page, go to umbracoSettings.config and set</p>
    <pre>
    &lt;error404&gt;
        &lt;errorPage culture="en-US"&gt;'not found node id'&lt;/errorPage&gt;
        &lt;errorPage culture="es-ES"&gt;'no encontrado node id'&lt;/errorPage&gt;
        &lt;errorPage culture="he-IL"&gt;'not found node id'&lt;/errorPage&gt;
    &lt;/error404&gt;
    </pre>
    <h3>Demo site</h3>
    <p>You can see a live demo in <a rel="external" href="http://bs.jlusar.es">here</a>, and see the site in other languages by selecting them in the footer of the website.</p>
</div>
