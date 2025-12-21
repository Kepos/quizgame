let sock;

let isAdmin = false;
let playerName = '';

let uploadNextTrackPoint;

let currentGame = 'login-screen';
let currentGameState = 0;

// unused
const onChatSubmitted = (sock) => (e) => {
  e.preventDefault();
};

function onBuzzerClicked() {
  // sock.emit('message', 'lets play!');
  let name = 'Titus'; // document.getElementById('nameinput').value;
  sock.emit('Buzzer', name);
}

function onLoginButtonClicked() {
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
      currentGame = response.game;
      currentGameState = response.gamestate;
      changeView();
    }
  });
}

function onAnswerButtonClicked(payload = null) {
  switch (currentGame) {
    case 'game-creative-writing':
      switch (currentGameState) {
        case 1:
          if (payload && payload.length < 1) {
            alert('Please enter your answer');
            return;
          }
          break;
        case 2:
          const selected = document.querySelector('input[name="word"]:checked');
          if (!selected) {
            alert('Please select an answer');
            return;
          }
          payload = selected.nextElementSibling.textContent;
      }
      break;
    case 'game-mapfinder':
      if (!markerLocation) {
        alert('Please select a location');
        return;
      }
      payload = markerLocation;
  }

  sock.emit(
    'player-answer',
    payload,
    currentGame,
    currentGameState,
    (response) => {
      // maybe disable, neue Antwort schicken können möglich?
      if (response.status == 'ok') {
        currentGame = 'waiting-screen';
        currentGameState = 0;
        changeView();
      }
    }
  );
}

(() => {
  sock = io();

  // document
  //   .getElementsByClassName('play-button')[0]
  //   .addEventListener('click', onBuzzerClicked(sock));
  // document
  //   .getElementById('login-button')
  //   .addEventListener('click', onLoginButtonClicked(sock));

  sock.on('message', (text) => {});

  sock.on('admin', () => {
    console.log('You are the admin!');
    isAdmin = true;
    document.getElementById('select-racetrack').style.display = 'inline';
  });

  sock.on('new-game', (newGame) => {
    if (currentGame == 'login-screen') return;
    currentGame = newGame;
    currentGameState = 0;
    changeView();
  });

  sock.on('back-to-panel', () => {
    if (currentGame == 'login-screen') return;
    currentGame = 'games-panel';
    currentGameState = 0;
    changeView();
  });

  sock.on('player-game-state', (game, gamestate) => {
    if (currentGame == 'login-screen') return;
    currentGame = game;
    currentGameState = gamestate;
    changeView();
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
