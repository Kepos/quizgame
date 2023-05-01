const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const createGame = require('./create-game');

const app = express();

app.use(express.static(`${__dirname}/../client`, { index: 'racegame.html' }));

const server = http.createServer(app);
const io = socketio(server);
const { addPlayer, addMove, getMoves, setTrack, getTrack, restart } =
  createGame();

let admin;
let players = [];
let deadPlayers = [];
let playersMoves = [];

let acceptNewPlayers = true;

function getNextFreeIndex() {
  for (let i = 0; i <= players.length; i++) {
    if (!players.includes(i)) return i;
  }

  return players.length;
}

function allPlayersSelectedNextMove() {
  // check if all the not-undefined values from playersMoves add up to alive players Num
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

  if (!admin) {
    admin = playerID;
    sock.emit('admin');
  }

  sock.on('message', (text) => console.log(`got text: ${text}`));

  sock.on('signup', (player) => {
    console.log(`new player: ${player.name} ${player.car}`);
    playerIndex = players.length;
    players.push(playerID);
    sock.emit('playerindex', playerIndex);
    player.index = playerIndex;
    io.emit('newPlayer', player);
  });

  sock.on('track', (track) => {
    console.log('track uploaded: ', track);
    setTrack(track);
    acceptNewPlayers = false;
    io.emit('track', { track: track, players: Array(players.length).fill(1) });
  });

  sock.on('nextStop', (nextStop) => {
    var index = players.indexOf(playerID);
    if (index !== -1) {
      addMove(index, nextStop.x, nextStop.y);
    }
    playersMoves[index] = nextStop;
    console.log('index', index);
    console.log('pindex', playerIndex);
    console.log(playersMoves);

    if (allPlayersSelectedNextMove()) {
      io.emit('playersMoves', playersMoves);
      playersMoves = [];
    }
  });

  sock.on('death', () => {
    deadPlayers.push(playerID);
  });

  sock.on('disconnect', (reason) => {
    console.log('player disconnected: ', playerID);
    var index = players.indexOf(playerID);
    if (index !== -1) {
      players.splice(index, 1);
    }
    var deadindex = deadPlayers.indexOf(playerID);
    if (deadindex !== -1) {
      deadPlayers.splice(deadindex, 1);
    }

    if (admin === playerID) {
      admin = null;
    }

    io.emit('playerLeft', index);

    if (allPlayersSelectedNextMove()) {
      io.emit('playersMoves', playersMoves);
      playersMoves = [];
    }
  });
});

server.on('error', (err) => {
  console.error(err);
});

server.listen(8080, () => {
  console.log('server is ready');
});
