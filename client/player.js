let isAdmin = false;

let uploadNextTrackPoint;

// unused
const onChatSubmitted = (sock) => (e) => {
  e.preventDefault();
};

const onBuzzerClicked = (sock) => () => {
  // sock.emit('message', 'lets play!');
  let name = document.getElementById('nameinput').value;
  sock.emit('Buzzer', name);
};

(() => {
  const sock = io();

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

  document
    .getElementsByClassName('play-button')[0]
    .addEventListener('click', onBuzzerClicked(sock));

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
