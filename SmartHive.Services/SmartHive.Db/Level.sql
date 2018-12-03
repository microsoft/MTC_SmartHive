CREATE TABLE [dbo].[Level]
(
	[LevelId] INT NOT NULL PRIMARY KEY, 
	[OfficeId] INT NOT NULL,
    [LevelNumber] INT NULL, 
    [LevelCode] NVARCHAR(50) NOT NULL, 
	[LevelMapUrl] NVARCHAR(MAX) NOT NULL DEFAULT 'http://cloud.wiregeo.com/?PHJXfrNo&amp;frame', 
    CONSTRAINT [FK_Level_ToOffice] FOREIGN KEY ([OfficeId]) REFERENCES [Office]([OfficeId])
)
