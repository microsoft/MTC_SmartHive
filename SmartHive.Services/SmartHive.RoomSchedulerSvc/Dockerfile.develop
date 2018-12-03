FROM microsoft/dotnet:2.1-sdk
ARG BUILD_CONFIGURATION=Debug
ENV ASPNETCORE_ENVIRONMENT=Development
ENV DOTNET_USE_POLLING_FILE_WATCHER=true
EXPOSE 80

WORKDIR /src
COPY ["SmartHive.RoomSchedulerSvc/SmartHive.RoomSchedulerSvc.csproj", "SmartHive.RoomSchedulerSvc/"]

RUN dotnet restore "SmartHive.RoomSchedulerSvc/SmartHive.RoomSchedulerSvc.csproj"
COPY . .
WORKDIR "/src/SmartHive.RoomSchedulerSvc"
RUN dotnet build --no-restore "SmartHive.RoomSchedulerSvc.csproj" -c $BUILD_CONFIGURATION

ENTRYPOINT ["dotnet", "run", "--no-build", "--no-launch-profile", "-c", "$BUILD_CONFIGURATION", "--"]