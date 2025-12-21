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

document.querySelectorAll('img[data-game]').forEach((img) => {
  img.title = img.dataset.game;
});

let quizData;

async function loadQuizData() {
  const response = await fetch('../questions/questions.json');
  const data = await response.json();

  quizData = data.gameQuestions;
}
loadQuizData();

// Key Press Events
document.addEventListener('keydown', function (event) {
  switch (event.key) {
    case '1':
    case '2':
    case '3':
    case '4':
      incrementScore(`team-points-input-${event.key}`, 1);
      break;
  }
});

// unused
const onChatSubmitted = (sock) => (e) => {
  e.preventDefault();
};

const onPlayButtonClicked = (sock) => () => {
  // sock.emit('message', 'lets play!');
  sock.emit('signup', { name: enteredPlayerName, car: selectedCarIndex });
};

function onGameCardClicked(emitter) {
  let newGame = emitter.getAttribute('data-game');
  emitter.classList.add('opacity-50');
  sock.emit('new-game', newGame, (response) => {
    if (response.status == 'ok') {
      currentGame = newGame;
      setCurrentGameView();
      changeView();
    }
  });
}

function onNextButtonClicked(payload) {
  sock.emit('next', payload, (response) => {
    if (response.status == 'ok') {
      setCurrentGameView();
      let nextButton = document.getElementById('nextButton');
      nextButton.textContent = response.nextUp;
      // prevent accidental double click
      nextButton.disabled = true;
      nextButton.classList.add('opacity-50');
      setTimeout(() => {
        nextButton.disabled = false;
        nextButton.classList.remove('opacity-50');
      }, 700);
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
      changeView();
    }
  });
}

let sentOptions = [];

function onSelectionSendButtonClicked() {
  let select = document.getElementById('sort-element-selection');
  sock.emit('sort-selection', select.value, (response) => {
    if (response.status == 'ok') {
      sentOptions.push(select.value);
      setSelectionOptions();
    }
  });
}

function setSelectionOptions() {
  if (currentGameState - 2 >= quizData['game-einsortieren'].lists.length)
    return;
  let select = document.getElementById('sort-element-selection');
  select.innerHTML = '';
  let optionsArray = quizData['game-einsortieren'].lists[currentGameState - 2];
  let startWord = optionsArray[0];
  let sortIndex = 1;
  optionsArray.forEach((text, index) => {
    if (text == startWord) {
      if (index == 0) {
        return;
      }
      if (!sentOptions.includes(text)) {
        sentOptions.push(text);
      }
    }
    const opt = document.createElement('option');
    opt.value = text;
    if (sentOptions.includes(text)) {
      opt.disabled = true;
      sortIndex++;
      opt.textContent = text;
    } else {
      opt.textContent = sortIndex + ' ' + text;
    }

    select.appendChild(opt);
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
    document.getElementById('buzzer-namelabel').innerHTML =
      name + '<br/>buzzered!';
    document.getElementById('buzzer').classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('buzzer').classList.add('hidden');
    }, 3000);
  });

  sock.on('Login', (allTeams) => {
    console.log(allTeams);
    const table = document.getElementById('player-table');
    table.innerHTML = '';

    allTeams.forEach((team, teamindex) => {
      Object.values(team.members).forEach((member) => {
        const tr = document.createElement('tr');
        tr.className = `bg-[${team.color}]`;
        [
          '#' + member.id.slice(0, 3),
          member.name,
          member.ping,
          member.answer !== '' ? '✅' : '',
        ].forEach((item, index) => {
          const td = document.createElement('td');
          td.className = `px-4 py-2 text-left text-black`;
          td.textContent = item;

          if (index == 0) {
            td.classList.add('text-gray-700');
            td.classList.remove('text-black');
            td.onclick = () => {
              sock.emit('player-delete', teamindex, member.id, (response) => {
                if (response.status === 'ok') {
                  tr.remove();
                }
              });
            };
            td.classList.add('cursor-pointer');
          } else if (index == 3) {
            td.onclick = () => {
              sock.emit(
                'player-answer-delete',
                teamindex,
                member.id,
                (response) => {
                  if (response.status === 'ok') {
                    td.textContent = '';
                  }
                }
              );
            };
            td.classList.add('cursor-pointer');
          }

          tr.appendChild(td);
        });

        table.appendChild(tr);
      });
    });
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

  nextButton.onclick = onNextButtonClicked;

  if (currentGameState == 0) {
    gameNameLabel.textContent = currentGame;
  }

  switch (currentGame) {
    // Game No. 1
    case 'game-quiz-question-1':
    case 'game-quiz-question-2':
    case 'game-quiz-question-3':
    case 'game-quiz-question-4':
      switch (currentGameState) {
        case 0:
          nextButton.textContent = 'Show Question Cards';
          nextButton.onclick = () => {
            let selectedQuestion =
              document.getElementById('question-selection').value;
            console.log(selectedQuestion);
            onNextButtonClicked(parseInt(selectedQuestion));
          };
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
          currentGameState++;
          break;
        default:
          currentGameState++;
          setSelectionOptions();
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
          nextButton.textContent = 'Show First Picture';
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
