let sock;

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

function onGameCardClicked(number) {
  sock.emit('new-game', number, (response) => {
    if (response.status == 'ok') {
      currentGame = games[number - 1];
      setCurrentGameView();
      changeView(number);
    }
  });
}

function onNextButtonClicked(index = 0) {
  sock.emit('next', index, (response) => {
    if (response.status == 'ok') {
      document.getElementById('nextButton').textContent = response.nextUp;
      setCurrentGameView();
    }
  });
}

function onScoreSendButtonClicked(teamNo) {
  let score = document.getElementById(`team-score-input-${teamNo}`).value;
  sock.emit('new-score', teamNo, score);
}

function onBackToPanelButtonClicked() {
  sock.emit('back-to-panel', (response) => {
    if (response.status == 'ok') {
      currentGame = 'games-panel';
      currentGameState = 0;
      changeView(0);
    }
  });
}

(() => {
  sock = io();

  sock.on('message', (text) => {});

  sock.on('admin', () => {
    console.log('You are the admin!');
    isAdmin = true;
    document.getElementById('select-racetrack').style.display = 'inline';
  });

  sock.on('Buzzer', (name) => {
    document.getElementById('namelabel').innerHTML = name + ' buzzered!';
  });

  sock.on('restart', () => {
    location.reload();
  });

  console.log('welcome');

  // document
  //   .getElementsByClassName('play-button')[0]
  //   .addEventListener('click', onPlayButtonClicked(sock));

  document.getElementsByClassName('');

  restartGame = () => {
    let rp = document.getElementById('restart-panel');
    rp.style.display = 'flex';
    sock.emit('restart');
  };
})();

function setCurrentGameView() {
  let nextButton = document.getElementById('nextButton');
  let gameNameLabel = document.getElementById('game-name-label');

  if (currentGameState == 0) {
    gameNameLabel.textContent = currentGame;
  }

  switch (currentGame) {
    // Game No. 1
    case 'game-quiz-question':
      switch (currentGameState) {
        case 0:
          nextButton.textContent = 'Show Question Cards';
          break;
      }
      break;

    // Game No 5
    case 'game-umfragewerte':
      switch (currentGameState) {
        case 0:
          nextButton.textContent = 'Show First Question';
          break;
      }
      break;

    // Game No 6
    case 'game-einsortieren':
      switch (currentGameState) {
        case 0:
          nextButton.textContent = 'Show First List';
          break;
      }
      break;

    // Game no 7
    case 'game-pantomime':
      switch (currentGameState) {
        case 0:
          nextButton.textContent = 'Start Timer';
          break;
      }
      break;

    // Game no 8
    case 'game-kategorie':
      switch (currentGameState) {
        case 0:
          nextButton.textContent = 'Start Timer';
          break;
      }
      break;

    // Game no 9
    case 'game-mapfinder':
      switch (currentGameState) {
        case 0:
          nextButton.textContent = 'Show First Question';
          break;
      }
      break;

    // Game no 10
    case 'game-whoisthis':
      switch (currentGameState) {
        case 0:
          nextButton.textContent = 'Show Question Cards';
          break;
      }
      break;

    // Game no 11
    case 'game-songs':
      switch (currentGameState) {
        case 0:
          nextButton.textContent = '### Nothing happens';
          break;
      }
      break;

    // Game no 12
    case 'game-teamguessing':
      switch (currentGameState) {
        case 0:
          nextButton.textContent = 'Show First Question';
          break;
      }
      break;

    // Game no 13
    case 'game-multiple-choice':
      switch (currentGameState) {
        case 0:
          nextButton.textContent = 'Show First Question';
          break;
      }
      break;

    // Game no 14
    case 'game-creative-writing':
      switch (currentGameState) {
        case 0:
          nextButton.textContent = 'Show First Prompt';
          break;
      }
      break;

    // Game no 15
    case 'game-blamieren-kassieren':
      switch (currentGameState) {
        case 0:
          nextButton.textContent = 'Do Nothing # # # #';
          break;
      }
      break;

    // Game no 16
    case 'game-mitspieler':
      switch (currentGameState) {
        case 0:
          nextButton.textContent = 'Show First Question';
          break;
      }
      break;

    // BIG DEFAULT
    default:
      break;
  }
}

function onNameChanged() {
  let playerName = document.getElementsByClassName('name-input')[0];
  enteredPlayerName = playerName.value;

  checkForCompleteData();
}
