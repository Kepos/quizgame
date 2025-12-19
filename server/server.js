const http = require('http');
const express = require('express');
const socketio = require('socket.io');
// const createGame = require('./create-game');

const app = express();

app.use(express.static(`${__dirname}/../client`, { index: 'player.html' }));

const server = http.createServer(app);
const io = socketio(server);
// const { addPlayer, addMove, getMoves, setTrack, getTrack, restart } = createGame();

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
  { points: 0, members: [] },
  { points: 0, members: [] },
  { points: 0, members: [] },
  { points: 0, members: [] },
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
    console.log(callback);
    teams[playerObj.team].members.push(playerObj.name);
    console.log(teams[playerObj.team]);
    callback({
      status: 'ok',
    });
  });

  sock.on('new-game', (newGame, callback) => {
    console.log(`start new Game, ${newGame}`);
    currentGame = newGame;
    currentGameState = 0;
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

  sock.on('signup', (player) => {
    if (!acceptNewPlayers) {
      sock.emit('nosignup');
      return;
    }
    console.log(`new player: ${player.name} ${player.car}`);
    playerIndex = players.length;
    players.push(playerID);
    playerObjs[playerIndex] = player;
    sock.emit('playerindex', playerIndex);
    player.index = playerIndex;
    io.emit('newPlayer', playerObjs);
  });

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
              nextUp: 'Show Answers',
            });
            currentGameState++;
            break;
          case 1:
            //Show Answers
            callback({
              status: 'ok',
              nextUp: 'Next Question',
            });
            currentGameState = 0;
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
              nextUp: 'Show Markers',
            });
            currentGameState++;
            break;
          case 1:
            // Show Markers
            callback({
              status: 'ok',
              nextUp: 'Show Correct Marker',
            });
            currentGameState++;
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
            break;
          case 1:
            // Show Answers
            callback({
              status: 'ok',
              nextUp: 'Show Correct Result',
            });
            currentGameState++;
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
        if (payload == 1) currentGameState = 1;
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
              nextUp: 'Show Team Points',
            });
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
              nextUp: 'Show Answers',
            });
            currentGameState++;
            break;
          case 1:
            // Show Answers
            callback({
              status: 'ok',
              nextUp: 'Show Votes',
            });
            currentGameState++;
            break;
          case 2:
            // Show Votes
            callback({
              status: 'ok',
              nextUp: 'Show Next Prompt',
            });
            currentGameState = 0;
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
