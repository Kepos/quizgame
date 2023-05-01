const createGame = () => {
  let track = {
    rightTrackPoints: [],
    leftTrackPoints: [],
  };

  let playersMoves = [];

  let players = [];

  const addPlayer = (name, color) => {
    players.push({ name: name, color: color });
    // return index of new player
    return playersMoves.push([]) - 1;
  };

  const addMove = (index, x, y) => {
    // playersMoves[index].push({ x: x, y: y });
  };

  const getMoves = () => playersMoves;

  const setTrack = (newTrack) => {
    track = newTrack;
  };

  const getTrack = () => {};

  const restart = () => {};

  return {
    addPlayer,
    addMove,
    getMoves,
    setTrack,
    getTrack,
    restart,
  };
};

module.exports = createGame;
