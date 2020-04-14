var uid = null;
var clients = [];
var noSleep = new NoSleep();

var socket = io.connect(document.location.protocol + '//' + document.location.host);
// Get UID
socket.on('uid', function (d) {
  uid = d;
  document.getElementById('yourId').innerHTML = 'id : ' + uid;
  document.getElementById('yourName').removeAttribute('disabled');
  document.getElementById('buzzer').removeAttribute('disabled');
  document.getElementById('yourName').focus();
})

//Save Name
document.getElementById('sendName').onclick = function () {
  socket.emit('setName', { uid: uid, name: document.getElementById('yourName').value });
  document.getElementById('yourName').value = '';
  noSleep.enable()
}

//Get Clients
socket.on('clients', datas => {
  clients = datas
  document.getElementById('userList').innerHTML = '';
  clients.map(c => {
    if (!c.isAdmin) {
      document.getElementById('userList').innerHTML += `<li data-uid="${c.uid}">${c.name}<span class="buuz-counter">${c.buzz}</span><span class="success-counter">${c.successBuzz}</span></li>`;
    }
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
    document.getElementById('result').innerHTML = `le gagnant est <big>${winner.name}</big><small>${winner.uid}</small>`;
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