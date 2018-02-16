
// performance logging
var P_array = [];
var P_draw_time = "0.000";

// background tiles
var bgTiles = new Image();
var bgTileWidth = 8, bgTileHeight = 8;

var level_1_tiles = new Image();
var level_2_tiles = new Image();
var level_3_tiles = new Image();
var level_4_tiles = new Image();
var level_5_tiles = new Image();
var level_6_tiles = new Image();

// actor tiles - really just Pacman
var pacTiles = new Image();
var pTileWidth = 16, pTileHeight = 16;
var pTileSheetWidth = 3;
var pacFrames = 2;

// ghost tiles
var ghostTiles = new Image();
var gTileWidth = 16, gTileHeight = 16;
var gTileSheetWidth =  8;
var ghostFrames = 2;

// misc tiles
var titleScreen = new Image();

var levelWidth = 28, levelHeight = 36;

// passable tiles (contains ghost house doors)
var passable = new Set([0,253,254]);

// ghost house
var h = { cx: 13, cy: 15 };

var ctx;  // main graphics context we draw to
var double_buffer = document.createElement('canvas');

titleScreen.onload = function() {
  console.log("loaded titleScreen");
};
titleScreen.src = "gfx/title_screen.png";

var NUM_LEVELS = 6;  // levels are all in the levels.js file

level_1_tiles.onload = function () {
  console.log("loaded level_1_tiles");
};
level_1_tiles.src = "gfx/level_1_tiles.png";

level_2_tiles.onload = function () {
  console.log("loaded level_2_tiles");
};
level_2_tiles.src = "gfx/level_2_tiles.png";

level_3_tiles.onload = function () {
  console.log("loaded level_3_tiles");
};
level_3_tiles.src = "gfx/level_3_tiles.png";

level_4_tiles.onload = function () {
  console.log("loaded level_4_tiles");
};
level_4_tiles.src = "gfx/level_4_tiles.png";

level_5_tiles.onload = function () {
  console.log("loaded level_5_tiles");
};
level_5_tiles.src = "gfx/level_5_tiles.png";

level_6_tiles.onload = function () {
  console.log("loaded level_6_tiles");
};
level_6_tiles.src = "gfx/level_6_tiles.png";

level_background_tiles = [ 0, level_1_tiles, level_2_tiles, level_3_tiles, level_4_tiles, level_5_tiles, level_6_tiles ];

pacTiles.onload = function(){
  console.log("loaded pacTiles");
  actorLoaded = 1;
};
pacTiles.src = "gfx/mspacman.png";

ghostTiles.onload = function() {
  console.log("loaded ghostTiles");
  ghostsLoaded = 1;
};
ghostTiles.src = "gfx/ghosts.png";

var FRAME_RATE = 30;

var settings = {
  draw_level: true,
  draw_pills: true,
	draw_hitboxes: false,
  invincible: false,
  debug_info: true,
  ghost_mode: 0
};

var opposites = {
  up: "down",
  left: "right",
  down: "up",
  right: "left"
};

var pills = [[]];
var pill_count = 0;

var pac = {
  x: 13*8,      // put him under the ghost house
  y: 26*8,
  cx: 0,        // these coordinates are for hit testing
  cy: 0,
  dir: 'left',  // which way pac is looking
  key: '',      // what key the user is hitting
  animFrame: 0,
  slowdown: 0.0
};

var game = {
  lives: 3,
  score: 0,
  level: 1,
  mode: 'ATTRACT', // ATTRACT, PLAYING, INTERMISSION...
  pause: 0,
  pill_time: 0
};

var ghosts = [];

initPac = function() {
  pac.x = 13*8;
  pac.y = 26*8;
  pac.dir = 'left';
  pac.key = '';
  calcActorHitBox(pac);
};

initGhosts = function() {
  ghosts = [];
  ghosts.push({ x: 11*8, y: 14*8, cx: 0, cy: 0, id: 0, dir: 'left', animFrame: 0, eaten: 0, state: 'CHASE', speed: 0.85, acc: 0 });
  ghosts.push({ x: 13*8, y: 14*8, cx: 0, cy: 0, id: 1, dir: 'left', animFrame: 0, eaten: 0, state: 'CHASE', speed: 0.90, acc: 0 });
  ghosts.push({ x: 15*8, y: 14*8, cx: 0, cy: 0, id: 2, dir: 'right', animFrame: 0, eaten: 0, state: 'SCATTER', speed: 0.75, acc: 0 });
  ghosts.push({ x: 17*8, y: 14*8, cx: 0, cy: 0, id: 3, dir: 'right', animFrame: 0, eaten: 0, state: 'SCATTER', speed: 0.80, acc: 0 });
	
	for (g=0; g<ghosts.length; g++) {
	  calcActorHitBox(ghosts[g]);
	}
};

