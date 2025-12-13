let isAdmin = false;
let playerName = '';

let uploadNextTrackPoint;

// unused
const onChatSubmitted = (sock) => (e) => {
  e.preventDefault();
};

const onBuzzerClicked = (sock) => () => {
  // sock.emit('message', 'lets play!');
  let name = 'Titus'; // document.getElementById('nameinput').value;
  sock.emit('Buzzer', name);
};

const onLoginButtonClicked = (sock) => () => {
  // sock.emit('message', 'lets play!');
  let name = document.getElementById('player-name-input').value.trim();
  let team = document.getElementById('team-selection').value;
  if (name.length < 2) {
    alert('Bitte Namen eingeben');
    return;
  }
  console.log({ name: name, team: team });
  sock.emit('Login', { name: name, team: team }, (response) => {
    if (response.status == 'ok') {
      // changeView(0);
    }
  });
};

(() => {
  const sock = io();

  document
    .getElementsByClassName('play-button')[0]
    .addEventListener('click', onBuzzerClicked(sock));
  document
    .getElementById('login-button')
    .addEventListener('click', onLoginButtonClicked(sock));

  sock.on('message', (text) => {});

  sock.on('admin', () => {
    console.log('You are the admin!');
    isAdmin = true;
    document.getElementById('select-racetrack').style.display = 'inline';
  });

  sock.on('restart', () => {
    location.reload();
  });

  console.log('welcome');

  uploadNextTrackPoint = (mousePos) => {
    sock.emit('nextTrackPoint', mousePos);
  };

  restartGame = () => {
    let rp = document.getElementById('restart-panel');
    rp.style.display = 'flex';
    sock.emit('restart');
  };
})();

function onNameChanged() {
  let playerName = document.getElementsByClassName('name-input')[0];
  enteredPlayerName = playerName.value;

  checkForCompleteData();
}
