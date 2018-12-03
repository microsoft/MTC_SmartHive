FROM microsoft/dotnet:2.1-aspnetcore-runtime AS base
WORKDIR /app
EXPOSE 3773
EXPOSE 44375

FROM microsoft/dotnet:2.1-sdk AS build
WORKDIR /src
COPY ["./SmartHive.RoomManagerSvc.csproj", "SmartHive.RoomManagerSvc/"]
RUN dotnet restore "SmartHive.RoomManagerSvc/SmartHive.RoomManagerSvc.csproj"
COPY . .
WORKDIR "/src/SmartHive.RoomManagerSvc"
RUN dotnet build "SmartHive.RoomManagerSvc.csproj" -c Release -o /app

FROM build AS publish
RUN dotnet publish "SmartHive.RoomManagerSvc.csproj" -c Release -o /app

FROM base AS final
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "SmartHive.RoomManagerSvc.dll"]