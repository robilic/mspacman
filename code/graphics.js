
drawLevel = function () {
  // draw screen tile-by-tile
  t0 = performance.now();

  for (x = 0; x < levelWidth; x++) {
		for (y = 0; y < levelHeight; y++) {
			drawTileId(level[y][x], x, y);
		}
	}

  t1 = performance.now();
  P_draw_time = t1-t0;
};

drawCachedLevel = function () {
  // copy the pre-drawn level to the screen
  t0 = performance.now();
  d_buf.drawImage(bkgCanvas, 0, 0);
  t1 = performance.now();

  P_draw_time = t1-t0;
};

drawTitleScreen = function () {
  d_buf.drawImage(titleScreen, 0,0);
};

drawPills = function () {
  // draw pills (to be overlaid with level)

  // you can't have pills on the edges either
  for (x = 1; x < levelWidth-1; x++) {
    // you can't have pills at the very top or bottom
    for (y = 4; y < levelHeight-3; y++) {
      if (pills[y][x] > 0) {
        drawTileId(pills[y][x], x, y);
      }
    }
  }
};

renderBackground = function (l) {
  // pre-generate an image with all the level tiles
  console.log("l: " + l + " bgTiles:" + bgTiles.src);

  for (x = 0; x < levelWidth; x++) {
    for (y = 0; y < levelHeight; y++) {
      renderBkgTileId(level[y][x], x, y);
    }
  }
};

drawActor = function (actor) {
  // draw the tile based on the size of the player sprite
  // and the animFrame of animation plus the direction
  // left, right, up, down
  // 3 animFrames
  switch (actor.dir) {
    case 'left':
      dir = 0;
      break;
    case 'right':
      dir = 1;
      break;
    case 'up':
      dir = 2;
      break;
    case 'down':
      dir = 3;
      break;
    default:
      break;
  }

  source_x = pTileWidth * actor.animFrame;
  source_y = pTileHeight * dir;
  // later we will draw offset by 4 pixels since the level is 8x8 and sprite is 16x16
  d_buf.drawImage(pacTiles, source_x, source_y, pTileWidth, pTileHeight,
                actor.x-4, actor.y-4, pTileWidth, pTileHeight);
};

drawGhost = function (g) {
  // ghosts are red, pink, blue, orange, eaten, eyes
  // ghosts only have 2 frames
  switch (g.dir) {
    case 'left':
      dir = 0;
      break;
    case 'right':
      dir = 1;
      break;
    case 'up':
      dir = 2;
      break;
    case 'down':
      dir = 3;
      break;
    default:
      break;
  }

  source_x = (gTileWidth * dir * 2) + (gTileWidth * Math.floor(g.animFrame));  // which direction * 2 frames + frame 1/2

  if (g.state == 'GOHOME') {
    source_y = gTileHeight * 5;  // if ghost is going home, draw the eyes
  } else {
    source_y = gTileHeight * ((g.state == 'FRIGHTENED') ? 4 : g.id);  // if ghost is frightened draw the blue sprites
  }
  // later we will draw offset by 4 pixels since the level is 8x8 and sprite is 16x16
  d_buf.drawImage(ghostTiles, source_x, source_y, gTileWidth, gTileHeight,
                g.x-4, g.y-4, gTileWidth, gTileHeight);
};

drawGhosts = function () {
  for (g=0; g<ghosts.length; g++) {
    drawGhost(ghosts[g]);
  }
};

drawLivesRemaining = function () {
  for (i=0; i<game.lives; i++) {
    d_buf.drawImage(pacTiles, 0, pTileHeight * 1, pTileWidth, pTileHeight,
                16 + (pTileWidth * i), 272, pTileWidth, pTileHeight);
  }
};

drawActorHitBox = function(actor, color) {
  // let's draw the current grid location we're in for hit detection
  d_buf.beginPath();
  d_buf.strokeStyle = color;
  d_buf.lineWidth = "1";
  d_buf.rect(actor.cx*8, actor.cy*8, 8, 8);
  d_buf.stroke();
};

// draw background tile #id on screen at grid position x,y
drawTileId = function (tileId, dest_x, dest_y) {
  source_x = bgTileWidth * (tileId % bgTileSheetWidth);
  source_y = bgTileHeight * (Math.floor(tileId / bgTileSheetWidth));

  d_buf.drawImage(bgTiles, source_x, source_y, bgTileWidth, bgTileHeight, 
            bgTileWidth * dest_x, bgTileHeight * dest_y, bgTileWidth, bgTileHeight);
};

// draw background tile #id off screen at grid position x,y
renderBkgTileId = function (tileId, dest_x, dest_y) {
  source_x = bgTileWidth * (tileId % bgTileSheetWidth);
  source_y = bgTileHeight * (Math.floor(tileId / bgTileSheetWidth));

  bkgCtx.drawImage(bgTiles, source_x, source_y, bgTileWidth, bgTileHeight, 
            bgTileWidth * dest_x, bgTileHeight * dest_y, bgTileWidth, bgTileHeight);
};

// draw background tile x, y on screen at grid position dest_x, dest_y
drawBgTileXY = function (tilesheet_x, tilesheet_y, dest_x, dest_y) {
  source_x = bgTileWidth * tilesheet_x;
  source_y = bgTileHeight * tilesheet_y;

  d_buf.drawImage(bgTiles, source_x, source_y, bgTileWidth, bgTileHeight, 
            bgTileWidth * dest_x, bgTileHeight * dest_y, bgTileWidth, bgTileHeight);
};
