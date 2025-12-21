let isAdmin = true;

let currentGame = 'games-panel';
let currentGameState = 0;
const games = [
  'game-quiz-question-1', // case 1
  'game-quiz-question-2', // case 1
  'game-quiz-question-3', // case 1
  'game-quiz-question-4', // case 1
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

let game_payload;

let quizData;

async function loadQuizData() {
  const response = await fetch('../questions/questions.json');
  const data = await response.json();

  quizData = data.gameQuestions;
}
loadQuizData();

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
    document.getElementById('buzzer-namelabel').innerHTML = name + ' buzzered!';
    document.getElementById('buzzer').classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('buzzer').classList.add('hidden');
    }, 3000);
  });

  sock.on('new-game', (newGame) => {
    currentGame = newGame;
    gameSelectionAnimation();
  });

  sock.on('new-score', (teamNo, score) => {
    animateCounter('score-' + teamNo, score, 2000); // id, Zielwert, Dauer in ms
  });

  sock.on('back-to-panel', () => {
    currentGame = 'games-panel';
    currentGameState = 0;
    changeView(true); // id, Zielwert, Dauer in ms
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

  sock.on('next', (payload) => {
    game_payload = payload;
    changeView();
  });

  sock.on('sort-selection', (elem) => {
    setSortingGame(elem);
  });
})();

function onNameChanged() {
  let playerName = document.getElementsByClassName('name-input')[0];
  enteredPlayerName = playerName.value;

  checkForCompleteData();
}

let sortedOptions = [];
function setSortingGame(newSortedWord = false) {
  // -1 because gamestate gets incremented directly in setCurrentGameView()
  if (currentGameState - 1 >= quizData['game-einsortieren'].lists.length)
    return;
  if (newSortedWord) {
    sortedOptions.push(newSortedWord);
  }
  let options = document.getElementById('game-einsortieren-options');
  let list = document.getElementById('game-einsortieren-sorted-list');

  options.innerHTML = '';
  list.innerHTML = '';

  let optionsArray = quizData['game-einsortieren'].lists[currentGameState - 1];
  let startWord = optionsArray[0];
  if (!sortedOptions.includes(startWord)) sortedOptions.push(startWord);

  optionsArray.forEach((text) => {
    if (text == startWord || sortedOptions.includes(text)) return;
    const div = document.createElement('div');
    div.className = 'px-5 py-1 text-3xl text-black bg-gray-200 rounded ';
    div.textContent = text;

    options.appendChild(div);
  });

  let sortingNum = 1;
  const span = document.createElement('span');
  span.textContent = sortingNum;
  list.appendChild(span);

  optionsArray.forEach((text, index) => {
    if (index == 0 || !sortedOptions.includes(text)) {
      return;
    }

    const div = document.createElement('div');
    div.className = 'px-5 py-1 text-3xl text-black bg-yellow-300 rounded';
    div.textContent = text;

    sortingNum++;
    const span2 = document.createElement('span');
    span2.textContent = sortingNum;

    list.appendChild(div);
    list.appendChild(span2);
  });
  //   <span>1</span>
  // <div
  //     class="px-5 py-1 text-3xl text-black bg-yellow-300 rounded"
  // >
  //     Hallo Test
  // </div>
  // <span>2</span>
  // <div
  //     class="px-5 py-1 text-3xl text-black bg-yellow-300 rounded"
  // >
  //     Hallo Test
  // </div>
  // <span>3</span>
  //
}

