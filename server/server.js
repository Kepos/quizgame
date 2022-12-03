const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();

app.use(express.static(`${__dirname}/../client`, { index: 'racegame.html' }));

const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (sock) => {
  console.log('someone connected');
  sock.emit('message', 'You are connected');

  sock.on('message', (text) => console.log(`got text: ${text}`));
});

server.on('error', (err) => {
  console.error(err);
});

server.listen(8080, () => {
  console.log('server is ready');
});
