<%@ Page Language="C#" MasterPageFile="../../masterpages/umbracoPage.Master" CodeBehind="EditLessFile.aspx.cs" Inherits="Bootstrap.Logic.Less.EditLessFile" %>

<%@ Register TagPrefix="umb" Namespace="umbraco.uicontrols" Assembly="controls" %>

<asp:Content ContentPlaceHolderID="body" runat="server">

	<umb:UmbracoPanel runat="server" ID="UmbracoPanel" Text="Less Editor" hasMenu="true">
		
		<umb:Pane runat="server" ID="EditPane" Text="Edit Less File">
			
			<umb:Feedback runat="server" ID="Feedback" Visible="false" />

			<umb:PropertyPanel runat="server" ID="NamePanel" Text="Name">
				<asp:TextBox ID="TxtName" Width="350px" runat="server" />
			</umb:PropertyPanel>
			
			<umb:PropertyPanel runat="server" id="PathPanel" Text="Path">
				<asp:Literal ID="LtrlPath" runat="server" />
			</umb:PropertyPanel>

			<umb:PropertyPanel runat="server" ID="EditorPanel">
				<umb:CodeArea runat="server" ID="EditorSource" CodeBase="Css" AutoResize="true" OffSetX="47" OffSetY="47"  />
			</umb:PropertyPanel>

		</umb:Pane>

	</umb:UmbracoPanel>

</asp:Content>
