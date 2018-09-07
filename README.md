# iota-backend

## How to configure

First you have to set the environment:

```
$ npm install
```

Second you need mosquitto mqtt Broker:

```
$ sudo apt-add-repository ppa:mosquitto-dev/mosquitto-ppa
$ sudo apt-get update
$ sudo apt-get install mosquitto
$ sudo apt-get install mosquitto-clients
```

It should automatically start mosquitto.
To Stop and start the service I needed to use:

```
$ sudo service stop mosquitto
$ sudo service start mosquitto #see note later
```

Most sites I discovered where using the format:

```
$ sudo /etc/init.d/mosquitto stop
```

Then start mosquitto on port 1883:

```
$ mosquitto -p 1883
```

## How to use

```
$ node index.js
```

## Theory about Backend element

![Backend schema](./img/schema_1.png)

Al fine di creare una scenario IoT verosimile abbiamo sviluppato una piccola app in node.js che offre i servizi di storage, broker MQTT e WebServer (REST + WebSocket).
L’idea generale è che il backend esponga un servizio MQTT per i “devices”, un servizio che consenta, da un lato, a tutti i sensori e/o agli aggregatori di sensori di manifestare la propria presenza nel network IoT, dall’altro a tutti gli utilizzatori di reperire le informazioni riguardanti i device disponibili al fine di essere in grado di instaurare una connessione end to end con essi.
Il device durante la fase di bootstrap manifesta la sua presenza al backend via mqtt al topic “/device”.

```javascript
mqttServer.on('published', function (packet, client) {
    console.log('[INFO] MQTT client Published at ' + new Date());

    console.log(packet.payload.toString());
    if(packet.topic === 'devices')
    {
      let alreadyExist = false;
      let data = JSON.parse(packet.payload.toString());
      console.log(data);
      for(let i=0;i<devices.length;i++)
      {
          if(devices[i].root===data.root){
              alreadyExist=true;
          }
      }
      if(!alreadyExist){
        devices.push(data);
        io.emit("devices", devices);
      }
    }
});
```

Dall’altra parte l’api REST esposta dal web server permetterà agli utilizzatori di questa infrastruttura, per esempio ad una WebApp di prendere informazioni sui dispositivi per poi essere in grado di instaurare una connessione.

```javascript
app.get('/devices', function (req, res){
    let onlineDevices = db.collection('devices').find();
    res.json(onlineDevices);
});
```

Parallelamente la stessa operazione può essere fatta via WebSocket, alla connessione di un client sul socket o alla pubblicazione di un nuovo device via mqtt.

```javascript
io.on('connection', (socket) => {
    console.log('[INFO] WebSocket user connected');
  
    io.emit("devices", devices);
    ...
    
});
```