//----------global defaults
var backgroundColor, numConstellations;
var swarms;
const numSwarms = 2;
const birdSize = 8;
const minSwarmSpeed = 3;
const maxSwarmSpeed = 18;
const rabbitSpeed = 20;
const newDestProb = 0.007
var lightZ = -1000;
const minBirds = 50;
const maxBirds = 300;
const rabbitSize = 50;
const minFlockDistance = 50;
const maxFlockDistance = 100;
const maxDistance = -5000;
const initialSpread = 200;

var flock = true;
var wanderEnabled = true;

//=========================
//Setup & draw functions
//=========================
function setup() {
    makeCanvas();
    resetBirds();
}

function makeCanvas(){
    var canvas = createCanvas(($(window).width()), $(window).height() + 50, WEBGL);
    canvas.parent('canvas-background');
    backgroundColor = "rgba(255, 255, 255, 1)";
};

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

function resetBirds(){
    swarms = new Array(numSwarms);
    skyRabbit = new SkyRabbit(random(-1 * windowWidth, windowWidth), random(-1 * windowHeight, windowHeight), random(0, maxDistance), rabbitSize);
    for (var i = 0; i < swarms.length; i++) {
        swarms[i] = new Swarm(random(-1 * windowWidth, windowWidth), random(-1 * windowHeight, windowHeight), random(0, maxDistance), skyRabbit);
    };

};

function draw() {
    //move all birds
    clear();
    background(backgroundColor);
    noStroke();
    ambientLight(100);
    pointLight(250, 100, 250, -1000, -1000, lightZ);
    pointLight(100, 250, 250, 1000, 1000, lightZ);
    skyRabbit.update();
    updateBirds();
};

function updateBirds(){
    for (var i = 0; i < swarms.length; i++) {
        // fill(swarms[i].r, swarms[i].g, swarms[i].b);
        for (var j = 0; j < swarms[i].birds.length; j++) {
            swarms[i].birds[j].update();
        };
    };
}


//=========================
//Classes
//=========================
var Swarm = function(spawnX, spawnY, spawnZ, target){
  //collection of birds with a common target, speed, and color
  // to-do: give individual speeds to birds, add acceleration to flocking
  this.target = target;
  this.birds = [];
  this.wander = 0;
  this.speed = random(minSwarmSpeed, maxSwarmSpeed);
  this.r = random(0, 255);
  this.g = random(0, 255);
  this.b = random(0, 255);
  this.flockDistance = random(minFlockDistance, maxFlockDistance);
  this.a = 0.5
  this.spawnX = spawnX;
  this.spawnY = spawnY;
  this.spawnZ = spawnZ;
  this.numBirds = Math.floor(random(minBirds, maxBirds));
  this.init = function(){
      for (var i = 0; i < this.numBirds; i++) {
          this.birds.push(new Bird(this, this.spawnX, this.spawnY, this.spawnZ, birdSize));
      };
  };
  this.init();
};

var SkyRabbit = function(x, y, z, r){
    //a flying target that changes destination randomly
    var that = this;
    this.x = x;
    this.y = y;
    this.z = z;
    this.radius = r;
    this.target = {
        x : random(-1 * windowWidth, windowWidth),
        y : random(-1 * windowHeight, windowHeight),
        z : random(maxDistance, 0)
    };

    this.wander = {
        x : 0,
        y : 0,
        z : 0
    };

    this.vector = new Vector(0, -1, 0, rabbitSpeed);

    this.updateTarget = function() {
        this.target = {
            x : random(-1 * windowWidth, windowWidth),
            y : random(-1 * windowHeight, windowHeight),
            z : random(maxDistance, 0)
        };
    };

    this.turnTowards = function(target) {
        //turning is based on adding vectors and scaling back to unit vector
        //destination vector is weighted down for gradual turns
        if (wanderEnabled) {
            //rabbit wander is less impulsive and sudden than bird wander
            this.wander.x += random(-0.01, 0.01);
            this.wander.y += random(-0.01, 0.01);
            this.wander.z += random(-0.01, 0.01);
            if (abs(this.wander.x) > 0.09) {
                this.wander.x *= 0.08
            };
            if (abs(this.wander.y) > 0.09) {
                this.wander.y *= 0.08
            };
            if (abs(this.wander.z) > 0.09) {
                this.wander.z *= 0.08
            };
        };
        var sumVector;
        var vectorToTarget = findUnitVector(this.x, this.y, this.z, target.x, target.y, target.z);
        sumVector = findUnitVector(
            0,
            0,
            0,
            this.vector.x + vectorToTarget.x * 0.1 + this.wander.x,
            this.vector.y + vectorToTarget.y * 0.1 + this.wander.y,
            this.vector.z + vectorToTarget.z * 0.1 + this.wander.z
        );

        sumVector.magnitude = rabbitSpeed;
        this.vector = sumVector;
    };

    this.update = function(){
        //change destination randomly, turn towards it
        var newTarget = random(0, 1);
        if (newTarget < newDestProb) {
            this.updateTarget();
        };

        this.turnTowards(this.target);

        this.x += this.vector.x * this.vector.magnitude;
        this.y += this.vector.y * this.vector.magnitude;
        this.z += this.vector.z * this.vector.magnitude;

        var lineVectorX = this.x + this.vector.x * this.vector.magnitude * 4;
        var lineVectorY = this.y + this.vector.y * this.vector.magnitude * 4;
        var lineVectorZ = this.z + this.vector.z * this.vector.magnitude * 4;

        // stroke(250, 0, 250);
        // line(this.x, this.y, this.z, lineVectorX, lineVectorY, lineVectorZ);

        noStroke();
        var translateX = this.x;
        var translateY = this.y;
        var translateZ = this.z;

        specularMaterial(100, 100, 250);

        translate(translateX, translateY, translateZ);
        sphere(this.radius);
        translate(-1 * translateX, -1 * translateY, -1 * translateZ);
    };
};

