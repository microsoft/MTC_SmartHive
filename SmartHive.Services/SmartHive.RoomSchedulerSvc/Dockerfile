FROM microsoft/dotnet:2.1-aspnetcore-runtime AS base
WORKDIR /app
EXPOSE 80

FROM microsoft/dotnet:2.1-sdk AS build
WORKDIR /src
COPY ["SmartHive.RoomSchedulerSvc/SmartHive.RoomSchedulerSvc.csproj", "SmartHive.RoomSchedulerSvc/"]

RUN dotnet restore "$PROJECT_DIR/SmartHive.RoomSchedulerSvc.csproj"
COPY . .
WORKDIR "/src/SmartHive.RoomSchedulerSvc"
RUN dotnet build "SmartHive.RoomSchedulerSvc.csproj" -c Release -o /app

FROM build AS publish
RUN dotnet publish "SmartHive.RoomSchedulerSvc.csproj" -c Release -o /app

FROM base AS final
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "SmartHive.RoomSchedulerSvc.dll"]