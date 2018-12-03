using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using SmartHive.Common.Data;
using SmartHive.RoomManagerSvc;

namespace SmartHive.RoomManagerSvc.Data
{
    public partial class SmartHiveContext : DbContext
    {
        public SmartHiveContext()
        {
        }

        public SmartHiveContext(DbContextOptions<SmartHiveContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Device> Device { get; set; }
        public virtual DbSet<DeviceSettings> DeviceSettings { get; set; }
        public virtual DbSet<Level> Level { get; set; }
        public virtual DbSet<Office> Office { get; set; }
        public virtual DbSet<Room> Room { get; set; }
        public virtual DbSet<Sensor> Sensor { get; set; }
        public virtual DbSet<ServiceBusNamespace> ServiceBusNamespace { get; set; }
        public virtual DbSet<ServiceBusTopic> ServiceBusTopic { get; set; }
        public virtual DbSet<Telemetry> Telemetry { get; set; }
        public virtual DbSet<TelemetryValues> TelemetryValues { get; set; }
        public virtual DbSet<ViewStyle> ViewStyle { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlite(ServiceConfig.ConnectionString);
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Device>(entity =>
            {
                entity.Property(e => e.DeviceId)
                    .HasMaxLength(50)
                    .IsUnicode(false)
                    .ValueGeneratedNever();

                entity.Property(e => e.Name).HasMaxLength(100);
            });

            modelBuilder.Entity<DeviceSettings>(entity =>
            {
                entity.HasKey(e => e.DeviceId);

                entity.Property(e => e.DeviceId)
                    .HasMaxLength(50)
                    .IsUnicode(false)
                    .ValueGeneratedNever();

                entity.Property(e => e.DeviceSubscription)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.HasOne(d => d.Device)
                    .WithOne(p => p.DeviceSettings)
                    .HasForeignKey<DeviceSettings>(d => d.DeviceId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_DeviceSettings_ToDevice");

                entity.HasOne(d => d.Topic)
                    .WithMany(p => p.DeviceSettings)
                    .HasForeignKey(d => d.TopicId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_DeviceSettings_ToServiceBusTopic");

                entity.HasOne(d => d.ViewStyle)
                    .WithMany(p => p.DeviceSettings)
                    .HasForeignKey(d => d.ViewStyleId)
                    .HasConstraintName("FK_DeviceSettings_ToViewStyle");
            });

            modelBuilder.Entity<Level>(entity =>
            {
                entity.Property(e => e.LevelId).ValueGeneratedNever();

                entity.Property(e => e.LevelCode)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.LevelMapUrl)
                    .IsRequired()
                    .HasDefaultValueSql("('http://cloud.wiregeo.com/?PHJXfrNo&amp;frame')");

                entity.HasOne(d => d.Office)
                    .WithMany(p => p.Level)
                    .HasForeignKey(d => d.OfficeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Level_ToOffice");
            });

            modelBuilder.Entity<Office>(entity =>
            {
                entity.Property(e => e.OfficeId).ValueGeneratedNever();

                entity.Property(e => e.Latitude).HasMaxLength(50);

                entity.Property(e => e.Longitude).HasMaxLength(50);

                entity.Property(e => e.OfficeAddress)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(e => e.OfficeCode)
                    .IsRequired()
                    .HasMaxLength(50);
            });

            modelBuilder.Entity<Room>(entity =>
            {
                entity.Property(e => e.RoomId).ValueGeneratedNever();

                entity.Property(e => e.ExchangeName).IsRequired();

                entity.Property(e => e.Title).IsRequired();

                entity.Property(e => e.TitleEn).HasColumnName("Title_En");

                entity.HasOne(d => d.Level)
                    .WithMany(p => p.Room)
                    .HasForeignKey(d => d.LevelId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Room_ToTable");

                entity.HasOne(d => d.Topic)
                    .WithMany(p => p.Room)
                    .HasForeignKey(d => d.TopicId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Room_ServiceBusTopic");
            });

            modelBuilder.Entity<Sensor>(entity =>
            {
                entity.Property(e => e.Id).ValueGeneratedNever();

                entity.Property(e => e.DeviceId)
                    .IsRequired()
                    .HasMaxLength(50)
                    .IsUnicode(false);

                entity.Property(e => e.Telemetry)
                    .IsRequired()
                    .HasMaxLength(50)
                    .IsUnicode(false);

                entity.HasOne(d => d.Device)
                    .WithMany(p => p.Sensor)
                    .HasForeignKey(d => d.DeviceId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Sensor_Device");

                entity.HasOne(d => d.Room)
                    .WithMany(p => p.Sensor)
                    .HasForeignKey(d => d.RoomId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Sensor_ToRoomId");

                entity.HasOne(d => d.TelemetryNavigation)
                    .WithMany(p => p.Sensor)
                    .HasForeignKey(d => d.Telemetry)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Sensor_ToTable");
            });

            modelBuilder.Entity<ServiceBusNamespace>(entity =>
            {
                entity.HasKey(e => e.Namespace);

                entity.Property(e => e.Namespace)
                    .HasMaxLength(100)
                    .ValueGeneratedNever();
            });

            modelBuilder.Entity<ServiceBusTopic>(entity =>
            {
                entity.HasKey(e => e.TopicId);

                entity.Property(e => e.TopicId).ValueGeneratedNever();

                entity.Property(e => e.Namespace)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.SasKey).HasMaxLength(1024);

                entity.Property(e => e.SasKeyName).HasMaxLength(10);

                entity.Property(e => e.TopicName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.HasOne(d => d.NamespaceNavigation)
                    .WithMany(p => p.ServiceBusTopic)
                    .HasForeignKey(d => d.Namespace)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_ServiceBusTopic_ToServiceBusNamespace");
            });

            modelBuilder.Entity<Telemetry>(entity =>
            {
                entity.HasKey(e => e.Telemetry1);

                entity.Property(e => e.Telemetry1)
                    .HasColumnName("Telemetry")
                    .HasMaxLength(50)
                    .IsUnicode(false)
                    .ValueGeneratedNever();

                entity.Property(e => e.ValueType)
                    .HasMaxLength(50)
                    .IsUnicode(false);

                entity.Property(e => e.ValueUnits).HasMaxLength(50);
            });

            modelBuilder.Entity<TelemetryValues>(entity =>
            {
                entity.Property(e => e.TelemetryId)
                    .HasMaxLength(50)
                    .IsUnicode(false);

                entity.HasOne(d => d.Telemetry)
                    .WithMany(p => p.TelemetryValues)
                    .HasForeignKey(d => d.TelemetryId)
                    .HasConstraintName("FK_TelemetryValues_ToTelemetry");
            });

            modelBuilder.Entity<ViewStyle>(entity =>
            {
                entity.Property(e => e.Id).ValueGeneratedNever();

                entity.Property(e => e.FloorMapVarName).HasMaxLength(100);

                entity.HasOne(d => d.Room)
                    .WithMany(p => p.ViewStyle)
                    .HasForeignKey(d => d.RoomId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_ViewStyle_ToRoomId");
            });
        }
    }
}
