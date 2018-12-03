CREATE TABLE [dbo].[ServiceBusNamespace]
(
	[Namespace] NCHAR(100) NOT NULL PRIMARY KEY,
	[ConnString] NCHAR(256) NOT NULL
)
