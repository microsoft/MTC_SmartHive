FROM microsoft/dotnet:2.1-aspnetcore-runtime AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM microsoft/dotnet:2.1-sdk AS build
WORKDIR /src
COPY ["SmartHive.ServiceBusSvc/SmartHive.ServiceBusSvc.csproj", "SmartHive.ServiceBusSvc/"]
RUN dotnet restore "SmartHive.ServiceBusSvc/SmartHive.ServiceBusSvc.csproj"
COPY . .
WORKDIR "/src/SmartHive.ServiceBusSvc"
RUN dotnet build "SmartHive.ServiceBusSvc.csproj" -c Release -o /app

FROM build AS publish
RUN dotnet publish "SmartHive.ServiceBusSvc.csproj" -c Release -o /app

FROM base AS final
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "SmartHive.ServiceBusSvc.dll"]