CREATE TABLE [dbo].[TelemetryValues]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY, 
	[TelemetryId] VARCHAR(50) NULL,
	[SensorId] INT NOT NULL,
    [SourceTimestamp] DATETIME2 NOT NULL, 
	ValueInt INT NULL,
	ValueDouble FLOAT NULL,
	ValueBool BIT NULL,
	ValueStr NVARCHAR(MAX) NULL,
    CONSTRAINT [FK_TelemetryValues_ToTelemetry] FOREIGN KEY ([TelemetryId]) REFERENCES [Telemetry]([Telemetry])
)
