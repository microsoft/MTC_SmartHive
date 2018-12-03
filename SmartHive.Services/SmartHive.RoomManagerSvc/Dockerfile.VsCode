FROM microsoft/dotnet:2.1-sdk
ENV BUILD_CONFIGURATION Debug
ENV ASPNETCORE_ENVIRONMENT Development
ENV DOTNET_USE_POLLING_FILE_WATCHER true
EXPOSE 80
EXPOSE 3773
EXPOSE 44375

# Installing vsdbg debbuger into our container 
#RUN apt-get update \
#    && apt-get install -y --no-install-recommends \
#       unzip \
#    && rm -rf /var/lib/apt/lists/* \
#    && curl -sSL https://aka.ms/getvsdbgsh | bash /dev/stdin -v latest -l /vsdbg

WORKDIR /src

COPY *.csproj ./SmartHive.RoomManagerSvc/

WORKDIR /src/SmartHive.RoomManagerSvc
RUN dotnet restore SmartHive.RoomManagerSvc.csproj
COPY . .
#RUN dotnet build SmartHive.RoomManagerSvc.csproj -c Release -o /app

## Debug configuration
RUN dotnet build SmartHive.RoomManagerSvc.csproj -c Debug 

ENTRYPOINT dotnet run --no-build --no-launch-profile -c Debug --