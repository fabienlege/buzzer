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
var fs = require('fs');
var app = express();
//debugmode only :
//var server = require('http').Server(app)
var server = require('https').Server({
  key: fs.readFileSync("/etc/letsencrypt/live/fabienlege.com/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/fabienlege.com/fullchain.pem")
}, app);
var io = require('socket.io')(server);
var fs = require('fs');

server.listen(8080)

// Chargement du fichier index.html affiché au client
app.use(express.static('public'))

var clients = [];
var emptyClient = {
  uid: null,
  name: "Sans nom",
  buzz: 0,
  successBuzz: 0,
  isAdmin: false
}
buzz = null

// Chargement de socket.io


// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
  console.log('Un client est connecté !');
  socket.emit('uid', socket.id);
  socket.emit('buzzed', buzz === null ? null : clients[buzz])
  clients.push({ ...emptyClient, uid: socket.id })

  //Déconnexion
  socket.on('disconnect', () => {
    let index = clients.findIndex(r => r.uid === socket.id)
    if (index === buzz) {
      buzz = null;
      socket.broadcast.emit('buzzed', null)
    }
    clients.splice(index, 1);
    socket.broadcast.emit('clients', clients)
  });

  // Receive Name
  socket.on('setName', function (data) {
    let index = clients.findIndex(r => r.uid === socket.id)
    if (data.name === "admin6440") {
      clients[index].name = "Administrateur";
      clients[index].isAdmin = true;
    }
    else {
      clients[index].name = data.name;
    }
    socket.emit('clients', clients)
    socket.broadcast.emit('clients', clients)
    socket.emit('buzzed', buzz === null ? null : clients[buzz])
  })

  //receive Buzz
  socket.on('buzz', uid => {
    let index = clients.findIndex(r => r.uid === socket.id)
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
    let index = clients.findIndex(c => c.uid === socket.id && c.isAdmin)
    if (index > -1) {
      buzz = null;
      socket.emit('buzzed', buzz)
      socket.broadcast.emit('buzzed', buzz);
    }
  })

  socket.on('raz', uid => {
    let index = clients.findIndex(c => c.uid === socket.id && c.isAdmin)
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
