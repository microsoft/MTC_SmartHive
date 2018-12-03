CREATE TABLE [dbo].[Room]
(
	[RoomId] INT NOT NULL PRIMARY KEY,
	[LevelId] INT NOT NULL,
	[TopicId] INT NOT NULL,
	[ExchangeName] NVARCHAR(MAX) NOT NULL, 	
    [Title] NVARCHAR(MAX) NOT NULL, 
    [Title_En] NVARCHAR(MAX) NULL, 
    CONSTRAINT [FK_Room_ToTable] FOREIGN KEY ([LevelId]) REFERENCES [Level]([LevelId]), 
    CONSTRAINT [FK_Room_ServiceBusTopic] FOREIGN KEY ([TopicId]) REFERENCES [ServiceBusTopic]([TopicId])
)
