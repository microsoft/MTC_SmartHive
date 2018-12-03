CREATE TABLE [dbo].[Device]
(
	[DeviceId] VARCHAR(50) NOT NULL PRIMARY KEY,
	[RoomId] INT NOT NULL,
	[Name] NVARCHAR(100),
	[Description] NVARCHAR(MAX)
)
