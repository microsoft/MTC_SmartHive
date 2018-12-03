CREATE TABLE [dbo].[DeviceSettings]
(
	[DeviceId] varchar(50) NOT NULL PRIMARY KEY, 
    [DeviceSubscription] NVARCHAR(100) NOT NULL, 
    [TopicId] INT NOT NULL, 
    [ViewStyleId] INT NULL, 
    CONSTRAINT [FK_DeviceSettings_ToDevice] FOREIGN KEY ([DeviceId]) REFERENCES [Device]([DeviceId]), 
    CONSTRAINT [FK_DeviceSettings_ToServiceBusTopic] FOREIGN KEY ([TopicId]) REFERENCES [ServiceBusTopic]([TopicId]), 
    CONSTRAINT [FK_DeviceSettings_ToViewStyle] FOREIGN KEY ([ViewStyleId]) REFERENCES [ViewStyle]([Id])
)
