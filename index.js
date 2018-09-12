var express = require('express');
var mosca = require('mosca');
var app = express();

const bodyParser = require('body-parser')
const http = require('http').Server(app);
const io = require('socket.io')(http);

const devices = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', express.static(__dirname + '/webapp'));
//mosquitto backend for mosca
var mosquittoBackend = {
  type: 'mqtt',
  json: false,
  mqtt: require('mqtt'),
  host: '127.0.0.1',
  port: 3883
};

//mongo db backend for mosca
var mongoBackend = {
  type: 'mongo',
  url: 'mongodb://localhost:27017/mqtt',
  pubsubCollection: 'widgets',
  mongo: {}
};

//setup mosca
var moscaSettings = {
  port: 1883,			
  backend: mosquittoBackend
};

//start mosca server
var mqttServer = new mosca.Server(moscaSettings);
mqttServer.on('ready', function () {
    console.log('[INFO] MQTT server is up and running');
});

mqttServer.on('clientConnected', function (client) {
    console.log('[INFO] MQTT client connected', client.id);
});

mqttServer.on('clientDisconnected', function (client) {
    console.log('[INFO] MQTT client Disconnected:', client.id);
});

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

io.on('connection', (socket) => {

  console.log('[INFO] WebSocket user connected');

  //io.emit("devices",{});
  io.emit("devices", devices);

  socket.on('disconnect', function () {
      console.log('[INFO] WebSocket user disconnected');
  });

});

http.listen(5000, function () {
  console.log('[INFO] Http Server UP!');
});

