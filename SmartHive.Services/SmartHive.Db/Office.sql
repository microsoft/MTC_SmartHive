CREATE TABLE [dbo].[Office]
(
	[OfficeId] INT NOT NULL PRIMARY KEY, 
    [OfficeCode] NVARCHAR(50) NOT NULL, 
    [OfficeAddress] NVARCHAR(255) NOT NULL, 
    [Latitude] NCHAR(50) NULL, 
    [Longitude] NCHAR(50) NULL
)