initPills = function(l) {
  // copy the pills from the levels.js to the current level

  for (y = 0; y < level_pills_list[l].length; y++) {
    pills[y] = level_pills_list[l][y].slice();
  }

  pill_count = 0;
  for (y = 0; y < level_pills_list[l].length; y++) {
    for (x = 0; x < level_pills_list[l][y].length; x++) {
      if (level_pills_list[l][y][x] > 0) { pill_count++; }
    }
  }

  console.log(pill_count + " pills loaded");
};

checkPills = function () {
  // hit-detection and management of pills
  p = pills[pac.cy][pac.cx];
  if (p > 0) {
    pills[pac.cy][pac.cx] = 0; // clear the pill
    pill_count--;

    switch (p) {
      case 1: // regular pill
        game.score += 10;
        pac.slowdown += 0.5;
      break;
      case 2: // power pellet
        game.score += 50;
        makeGhostsVulnerable();
        game.pill_time = FRAME_RATE * 6; // ghosts stay killable for 6 seconds
      break;
    }

  }
  if (pill_count < 1) {
    game.pause = FRAME_RATE * 2;
    game.mode = 'NEXTLEVEL';
  }
};

makeGhostsInvulnerable = function () {
  for (g=0; g<ghosts.length; g++) {
    if (ghosts[g].state != 'GOHOME') {  // don't restore eaten ghosts going home
      ghosts[g].state = 'CHASE';
      ghosts[g].speed = 0.75;
    }
  }
};

makeGhostsVulnerable = function () { // turn them blue so Pacman can eat them
  for (g=0; g<ghosts.length; g++) {
    if (ghosts[g].state != 'GOHOME') {  // don't restore eaten ghosts going home
      ghosts[g].state = 'FRIGHTENED';
      ghosts[g].speed = 0.55;
    }
  }
};

doHitDetection = function () {
  // check for ghost-player collisions
  for (g=0; g<ghosts.length; g++) {
    if (ghosts[g].cx == pac.cx && ghosts[g].cy == pac.cy) {
      if (ghosts[g].state == 'GOHOME') {
        // don't do anything the ghosts is going back to the house
      } else if (ghosts[g].state == 'FRIGHTENED') {
        // if ghost is frightened, eating him makes him 'go home'
        // give pac his points        
        ghosts[g].state = 'GOHOME';
        ghosts[g].speed = 0.9; // speed them up a little bit
        game.score += 200;
      } else if (!settings.invincible) {
        // if ghost is invulnerable
        game.mode = 'PACDEAD';
        game.lives -= 1;
        game.pause = FRAME_RATE * 3;
        // kill pac
        // reset ghosts
        // go to ready screen
      }
    }
  }
};

calcActorHitBox = function(actor) {
  ax = actor.x+3; ay = actor.y+3; // move to correct pixel
  lx = Math.floor(ax / 8); ly = Math.floor(ay / 8); // find the grid pos of player
  actor.cx = lx; actor.cy = ly;
};

showDebugInfo = function () {
	d_buf.beginPath();
  d_buf.rect(1, 1, 240, 10);
  d_buf.fillStyle = '#303030';
  d_buf.fill();

	debugInfoString = "P:" + pac.x + "," + pac.y + " L:" + level[Math.floor(pac.y/8)][Math.floor((pac.x - 2)/8)] + 
                    " C:" + Math.floor(pac.y/8) + ", " + Math.floor((pac.x - 2)/8) +
                    " T:" + P_draw_time.toFixed(3) +
                    " M:" + settings.ghost_mode + " Inv:" + settings.invincible;
  drawText(debugInfoString, "yellow", 1, 1);
};

showGameInfo = function () {
  d_buf.beginPath();
  d_buf.rect(1, 10, 240, 10);
  d_buf.fillStyle = '#303030';
  d_buf.fill();

  gameInfoString = "Score: " + game.score + "     " + "Lives: " + game.lives + " Pills left: " + pill_count;
  drawText(gameInfoString, "orange", 1, 2);
};

