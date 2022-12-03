const log = (text) => {};

const onChatSubmitted = (sock) => (e) => {
  e.preventDefault();
};

(() => {
  const sock = io();

  sock.on('message', (text) => {
    console.log(text);
    sock.emit('message', text);
  });

  console.log('welcome');
})();