var Bird = function(parentSwarm, x, y, z, r){
    //member of a swarm
    var that = this;
    this.spread = initialSpread;
    this.parentSwarm = parentSwarm;
    this.x = x + random(-1 * this.spread, this.spread);
    this.y = y + random(-1 * this.spread, this.spread);
    this.z = z + random(-1 * this.spread, this.spread);
    this.radius = r;
    this.vector = new Vector(0, -1, 0, this.parentSwarm.speed);
    this.wander = {
        x : 0,
        y : 0,
        z : 0
    };
    this.turnTowards = function(target) {
        //turning is based on adding vectors and scaling back to unit vector
        //destination vector is weighted down for gradual turns
        if (wanderEnabled) {
            this.wander = {
                x : random(-0.1, 0.1),
                y : random(-0.1, 0.1),
                z : random(-0.1, 0.1)
            };
        };

        var sumVector;
        var vectorToTarget = findUnitVector(this.x, this.y, this.z, target.x, target.y, target.z);
        sumVector = findUnitVector(
            0,
            0,
            0,
            this.vector.x + vectorToTarget.x * 0.1 + this.wander.x,
            this.vector.y + vectorToTarget.y * 0.1 + this.wander.y,
            this.vector.z + vectorToTarget.z * 0.1 + this.wander.z
        );

        sumVector.magnitude = this.parentSwarm.speed;
        this.vector = sumVector;
    };

    this.turnAway = function(target) {
        //used for flocking
        var sumVector;
        var vectorToTarget = findUnitVector(this.x, this.y, this.z, target.x, target.y, target.z);
        sumVector = findUnitVector(
            0,
            0,
            0,
            this.vector.x - vectorToTarget.x * 0.1,
            this.vector.y - vectorToTarget.y * 0.1,
            this.vector.z - vectorToTarget.z * 0.1
        );

        sumVector.magnitude = this.parentSwarm.speed;
        this.vector = sumVector;
    };

    this.flockAwareness = function(){
        //allows birds to maintain constant distance from neighbors
        for (var i = 0; i < swarms.length; i++) {
            for (var j = 0; j < swarms[i].birds.length; j++) {
                let otherBird = swarms[i].birds[j];
                let distance = findDistance(this.x, this.y, this.z, otherBird.x, otherBird.y, otherBird.z);
                if (distance < this.parentSwarm.flockDistance) {
                    this.turnAway(otherBird);
                };
            };
        };
    };

    this.update = function(){
        this.turnTowards(this.parentSwarm.target);
        if (flock) {
            this.flockAwareness();
        }
        this.x += this.vector.x * this.vector.magnitude;
        this.y += this.vector.y * this.vector.magnitude;
        this.z += this.vector.z * this.vector.magnitude;

        var lineVectorX = this.x + this.vector.x * this.vector.magnitude * 4;
        var lineVectorY = this.y + this.vector.y * this.vector.magnitude * 4;
        var lineVectorZ = this.z + this.vector.z * this.vector.magnitude * 4;

        // stroke(250, 0, 250);
        // line(this.x, this.y, this.z, lineVectorX, lineVectorY, lineVectorZ);

        noStroke();
        var translateX = this.x;
        var translateY = this.y;
        var translateZ = this.z;

        specularMaterial(this.parentSwarm.r, this.parentSwarm.g, this.parentSwarm.b);

        translate(translateX, translateY, translateZ);
        sphere(this.radius);
        translate(-1 * translateX, -1 * translateY, -1 * translateZ);
    };
};

var Vector = function(x, y, z, magnitude) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.magnitude = magnitude;
};

//=========================
//Interactivity functions
//=========================
function keyPressed() {
    if (keyCode) {
        switch (keyCode) {
            case 32:
                flock = !flock;
                console.log(flock);
                break;
        };
    };
};

//=========================
//Angle functions
//=========================
function findUnitVector(x1, y1, z1, x2, y2, z2) {
    //calculates normal vector between two points (in order), converts to unit vector
    var normalVector = new Vector(x2 - x1, y2 - y1, z2 - z1, null);
    var magnitude = sqrt((Math.pow(normalVector.x, 2)) + (Math.pow(normalVector.y, 2)) + (Math.pow(normalVector.z, 2)));
    if (magnitude == 0) {
        var unitVector = new Vector(0, 0, 0, 0);
    } else {
        var unitVector = new Vector(normalVector.x / magnitude, normalVector.y / magnitude, normalVector.z / magnitude, 1);
    };

    return unitVector;
};

function convertUnitToNormalVector(unitVector, magnitude) {
    normalVector = new Vector();
    normalVector.x = unitVector.x * magnitude;
    normalVector.y = unitVector.y * magnitude;
    normalVector.z = unitVector.z * magnitude;
    normalVector.magnitude = magnitude;
    return normalVector;
};

function findDistance(x1, y1, z1, x2, y2, z2) {
    distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));
    return distance;
};
