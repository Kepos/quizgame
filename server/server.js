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
  { points: 0, members: new Map(), color: '#ce5bd3' },
  { points: 0, members: new Map(), color: '#5bd35b' },
  { points: 0, members: new Map(), color: '#c33838' },
  { points: 0, members: new Map(), color: '#d3cd5b' },
];

function getNextFreeIndex() {
  for (let i = 0; i <= players.length; i++) {
    if (!players.includes(i)) return i;
  }

  return players.length;
}

function allPlayersSelectedNextMove() {
  return;
  // check if all the not-undefined values from playersMoves add up to alive players Num
  console.log('all playes selected?');
  console.log('playersmoveslength', playersMoves.filter((v) => v).length);
  return (
    playersMoves.filter((v) => v).length >= players.length - deadPlayers.length
  );
  return (
    playersMoves.length >= players.length && !playersMoves.includes(undefined)
  );
}

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

  sock.on('Buzzer', (name) => {
    console.log(`${name} buzzered ... emitting event!`);
    io.emit('Buzzer', name);
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

  function emitTeams() {
    const teamsForClient = teams.map((team) => ({
      ...team,
      members: Object.fromEntries(team.members), // Map -> Objekt
    }));
    io.emit('Login', teamsForClient);
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
          if (!Array.isArray(player.answer)) {
            player.answer = [];
          }
          player.answer.push(payload);
          break;
        case 'game-creative-writing':
          switch (currentGameState) {
            case 2:
              // Increment points of the given answers author
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

  sock.on('back-to-panel', (callback) => {
    io.emit('back-to-panel');
    currentGame = 'games-panel';
    currentGameState = 0;
    callback({ status: 'ok' });
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
    if (players.includes(playerID) && !deadPlayers.includes(playerID)) {
      deadPlayers.push(playerID);
    }

    if (admin === playerID) {
      admin = null;
    }

    io.emit('playerLeft', index);

    if (allPlayersSelectedNextMove()) {
      io.emit('playersMoves', playersMoves);
      playersMoves = [];
    }

    if (players.length === 0) {
      admin = null;
      players = [];
      playerObjs = [];
      deadPlayers = [];
      playersMoves = [];
      acceptNewPlayers = true;
    }
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

  function emitCurrentState() {
    io.emit('player-game-state', currentGame, currentGameState);
  }

  sock.on('next', (payload, callback) => {
    console.log(payload);

    switch (currentGame) {
      // Game No. 1
      case 'game-quiz-question-1':
      case 'game-quiz-question-2':
      case 'game-quiz-question-3':
      case 'game-quiz-question-4':
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

      // Game No 5
      case 'game-umfragewerte':
        switch (currentGameState) {
          case 0:
            // Show Question
            callback({
              status: 'ok',
              nextUp: '(...) Show Answers',
            });
            currentGameState++;
            emitCurrentState();
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

            currentGameState = 0;
            emitCurrentState();
            break;
        }
        break;

      // Game No 6
      case 'game-einsortieren':
        switch (currentGameState) {
          case 0:
            // Fade in Game
            callback({
              status: 'ok',
              nextUp: 'Next List',
            });
            currentGameState++;
            break;
          case 1:
            // Next List
            callback({
              status: 'ok',
              nextUp: 'Next List?',
            });
            break;
        }
        break;

      // Game no 7
      case 'game-pantomime':
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

      // Game no 8
      case 'game-kategorie':
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

      // Game no 9
      case 'game-mapfinder':
        switch (currentGameState) {
          case 0:
            // Show Question
            callback({
              status: 'ok',
              nextUp: '(...) Show Markers',
            });
            currentGameState++;
            emitCurrentState();
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
            callback({
              status: 'ok',
              nextUp: 'Show Leaderboard',
            });
            currentGameState++;
            break;
          case 3:
            // Show Leaderboard
            callback({
              status: 'ok',
              nextUp: 'Show Team Average',
            });
            currentGameState++;
            break;
          case 4:
            // Show Team Average
            callback({
              status: 'ok',
              nextUp: 'Show Next Question',
            });
            currentGameState = 0;
            break;
        }
        break;

      // Game no 10
      case 'game-whoisthis':
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

      // Game no 11
      case 'game-songs':
        break;

      // Game no 12
      case 'game-teamguessing':
        switch (currentGameState) {
          case 0:
            // Show Question
            callback({
              status: 'ok',
              nextUp: '(...) Show Results',
            });
            currentGameState++;
            emitCurrentState();
            break;
          case 1:
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
            callback({
              status: 'ok',
              nextUp: 'Show Winner',
            });
            currentGameState++;
            break;
          case 4:
            // Show Winner
            callback({
              status: 'ok',
              nextUp: 'Next Question',
            });
            currentGameState = 0;
            break;
        }
        break;

      // Game no 13
      case 'game-multiple-choice':
        switch (currentGameState) {
          case 0:
            // Show Question
            callback({
              status: 'ok',
              nextUp: 'Show Answer-Options',
            });
            currentGameState++;
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
            currentGameState = 0;
            break;
        }
        break;

      // Game no 14
      case 'game-creative-writing':
        switch (currentGameState) {
          case 0:
            // Show Prompt
            callback({
              status: 'ok',
              nextUp: '(...) Show Answers',
            });
            currentGameState++;
            emitCurrentState();
            break;
          case 1:
            // Show Answers
            callback({
              status: 'ok',
              nextUp: '(...) Show Votes',
            });
            currentGameState++;
            emitCurrentState();
            break;
          case 2:
            // Show Votes
            callback({
              status: 'ok',
              nextUp: 'Show Next Prompt',
            });
            currentGameState = 0;
            emitCurrentState();
            break;
        }
        break;

      // Game no 15
      case 'game-blamieren-kassieren':
        break;

      // Game no 16
      case 'game-mitspieler':
        switch (currentGameState) {
          case 0:
            // Show Question
            callback({
              status: 'ok',
              nextUp: 'Show Results',
            });
            currentGameState++;
            break;
          case 1:
            // Show Results
            callback({
              status: 'ok',
              nextUp: 'Show Next Question',
            });
            currentGameState = 0;
            break;
        }
        break;

      // BIG DEFAULT
      default:
        break;
    }
    io.emit('next', payload);
  });
});

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
