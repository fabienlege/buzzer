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
var uid = require('uid');
var fs = require('fs');
var app = express();
var clone = require('clone')
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
  isAdmin: false,
  loggedIn: false
}
buzz = null

var rooms = []
var emptyRoom = {
  id: null,
  title: null,
  isProtected: false,
  password: null,
  adminpass: null,
  waitfirst: true,
  buzz: null,
  players: []
}


// Chargement de socket.io

//LIST DES PARTIES
var listSocket = io.of('roomlist');
listSocket.on('connection', socket => {
  socket.emit('rooms', clone(rooms).map(r => { r.password = null; r.adminpass = null; return r }));
  socket.on('createRoom', room => {
    var roomId = uid(16);
    rooms.push({ ...clone(emptyRoom), ...room, id: roomId, isProtected: Boolean(room.password) })
    socket.emit('goToRoom', roomId);
    socket.broadcast.emit('rooms', clone(rooms).map(r => { r.password = null; r.adminpass = null; return r }));
  })
})

//IN A ROOM
var roomSock = io.of('room');
// Quand un client se connecte, on le note dans la console
var login = (socket, room_index) => {
  var player_index = rooms[room_index].players.push({ ...emptyClient, uid: socket.id });
  player_index--;
  rooms[room_index].players[player_index].loggedIn = true
  rooms[room_index].waitfirst = false;
  socket.join(socket.handshake.query.room_id);
  socket.emit('loggedin');
  roomSock.in(rooms[room_index].id).emit('clients', rooms[room_index].players)
}

roomSock.on('connection', function (socket) {
  console.log('Un client est connecté ! (room : ' + socket.handshake.query.room_id + ')');
  var room_index = rooms.findIndex(r => r.id === socket.handshake.query.room_id);
  if (room_index < 0) {
    socket.emit('goToIndex')
    return;
  }
  rooms[room_index].waitfirst = false;
  var room_info = clone(rooms[room_index]);
  room_info.password = null
  room_info.adminpass = null
  socket.emit('roomInfos', room_info);

  if (rooms[room_index].isProtected) {
    socket.emit('needPassword');
  }
  else {
    login(socket, room_index);
  }

  //login
  socket.on('login', password => {
    if (rooms[room_index].password === password) {
      login(socket, room_index);
    }
    else {
      socket.emit('badPassword');
    }
  })

  //admin login
  socket.on('loginAdmin', password => {
    if (rooms[room_index].adminpass === password) {
      player_index = rooms[room_index].players.findIndex(p => p.uid === socket.id);
      if (player_index >= 0) {
        rooms[room_index].players[player_index].isAdmin = true;
        socket.emit('loggedinAdmin');
        roomSock.in(rooms[room_index].id).emit('clients', rooms[room_index].players);
      }
    }
    else {
      socket.emit('badAdminPassword');
    }
  })

  socket.emit('buzzed', rooms[room_index].buzz === null ? null : rooms[room_index].players[rooms[room_index].buzz])

  //Déconnexion
  socket.on('disconnect', () => {
    let index = rooms[room_index].players.findIndex(p => p.uid === socket.id)
    if (index === rooms[room_index].buzz) {
      rooms[room_index].buzz = null;
      roomSock.in(rooms[room_index].id).emit('buzzed', null)
    }

    rooms[room_index].players.splice(index, 1);

    if (!rooms[room_index].players.length && !rooms[room_index].waitfirst) {
      console.log("La room " + rooms[room_index].id + "est vide !");
      rooms.splice(room_index, 1);
      listSocket.emit('rooms', clone(rooms).map(r => { r.password = null; r.adminpass = null; return r }))
      return
    }


    roomSock.in(rooms[room_index].id).emit('clients', rooms[room_index].players)
  });

  // Receive Name
  socket.on('setName', function (data) {
    let index = rooms[room_index].players.findIndex(r => r.uid === socket.id)
    rooms[room_index].players[index].name = data.name;
    roomSock.in(rooms[room_index].id).emit('clients', rooms[room_index].players);
    socket.emit('buzzed', rooms[room_index].buzz === null ? null : rooms[room_index].players[rooms[room_index].buzz])
  })

  //receive Buzz
  socket.on('buzz', uid => {
    let index = rooms[room_index].players.findIndex(r => r.uid === socket.id)
    if (index > -1) {
      rooms[room_index].players[index].buzz++;
      if (rooms[room_index].buzz === null) {
        rooms[room_index].buzz = index;
        rooms[room_index].players[index].successBuzz++;
        roomSock.in(rooms[room_index].id).emit('buzzed', rooms[room_index].players[rooms[room_index].buzz]);
      }
    }
    roomSock.in(rooms[room_index].id).emit('clients', rooms[room_index].players);
  })

  // Release
  socket.on('release', uid => {
    let index = rooms[room_index].players.findIndex(c => c.uid === socket.id && c.isAdmin)
    if (index > -1) {
      rooms[room_index].buzz = null;
      roomSock.in(rooms[room_index].id).emit('buzzed', rooms[room_index].buzz);
    }
  })
});