moveGhosts = function () {
  for (g = 0; g < ghosts.length; g++) {
    // increment accumulator and see if the ghost should move
    ghosts[g].acc += ghosts[g].speed;
    if (ghosts[g].acc > 1.0) {
      switch (ghosts[g].state) {
        case 'SCATTER':
          moveGhostScatter(ghosts[g]);
        break;
        case 'CHASE':
          moveGhostChase(ghosts[g]);
        break;
        case 'FRIGHTENED':
          moveGhostFrightened(ghosts[g]);
        break;
        case 'GOHOME':
          moveGhostGoHome(ghosts[g]);
        break;
      } // end switch    
      ghosts[g].acc -= 1;
      calcActorHitBox(ghosts[g]);
    }
  }

  if (game.pill_time > 0) {
    game.pill_time--;
    if (game.pill_time == 0) {
      makeGhostsInvulnerable(); // restore the ghosts after the pill expires
    }
  }
};

tryToMoveRandomDir = function (a) {
  // pick a random one, and try it
  dirs = ['up', 'left', 'right', 'down'];
  for (i = 0; i < dirs.length; i++) {
    // remove the direction we can't go - 180 of our current
    if (dirs[i] === opposites[a.dir]) {
      dirs.remove(i);
    }
  }
  random_choice = dirs[Math.floor(Math.random() * dirs.length)];
  ghost_moved = false;

  switch (random_choice) {
    case 'left':
      ghost_moved = tryToMove('left', a);
      break;
    case 'right':
      ghost_moved = tryToMove('right', a);
      break;
    case 'up':
      ghost_moved = tryToMove('up', a);
      break;
    case 'down':
      ghost_moved = tryToMove('down', a);
      break;
    default:
      console.log("Error: randomly chose a bad way");
      break;
  }   // end switch(g.dir)
  // if it didn't work, try each of the other ways
  i = 0;
  while (!ghost_moved) {
      if (i > 2) { ghost_moved = true; console.log("we got stuck"); }

      switch (dirs[i]) {
        case 'left':
          ghost_moved = tryToMove('left', a);
          break;
        case 'right':
          ghost_moved = tryToMove('right', a);
          break;
        case 'up':
          ghost_moved = tryToMove('up', a);
          break;
        case 'down':
          ghost_moved = tryToMove('down', a);
          break;
        default:
          console.log("Error: ghost has nowhere to go");
          break;
      }   // end switch(g.dir)
      i++; // try the next direction
  }
  return ghost_moved;
};

tryToMove = function (dir, a) {
  moved = false;
  switch (dir) {
    case 'left':
      if (cellToLeft(a) == 0) { moveActorLeft(a); moved = true; }
      break;
    case 'right':
      if (cellToRight(a) == 0) { moveActorRight(a); moved = true; }
      break;
    case 'up':
      if (passable.has(cellAbove(a))) { moveActorUp(a); moved = true; }
      break;
    case 'down':
      if (a.state == 'GOHOME') {
        if (passable.has(cellBelow(a))) { moveActorDown(a); moved = true; }
      } else {
        if (cellBelow(a) ==  0) { moveActorDown(a); moved = true; }
      }
      break;
    default:
      console.log("Error: randomly chose a bad way");
      break;
  }   // end switch(g.dir)
  return moved;
};

keepMoving = function (g) {
  // keep going in the direction the ghost is going
  switch (g.dir) {
    case 'left':
      moveActorLeft(g);
      break;
    case 'right':
      moveActorRight(g);
      break;
    case 'up':
      moveActorUp(g);
      break;
    case 'down':
      moveActorDown(g);
      break;
    default:
      console.log("Error: can't go where we're going");
      break;
  }   // end switch(g.dir)
};

moveGhostScatter = function (g) {
  // this is the SCATTER algorithm
  // just randomly run around

  // are we in an intersection (free in two or more directions other than behind us)
  if (actorIsInIntersection(g)) {
    // try to go in a random direction - we have no goal in mind
    tryToMoveRandomDir(g);
  } else {   // we're not in an intersection, just keep going where we're going
    keepMoving(g);
  }    // end else

  g.animFrame++;
  if (g.animFrame > 1) { g.animFrame = 0;}
};

