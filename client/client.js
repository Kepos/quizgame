let enteredPlayerName = '';
let selectedCar = '';
let selectedTrack = '';
let cars = ['green', 'blue', 'yellow', 'red'];
let tracks = ['NBG', 'Raincastle', 'Monaco', 'Custom'];

const log = (text) => {};

const onChatSubmitted = (sock) => (e) => {
  e.preventDefault();
};

(() => {
  const sock = io();

  sock.on('message', (text) => {
    console.log(text);
    let response = 'Hello from client!';
    // sock.emit('message', response);
  });

  console.log('welcome');
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

  selectedCar = cars[index];

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
    selectedCar &&
    selectedTrack &&
    enteredPlayerName &&
    enteredPlayerName.length > 1
  ) {
    playButton.disabled = false;
  } else {
    playButton.disabled = true;
  }
}

function onPlayButtonClicked() {
  let gameSettings = document.getElementsByClassName(
    'game-settings-container'
  )[0];
  gameSettings.style.display = 'none';
}
