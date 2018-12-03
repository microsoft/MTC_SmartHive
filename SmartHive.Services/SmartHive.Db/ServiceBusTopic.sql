CREATE TABLE [dbo].[ServiceBusTopic]
(
	[TopicId] INT NOT NULL PRIMARY KEY, 
	[Namespace] NCHAR(100) NOT NULL, 
	[TopicName] NCHAR(100) NOT NULL, 
    [SasKeyName] NCHAR(10) NULL, 
    [SasKey] NCHAR(1024) NULL,  
    CONSTRAINT [FK_ServiceBusTopic_ToServiceBusNamespace] FOREIGN KEY ([Namespace]) REFERENCES [ServiceBusNamespace]([Namespace])
)
