var canvas;
var ctx;

var gridCanvas;
var gridCtx;

var gridPointer;
const GRID_POINTER_RADIUS = 6;

var gridOptionPointers = [];

const CANVAS_MARGIN = 20;
// Board width
const GRID_WIDTH = 2200;
// Board height
const GRID_HEIGHT = 2200;
// Board padding
const CANVAS_PADDING = 10;
// width / height of the grid boxes
const GRID_BOX_WIDTH = 40;
// line width of the grid lines
const GRID_LINE_WIDTH = 1;

const GRID_OFFSET = CANVAS_MARGIN + CANVAS_PADDING;

var TRACK_WIDTH = 200;

const DRAW_INTERVAL = 10;

var NUM_PLAYERS = 4;
var playerColors = ['#003a23', '#0e5fa9', '#ecc717', '#9a1a20'];
// player that currently is picking next stop
var currentPlayer = 0;
var racecarsPos = [];
var racecarsStopsArray = [];

var nextGridOptions = [];

const RACECAR_WIDTH = 40;
const RACECAR_HEIGHT = 26;

// sprite / img Objects
var racecarImgs = [];
var explosion;

// pause Racing Animation when explosion is shown;
let animationIsPaused = false;

var leftTrackPoints = [];
var middleTrackPoints = [];
var rightTrackPoints = [];

var firstDrawingMousePos;
var firstDrawingRightPos;
var firstDrawingLeftPos;

var lastDrawingMousePos;
var lastDrawingRightPos;
var lastDrawingLeftPos;

var trackDrawingActive = false;

let lastMouseMoveEvt;

// drawing / choosing / driving
const GAME_STATE_DRAWING = 0;
const GAME_STATE_PICKING = 1;
const GAME_STATE_RACING = 2;
var gameState = GAME_STATE_DRAWING;

let infoPanelTempl;

