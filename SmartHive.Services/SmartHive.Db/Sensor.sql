CREATE TABLE [dbo].[Sensor]
(
	[Id] INT NOT NULL PRIMARY KEY,
	[RoomId] INT NOT NULL,
	[Telemetry] VARCHAR(50) NOT NULL,
	[DeviceId] VARCHAR(50) NOT NULL
    CONSTRAINT [FK_Sensor_ToTable] FOREIGN KEY ([Telemetry]) REFERENCES [Telemetry]([Telemetry]), 
    CONSTRAINT [FK_Sensor_ToRoomId] FOREIGN KEY ([RoomId]) REFERENCES [Room]([RoomId]), 
    CONSTRAINT [FK_Sensor_Device] FOREIGN KEY ([DeviceId]) REFERENCES [Device]([DeviceId])
)
