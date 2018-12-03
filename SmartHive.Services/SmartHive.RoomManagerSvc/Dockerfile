FROM microsoft/dotnet:2.1-aspnetcore-runtime AS base
WORKDIR /app
EXPOSE 80

FROM microsoft/dotnet:2.1-sdk AS build
WORKDIR /src
COPY ["SmartHive.RoomManagerSvc/SmartHive.RoomManagerSvc.csproj", "SmartHive.RoomManagerSvc/"]
RUN sudo apt-get install -y sqlite3 libsqlite3-dev
RUN mkdir /db
RUN /usr/bin/sqlite3 /db/smarthive.db
RUN dotnet restore "$PROJECT_DIR/SmartHive.RoomManagerSvc.csproj"
COPY . .
WORKDIR "/src/SmartHive.RoomManagerSvc"
RUN dotnet build "SmartHive.RoomManagerSvc.csproj" -c Release -o /app


FROM build AS publish
RUN dotnet publish "SmartHive.RoomManagerSvc.csproj" -c Release -o /app

FROM base AS final
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "SmartHive.RoomManagerSvc.dll"]