moveGhostGoHome = function (g) {
  // 'chase' the door of the ghost house
  // adaptation fo the CHASE algorithm

  // are we in an intersection (free in two or more directions other than behind us)
  if (actorIsInIntersection(g)) {
    ghost_moved = false;
    if (g.dir == 'up' || g.dir == 'down') {
      if (g.cx == h.cx) {
        // if equal keep moving up/down
        if (tryToMove(g.dir, g)) { ghost_moved = true; };
      } else if (g.cx > h.cx) { // ghost is on the right of pac
        // if ghost is right of pac try to move left
        if (tryToMove('left', g)) { ghost_moved = true; };
      } else if (g.cx < h.cx) { // ghost is on the left of pac
        // if ghost is left of pac, try to move right
        if (tryToMove('right', g)) { ghost_moved = true; };
      }
    } else {
      if (g.cy == h.cy) {
        // if equal keep moving left/right
        if (tryToMove(g.dir, g)) { ghost_moved = true; };
      } else if (g.cy > h.cy) { // ghost is below pac
        if (tryToMove('up', g)) { ghost_moved = true; };
      } else if (g.cy < h.cy) { // ghost is on top of pac
        if (tryToMove('down', g)) { ghost_moved = true; };
      }
    } 
    if (!ghost_moved) { tryToMoveRandomDir(g); }
  } else {   // we're not in an intersection, just keep going where we're going
    keepMoving(g);
  }    // end else

  g.animFrame = 0; // only show ghost eyes, no animation

  // check if we are IN the ghost house - if so then switch to chase/scatter
  if (g.cy == h.cy && g.cx == h.cx) {
    console.log('ghost made it home');
    g.state = 'SCATTER';
  }
};

moveGhostChase = function (g) {
  // this is the CHASE algorithm
  // move towards pacman to get him

  // are we in an intersection (free in two or more directions other than behind us)
  if (actorIsInIntersection(g)) {
    ghost_moved = false;
    // are we moving vertically or horizontally?
    if (g.dir == 'up' || g.dir == 'down') {
      if (g.cx == pac.cx) {
        // if equal keep moving up/down
        if (tryToMove(g.dir, g)) { ghost_moved = true; };
      } else if (g.cx > pac.cx) { // ghost is on the right of pac
        // if ghost is right of pac try to move left
        if (tryToMove('left', g)) { ghost_moved = true; };
      } else if (g.cx < pac.cx) { // ghost is on the left of pac
        // if ghost is left of pac, try to move right
        if (tryToMove('right', g)) { ghost_moved = true; };
      }
    } else {
      if (g.cy == pac.cy) {
        // if equal keep moving left/right
        if (tryToMove(g.dir, g)) { ghost_moved = true; };
      } else if (g.cy > pac.cy) { // ghost is below pac
        if (tryToMove('up', g)) { ghost_moved = true; };
      } else if (g.cy < pac.cy) { // ghost is on top of pac
        if (tryToMove('down', g)) { ghost_moved = true; };
      }
    } 
    if (!ghost_moved) { tryToMoveRandomDir(g); }
  } else {   // we're not in an intersection, just keep going where we're going
    keepMoving(g);
  }    // end else

  g.animFrame++;
  if (g.animFrame > 1) { g.animFrame = 0;}
};

moveGhostFrightened = function (g) {
  // this is the FRIGHTENED algorithm
  // run from pacman so he can't eat you

  // are we in an intersection (free in two or more directions other than behind us)
  if (actorIsInIntersection(g)) {
    ghost_moved = false;
    // are we moving vertically or horizontally?
    if (g.dir == 'up' || g.dir == 'down') {
      if (g.cx < pac.cx) { // ghost is on the right of pac
        // if ghost is right of pac try to move left
        if (tryToMove('left', g)) { ghost_moved = true; };
      } else if (g.cx > pac.cx) { // ghost is on the left of pac
        // if ghost is left of pac, try to move right
        if (tryToMove('right', g)) { ghost_moved = true; };
      }
    } else {
      if (g.cy < pac.cy) { // ghost is below pac
        if (tryToMove('up', g)) { ghost_moved = true; };
      } else if (g.cy > pac.cy) { // ghost is on top of pac
        if (tryToMove('down', g)) { ghost_moved = true; };
      }
    }

    if (!ghost_moved) { tryToMoveRandomDir(g); }
  } else {   // we're not in an intersection, just keep going where we're going
    keepMoving(g);
  }    // end else

  if (game.pill_time > 2 * FRAME_RATE) { // pulse the ghosts for last 2 secs
    g.animFrame = 0;
  } else {
    g.animFrame += 0.25;
    if (g.animFrame > 2) {
      g.animFrame = 0;
    }
  }
};

