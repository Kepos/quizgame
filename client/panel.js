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

const teamColors = [
  'bg-[#ce5bd3]',
  'bg-[#5bd35b]',
  'bg-[#c33838]',
  'bg-[#d3cd5b]',
];

const teamTextColors = [
  'text-[#ce5bd3]',
  'text-[#5bd35b]',
  'text-[#c33838]',
  'text-[#d3cd5b]',
];

let game_payload;

let quizData;

let gameHasStarted = false;

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

  sock.on('start-quiz', () => {
    if (!gameHasStarted) {
      startIntro();
    }
    gameHasStarted = true;
  });

  sock.on('end-screen', () => {
    toggleEndScreen();
  });

  sock.on('Buzzer', (member) => {
    document.getElementById('buzzer-namelabel').innerHTML =
      member.name + '<br/>buzzered!';
    let buzzer = document.getElementById('buzzer');
    document.getElementById('buzzer-star').src = `./assets/buzzer-star-${
      member.team + 1
    }.png`;

    buzzer.classList.remove('hidden');

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

  sock.on('eval', (payload) => {
    // animateCounter('score-' + teamNo, score, 2000); // id, Zielwert, Dauer in ms
    console.log('eval!');
    currentGameState = 'eval';
    game_payload = payload;
    changeView();
    // switch (currentGame) {
    //   case 'game-mapfinder': {
    //     switch (currentGameState) {
    //       case 'eval': {
    //         currentGameState = 'eval-1';
    //         break;
    //       }
    //       case 'eval-1': {
    //         currentGameState = 'eval-2';
    //         break;
    //       }
    //       default: {
    //         currentGame = 'eval';
    //         break;
    //       }
    //     }
    //     // do next...
    //   }
    //   default:
    //     currentGameState = 'eval';
    //     break;
    // }
  });

  sock.on('back-to-panel', () => {
    currentGame = 'games-panel';
    currentGameState = 0;
    if (timerInterval) clearInterval(timerInterval);
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

  document.getElementById('game-einsortieren-ind-up').innerHTML =
    quizData['game-einsortieren'].indicators[currentGameState - 1][0];
  document.getElementById('game-einsortieren-ind-down').innerHTML =
    quizData['game-einsortieren'].indicators[currentGameState - 1][1];

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

function showLeaderboard() {
  document
    .querySelectorAll('#game-container > div')
    .forEach((el) => el.classList.add('hidden'));
  document.getElementById('leaderboard').classList.remove('hidden');

  // <tr class="odd:bg-transparent even:bg-transparent">
  //     <td class="px-4 py-2 break-words">Name 1</td>
  //     <td class="px-4 py-2 text-center">0</td>
  //     <td class="px-4 py-2 text-center">Team Aejreklrwerjewklr</td>
  // </tr>

  const table = document.getElementById('leaderboard-table');
  table.innerHTML = '';

  Array.isArray(game_payload) &&
    game_payload.forEach((row) => {
      const tr = document.createElement('tr');
      tr.className = `${teamColors[row.team]}`;
      for (const [key, value] of Object.entries(row)) {
        console.log(key);
        if (key === 'team') continue;
        const td = document.createElement('td');
        td.className = `px-4 py-2 text-left text-black`;
        td.textContent = value;
        tr.appendChild(td);
      }
      //   [
      //     row.name,
      //     (Math.round(row.answer * 100) / 100).toFixed(2) + ' km',
      //   ].forEach((item, index) => {
      //     const td = document.createElement('td');
      //     td.className = `px-4 py-2 text-left text-black`;
      //     td.textContent = item;
      //     tr.appendChild(td);
      //   });

      table.appendChild(tr);
    });
}

function shuffleChildren(parent) {
  const children = Array.from(parent.children);

  // Fisher–Yates Shuffle
  for (let i = children.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [children[i], children[j]] = [children[j], children[i]];
  }

  // Neu anhängen (verschiebt die Elemente im DOM)
  children.forEach((child) => parent.appendChild(child));
}

function setCurrentGameView() {
  console.log('setCurrentGameView!', currentGame);

  if (currentGameState === 'eval') {
    document
      .querySelectorAll('#game-container > div')
      .forEach((el) => el.classList.add('hidden'));
    document.getElementById('points-panel').classList.remove('hidden');

    let els = document.getElementsByClassName('team-points-label');

    Array.prototype.forEach.call(els, function (el) {
      // Do stuff here
      el.innerHTML = 0;
    });

    setTimeout(() => {
      Array.isArray(game_payload) &&
        game_payload.forEach((teampoints, index) => {
          animateCounter(
            `team-points-label-${index + 1}`,
            teampoints,
            teampoints > 15 ? teampoints * 250 : teampoints * 500
          );
        });
    }, 1000);
    return;
  }

  switch (currentGame) {
    // Game No. 1
    case 'game-quiz-question-1':
    case 'game-quiz-question-2':
    case 'game-quiz-question-3':
    case 'game-quiz-question-4': {
      switch (currentGameState) {
        case 0: {
          // Show Quiz Card Options
          document
            .getElementById('game-quiz-question-options')
            .classList.remove('hidden');
          document
            .getElementById('game-quiz-question-question')
            .classList.add('hidden');
          currentGameState++;
          break;
        }
        case 1: {
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
      }
      break;
    }
    // Game No 5
    case 'game-umfragewerte': {
      switch (currentGameState % 2) {
        case 0: {
          // SHow Question
          let elem = document.getElementById('game-multiple-choice-question');
          let question =
            quizData[currentGame].questions[Math.floor(currentGameState / 2)]
              ?.question;
          if (question) {
            elem.textContent = question;
          }
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
        }
        case 1: {
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
          currentGameState++;
          break;
        }
      }
      break;
    }
    // Game No 6
    case 'game-einsortieren': {
      switch (currentGameState) {
        default: {
          // Show the first list
          sortedOptions = [];
          document
            .getElementById('game-einsortieren-game')
            .classList.remove('hidden');
          currentGameState++;
          setSortingGame();
          break;
        }
      }
      break;
    }
    // Game no 7
    case 'game-pantomime': {
      switch (currentGameState) {
        case 0: {
          startTimer(game_payload);
          break;
        }
      }
      break;
    }
    // Game no 8
    case 'game-kategorie': {
      switch (currentGameState) {
        case 0: {
          startTimer(game_payload);
          break;
        }
      }
      break;
    }
    // Game no 9
    case 'game-mapfinder': {
      if (currentGameState === 'eval') {
        document.getElementById('game-mapfinder').classList.add('hidden');
        document.getElementById('points-panel').classList.remove('hidden');
      } else {
        switch (currentGameState % 5) {
          case 0: {
            // Show Question / Map
            document.getElementById('map').classList.add('hidden');
            document.getElementById('leaderboard').classList.add('hidden');
            document
              .getElementById('game-mapfinder')
              .classList.remove('hidden');

            markers.clearLayers();

            const questionField = document.getElementById(
              'game-mapfinder-question'
            );
            questionField.classList.remove('hidden');
            const question =
              quizData['game-mapfinder']?.questions?.[
                Math.floor(currentGameState / 5)
              ]?.question;
            if (question) {
              questionField.innerHTML = question;
            }
            currentGameState++;
            break;
          }
          case 1: {
            // Show Markers
            document
              .getElementById('game-mapfinder-question')
              .classList.add('hidden');
            document.getElementById('map').classList.remove('hidden');

            Array.isArray(game_payload) &&
              game_payload?.forEach((marker) => {
                const teamHues = [
                  ['hue-rotate-[103deg]', 'brightness-100'],
                  ['hue-rotate-270', 'brightness-100'],
                  ['hue-rotate-[152deg]', 'brightness-100'],
                  ['hue-rotate-200', 'brightness-150'],
                ];

                // const markerHtmlStyles = `
                //     background-color: ${teamColors[marker.team]};
                //     width: 3rem;
                //     height: 3rem;
                //     display: block;
                //     left: -1.5rem;
                //     top: -1.5rem;
                //     position: relative;
                //     border-radius: 3rem 3rem 0;
                //     transform: rotate(45deg);
                //     border: 1px solid #FFFFFF`;

                // const icon = L.divIcon({
                //   className: 'my-custom-pin',
                //   iconAnchor: [0, 24],
                //   labelAnchor: [-6, 0],
                //   popupAnchor: [0, -36],
                //   html: `<span style="${markerHtmlStyles}" />`,
                // });

                // let newMarker = L.marker(marker.latlng, {
                //   icon: icon,
                // }).bindTooltip(marker.name, {
                //   permanent: true,
                //   direction: 'right',
                // });

                let newMarker = L.marker(marker.latlng).bindTooltip(
                  marker.name,
                  {
                    permanent: true,
                    direction: 'right',
                  }
                );
                markers.addLayer(newMarker);

                L.DomUtil.addClass(newMarker._icon, teamHues[marker.team][0]);
                L.DomUtil.addClass(newMarker._icon, teamHues[marker.team][1]);
              });

            currentGameState++;
            break;
          }
          case 2: {
            // Show Correct Marker
            if (game_payload?.lat) {
              let newMarker = L.marker(game_payload);
              markers.addLayer(newMarker);
            }
            currentGameState++;
            break;
          }
          case 3: {
            // Show Leaderboard
            showLeaderboard();
            currentGameState++;
            break;
          }
          case 4: {
            // Show Team Average
            showLeaderboard();
            currentGameState++;
            break;
          }
        }
      }

      break;
    }
    // Game no 10
    case 'game-whoisthis': {
      switch (currentGameState) {
        case 0: {
          document
            .getElementById('game-whoisthis-game')
            .classList.remove('hidden');
          // Show next picture
        }
        default: {
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
      }
      break;
    }
    // Game no 11
    case 'game-songs': {
      switch (currentGameState) {
        case 0:
          break;
      }
      break;
    }
    // Game no 12
    case 'game-teamguessing': {
      switch (currentGameState % 5) {
        case 0: {
          // Show Question
          let question =
            quizData['game-teamguessing'].questions[
              Math.floor(currentGameState / 5)
            ]?.question;

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
        }
        case 1: {
          // Show Answers
          document
            .querySelectorAll('.game-teamguessing-answers-table')
            .forEach((elem) => elem.classList.remove('opacity-0'));

          Array.isArray(game_payload) &&
            game_payload.forEach((team, teamindex) => {
              let currenttable = document.getElementById(
                `guessing-table-${teamindex + 1}`
              );
              currenttable.innerHTML = '';
              Object.values(team.members).forEach((member) => {
                if (member.answer === '' || isNaN(member.answer)) return;
                const tr = document.createElement('tr');
                // tr.className = `${teamColors[row.team]}`;
                [member.name, member.answer].forEach((item, index) => {
                  const td = document.createElement('td');
                  td.className = `px-4 py-2 wrap-break-word`;
                  if (index == 1) {
                    td.classList.add('text-end');
                  }
                  td.textContent = item;
                  tr.appendChild(td);
                });

                currenttable.appendChild(tr);
              });
            });

          currentGameState++;
          break;
        }
        case 2: {
          // Show Correct Result
          let answer =
            quizData['game-teamguessing'].questions[
              Math.floor(currentGameState / 5)
            ]?.answer;

          let questionField = document.getElementById(
            'game-teamguessing-question'
          );
          if (answer) {
            questionField.innerHTML = answer;
          }
          currentGameState++;
          break;
        }
        case 3: {
          // Show Averages
          Array.isArray(game_payload) &&
            game_payload.forEach((team, teamindex) => {
              let currenttable = document.getElementById(
                `guessing-table-${teamindex + 1}`
              );
              const tr = document.createElement('tr');
              [``, team].forEach((item, index) => {
                const td = document.createElement('td');
                td.className = `px-4 py-2 wrap-break-word`;
                if (index == 1) {
                  td.classList.add('text-end');
                }
                td.textContent = item;
                tr.appendChild(td);
              });

              currenttable.appendChild(tr);
            });
          currentGameState++;
          break;
        }
        case 4: {
          // Show Winner
          if (isNaN(game_payload)) break;
          let currenttable = document.getElementById(
            `guessing-table-${game_payload + 1}`
          );
          currenttable.lastElementChild.classList.add('text-green-400');
          currentGameState++;
          break;
        }
      }
      break;
    }
    // Game no 13
    case 'game-multiple-choice': {
      switch (currentGameState % 4) {
        case 0: {
          // Show Question
          let questionField = document.getElementById(
            'game-multiple-choice-question'
          );
          questionField.classList.remove('hidden');
          document
            .getElementById('game-multiple-choice-answers')
            .classList.add('hidden');
          document
            .querySelectorAll('#game-multiple-choice-answers > div')
            .forEach((div) => div.classList.remove('text-green-400'));

          document
            .querySelectorAll('.game-multiple-choice-votes')
            .forEach((elem) => elem.classList.add('hidden'));

          let question =
            quizData[currentGame].questions[Math.floor(currentGameState / 4)];
          if (question) {
            questionField.textContent = question.question;
            document
              .querySelectorAll('.game-multiple-choice-answer')
              .forEach((answerField, index) => {
                answerField.textContent =
                  ['A', 'B', 'C', 'D'][index] + ': ' + question.answers[index];
              });
          }
          currentGameState++;
          break;
        }
        case 1: {
          // Show Answers
          document
            .getElementById('game-multiple-choice-answers')
            .classList.remove('hidden');
          currentGameState++;
          break;
        }
        case 2: {
          // Show Votes
          const answerVoteFields = document.querySelectorAll(
            '.game-multiple-choice-votes'
          );
          //   <span class="px-2 py-1 text-lg bg-red-600 rounded"
          //             >Titus</span
          //           >
          answerVoteFields.forEach((field) => (field.innerHTML = ''));
          console.log(game_payload);
          if (Array.isArray(game_payload)) {
            game_payload.forEach((team) => {
              Object.values(team.members).forEach((member) => {
                let span = document.createElement('span');
                span.className = 'px-2 py-1 ml-5 text-lg text-black rounded';
                span.textContent = member.name;
                span.classList.add(teamColors[team.index]);

                answerVoteFields[member.answer]?.appendChild(span);
              });
            });
          }
          document
            .querySelectorAll('.game-multiple-choice-votes')
            .forEach((elem) => elem.classList.remove('hidden'));
          currentGameState++;
          break;
        }
        case 3: {
          // Show Correct Answer
          let correct =
            quizData[currentGame].questions[Math.floor(currentGameState / 4)]
              ?.correct;
          if (correct != null) {
            document
              .querySelectorAll('#game-multiple-choice-answers > div')
              [correct].classList.add('text-green-400');
          }
          currentGameState++;
          break;
        }
      }
      break;
    }
    // Game no 14
    case 'game-creative-writing': {
      switch (currentGameState % 3) {
        case 0: {
          let promptField = document.getElementById(
            'game-creative-writing-prompt'
          );
          promptField.classList.remove('hidden');
          document
            .getElementById('game-creative-writing-game')
            .classList.add('hidden');

          let question =
            quizData[currentGame].questions[Math.floor(currentGameState / 3)];

          if (question) {
            promptField.innerHTML = question.question;
          }

          currentGameState++;
          break;
        }
        case 1: {
          // Show Answers
          document
            .getElementById('game-creative-writing-prompt')
            .classList.add('hidden');
          let answersContainer = document.getElementById(
            'game-creative-writing-game'
          );
          answersContainer.classList.remove('hidden');

          // <div class="flex flex-col">
          //   <span class="p-3 mb-3 text-3xl rounded-lg bg-gray-50"
          //     >Der Bieromat</span
          //   >
          //   <div class="text-xl font-semibold text-red-600">
          //     Kim &nbsp;&nbsp;&nbsp;👍👍👍👍
          //   </div>
          // </div>
          answersContainer.innerHTML = '';
          Array.isArray(game_payload) &&
            game_payload.forEach((team, teamindex) => {
              Object.values(team.members).forEach((member) => {
                if (member.answer === '') return;
                let div = document.createElement('div');
                div.className = 'flex flex-col';
                let span = document.createElement('span');
                span.className = 'p-3 mb-3 text-3xl rounded-lg bg-gray-50';
                span.innerHTML = member.answer;
                let div2 = document.createElement('div');
                div2.className = `text-xl hidden font-semibold ${teamTextColors[teamindex]}`;
                div2.dataset.playerId = member.id;

                div.appendChild(span);
                div.appendChild(div2);
                answersContainer.appendChild(div);
              });
            });

          shuffleChildren(answersContainer);

          currentGameState++;
          break;
        }
        case 2: {
          // Show Votes
          console.log('payload!!!', game_payload);
          Array.isArray(game_payload) &&
            game_payload.forEach((team, teamindex) => {
              Object.values(team.members).forEach((member) => {
                if (member.answer === '') return;

                let playerElem = document.querySelector(
                  `[data-player-id="${member.id}"]`
                );
                if (!playerElem) return;
                let str = `${member.name} &nbsp;&nbsp;&nbsp;`;
                for (let i = 0; i < member.points; i++) {
                  str += '👍';
                }
                if (member.points > 0) {
                  str += ` &nbsp;${member.points}`;
                }
                playerElem.innerHTML = str;
                playerElem.classList.remove('hidden');
              });
            });

          currentGameState++;
          break;
        }
      }
      break;
    }
    // Game no 15
    case 'game-blamieren-kassieren': {
      switch (currentGameState) {
        case 0:
          break;
      }
      break;
    }
    // Game no 16
    case 'game-mitspieler': {
      switch (currentGameState % 2) {
        case 0: {
          let questionField = document.getElementById(
            'game-teamguessing-question'
          );
          questionField.classList.remove('opacity-0');
          document
            .querySelectorAll('.game-teamguessing-answers-table')
            .forEach((elem) => elem.classList.add('opacity-0'));

          let question =
            quizData[currentGame].questions[Math.floor(currentGameState / 2)];

          if (question) {
            questionField.textContent = question;
          }

          currentGameState++;
          break;
        }
        case 1: {
          document
            .querySelectorAll('.game-teamguessing-answers-table')
            .forEach((elem) => elem.classList.remove('opacity-0'));

          Array.isArray(game_payload) &&
            game_payload.forEach((team, teamindex) => {
              let currenttable = document.getElementById(
                `guessing-table-${teamindex + 1}`
              );
              currenttable.innerHTML = '';
              Object.values(team.members).forEach((member) => {
                if (member.answer === '') return;
                const tr = document.createElement('tr');
                // tr.className = `${teamColors[row.team]}`;
                [member.name, member.answer].forEach((item, index) => {
                  const td = document.createElement('td');
                  td.className = `px-4 py-2 wrap-break-word`;
                  if (index == 1) {
                    td.classList.add('text-end');
                  }
                  td.textContent = item;
                  tr.appendChild(td);
                });

                currenttable.appendChild(tr);
              });
            });

          currentGameState++;
          break;
        }
      }
      break;
    }
    // BIG DEFAULT
    default:
      break;
  }
}