window.onload = function () {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  ctx.save();

  infoPanelTempl = document.getElementById('info-panel-template');

  gridCanvas = document.getElementById('grid-canvas');
  gridCtx = gridCanvas.getContext('2d');

  canvas.width = GRID_WIDTH + CANVAS_PADDING * 2;
  canvas.height = GRID_HEIGHT + CANVAS_PADDING * 2;

  gridCanvas.width = GRID_WIDTH + CANVAS_PADDING * 2;
  gridCanvas.height = GRID_HEIGHT + CANVAS_PADDING * 2;

  gridPointer = document.getElementById('grid-pointer');

  gridOptionPointers = document.querySelectorAll('[id^=grid-option]');

  initExplosion();

  drawBoard();

  ctx.strokeStyle = 'black';
  ctx.lineWidth = 5;
  ctx.lineJoin = 'bevel';

  let storedTrackObj = localStorage.getItem('track');
  if (true && storedTrackObj) {
    storedTrackObj = JSON.parse(storedTrackObj);
    rightTrackPoints = storedTrackObj.right;
    leftTrackPoints = storedTrackObj.left;
    firstDrawingRightPos = rightTrackPoints[0];
    firstDrawingLeftPos = leftTrackPoints[0];
    drawTrack();
    initRacecars();
    startRace();
  }

  // document.body.style.zoom = '50%';

  canvas.addEventListener('mousedown', (evt) => {
    handleMouseDown(evt, false);
  });

  canvas.addEventListener('mousemove', (evt) => {
    handleMouseMove(evt, false);
  });

  canvas.addEventListener('touchstart', function (evt) {
    handleMouseDown(evt, true);
  });

  canvas.addEventListener('touchmove', function (evt) {
    handleMouseMove(evt, true);
  });

  function handleMouseDown(evt, touch = false) {
    switch (gameState) {
      case GAME_STATE_DRAWING:
        if (!lastDrawingMousePos) {
          firstDrawingMousePos = calculateMousePos(evt);
          lastDrawingMousePos = firstDrawingMousePos;
          ctx.beginPath();
        }

        trackDrawingActive = !trackDrawingActive;

        if (trackDrawingActive) {
          // const infoPanelEl = infoPanelTempl.cloneNode(true);
          // infoPanelTempl.parentElement.appendChild(infoPanelEl);

          infoPanelTempl.querySelector('.info-text').innerHTML =
            'Klicken, um Zeichnen zu pausieren<br>Letzten Strich löschen mit D<br>Enter, um Rennen zu starten';
        } else {
          infoPanelTempl.querySelector('.info-text').innerHTML =
            'Klicken, um mit Zeichnen fortzufahren<br>Letzten Strich löschen mit D<br>Enter, um Rennen zu starten';
        }

        break;
      case GAME_STATE_PICKING:
        racecarsStopsArray[currentPlayer].push(getGridPointerPos());

        if (currentPlayer === NUM_PLAYERS - 1) {
          gameState = GAME_STATE_RACING;
          currentPlayer = 0;
          gridPointer.style.backgroundColor = playerColors[0];
          hideGridOptionPointers();
          animateRacecars();
        } else {
          currentPlayer++;
          gridPointer.style.backgroundColor = playerColors[currentPlayer];
          gridPointer.style.border = '1px solid black';
          drawGridOptionPointers();
        }
        break;
      default:
        break;
    }
    if (touch) {
      // do not call mouse event again;
      evt.preventDefault();
    }
  }

  function handleMouseMove(evt, touch = false) {
    lastMouseMoveEvt = evt;
    if (trackDrawingActive) {
      traceTrack(evt);
    } else if (gameState === GAME_STATE_PICKING) {
      drawGridPointer(evt);
    }
    if (touch) {
      // do not call mouse event again;
      evt.preventDefault();
    }
  }

  window.addEventListener('keydown', (evt) => {
    let key = evt.key.toLowerCase();
    console.log('KEY PRESSED: ', key);
    switch (key) {
      case 'w':
        TRACK_WIDTH += 10;
        break;
      case 's':
        TRACK_WIDTH -= 10;
        break;
      case 't':
        localStorage.setItem(
          'track',
          JSON.stringify({ right: rightTrackPoints, left: leftTrackPoints })
        );
        break;
      case 'd':
        if (gameState === GAME_STATE_DRAWING) {
          trackDrawingActive = false;
          rightTrackPoints.pop();
          middleTrackPoints.pop();
          leftTrackPoints.pop();

          if (rightTrackPoints.length > 0) {
            lastDrawingRightPos = rightTrackPoints[rightTrackPoints.length - 1];
            lastDrawingLeftPos = leftTrackPoints[leftTrackPoints.length - 1];
            lastDrawingMousePos =
              middleTrackPoints[middleTrackPoints.length - 1];
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawTrack(false);

          infoPanelTempl.querySelector('.info-text').innerHTML =
            'Klicken, um mit Zeichnen fortzufahren<br>Letzten Strich löschen mit D<br>Enter, um Rennen zu starten';
        }
        break;
      case 'enter':
        if (gameState === GAME_STATE_DRAWING) {
          trackDrawingActive = false;
          console.log('Drive Mode enabled!');
          initRacecars();
          startRace();
        }
        break;
      case 'backspace':
        localStorage.removeItem('track');
        break;
      default:
        break;
    }
  });
};

function startRace() {
  gameState = GAME_STATE_PICKING;
  gridPointer.style.backgroundColor = playerColors[0];
  drawGridOptionPointers();
}

// function isMouseOnGridOptions(mousePos) {
//   mousePos.x = Math.round(mousePos.x);
//   mousePos.y = Math.round(mousePos.y);

//   for (let i = 0; i < nextGridOptions.length; i++) {
//     if (
//       Math.round(nextGridOptions[i].x) === mousePos.x &&
//       Math.round(nextGridOptions[i].y) === mousePos.y
//     ) {
//       return true;
//     }
//   }

//   return false;
// }

function calculateNearestValidGridPoint(mousePos) {
  let closestIdx = 0;
  let shortestDist = calculateDistance(
    calculateDirectionVector(mousePos, nextGridOptions[0])
  );
  for (let i = 1; i < nextGridOptions.length; i++) {
    let dist = calculateDistance(
      calculateDirectionVector(mousePos, nextGridOptions[i])
    );
    if (dist < shortestDist) {
      shortestDist = dist;
      closestIdx = i;
    }
  }
  return nextGridOptions[closestIdx];
}

function drawGridPointer(evt = null) {
  if (!evt) {
    if (!lastMouseMoveEvt) return;
    evt = lastMouseMoveEvt;
  }
  let mousePos;

  mousePos = calculateMousePos(evt, false);
  mousePos.x =
    Math.round((mousePos.x - GRID_OFFSET) / GRID_BOX_WIDTH) * GRID_BOX_WIDTH +
    GRID_OFFSET;
  mousePos.y =
    Math.round((mousePos.y - GRID_OFFSET) / GRID_BOX_WIDTH) * GRID_BOX_WIDTH +
    GRID_OFFSET;

  mousePos = calculateNearestValidGridPoint(mousePos);

  gridPointer.style.top =
    mousePos.y +
    CANVAS_MARGIN -
    GRID_POINTER_RADIUS +
    GRID_LINE_WIDTH / 2 +
    'px';
  gridPointer.style.left =
    mousePos.x +
    CANVAS_MARGIN -
    GRID_POINTER_RADIUS +
    GRID_LINE_WIDTH / 2 +
    'px';
}

function hideGridOptionPointers() {
  for (let i = 0; i < 9; i++) {
    let cp = gridOptionPointers[i];
    cp.style.left = '-500px';
    cp.style.top = '-500px';
  }
}

function drawGridOptionPointers() {
  let nextPivotPoint;
  if (racecarsStopsArray[currentPlayer].length <= 0) {
    return;
  } else if (racecarsStopsArray[currentPlayer].length === 1) {
    nextPivotPoint = racecarsStopsArray[currentPlayer][0];
  } else {
    nextPivotPoint = calculateNextPivotPoint();
  }

  // draw dashed Line to next pivot point
  /*
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.beginPath();
  ctx.setLineDash([15, 5]);
  ctx.moveTo(racecarsPos[currentPlayer].x, racecarsPos[currentPlayer].y);
  ctx.lineTo(nextPivotPoint.x, nextPivotPoint.y);
  ctx.strokeStyle = playerColors[currentPlayer];
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'black';
  */

  let topLeftGridPoint = {
    x: nextPivotPoint.x - GRID_BOX_WIDTH,
    y: nextPivotPoint.y - GRID_BOX_WIDTH,
  };

  nextGridOptions = [];
  for (let i = 0; i < 9; i++) {
    let cp = gridOptionPointers[i];

    let canvasX = topLeftGridPoint.x + (i % 3) * GRID_BOX_WIDTH;
    let canvasY = topLeftGridPoint.y + Math.floor(i / 3) * GRID_BOX_WIDTH;

    // cant travel to racecar's current position
    if (
      Math.round(canvasX) === Math.round(racecarsPos[currentPlayer].x) &&
      Math.round(canvasY) === Math.round(racecarsPos[currentPlayer].y)
    ) {
      canvasX = -500;
      canvasY = -500;
    }

    cp.style.left =
      canvasX +
      CANVAS_MARGIN +
      GRID_LINE_WIDTH / 2 -
      GRID_POINTER_RADIUS +
      'px';
    cp.style.top =
      canvasY +
      CANVAS_MARGIN +
      GRID_LINE_WIDTH / 2 -
      GRID_POINTER_RADIUS +
      'px';
    nextGridOptions.push({
      x: canvasX,
      y: canvasY,
    });
  }

  drawGridPointer();

  console.log(nextGridOptions);
}

function calculateNextPivotPoint() {
  let distVect = calculateDirectionVector(
    racecarsStopsArray[currentPlayer][
      racecarsStopsArray[currentPlayer].length - 2
    ],
    racecarsStopsArray[currentPlayer][
      racecarsStopsArray[currentPlayer].length - 1
    ]
  );
  return {
    x:
      racecarsStopsArray[currentPlayer][
        racecarsStopsArray[currentPlayer].length - 1
      ].x + distVect.x,
    y:
      racecarsStopsArray[currentPlayer][
        racecarsStopsArray[currentPlayer].length - 1
      ].y + distVect.y,
  };
}

function getGridPointerPos() {
  return {
    x:
      parseInt(gridPointer.style.left.split('px')[0]) -
      CANVAS_MARGIN +
      GRID_POINTER_RADIUS,
    y:
      parseInt(gridPointer.style.top.split('px')[0]) -
      CANVAS_MARGIN +
      GRID_POINTER_RADIUS,
  };
}

function animateRacecars() {
  // Move somewhere else, maybe into hidegridoptions
  gridPointer.style.left = '-500px';
  gridPointer.style.top = '-500px';

  let carVects = [];
  let carVectAngles = [];

  // 30 Frames = 1 sec. // 90 Frames = 3 sec.
  const ANIMATION_FRAMES = 30;

  for (let i = 0; i < NUM_PLAYERS; i++) {
    let aimPos = racecarsStopsArray[i][racecarsStopsArray[i].length - 1];
    let carVect = calculateDirectionVector(racecarsPos[i], aimPos);
    let carVectAngle = calculateLineAngle(0, 0, carVect.x, carVect.y);

    carVect.x = carVect.x / ANIMATION_FRAMES;
    carVect.y = carVect.y / ANIMATION_FRAMES;

    carVects.push(carVect);
    carVectAngles.push(carVectAngle);
  }

  let frames = 0;
  let animInterval = setInterval(async () => {
    if (animationIsPaused) return;
    if (frames === ANIMATION_FRAMES) {
      clearInterval(animInterval);
      drawGridOptionPointers();
      gameState = GAME_STATE_PICKING;
      return;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawTrack();

    for (let i = 0; i < NUM_PLAYERS; i++) {
      if (checkForBoundaryCrash(racecarsPos[i], carVects[i])) {
        //clearInterval(animInterval);
        animationIsPaused = true;
        await animateExplosion(i);
        racecarsPos[i] = {
          x: -500,
          y: -500,
        };
        // return;
      }

      racecarsPos[i].x += carVects[i].x;
      racecarsPos[i].y += carVects[i].y;

      ctx.setTransform(1, 0, 0, 1, racecarsPos[i].x, racecarsPos[i].y);

      ctx.rotate(degrees_to_radians(carVectAngles[i]));

      // half of the image to the left and top
      ctx.drawImage(
        racecarImgs[i],
        -RACECAR_WIDTH / 2,
        -RACECAR_HEIGHT / 2,
        RACECAR_WIDTH,
        RACECAR_HEIGHT
      );

      ctx.rotate(degrees_to_radians(-carVectAngles[i]));
    }

    // Calculate Center Position of all the racecars for camera
    let avgPos = { x: 0, y: 0 };
    for (let i = 0; i < NUM_PLAYERS; i++) {
      avgPos.x += racecarsPos[i].x;
      avgPos.y += racecarsPos[i].y;
    }
    avgPos.x /= NUM_PLAYERS;
    avgPos.y /= NUM_PLAYERS;

    window.scrollTo(
      avgPos.x - window.innerWidth / 2,
      avgPos.y - window.innerHeight / 2
    );

    frames++;
  }, 1000 / ANIMATION_FRAMES);
}

function drawRacecars(skipIndex = -1) {
  let carVects = [];
  let carVectAngles = [];

  for (let i = 0; i < NUM_PLAYERS; i++) {
    //let aimPos = racecarsStopsArray[i][racecarsStopsArray[i].length - 1];
    let lastPos = racecarsStopsArray[i][racecarsStopsArray[i].length - 2];
    let aimPos = racecarsPos[i];
    let carVect = calculateDirectionVector(lastPos, aimPos);
    let carVectAngle = calculateLineAngle(0, 0, carVect.x, carVect.y);

    carVect.x = carVect.x;
    carVect.y = carVect.y;

    carVects.push(carVect);
    carVectAngles.push(carVectAngle);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  for (let i = 0; i < NUM_PLAYERS; i++) {
    if (skipIndex === i) continue;
    ctx.setTransform(1, 0, 0, 1, racecarsPos[i].x, racecarsPos[i].y);

    ctx.rotate(degrees_to_radians(carVectAngles[i]));

    // half of the image to the left and top
    ctx.drawImage(
      racecarImgs[i],
      -RACECAR_WIDTH / 2,
      -RACECAR_HEIGHT / 2,
      RACECAR_WIDTH,
      RACECAR_HEIGHT
    );

    ctx.rotate(degrees_to_radians(-carVectAngles[i]));
  }
}

function animateExplosion(racecarIndex) {
  return new Promise((resolve) => {
    console.log('animateEXPLOSION!!');
    let spriteRows = 2;
    let spriteCols = 3;

    let frameWidth = explosion.width / spriteCols;
    let frameHeight = explosion.height / spriteRows;

    const ANIMATION_FRAMES = 5;
    let currentFrame = 0;

    updateExplosion();
    let animInterval = setInterval(() => {
      updateExplosion();
    }, 1000 / 12);

    function updateExplosion() {
      console.log('EXPLO INTERVAL');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawTrack();

      drawRacecars(racecarIndex);

      if (currentFrame === ANIMATION_FRAMES) {
        clearInterval(animInterval);
        animationIsPaused = false;
        resolve();
        return;
      }

      let column = currentFrame % spriteCols;
      let row = Math.floor(currentFrame / spriteCols);

      ctx.setTransform(1, 0, 0, 1, 0, 0);

      ctx.drawImage(
        explosion,
        column * frameWidth,
        row * frameHeight,
        frameWidth,
        frameHeight,
        racecarsPos[racecarIndex].x - frameWidth / 2,
        racecarsPos[racecarIndex].y - frameHeight / 2,
        frameWidth,
        frameHeight
      );

      // half of the image to the left and top
      // ctx.drawImage(
      //   racecarImgs[0],
      //   -RACECAR_WIDTH / 2,
      //   -RACECAR_HEIGHT / 2,
      //   RACECAR_WIDTH,
      //   RACECAR_HEIGHT
      // );

      currentFrame++;
    }
  });
}

function checkForBoundaryCrash(currentPos, dirVect) {
  let currentAimPos = {
    x: currentPos.x + dirVect.x,
    y: currentPos.y + dirVect.y,
  };

  let frtp = rightTrackPoints[0];
  let fltp = leftTrackPoints[0];
  let lrtp = rightTrackPoints[rightTrackPoints.length - 1];
  let lltp = leftTrackPoints[leftTrackPoints.length - 1];

  // check for start line / end line intersection
  if (
    intersects(
      currentPos.x,
      currentPos.y,
      currentAimPos.x,
      currentAimPos.y,
      frtp.x,
      frtp.y,
      fltp.x,
      fltp.y
    )
  ) {
    console.log('START LINE!?!');
    return true;
  } else if (
    intersects(
      currentPos.x,
      currentPos.y,
      currentAimPos.x,
      currentAimPos.y,
      lrtp.x,
      lrtp.y,
      lltp.x,
      lltp.y
    )
  ) {
    console.log('FINISH LINE!!!!');
    return true;
  }

  // go through every rightTrack and lefTrack vector to check if car crashes
  for (let i = 0; i < rightTrackPoints.length - 1; i++) {
    let rtp = rightTrackPoints[i];
    let nrtp = rightTrackPoints[i + 1];
    let ltp = leftTrackPoints[i];
    let nltp = leftTrackPoints[i + 1];
    if (
      intersects(
        currentPos.x,
        currentPos.y,
        currentAimPos.x,
        currentAimPos.y,
        rtp.x,
        rtp.y,
        nrtp.x,
        nrtp.y
      )
    ) {
      console.log('CRASH RIGHT???');
      return true;
    } else if (
      intersects(
        currentPos.x,
        currentPos.y,
        currentAimPos.x,
        currentAimPos.y,
        ltp.x,
        ltp.y,
        nltp.x,
        nltp.y
      )
    ) {
      console.log('CRASH LEFT!!!');
      return true;
    }
  }

  return false;
}

function initRacecars() {
  let startLine = calculateDirectionVector(
    firstDrawingRightPos,
    firstDrawingLeftPos
  );

  let startLineAngle = calculateLineAngle(0, 0, startLine.x, startLine.y);

  // Divide Startline vector into (number of players + 1) parts
  startLine.x = startLine.x / (NUM_PLAYERS + 1);
  startLine.y = startLine.y / (NUM_PLAYERS + 1);

  // round to nearest multiple of 40 so that the cars start on a valid grid point
  startLine.x = Math.round(startLine.x / 40) * 40;
  startLine.y = Math.round(startLine.y / 40) * 40;

  // ctx.translate(firstDrawingRightPos.x, firstDrawingRightPos.y);
  ctx.setTransform(1, 0, 0, 1, firstDrawingRightPos.x, firstDrawingRightPos.y);
  ctx.rotate(degrees_to_radians(startLineAngle));
  for (let i = 0; i < NUM_PLAYERS; i++) {
    racecarImgs[i] = new Image();
    racecarImgs[i].onload = function () {
      ctx.translate(startLine.x, startLine.y);

      ctx.rotate(degrees_to_radians(startLineAngle + 90));
      // half of the image to the left and top
      ctx.drawImage(
        racecarImgs[i],
        -RACECAR_WIDTH / 2,
        -RACECAR_HEIGHT / 2,
        RACECAR_WIDTH,
        RACECAR_HEIGHT
      );

      ctx.rotate(degrees_to_radians(-(startLineAngle + 90)));
    };
    racecarImgs[i].src = `assets/racecar-${i + 1}.png`;

    // add array for every car with the first position
    racecarsStopsArray.push([
      {
        x: firstDrawingRightPos.x + (i + 1) * startLine.x,
        y: firstDrawingRightPos.y + (i + 1) * startLine.y,
      },
    ]);

    racecarsPos[i] = { ...racecarsStopsArray[i][0] };
  }

  ctx.rotate(degrees_to_radians(-startLineAngle));

  setTimeout(() => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, 1000);
}

function initExplosion() {
  explosion = new Image();
  explosion.src = `assets/explosion.png`;
}

function calculateLineAngle(p1x, p1y, p2x, p2y) {
  var dy = p2y - p1y;
  var dx = p2x - p1x;
  var theta = Math.atan2(dy, dx); // range (-PI, PI]
  theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  //if (theta < 0) theta = 360 + theta; // range [0, 360)
  return theta;
}

function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi / 180);
}

function traceTrack(evt) {
  let mousePos = calculateMousePos(evt);
  let directVect = calculateDirectionVector(lastDrawingMousePos, mousePos);
  let distance = calculateDistance(directVect);
  let orthVect = calculateNormOrthoVector(directVect, distance);

  if (distance < DRAW_INTERVAL) return;

  // move to a point which lies orthogonally to the connection between mousePos and lastDrawingMousePos
  // RIGHT POS
  let currentRightPos = {
    x: lastDrawingMousePos.x + orthVect.x,
    y: lastDrawingMousePos.y + orthVect.y,
  };

  let nextRightPos = {
    x: currentRightPos.x + directVect.x,
    y: currentRightPos.y + directVect.y,
  };

  if (lastDrawingRightPos) {
    ctx.moveTo(lastDrawingRightPos.x, lastDrawingRightPos.y);
    ctx.lineTo(nextRightPos.x, nextRightPos.y);
  } else {
    // check if the start line should be rounded to be horizontal (dy > dx) or vertical (dy < dx).
    let dx = mousePos.x - lastDrawingMousePos.x;
    let dy = mousePos.y - lastDrawingMousePos.y;
    if (Math.abs(dy) > Math.abs(dx)) {
      currentRightPos.x =
        lastDrawingMousePos.x + (TRACK_WIDTH / 2) * Math.sign(-dy);
      currentRightPos.y = lastDrawingMousePos.y;
    } else {
      currentRightPos.x = lastDrawingMousePos.x;
      currentRightPos.y =
        lastDrawingMousePos.y + (TRACK_WIDTH / 2) * Math.sign(dx);
    }
    // round values to be exactly on grid
    currentRightPos.x =
      Math.round((currentRightPos.x - CANVAS_PADDING) / GRID_BOX_WIDTH) *
        GRID_BOX_WIDTH +
      CANVAS_PADDING;
    currentRightPos.y =
      Math.round((currentRightPos.y - CANVAS_PADDING) / GRID_BOX_WIDTH) *
        GRID_BOX_WIDTH +
      CANVAS_PADDING;

    ctx.beginPath();
    ctx.moveTo(currentRightPos.x, currentRightPos.y);
    ctx.lineTo(nextRightPos.x, nextRightPos.y);
  }

  // dont need curretnRightPos??
  // ctx.moveTo(currentRightPos.x, currentRightPos.y);
  // ctx.lineTo(nextRightPos.x, nextRightPos.y);

  // LEFT POS
  let currentLeftPos = {
    x: lastDrawingMousePos.x - orthVect.x,
    y: lastDrawingMousePos.y - orthVect.y,
  };

  let nextLeftPos = {
    x: currentLeftPos.x + directVect.x,
    y: currentLeftPos.y + directVect.y,
  };

  if (lastDrawingLeftPos) {
    ctx.moveTo(lastDrawingLeftPos.x, lastDrawingLeftPos.y);
    ctx.lineTo(nextLeftPos.x, nextLeftPos.y);
  } else {
    // check if the start line should be rounded to be horizontal (dy > dx) or vertical (dy < dx).
    let dx = mousePos.x - lastDrawingMousePos.x;
    let dy = mousePos.y - lastDrawingMousePos.y;
    if (Math.abs(dy) > Math.abs(dx)) {
      currentLeftPos.x =
        lastDrawingMousePos.x - (TRACK_WIDTH / 2) * Math.sign(-dy);
      currentLeftPos.y = lastDrawingMousePos.y;
    } else {
      currentLeftPos.x = lastDrawingMousePos.x;
      currentLeftPos.y =
        lastDrawingMousePos.y - (TRACK_WIDTH / 2) * Math.sign(dx);
    }
    // round values to be exactly on grid
    currentLeftPos.x =
      Math.round((currentLeftPos.x - CANVAS_PADDING) / GRID_BOX_WIDTH) *
        GRID_BOX_WIDTH +
      CANVAS_PADDING;
    currentLeftPos.y =
      Math.round((currentLeftPos.y - CANVAS_PADDING) / GRID_BOX_WIDTH) *
        GRID_BOX_WIDTH +
      CANVAS_PADDING;
    ctx.moveTo(currentLeftPos.x, currentLeftPos.y);
    ctx.lineTo(nextLeftPos.x, nextLeftPos.y);
  }

  // ctx.moveTo(currentLeftPos.x, currentLeftPos.y);
  // ctx.lineTo(nextLeftPos.x, nextLeftPos.y);

  lastDrawingMousePos = mousePos;
  lastDrawingLeftPos = nextLeftPos;
  lastDrawingRightPos = nextRightPos;

  if (!firstDrawingRightPos) {
    firstDrawingRightPos = currentRightPos;
    firstDrawingLeftPos = currentLeftPos;
    rightTrackPoints[0] = firstDrawingRightPos;
    leftTrackPoints[0] = firstDrawingLeftPos;
    ctx.moveTo(firstDrawingRightPos.x, firstDrawingRightPos.y);
    ctx.lineTo(firstDrawingLeftPos.x, firstDrawingLeftPos.y);
    ctx.stroke();
  }

  rightTrackPoints.push(nextRightPos);
  middleTrackPoints.push(mousePos);
  leftTrackPoints.push(nextLeftPos);

  if (middleTrackPoints.length % 5 === 0) {
    console.log(rightTrackPoints);
  }

  // MOVE BACK TO CURSOR
  ctx.moveTo(mousePos.x, mousePos.y);

  ctx.stroke();
}

function calculateNormOrthoVector(vect, magnitude) {
  return {
    x: (-vect.y / magnitude) * (TRACK_WIDTH / 2),
    y: (vect.x / magnitude) * (TRACK_WIDTH / 2),
  };
}

function calculateDirectionVector(pos1, pos2) {
  return {
    x: pos2.x - pos1.x,
    y: pos2.y - pos1.y,
  };
}

function calculateDistance(vect) {
  return Math.sqrt(Math.pow(vect.x, 2) + Math.pow(vect.y, 2));
}

// returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
function intersects(a, b, c, d, p, q, r, s) {
  var det, gamma, lambda;
  det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  } else {
    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1;
  }
}

