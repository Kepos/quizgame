let isAdmin = true;

let currentGame = 'games-panel';
let currentGameState = 0;
const games = [
  'game-quiz-question', // case 1
  'game-quiz-question', // case 1
  'game-quiz-question', // case 1
  'game-quiz-question', // case 1
  'game-umfragewerte', // case 5
  'game-einsortieren', // case 6
  'game-pantomime', // case 7
  'game-kategorie', // case 8
  'game-mapfinder', // case 9
  'game-whoisthis', // case 10
  'game-songs', // case 11
  'game-teamguessing', // case 12
  'game-multiple-choice', // case 13
  'game-creative-writing', // case 14
  'game-blamieren-kassieren', // case 15
  'game-mitspieler', // case 16
];

// unused
const onChatSubmitted = (sock) => (e) => {
  e.preventDefault();
};

const onPlayButtonClicked = (sock) => () => {
  // sock.emit('message', 'lets play!');
  sock.emit('signup', { name: enteredPlayerName, car: selectedCarIndex });
};

(() => {
  const sock = io();

  sock.on('message', (text) => {});

  sock.on('admin', () => {
    console.log('You are the admin!');
    isAdmin = true;
    document.getElementById('select-racetrack').style.display = 'inline';
  });

  sock.on('Buzzer', (name) => {
    document.getElementById('namelabel').innerHTML = name + ' buzzered!';
  });

  sock.on('new-game', (number) => {
    gameSelectionAnimation(number);
  });

  sock.on('new-score', (teamNo, score) => {
    animateCounter('score-' + teamNo, score, 2000); // id, Zielwert, Dauer in ms
  });

  sock.on('back-to-panel', () => {
    changeView(0); // id, Zielwert, Dauer in ms
  });

  sock.on('restart', () => {
    location.reload();
  });

  console.log('welcome');

  //   document
  //     .getElementsByClassName('play-button')[0]
  //     .addEventListener('click', onPlayButtonClicked(sock));

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
