var uid = null;
var roomInfos = {};
var clients = [];
var noSleep = new NoSleep();

var socket = io.connect(document.location.protocol + '//' + document.location.host + '/room', { query: document.location.search.slice(1) });

//Return to index
socket.on('goToIndex', () => {
  document.location.href = document.location.protocol + '//' + document.location.host + '/index.html'
})
// Get room infos
socket.on('roomInfos', function (d) {
  roomInfos = d
  document.title = roomInfos.title;
  document.getElementById('yourId').innerHTML = roomInfos.title;
})

//Show identification Dialog
socket.on('needPassword', () => {
  document.getElementById('password-overlay').classList.add('active');
  document.getElementById('bad-password').classList.add('hide')
})
//send password
document.getElementById('login').onclick = () => {
  socket.emit('login', document.getElementById('room-password').value);
}
//Bad password 
socket.on('badPassword', () => {
  document.getElementById('bad-password').classList.remove('hide')
})
//Good password
socket.on('loggedin', () => {
  document.getElementById('password-overlay').classList.remove('active');
  document.getElementById('yourName').removeAttribute('disabled');
  document.getElementById('buzzer').removeAttribute('disabled');
  document.getElementById('yourName').focus();
})

//Show admin identification Dialog
document.getElementById('logAdmin').onclick = () => {
  document.getElementById('admin-overlay').classList.add('active');
  document.getElementById('bad-password-admin').classList.add('hide')
}
//send password
document.getElementById('loginAdmin').onclick = () => {
  socket.emit('loginAdmin', document.getElementById('admin-password').value);
}
//Bad password 
socket.on('badAdminPassword', () => {
  document.getElementById('bad-password-admin').classList.remove('hide')
})
//Good password
socket.on('loggedinAdmin', () => {
  document.getElementById('admin-overlay').classList.remove('active');
  document.getElementById('release').removeAttribute('disabled')
})

//Save Name
document.getElementById('sendName').onclick = function () {
  socket.emit('setName', { uid: uid, name: document.getElementById('yourName').value });
  noSleep.enable()
}

//Get Clients
socket.on('clients', datas => {
  clients = datas
  if (clients.findIndex(c => c.isAdmin === true) < 0) {
    document.getElementById('noAdminError').classList.remove('hide');
  }
  else {
    document.getElementById('noAdminError').classList.add('hide');
  }

  document.getElementById('userList').innerHTML = '';
  clients.map(c => {
    document.getElementById('userList').innerHTML += `<li data-uid="${c.uid}">${c.isAdmin ? '<i title="Administrateur de la partie">💪 </i>' : ''}${c.name}${c.buzz !== c.successBuzz ? `<span class="buuz-counter">${c.buzz - c.successBuzz}</span>` : ''}<span class="success-counter">${c.successBuzz}</span></li>`;
  })
  if (clients.findIndex(c => c.uid === uid && c.isAdmin) > -1) {
    document.getElementById('release').removeAttribute('disabled')
    document.getElementById('raz').removeAttribute('disabled')
  }
})

//Buzzer !
document.getElementById('buzzer').onclick = () => {
  socket.emit('buzz', uid);
}

//Buzzed 
socket.on('buzzed', winner => {
  if (winner !== null) {
    document.getElementById('buzzer').setAttribute('disabled', true);
    document.getElementById('result').innerHTML = `le gagnant est <big>${winner.name}</big>`;
    if (winner.uid === uid) {
      document.getElementById('result').innerHTML += "<strong>Bravo champion ;)</strong>"
    }
    document.getElementById('sound1').play()
  }
  else {
    document.getElementById('buzzer').removeAttribute('disabled');
    document.getElementById('result').innerHTML = '';
  }
})

document.getElementById('release').onclick = () => {
  socket.emit('release', uid);
}
document.getElementById('raz').onclick = () => {
  socket.emit('raz', uid);
}


//PWA
// CODELAB: Register service worker.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((reg) => {
        console.log('Service worker registered.', reg);
      });
  });
}