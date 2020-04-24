var socket = io.connect(document.location.protocol + '//' + document.location.host + '/roomlist');

socket.on('rooms', (rooms) => {
  if (!rooms.length) {
    document.getElementById('roomlist').innerHTML = '<strong>Aucune partie en cours.<br>Créez-en une à l\'aide du bouton "+" en bas à droite</strong>'
    return
  }
  document.getElementById('roomlist').innerHTML = ''
  rooms.map(r => {
    document.getElementById('roomlist').innerHTML += `<a href="room.html?room_id=${r.id}">
      <span class="room-title">${r.title}</span>
      <span class="room-players">${r.players.length} joueur${r.players.length > 1 ? 's' : ''}</span>
      ${r.isProtected ? `<span class="room-protected" title="Cette partie est protégée par mot de passe">🔐</span>` : ''}
    </a>`
  })
})

socket.on('goToRoom', rid => {
  document.location.href = document.location.protocol + '//' + document.location.host + '/room.html?room_id=' + rid;
})

document.getElementById('create-room').onclick = () => {
  document.getElementById('create-room-overlay').classList.add('active');
}

document.getElementById('form-creation').onsubmit = (e) => {
  e.preventDefault()
  room = {
    title: document.getElementById('room-name').value,
    password: document.getElementById('room-password').value,
    adminpass: document.getElementById('room-adminpass').value
  }
  console.log('room', room);
  socket.emit('createRoom', room)
}