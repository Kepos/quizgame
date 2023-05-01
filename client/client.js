let enteredPlayerName = '';
let selectedCarIndex;
let selectedTrack = '';
let cars = ['green', 'blue', 'yellow', 'red'];
let tracks = ['NBG', 'Raincastle', 'Monaco', 'Custom'];

let isAdmin = false;

let uploadTrack;
let uploadNextStop;
let uploadDeath;

const onChatSubmitted = (sock) => (e) => {
  e.preventDefault();
};

const onPlayButtonClicked = (sock) => () => {
  let gameSettings = document.getElementsByClassName(
    'game-settings-container'
  )[0];
  gameSettings.style.display = 'none';

  // sock.emit('message', 'lets play!');
  sock.emit('signup', { name: enteredPlayerName, car: selectedCarIndex });

  startDrawing();
};

(() => {
  const sock = io();

  sock.on('message', (text) => {
    console.log(text);
    let response = 'Hello from client!';
    // sock.emit('message', response);
  });

  sock.on('admin', () => {
    console.log('You are the admin!');
    isAdmin = true;
    document.getElementById('select-racetrack').style.display = 'inline';
  });

  sock.on('playerindex', (index) => {
    currentPlayer = index;
  });

  sock.on('newPlayer', (player) => {
    popup(`New Player: ${player.name}`);
    players[player.index] = player;
    addPlayersPanelTag(player.index);
  });

  sock.on('playerLeft', (index) => {
    playersState[index] = 0;
  });

  sock.on('track', (info) => {
    console.log('Track received!');

    const { track, players } = info;

    rightTrackPoints = track.rightTrackPoints;
    leftTrackPoints = track.leftTrackPoints;
    firstDrawingRightPos = rightTrackPoints[0];
    firstDrawingLeftPos = leftTrackPoints[0];

    NUM_PLAYERS = players.length;
    playersState = players;

    initRace();
  });

  sock.on('playersMoves', (playersMoves) => {
    for (let i = 0; i < NUM_PLAYERS; i++) {
      racecarsStopsArray[i].push(playersMoves[i]);
    }
    drive();
  });

  console.log('welcome');

  document
    .getElementsByClassName('play-button')[0]
    .addEventListener('click', onPlayButtonClicked(sock));

  uploadTrack = (track) => {
    sock.emit('track', track);
  };

  uploadNextStop = (nextStop) => {
    sock.emit('nextStop', nextStop);
  };

  uploadDeath = () => {
    sock.emit('death');
  };
})();

function onNameChanged() {
  let playerName = document.getElementsByClassName('name-input')[0];
  enteredPlayerName = playerName.value;

  checkForCompleteData();
}

function onSelectRacecar(index) {
  console.log('racecar selected!');

  let cards = document.getElementsByClassName('racecar-card');

  for (let i = 0; i < cards.length; i++) {
    cards[i].style.border = '3px solid transparent';
    // cards[i].style.transform = 'translateY(0px)';
  }
  cards[index].style.border = '3px solid green';
  // cards[index].style.transform = 'translateY(-10px)';

  selectedCarIndex = index;

  checkForCompleteData();
}

function onSelectTrack(index) {
  console.log('track selected!');

  let cards = document.getElementsByClassName('track-card');

  for (let i = 0; i < cards.length; i++) {
    cards[i].style.border = '3px solid transparent';
    // cards[i].style.transform = 'translateY(0px)';
  }
  cards[index].style.border = '3px solid green';
  // cards[index].style.transform = 'translateY(-10px)';

  selectedTrack = tracks[index];
  checkForCompleteData();
}

function checkForCompleteData() {
  let playButton = document.getElementsByClassName('play-button')[0];

  if (
    (isAdmin &&
      typeof selectedCarIndex !== 'undefined' &&
      selectedTrack &&
      enteredPlayerName &&
      enteredPlayerName.length > 1) ||
    (!isAdmin &&
      typeof selectedCarIndex !== 'undefined' &&
      enteredPlayerName &&
      enteredPlayerName.length > 1)
  ) {
    playButton.disabled = false;
  } else {
    playButton.disabled = true;
  }
}
