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
