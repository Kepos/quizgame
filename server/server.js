const http = require('http');
const express = require('express');
const socketio = require('socket.io');
// const createGame = require('./create-game');

const app = express();

app.use(express.static(`${__dirname}/../client`, { index: 'player.html' }));

// Questions-Ordner freigeben
app.use('/questions', express.static(`${__dirname}/../questions`));

const server = http.createServer(app);
const io = socketio(server);
// const { addPlayer, addMove, getMoves, setTrack, getTrack, restart } = createGame();

// Get JSON Data
const quizData = require('../questions/questions.json').gameQuestions;

let admin;
let players = [];

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

let currentGame = 'panel';
let currentGameState = 0;

let teams = [
  { points: 0, members: new Map(), color: '#ce5bd3', avgAnswer: 0, index: 0 },
  { points: 0, members: new Map(), color: '#5bd35b', avgAnswer: 0, index: 1 },
  { points: 0, members: new Map(), color: '#c33838', avgAnswer: 0, index: 2 },
  { points: 0, members: new Map(), color: '#d3cd5b', avgAnswer: 0, index: 3 },
];

io.on('connection', (sock) => {
  const playerID = sock.id;
  let playerIndex;
  let playerTeam;

  console.log('someone connected:', playerID);
  sock.emit('message', 'You are connected!!');

  // if (!admin && !blockNewAdmin) {
  //   admin = playerID;
  //   sock.emit('admin');
  // }

  // if (!acceptNewPlayers) {
  //   sock.emit('nosignup');
  // }

  sock.on('message', (text) => console.log(`got text: ${text}`));

  sock.on('Buzzer', (playerID) => {
    teams.forEach((team, index) => {
      let member = team.members.get(playerID);
      if (member) {
        io.emit('Buzzer', { name: member.name, team: index });
      }
    });
  });

  sock.on('Login', (playerObj, callback) => {
    console.log(`new player: ${playerObj.name} ${playerObj.team}`);
    const newPlayer = {
      id: playerID,
      name: playerObj.name,
      answer: '',
      points: 0,
      ping: 0,
    };
    teams[playerObj.team].members.set(playerID, newPlayer);
    playerTeam = playerObj.team;
    console.log(teams[playerObj.team]);
    console.log(currentGame, currentGameState);
    callback({
      status: 'ok',
      game: currentGame,
      gamestate: currentGameState,
    });

    emitTeams();
  });

  sock.on('table-reload', () => {
    emitTeams();
  });

  function getTeamsForClient() {
    return teams.map((team) => ({
      ...team,
      members: Object.fromEntries(team.members), // Map -> Objekt
    }));
  }

  function emitTeams() {
    const teamsForClient = getTeamsForClient();
    io.emit('Login', teamsForClient);
  }

  function deleteAllPlayerAnswersAndPoints(teamPoints = true) {
    teams.forEach((team) => {
      team.members.forEach((member) => {
        member.answer = '';
        member.points = 0;
      });
      if (teamPoints) {
        team.points = 0;
      }
    });
  }

  function deleteTeamGameAverages() {
    teams.forEach((team) => {
      team.avgAnswer = 0;
    });
  }

  sock.on('player-answer', (payload, game, gamestate, callback) => {
    console.log(
      `new answer: ${teams[playerTeam]?.members.get(playerID).name}: ${[
        game == currentGame,
        gamestate == currentGameState,
      ]}`,
      payload
    );

    const player = teams[playerTeam]?.members?.get(playerID);

    if (player && game == currentGame && gamestate == currentGameState) {
      switch (currentGame) {
        case 'game-multiple-choice':
          if (
            payload != null &&
            payload ===
              quizData[currentGame].questions[Math.floor(currentGameState / 4)]
                ?.correct
          ) {
            player.points++;
            teams[playerTeam].avgAnswer++;
          }

          player.answer = payload;
          break;
        case 'game-creative-writing':
          switch (currentGameState % 3) {
            case 1:
              player.answer = payload;
              break;
            case 2:
              // Increment points of the given answers author
              console.log('payload', payload);
              if (!payload) return;
              teams.forEach((team) => {
                team.members.forEach((member) => {
                  console.log('memberID', member.id);
                  if (member.id === payload) {
                    member.points++;
                    team.avgAnswer++;
                  }
                });
              });
              break;
          }
        default:
          player.answer = payload;
          break;
      }
      emitTeams();
      callback({
        status: 'ok',
      });
    }

    console.log(player);
  });

  sock.on('player-answer-delete', (teamindex, id, callback) => {
    const member = teams[teamindex]?.members?.get(id);
    if (member) {
      member.answer = '';
      callback({
        status: 'ok',
      });
      io.to(id).emit('player-game-state', currentGame, currentGameState);
    }
  });

  sock.on('player-delete', (teamindex, id, callback) => {
    if (teams[teamindex]?.members?.delete(id)) {
      callback({
        status: 'ok',
      });
      emitTeams();
      io.to(id).emit('player-game-state', 'login-screen', 0);
    }
  });

  sock.on('new-game', (newGame, callback) => {
    console.log(`start new Game, ${newGame}`);
    currentGame = newGame;
    currentGameState = 0;

    // Init Game Data
    // switch (currentGame) {
    //   case 'game-multiple-choice':
    //     teams.forEach((team) => {
    //       team.members.forEach((member) => {
    //         // Make Answer property an array
    //         member.answer = [];
    //       });
    //     });
    //     break;
    // }

    io.emit('new-game', newGame);
    callback({
      status: 'ok',
    });
  });

  sock.on('new-score', (teamNo, score) => {
    io.emit('new-score', teamNo, score);
  });

  sock.on('eval', (payload) => {
    console.log('eval!!');
    if (currentGame === 'game-multiple-choice') {
      let points = [0, 0, 0, 0];
      teams.forEach((team, teamindex) => {
        team.members.forEach((member) => {
          points[teamindex] += member.points;
        });
      });
      payload = points;
    } else if (currentGame === 'game-creative-writing') {
      let points = [0, 0, 0, 0];
      teams.forEach((team, teamindex) => {
        points[teamindex] = team.avgAnswer;
      });
      payload = points;
    } else if (currentGame === 'game-teamguessing') {
      let points = [0, 0, 0, 0];
      teams.forEach((team, teamindex) => {
        points[teamindex] = team.points;
      });
      payload = points;
    }
    io.emit('eval', payload);
  });

  sock.on('back-to-panel', (callback) => {
    io.emit('back-to-panel');
    currentGame = 'games-panel';
    currentGameState = 0;
    callback({ status: 'ok' });
    deleteAllPlayerAnswersAndPoints();
    deleteTeamGameAverages();
    emitTeams();
  });

  sock.on('sort-selection', (selection, callback) => {
    console.log(selection);
    io.emit('sort-selection', selection);
    callback({ status: 'ok' });
  });

  // sock.on('signup', (player) => {
  //   if (!acceptNewPlayers) {
  //     sock.emit('nosignup');
  //     return;
  //   }
  //   console.log(`new player: ${player.name} ${player.car}`);
  //   console.log(currentGame, currentGameState);
  //   playerIndex = players.length;
  //   players.push(playerID);
  //   playerObjs[playerIndex] = player;
  //   sock.emit('playerindex', playerIndex);
  //   player.index = playerIndex;
  //   io.emit('newPlayer', playerObjs);
  // });

  sock.on('disconnect', (reason) => {
    console.log('player disconnected: ', playerID);
    var index = players.indexOf(playerID);

    let members = teams[playerTeam]?.members;
    if (members?.has(playerID)) {
      members.delete(playerID);
    }

    emitTeams();
    /*
    var index = players.indexOf(playerID);
    if (index !== -1) {
      players.splice(index, 1);
    }
    
    var deadindex = deadPlayers.indexOf(playerID);
    if (deadindex !== -1) {
      deadPlayers.splice(deadindex, 1);
    }
    */
    // check if players array is not empty
    // if (players.includes(playerID) && !deadPlayers.includes(playerID)) {
    //   deadPlayers.push(playerID);
    // }

    // if (admin === playerID) {
    //   admin = null;
    // }

    // io.emit('playerLeft', index);

    // if (allPlayersSelectedNextMove()) {
    //   io.emit('playersMoves', playersMoves);
    //   playersMoves = [];
    // }

    // if (players.length === 0) {
    //   admin = null;
    //   players = [];
    //   playerObjs = [];
    //   deadPlayers = [];
    //   playersMoves = [];
    //   acceptNewPlayers = true;
    // }
  });

  sock.on('restart', () => {
    if (blockNewAdmin) {
      return;
    }
    admin = null;
    players = [];
    playerObjs = [];
    deadPlayers = [];
    playersMoves = [];
    acceptNewPlayers = true;

    blockNewAdmin = true;
    sock.broadcast.emit('restart');

    // Sender shall be new admin, therefore timeout
    setTimeout(() => {
      blockNewAdmin = false;
      sock.emit('restart');
    }, 2000);
  });

  function emitCurrentState(payload = null) {
    io.emit('player-game-state', currentGame, currentGameState, payload);
  }

  sock.on('next', (payload, callback) => {
    console.log(payload);

    switch (currentGame) {
      // Game No. 1
      case 'game-quiz-question-1':
      case 'game-quiz-question-2':
      case 'game-quiz-question-3':
      case 'game-quiz-question-4': {
        switch (currentGameState) {
          case 0:
            // Show Questions
            callback({
              status: 'ok',
              nextUp: '# Open Question Card',
            });
            currentGameState++;
            break;
          case 1:
            //
            callback({
              status: 'ok',
              nextUp: 'Back To Questions',
            });
            currentGameState--;
            break;
        }
        break;
      }
      // Game No 5
      case 'game-umfragewerte': {
        switch (currentGameState % 2) {
          case 0:
            // Show Question
            callback({
              status: 'ok',
              nextUp: '(...) Show Answers',
            });
            currentGameState++;
            emitCurrentState();

            deleteAllPlayerAnswersAndPoints();
            emitTeams();
            break;
          case 1:
            //Show Answers
            let votes = {
              yes: 0,
              no: 0,
            };
            teams.forEach((team) => {
              team.members.forEach((member) => {
                if (member.answer === true) {
                  votes.yes++;
                }
                if (member.answer === false) {
                  votes.no++;
                }
              });
            });
            payload = votes;

            callback({
              status: 'ok',
              nextUp: 'Next Question',
            });

            currentGameState++;
            emitCurrentState();
            break;
        }
        break;
      }
      // Game No 6
      case 'game-einsortieren': {
        switch (currentGameState) {
          case 0:
            // Fade in Game
            callback({
              status: 'ok',
              nextUp: 'Next List',
            });
            currentGameState++;
            break;
          default:
            // Next List
            callback({
              status: 'ok',
              nextUp: 'Next List?',
            });
            currentGameState++;
            break;
        }
        break;
      }
      // Game no 7
      case 'game-pantomime': {
        switch (currentGameState) {
          case 0:
            //
            callback({
              status: 'ok',
              nextUp: 'Restart Timer',
            });
            break;
        }
        break;
      }
      // Game no 8
      case 'game-kategorie': {
        switch (currentGameState) {
          case 0:
            //
            callback({
              status: 'ok',
              nextUp: 'Restart Timer',
            });
            break;
        }
        break;
      }
      // Game no 9
      case 'game-mapfinder': {
        switch (currentGameState % 5) {
          case 0:
            // Show Question
            callback({
              status: 'ok',
              nextUp: '(...) Show Markers',
            });
            currentGameState++;
            emitCurrentState();

            deleteAllPlayerAnswersAndPoints();
            emitTeams();
            break;
          case 1:
            // Show Markers
            let markers = [];
            teams.forEach((team, index) => {
              team.members.forEach((member) => {
                if (member.answer) {
                  markers.push({
                    name: member.name,
                    team: index,
                    latlng: member.answer,
                  });
                }
              });
            });
            payload = markers;
            callback({
              status: 'ok',
              nextUp: 'Show Correct Marker',
            });
            currentGameState++;
            emitCurrentState();
            break;
          case 2:
            // Show Correct Marker
            let correctMarker =
              quizData[currentGame].questions[Math.floor(currentGameState / 5)];
            payload = correctMarker?.answer;
            callback({
              status: 'ok',
              nextUp: 'Show Leaderboard',
            });
            currentGameState++;
            break;
          case 3:
            // Calculate Distances
            // Show Leaderboard
            let correctLocation =
              quizData[currentGame].questions[Math.floor(currentGameState / 5)]
                ?.answer;
            teams.forEach((team) => (team.avgAnswer = 0));
            let teamsLegitAnswers = [0, 0, 0, 0];
            if (correctLocation) {
              const flatplayers = teams.flatMap((team, teamIndex) =>
                [...team.members.entries()].map(([id, data]) => {
                  let distance = data.answer?.lat
                    ? Math.round(
                        haversineDistanceKM(
                          data.answer.lat,
                          data.answer.lng,
                          correctLocation.lat,
                          correctLocation.lng
                        ) * 100
                      ) / 100
                    : '';
                  if (distance !== '') {
                    teamsLegitAnswers[teamIndex]++;
                    team.avgAnswer += distance;
                  }
                  return {
                    // id,
                    name: data.name,
                    answer: distance ? distance?.toFixed(2) + ' km' : '',
                    team: team.index,
                  };
                })
              );
              payload = flatplayers.sort((a, b) => a.answer - b.answer);
              console.log(payload);
            }
            teams.forEach(
              (team, teamindex) =>
                (team.avgAnswer /= teamsLegitAnswers[teamindex])
            );
            callback({
              status: 'ok',
              nextUp: 'Show Team Average',
            });
            currentGameState++;
            break;
          case 4:
            // Show Team Average
            let teamsObj = [];
            teams.forEach((team, teamindex) => {
              console.log('Show Avg', team.avgAnswer);
              teamsObj.push({
                name: `Team ${teamindex + 1}`,
                score:
                  (Math.round(team.avgAnswer * 100) / 100).toFixed(2) + ' km',
                team: teamindex,
              });
            });
            payload = teamsObj;
            callback({
              status: 'ok',
              nextUp: 'Show Next Question',
            });
            currentGameState++;
            break;
        }
        break;
      }
      // Game no 10
      case 'game-whoisthis': {
        switch (currentGameState) {
          case 0:
            //
            callback({
              status: 'ok',
              nextUp: 'Next Picture',
            });
            break;
        }
        break;
      }
      // Game no 11
      case 'game-songs':
        break;

      // Game no 12
      case 'game-teamguessing': {
        switch (currentGameState % 5) {
          case 0:
            // Show Question
            callback({
              status: 'ok',
              nextUp: '(...) Show Results',
            });
            currentGameState++;
            emitCurrentState();

            deleteAllPlayerAnswersAndPoints(false);
            emitTeams();
            break;
          case 1:
            payload = getTeamsForClient();
            // Show Answers
            callback({
              status: 'ok',
              nextUp: 'Show Correct Result',
            });
            currentGameState++;
            emitCurrentState();
            break;
          case 2:
            // Show Correct Result
            callback({
              status: 'ok',
              nextUp: 'Show Averages',
            });
            currentGameState++;
            break;
          case 3:
            // Show Averages
            let averages = [0, 0, 0, 0];
            let validAnswers = [0, 0, 0, 0];
            teams.forEach((team, teamindex) => {
              team.members.forEach((member) => {
                if (member.answer === '' || isNaN(member.answer)) return;
                averages[teamindex] += parseInt(member.answer);
                validAnswers[teamindex]++;
              });
              if (validAnswers[teamindex] > 0) {
                averages[teamindex] /= validAnswers[teamindex];
                averages[teamindex] = (
                  Math.round(averages[teamindex] * 100) / 100
                ).toFixed(2);
                team.avgAnswer = averages[teamindex];
              }
            });
            payload = averages;
            callback({
              status: 'ok',
              nextUp: 'Show Winner',
            });
            currentGameState++;
            break;
          case 4:
            // Show Winner
            let correct =
              quizData[currentGame].questions[Math.floor(currentGameState / 5)]
                ?.answer;
            let closestIndex = 0;
            if (correct) {
              let smallestDiff = Math.abs(teams[0].avgAnswer - correct);

              for (let i = 1; i < teams.length; i++) {
                const diff = Math.abs(teams[i].avgAnswer - correct);
                if (diff < smallestDiff) {
                  smallestDiff = diff;
                  closestIndex = i;
                }
              }

              const rankedTeams = [...teams].sort((a, b) => {
                return (
                  Math.abs(a.avgAnswer - correct) -
                  Math.abs(b.avgAnswer - correct)
                );
              });

              // Punktevergabe
              const points = [3, 2, 1, 0];

              rankedTeams.forEach((team, index) => {
                team.points += points[index] ?? 0;
              });
            }
            payload = closestIndex;
            callback({
              status: 'ok',
              nextUp: 'Next Question',
            });
            currentGameState++;
            break;
        }
        break;
      }
      // Game no 13
      case 'game-multiple-choice': {
        switch (currentGameState % 4) {
          case 0:
            // Show Question
            callback({
              status: 'ok',
              nextUp: 'Show Answer-Options',
            });
            currentGameState++;
            deleteAllPlayerAnswersAndPoints();
            emitTeams();
            break;
          case 1:
            // Show Answer-Options
            callback({
              status: 'ok',
              nextUp: '(...) Show Votes',
            });
            currentGameState++;
            emitCurrentState();
            break;
          case 2:
            // Show Votes
            payload = getTeamsForClient();
            console.log(payload);
            callback({
              status: 'ok',
              nextUp: 'Show Correct Answer',
            });
            currentGameState++;
            emitCurrentState();
            break;
          case 3:
            // Show Correct Answer
            callback({
              status: 'ok',
              nextUp: 'Next Question',
            });
            currentGameState++;
            break;
        }
        break;
      }
      // Game no 14
      case 'game-creative-writing': {
        switch (currentGameState % 3) {
          case 0:
            // Show Prompt
            callback({
              status: 'ok',
              nextUp: '(...) Show Answers',
            });
            currentGameState++;
            emitCurrentState();
            deleteAllPlayerAnswersAndPoints();
            emitTeams();
            break;
          case 1:
            // Show Answers
            payload = getTeamsForClient();
            callback({
              status: 'ok',
              nextUp: '(...) Show Votes',
            });
            currentGameState++;
            emitCurrentState(payload);
            io.emit('next', payload);
            deleteAllPlayerAnswersAndPoints();
            emitTeams();
            return;
          case 2:
            // Show Votes
            payload = getTeamsForClient();
            callback({
              status: 'ok',
              nextUp: 'Show Next Prompt',
            });
            currentGameState++;
            emitCurrentState(payload);
            console.log('payload!!!', payload);
            break;
        }
        break;
      }
      // Game no 15
      case 'game-blamieren-kassieren':
        break;

      // Game no 16
      case 'game-mitspieler': {
        switch (currentGameState % 2) {
          case 0:
            // Show Question
            callback({
              status: 'ok',
              nextUp: 'Show Results',
            });
            currentGameState++;
            emitCurrentState();

            deleteAllPlayerAnswersAndPoints();
            emitTeams();
            break;
          case 1:
            // Show Results
            payload = getTeamsForClient();
            callback({
              status: 'ok',
              nextUp: 'Show Next Question',
            });
            currentGameState++;
            emitCurrentState();
            break;
        }
        break;
      }
      // BIG DEFAULT
      default:
        break;
    }

    // Emit Payload (to Panel)
    io.emit('next', payload);
  });
});

function haversineDistanceKM(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
  function toRad(degree) {
    return (degree * Math.PI) / 180;
  }

  const lat1 = toRad(lat1Deg);
  const lon1 = toRad(lon1Deg);
  const lat2 = toRad(lat2Deg);
  const lon2 = toRad(lon2Deg);

  const { sin, cos, sqrt, atan2 } = Math;

  const R = 6371; // earth radius in km
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a =
    sin(dLat / 2) * sin(dLat / 2) +
    cos(lat1) * cos(lat2) * sin(dLon / 2) * sin(dLon / 2);
  const c = 2 * atan2(sqrt(a), sqrt(1 - a));
  const d = R * c;
  return d; // distance in km
}

server.on('error', (err) => {
  console.error(err);
});

let port = process.env.PORT;
if (port == null || port == '') {
  port = 8080;
}

server.listen(port, () => {
  console.log('server is ready');
});