function setCurrentGameView() {
  console.log('setCurrentGameView!', currentGame);
  switch (currentGame) {
    // Game No. 1
    case 'game-quiz-question-1':
    case 'game-quiz-question-2':
    case 'game-quiz-question-3':
    case 'game-quiz-question-4':
      switch (currentGameState) {
        case 0:
          // Show Quiz Card Options
          document
            .getElementById('game-quiz-question-options')
            .classList.remove('hidden');
          document
            .getElementById('game-quiz-question-question')
            .classList.add('hidden');
          currentGameState++;
          break;
        case 1:
          // Show Quiz Question
          document
            .getElementById('game-quiz-question-options')
            .classList.add('hidden');
          const img = document.querySelector(
            `#game-quiz-question-options img:nth-child(${game_payload})`
          );
          img.classList.add('opacity-25');
          img.classList.remove('opacity-100');
          let question = document.getElementById('game-quiz-question-question');
          question.textContent =
            quizData[`game-quiz-question-1`].questions[
              game_payload - 1
            ].question;
          question.classList.remove('hidden');

          currentGameState--;
          break;
      }
      break;

    // Game No 5
    case 'game-umfragewerte':
      switch (currentGameState) {
        case 0:
          // SHow Question
          let elem = document.getElementById('game-multiple-choice-question');
          elem.textContent = quizData[currentGame].questions[0].question;
          elem.classList.remove('hidden');
          document
            .getElementById('game-multiple-choice-chart')
            .classList.add('hidden');
          document
            .getElementById('game-multiple-choice-answers')
            .classList.add('hidden');
          currentGameState++;
          updateChart(0, 0);
          break;
        case 1:
          // Show Answers Chart
          document
            .getElementById('game-multiple-choice-chart')
            .classList.remove('hidden');
          document
            .getElementById('game-multiple-choice-question')
            .classList.add('hidden');
          setTimeout(() => {
            updateChart(game_payload?.yes, game_payload?.no);
          }, 1000);
          currentGameState = 0;
          break;
      }
      break;

    // Game No 6
    case 'game-einsortieren':
      switch (currentGameState) {
        default:
          // Show the first list
          sortedOptions = [];
          document
            .getElementById('game-einsortieren-game')
            .classList.remove('hidden');
          currentGameState++;
          setSortingGame();
          break;
      }
      break;

    // Game no 7
    case 'game-pantomime':
      switch (currentGameState) {
        case 0:
          startTimer(60);
          break;
      }
      break;

    // Game no 8
    case 'game-kategorie':
      switch (currentGameState) {
        case 0:
          startTimer(60);
          break;
      }
      break;

    // Game no 9
    case 'game-mapfinder':
      switch (currentGameState % 5) {
        case 0:
          // Show Question / Map
          document.getElementById('map').classList.add('hidden');
          const questionField = document.getElementById(
            'game-mapfinder-question'
          );
          questionField.classList.remove('hidden');
          const question =
            quizData['game-mapfinder']?.questions?.[currentGameState / 5]
              .question;
          if (question) {
            questionField.innerHTML = question;
          }
          currentGameState++;
          break;
        case 1:
          // Show Markers
          document
            .getElementById('game-mapfinder-question')
            .classList.add('hidden');
          document.getElementById('map').classList.remove('hidden');

          game_payload.forEach((marker) => {
            const teamColors = ['#ce5bd3', '#5bd35b', '#c33838', '#d3cd5b'];
            const teamHues = [
              'hue-rotate-15',
              'hue-rotate-90',
              'hue-rotate-180',
              'hue-rotate-270',
            ];

            const markerHtmlStyles = `
                background-color: ${teamColors[marker.team]};
                width: 3rem;
                height: 3rem;
                display: block;
                left: -1.5rem;
                top: -1.5rem;
                position: relative;
                border-radius: 3rem 3rem 0;
                transform: rotate(45deg);
                border: 1px solid #FFFFFF`;

            const icon = L.divIcon({
              className: 'my-custom-pin',
              iconAnchor: [0, 24],
              labelAnchor: [-6, 0],
              popupAnchor: [0, -36],
              html: `<span style="${markerHtmlStyles}" />`,
            });

            // let newMarker = L.marker(marker.latlng, {
            //   icon: icon,
            // }).bindTooltip(marker.name, {
            //   permanent: true,
            //   direction: 'right',
            // });

            let newMarker = L.marker(marker.latlng).bindTooltip(marker.name, {
              permanent: true,
              direction: 'right',
            });
            markers.addLayer(newMarker);

            L.DomUtil.addClass(newMarker._icon, teamHues[marker.team]);
          });

          //   setTimeout(() => {
          //     markers.clearLayers();
          //   }, 5000)

          currentGameState++;
          break;
        case 2:
          // Show Correct Marker
          currentGameState++;
          break;
        case 3:
          // Show Leaderboard
          currentGameState++;
          break;
        case 4:
          // Show Team Average
          currentGameState++;
          break;
      }
      break;

    // Game no 10
    case 'game-whoisthis':
      switch (currentGameState) {
        case 0:
          document
            .getElementById('game-whoisthis-game')
            .classList.remove('hidden');
        // Show next picture
        default:
          let arr = quizData[currentGame].questions;
          if (arr.length > currentGameState) {
            document.getElementById('game-whoisthis-img').src =
              './assets/' +
              quizData[currentGame].questions[currentGameState].image +
              '.png';
            currentGameState++;
          }
          break;
      }
      break;

    // Game no 11
    case 'game-songs':
      switch (currentGameState) {
        case 0:
          break;
      }
      break;

    // Game no 12
    case 'game-teamguessing':
      switch (currentGameState % 5) {
        case 0:
          // Show Question
          let question =
            quizData['game-teamguessing'].questions[currentGameState / 5]
              ?.question;

          let questionField = document.getElementById(
            'game-teamguessing-question'
          );
          if (question) {
            questionField.innerHTML = question;
          }

          document
            .querySelectorAll('.game-teamguessing-answers-table')
            .forEach((elem) => elem.classList.add('opacity-0'));
          questionField.classList.remove('opacity-0');
          currentGameState++;
          break;
        case 1:
          // Show Answers
          document
            .querySelectorAll('.game-teamguessing-answers-table')
            .forEach((elem) => elem.classList.remove('opacity-0'));
          currentGameState++;
          break;
        case 2:
          // Show Correct Result
          currentGameState++;
          break;
        case 3:
          // Show Averages
          currentGameState++;
          break;
        case 4:
          // Show Winner
          currentGameState++;
          break;
      }
      break;

    // Game no 13
    case 'game-multiple-choice':
      switch (currentGameState) {
        case 0:
          // Show Question
          document
            .getElementById('game-multiple-choice-question')
            .classList.remove('hidden');
          document
            .getElementById('game-multiple-choice-answers')
            .classList.add('hidden');
          document
            .querySelectorAll('.game-multiple-choice-votes')
            .forEach((elem) => elem.classList.add('hidden'));
          currentGameState++;
          break;
        case 1:
          // Show Answers
          document
            .getElementById('game-multiple-choice-answers')
            .classList.remove('hidden');
          currentGameState++;
          break;
        case 2:
          // Show Votes
          document
            .querySelectorAll('.game-multiple-choice-votes')
            .forEach((elem) => elem.classList.remove('hidden'));
          currentGameState++;
          break;
        case 3:
          // Show Correct Answer
          document
            .querySelector('#game-multiple-choice-answers > div')
            .classList.add('text-green-400');
          currentGameState = 0;
          break;
          break;
      }
      break;

    // Game no 14
    case 'game-creative-writing':
      switch (currentGameState) {
        case 0:
          document
            .getElementById('game-creative-writing-prompt')
            .classList.remove('hidden');
          document
            .getElementById('game-creative-writing-game')
            .classList.add('hidden');
          currentGameState++;
          break;
        case 1:
          document
            .getElementById('game-creative-writing-prompt')
            .classList.add('hidden');
          document
            .getElementById('game-creative-writing-game')
            .classList.remove('hidden');
          currentGameState++;
          break;
        case 2:
          // Show Votes
          currentGameState = 0;
          break;
      }
      break;

    // Game no 15
    case 'game-blamieren-kassieren':
      switch (currentGameState) {
        case 0:
          break;
      }
      break;

    // Game no 16
    case 'game-mitspieler':
      switch (currentGameState) {
        case 0:
          document
            .getElementById('game-teamguessing-question')
            .classList.remove('opacity-0');
          currentGameState++;
          break;
        case 1:
          document
            .querySelectorAll('.game-teamguessing-answers-table')
            .forEach((elem) => elem.classList.remove('opacity-0'));
          currentGameState++;
          break;
      }
      break;

    // BIG DEFAULT
    default:
      break;
  }
}
