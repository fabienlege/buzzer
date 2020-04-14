/***
 *                                       _           _____
 *                                      | |         |  ___|
 *      __ _  __ _  ___ _ __   ___ ___  | |__   ___ |___ \
 *     / _` |/ _` |/ _ \ '_ \ / __/ _ \ | '_ \ / _ \    \ \
 *    | (_| | (_| |  __/ | | | (_|  __/ | | | | (_) /\__/ /
 *     \__,_|\__, |\___|_| |_|\___\___| |_| |_|\___/\____/
 *            __/ |
 *           |___/
 *
 *           >> https://agenceho5.com
 */

var express = require('express')
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var uid = require('uid');

server.listen(8080)

// Chargement du fichier index.html affiché au client
app.use(express.static('public'))

var clients = [];
var emptyClient = {
  uid: null,
  name: null,
  buzz: 0,
  successBuzz: 0,
  isAdmin: false
}
buzz = null

// Chargement de socket.io


// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
  console.log('Un client est connecté !');
  socket.emit('uid', uid(16));
  socket.emit('buzzed', buzz === null ? null : clients[buzz])

  // Receive Name
  socket.on('setName', function (data) {
    let index = clients.findIndex(r => r.uid === data.uid)
    if (index > -1) {
      clients[index].name = data.name;
    }
    else {
      clients.push({ ...emptyClient, uid: data.uid, name: data.name === 'admin6440' ? '****' : data.name, isAdmin: data.name === 'admin6440' });
    }
    socket.emit('clients', clients)
    socket.broadcast.emit('clients', clients)
    socket.emit('buzzed', buzz === null ? null : clients[buzz])
  })

  //receive Buzz
  socket.on('buzz', uid => {
    let index = clients.findIndex(r => r.uid === uid)
    if (index > -1) {
      clients[index].buzz++;
      if (buzz === null) {
        buzz = index;
        clients[index].successBuzz++;
        socket.emit('buzzed', clients[buzz])
        socket.broadcast.emit('buzzed', clients[buzz]);
      }
    }
    socket.emit('clients', clients)
    socket.broadcast.emit('clients', clients)
  })

  // Release
  socket.on('release', uid => {
    console.log(uid);
    let index = clients.findIndex(c => c.uid === uid && c.isAdmin)
    console.log(index)
    if (index > -1) {
      buzz = null;
      socket.emit('buzzed', buzz)
      socket.broadcast.emit('buzzed', buzz);
    }
  })

  socket.on('raz', uid => {
    console.log(uid);
    let index = clients.findIndex(c => c.uid === uid && c.isAdmin)
    console.log(index)
    if (index > -1) {
      buzz = null;
      clients = [];
      socket.emit('buzzed', buzz)
      socket.broadcast.emit('buzzed', buzz);
      socket.emit('clients', clients)
      socket.broadcast.emit('clients', clients)
    }
  })
});