function calculateMousePos(evt, onCanvas = true) {
  if (evt.changedTouches) {
    evt = evt.changedTouches[0];
  }
  var rect = onCanvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
  var root = onCanvas
    ? { scrollLeft: 0, scrollTop: 0 }
    : document.documentElement;
  var mouseX = evt.clientX - rect.left + root.scrollLeft;
  var mouseY = evt.clientY - rect.top + root.scrollTop;
  return {
    x: mouseX,
    y: mouseY,
  };
}

function calculateMousePosTouch(evt, onCanvas = true) {
  console.log(evt.clientX);
  evt = evt.changedTouches[0];
  var rect = onCanvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
  var root = onCanvas
    ? { scrollLeft: 0, scrollTop: 0 }
    : document.documentElement;
  var mouseX = evt.clientX - rect.left + root.scrollLeft;
  var mouseY = evt.clientY - rect.top + root.scrollTop;
  return {
    x: mouseX,
    y: mouseY,
  };
}

function drawRacecarsHistory() {
  for (let i = 0; i < NUM_PLAYERS; i++) {
    if (!racecarsStopsArray[i]) continue;
    ctx.beginPath();
    ctx.moveTo(racecarsStopsArray[i][0].x, racecarsStopsArray[i][0].y);
    for (let j = 1; j < racecarsStopsArray[i].length - 1; j++) {
      ctx.lineTo(racecarsStopsArray[i][j].x, racecarsStopsArray[i][j].y);
    }
    // Do not draw line to nirvana
    if (racecarsPos[i].x > 0) {
      ctx.lineTo(racecarsPos[i].x, racecarsPos[i].y);
    }
    ctx.strokeStyle = playerColors[i];
    ctx.stroke();
  }
  ctx.strokeStyle = 'black';
}