isHorizCentered = function (a) { return (a.x % 8 == 0); };
isVertCentered = function (a) { return (a.y % 8 == 0); };

actorIsInIntersection = function (a) { return isHorizCentered(a) && isVertCentered(a); };

cellToLeft = function(a) { return level[a.cy][a.cx-1]; };
cellToRight = function(a) { return level[a.cy][a.cx+1]; };
cellAbove = function(a) { return level[a.cy-1][a.cx]; };
cellBelow = function(a) { return level[a.cy+1][a.cx]; };

moveActorRight = function (a) {
  a.dir = 'right'; a.x = a.x + 2;
  if (a.x == 216) {   // enter tunnel?
    teleportActorToLeft(a);
  }
};

moveActorLeft = function (a) {
  a.dir = 'left'; a.x =a.x - 2; 
  if (a.cx == 0) {    // enter tunnel?
    teleportActorToRight(a);
  }
};

moveActorUp = function (a) { a.dir = 'up'; a.y = a.y - 2; };
moveActorDown = function (a) { a.dir = 'down'; a.y = a.y + 2; };

teleportActorToLeft = function (a) { a.x = 0; };
teleportActorToRight = function (a) { a.x = 216; };

movePlayer = function (o) {
  if (o.slowdown > 1.0) {
    o.slowdown = 0;
  } else {
    player_moved = false;
    switch (o.dir) {
      case 'left':
        if (level[Math.floor(o.y / 8)][Math.floor((o.x - 2)/8)] == 0) {
          moveActorLeft(o);
          player_moved = true;
        }
        break;
      case 'right':
        if (level[Math.floor(o.y / 8)][Math.floor((o.x + 8)/8)] == 0) {
          moveActorRight(o);
          player_moved = true;
        }
        break;
      case 'up': 
        if (level[Math.floor((o.y - 2) / 8)][Math.floor(o.x / 8)] == 0) {
          moveActorUp(o);
          player_moved = true;
        }
        break;
      case 'down':
        if (level[Math.floor((o.y + 8) / 8)][Math.floor(o.x / 8)] == 0) {
          moveActorDown(o);
          player_moved = true;
        }
        break;
      default:
        console.log('movePlayer() leaked through');
        break;
    }
    
    if (player_moved) { o.animFrame++; }
    if (o.animFrame > pacFrames) { o.animFrame = 0; }
    calcActorHitBox(o);
  }
}

processInput = function () {
  // we can only change direction if we're in an intersection
  if (actorIsInIntersection(pac)) {
    switch (pac.key) {
      case 'left':
        if (cellToLeft(pac) == 0) { pac.dir = 'left'; }
        break;
      case 'right':
        if (cellToRight(pac) == 0) { pac.dir = 'right'; }
        break;
      case 'up': 
        if (cellAbove(pac) == 0) { pac.dir = 'up'; }
        break;
      case 'down':
        if (cellBelow(pac) == 0) { pac.dir = 'down'; }
        break;
    }
  }
};

$(document).bind('keydown', function(event) {
k = event.which
  switch (k) {
    case 37:
      pac.key = 'left';
      break;
    case 38:
      pac.key = 'up';
      break;
    case 39:
      pac.key = 'right';
      break;
    case 40:
      pac.key = 'down';
      break;
  }
});

$(document).bind('keyup', function(event) {
  if (game.mode == 'ATTRACT') {
    k = event.which
    switch (k) {
      case 32:
        // if player hits space bar, go out of attract mode and start playing a new game
        console.log("exiting attract mode");
        newGame();
        break;
    }
  } else {
    pac.key = '';

    k = event.which
    switch (k) {
      case 37:
        break;
      case 38:
        break;
      case 39:
        break;
      case 40:
        break;
      case 68: // 'D'
        settings.debug_info = !settings.debug_info;
        break;
  		case 72: // 'H'
  			settings.draw_hitboxes = !settings.draw_hitboxes;
  			break;
      case 73: // 'I'
        settings.invincible = !settings.invincible;
        break;
      case 76: // 'L'
        settings.draw_level = !settings.draw_level;
        break;
      case 80: // 'P'
        settings.draw_pills = !settings.draw_pills;
        break;
    }
  };
});

