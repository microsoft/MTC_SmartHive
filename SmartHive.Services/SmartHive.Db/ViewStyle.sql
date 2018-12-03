CREATE TABLE [dbo].[ViewStyle]
(
	[Id] INT NOT NULL PRIMARY KEY,
	[RoomId] INT NOT NULL,
	[IconTop] NVARCHAR(MAX),
	[IconBottom] NVARCHAR(MAX),
	[Css] NVARCHAR(MAX),
	[FloorMapVarName] NVARCHAR(100), 
    CONSTRAINT [FK_ViewStyle_ToRoomId] FOREIGN KEY ([RoomId]) REFERENCES [Room]([RoomId])

)
