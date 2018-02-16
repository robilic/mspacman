# mspacman

A simple Pac-man style game written in Javascript, using HTML Canvas. It's complete enough to be fun
to play, however there are some more things that it needs to be 'finished'.

Pixel dimensions of the screen are 224 x 288
Playfield is 28 x 36 tiles in size for a total of 1,008 - 8x8 tiles

Notable positions: 
13,26 - pac start
13,14 - ghost just left house
11-13-15, 17 - ghost in house
13,20 - under ghost house
1,4  26,4 - top corners
1,32 26,32 - bottom corners 
15 13,14 -- ghost house door
16
253, 254 - door tile ID's

+ double buffer background graphics
+ add keys for debug, drawing layers
+ add dots
+ add ghosts
+ add tunnels
+ no animation if pac not moving
+ add ghost AI (scatter, chase, run)
+ fix turns (pacman can't turn unless the block he's going into is free)
+ skip top/bottom and edges of screen when drawing pills (micro-op)
+ increment ghost speeds 75, 85, 95% (25fps = 18.75, 21.25, 23.75)
+ add slowdown when eating dots
+ eating dot slows pac down .5 not 1
+ add ability to eat ghosts
+ make ghosts go home
+ allow ms pac to die
+ allow levels to 'end'
+ implement lives
+ add a 'game loop'
+ draw pacs on bottom of screen to show lives left
+ add more maps

TODO:
switch AI from scatter to chase: 7, 20, 7, 20, 5, 20, 5, 2000
add a little bit of leeway to turns
die animation (mouth open up left down right)
add fruit, make it dance around
make ghosts start in home
release ghosts based on counters
add key to +/- speed
call 'tiles' something else. art, graphics, bitmaps, whatever

Fruit Scoring:

1, Cherry, 100
2, Strawberry, 200
3, Orange, 500
4, Pretzel, 700
5, Apple, 1000
6, Pear, 2000
7, Banana, 5000


Power Pellet lasts about 6 seconds, not counting the half second pauses when you eat a ghost
FRAME_RATE * 6

Game loop notes

Not Playing - 'insert quarter message'
Playing - 
             Init Pac/Ghosts/Level
             Play Game
             Die? 
               Lives left? ----- remove live reset ghosts and pac
               No lives ----- end game
             Clear pills ---- reset ghosts, pac, pills

Levels need ' ' . and o as the first 3 tiles
Ghost door needs to be #253

levels 3 and 4 should be ready to playtest

5, 6 - resize image, re-arrange some tiles


For more Pac-man info, check out http://www.gamasutra.com/view/feature/3938/the_pacman_dossier.php