function drawTrack(drawEndLine = true) {
  ctx.beginPath();
  ctx.moveTo(rightTrackPoints[0].x, rightTrackPoints[0].y);
  for (let i = 1; i < rightTrackPoints.length; i++) {
    ctx.lineTo(rightTrackPoints[i].x, rightTrackPoints[i].y);
  }
  ctx.moveTo(leftTrackPoints[0].x, leftTrackPoints[0].y);
  for (let i = 1; i < leftTrackPoints.length; i++) {
    ctx.lineTo(leftTrackPoints[i].x, leftTrackPoints[i].y);
  }
  ctx.stroke();

  // draw startline
  ctx.beginPath();
  ctx.moveTo(firstDrawingRightPos.x, firstDrawingRightPos.y);
  ctx.lineTo(firstDrawingLeftPos.x, firstDrawingLeftPos.y);
  ctx.stroke();

  // draw Endline
  if (drawEndLine) {
    ctx.beginPath();
    ctx.moveTo(
      rightTrackPoints[rightTrackPoints.length - 1].x,
      rightTrackPoints[rightTrackPoints.length - 1].y
    );
    ctx.lineTo(
      leftTrackPoints[leftTrackPoints.length - 1].x,
      leftTrackPoints[leftTrackPoints.length - 1].y
    );
    ctx.stroke();
  }

  // if draw race cars history
  if (true) {
    drawRacecarsHistory();
  }
}

function drawBoard() {
  for (var x = 0; x <= GRID_WIDTH; x += GRID_BOX_WIDTH) {
    gridCtx.moveTo(GRID_LINE_WIDTH / 2 + x + CANVAS_PADDING, CANVAS_PADDING);
    gridCtx.lineTo(
      GRID_LINE_WIDTH / 2 + x + CANVAS_PADDING,
      GRID_HEIGHT + CANVAS_PADDING
    );
  }

  for (var x = 0; x <= GRID_HEIGHT; x += GRID_BOX_WIDTH) {
    gridCtx.moveTo(CANVAS_PADDING, GRID_LINE_WIDTH / 2 + x + CANVAS_PADDING);
    gridCtx.lineTo(
      GRID_WIDTH + CANVAS_PADDING,
      GRID_LINE_WIDTH / 2 + x + CANVAS_PADDING
    );
  }
  gridCtx.strokeStyle = '#ddd';
  gridCtx.stroke();
}