initLevel = function () {
  l = (game.level > NUM_LEVELS ? (game.level % NUM_LEVELS) : game.level);
  bgTiles = level_background_tiles[l];
  // this lets us use background tile sheets of any width
  bgTileSheetWidth = bgTiles.width / 8;
  level = level_background_list[l];
  renderBackground(l);  // generate the background from current level tiles
  initPills(l);
  initGhosts();
  initPac();
};

resetLevel = function () {
  initGhosts();
  initPac();
};

window.onload = function() {
  console.log(".onload()");
  var c=document.getElementById("screen");
  ctx=c.getContext("2d");

  double_buffer.width = screen.width; double_buffer.height = screen.height;
  d_buf = double_buffer.getContext('2d');
  console.log("created double buffer: " + d_buf);

  // offscreen buffer for background
  bkgCanvas = document.createElement('canvas');
  bkgCanvas.width = c.width;
  bkgCanvas.height = c.height;
  bkgCtx = bkgCanvas.getContext('2d');

  setInterval(function() { gameLoop(); }, 1000/FRAME_RATE);
};
  
gameLoop = function() {
  if (game.mode == 'ATTRACT') {
    attractMode();
  } else if (game.mode == 'GAMEOVER') {
    gameOver();
  } else if (game.mode == 'READY') {
    readyPrompt();
  } else if (game.mode == 'PACDEAD') {
    pacDead();
  } else if (game.mode == 'NEXTLEVEL') {
    nextLevel();
  } else {
    playGame();
  }
  ctx.drawImage(double_buffer, 0,0); // copy double buffer to screen
}

attractMode = function () {
  // show title screen and do whatever until player wishes to start playing
  drawTitleScreen();
  drawText("Press space to play!", "yellow", 7, 25);
  // make pac/ghosts fly around?
};

readyPrompt = function () {
  // ready! prompt for level starts
  game.pause -= 1;

  drawCachedLevel();
  drawGhosts();
  drawPills();
  drawActor(pac);
  drawLivesRemaining();
  drawText("READY!", "yellow", 12, 21);

  if (game.pause < 0) {
    game.mode = 'PLAYING';
  }
};

newGame = function () {
  game.mode = 'READY';
  game.lives = 2;
  game.level = 1;
  game.score = 0;
  game.pause = FRAME_RATE * 2;  // show the ready prompt for 2 seconds

  initLevel();
};

nextLevel = function () {
  game.pause -= 1;
  drawCachedLevel();
  drawPills();
  drawActor(pac);
  drawLivesRemaining();

  if (game.pause < 0) {
      game.pause = FRAME_RATE * 2;
      game.mode = 'READY';
      game.level += 1;
      initLevel();
  }
};

pacDead = function () {
  game.pause -= 1;
  // show dead pac
  drawCachedLevel();
  drawPills();
  drawActor(pac);

  if (game.pause < 0) {
    if (game.lives >= 0) {
      resetLevel();
      game.pause = FRAME_RATE * 2;
      game.mode = 'READY';
    } else {
      game.mode = 'GAMEOVER';
      game.pause = FRAME_RATE * 4;
    }
  }
};

playGame = function () {
  // play the game
  processInput();
  movePlayer(pac);
  moveGhosts();
  checkPills();
  
  // configurable hot-key things for debbuging etc
  if (settings.draw_level) { drawCachedLevel(); };
  if (settings.draw_pills) { drawPills(); }
  if (settings.debug_info) { showDebugInfo(); }
  if (settings.draw_hitboxes) {
    for(g=0; g<ghosts.length; g++) { drawActorHitBox(ghosts[g], 'blue'); }
    drawActorHitBox(pac, 'red');
  }

  showGameInfo();
  drawActor(pac);
  drawGhosts();
  drawLivesRemaining();

  doHitDetection();
};

gameOver = function () {
    game.pause -= 1;

    drawCachedLevel();
    drawPills();
    drawActor(pac);
    drawText("GAME", "yellow", 13, 17);
    drawText("OVER", "yellow", 13, 18);
    showGameInfo();

    if (game.pause < 0) {
      game.mode = 'ATTRACT';
    }    
};

drawText = function (s, c, x, y) {
  d_buf.beginPath();
  d_buf.font = "9px Monaco";
  d_buf.fillStyle = c;
  d_buf.fillText(s, x*8, y*8);
};

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

