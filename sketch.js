// Matter.js setup
let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body;

let engine, world;
let letterBodies = [];
let leftWall, rightWall, topWall, bottomWall;
let labels = [];
let staticBodies = [];

const labelWords = ["Empathy", "Experience", "Culture"];
let labelPositions = [
  { x: () => width * 0.2, y: () => height * 0.10 },
  { x: () => width * 0.75, y: () => height * 0.3 },
  { x: () => width * 0.3, y: () => height * 0.55 }
];

function addStaticLabel(x, y, word) {
  let label = new StaticLabel(x, y, word);
  labels.push(label);
}

function setup() {
  let minHeight = 300;
  createCanvas(windowWidth, max(windowHeight, minHeight));

  window.addEventListener('resize', () => {
    resizeCanvas(windowWidth, max(windowHeight, minHeight));
    repositionStaticElements();
    repositionWalls();
  });

  textFont('serif'); // Use serif font globally
  textAlign(CENTER, CENTER);

  engine = Engine.create();
  engine.world.gravity.y = 0;
  world = engine.world;

  for (let i = 0; i < labelWords.length; i++) {
    addStaticLabel(labelPositions[i].x(), labelPositions[i].y(), labelWords[i]);
  }

  let thickness = 100;
  bottomWall = Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, { isStatic: true });
  topWall = Bodies.rectangle(width / 2, -thickness / 2, width, thickness, { isStatic: true });
  leftWall = Bodies.rectangle(-thickness / 2, height / 2, thickness, height, { isStatic: true });
  rightWall = Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, { isStatic: true });
  World.add(world, [bottomWall, topWall, leftWall, rightWall]);
}

function draw() {
  if (width !== windowWidth || height !== windowHeight) {
    resizeCanvas(windowWidth, windowHeight);
    repositionStaticElements();
    repositionWalls();
  }

  clear();
  Engine.update(engine);
  detectCollisions();
  detectStaticLabelCollisions();

  if (frameCount % 20 === 0 && letterBodies.length < 80) {
    let x = random(100, width - 100);
    let y = random(100, height - 100);
    let spark = random(['*', '+', 'x', '•', '.', '✦']);
    letterBodies.push(new FloatingLetter(x, y, spark));
  }

  for (let label of labels) {
    label.display();
  }

  for (let i = letterBodies.length - 1; i >= 0; i--) {
    let l = letterBodies[i];
    l.update();
    if (l.isMouseOver()) {
      l.clicked();
    }
    l.display();
  }

  if (labels.length >= 3) {
    let a = labels[0];
    let b = labels[1];
    let c = labels[2];

    stroke(180);
    let offset = (millis() / 120) % 32;
    drawingContext.setLineDash([5, 20]);
    drawingContext.lineDashOffset = -offset;
    strokeWeight(2);
    noFill();

    let ax = a.body.position.x + a.w / 2;
    let ay = a.body.position.y;
    let bx = b.body.position.x - b.w / 2;
    let by = b.body.position.y;
    let bxr = b.body.position.x + b.w / 2;
    let cx = c.body.position.x - c.w / 2;
    let cy = c.body.position.y;

    bezier(ax, ay, ax + 40, ay + 40, bx - 200, by - 10, bx, by);
    bezier(bxr, by, bxr + 200, by + 100, cx - 200, cy - 100, cx, cy);
  }

  drawingContext.setLineDash([]);
}

function detectCollisions() {
  for (let i = 0; i < letterBodies.length; i++) {
    for (let j = i + 1; j < letterBodies.length; j++) {
      let a = letterBodies[i].body.position;
      let b = letterBodies[j].body.position;
      let d = dist(a.x, a.y, b.x, b.y);
      if (d < (letterBodies[i].w + letterBodies[j].w) / 2) {
        letterBodies[i].clicked();
        letterBodies[j].clicked();
      }
    }
  }
}

function detectStaticLabelCollisions() {
  for (let letter of letterBodies) {
    let pos = letter.body.position;
    for (let label of labels) {
      let lpos = label.body.position;
      let dx = abs(pos.x - lpos.x);
      let dy = abs(pos.y - lpos.y);
      let overlapX = dx < (letter.w / 2 + label.w / 2);
      let overlapY = dy < (letter.h / 2 + label.h / 2);
      if (overlapX && overlapY) {
        letter.clicked();
      }
    }
  }
}

function mousePressed() {
  for (let l of letterBodies) {
    if (l.isMouseOver()) {
      l.clicked();
    }
  }
}

class FloatingLetter {
  constructor(x, y, letter) {
    this.letter = letter;
    textSize(24);
    this.w = textWidth(letter) + 16;
    this.h = 32;
    this.body = Bodies.rectangle(x, y, this.w, this.h, {
      restitution: 0.6,
      friction: 0.02,
      frictionAir: 0.02,
      density: 0.001
    });
    World.add(world, this.body);
    this.color = color(255);
    this.hasChanged = false;

    Body.setVelocity(this.body, {
      x: random(-2, 2),
      y: random(-2, 2)
    });
  }

  update() {
    let pos = this.body.position;
    let mouse = createVector(mouseX, mouseY);
    let spark = createVector(pos.x, pos.y);
    let dir = p5.Vector.sub(mouse, spark);
    let distToMouse = dir.mag();
    if (distToMouse < 150) {
      dir.normalize().mult(0.0002);
      Body.applyForce(this.body, this.body.position, { x: dir.x, y: dir.y });
    }
    Body.applyForce(this.body, this.body.position, {
      x: random(-0.0001, 0.0001),
      y: random(-0.0001, 0.0001)
    });
  }

  display() {
    let pos = this.body.position;
    let angle = this.body.angle;
    push();
    translate(pos.x, pos.y);
    rotate(angle);
    fill(this.color);
    textFont('serif'); // Use serif font here
    textSize(24);
    text(this.letter, 0, 0);
    pop();
  }

  isMouseOver() {
    let pos = this.body.position;
    return (
      mouseX > pos.x - this.w / 2 &&
      mouseX < pos.x + this.w / 2 &&
      mouseY > pos.y - this.h / 2 &&
      mouseY < pos.y + this.h / 2
    );
  }

  clicked() {
    if (this.hasChanged) return;
    this.color = color(random(255), random(255), random(255));
    this.hasChanged = true;
  }
}

class StaticLabel {
  constructor(x, y, textContent) {
    this.textContent = textContent;
    textSize(32);
    this.w = textWidth(this.textContent) + 20;
    this.h = 40;
    this.body = Bodies.rectangle(x, y, this.w, this.h, {
      isStatic: true,
      restitution: 0.9
    });
    World.add(world, this.body);
  }

  display() {
    let pos = this.body.position;
    push();
    translate(pos.x, pos.y);
    noStroke();
    fill('#2E2E2E');
    textFont('serif'); // Use serif font here
    textSize(24);
    textAlign(CENTER, CENTER);
    text(this.textContent, 0, 0);
    pop();
  }
}

function repositionStaticElements() {
  let margin = 20;
  let minVerticalSpacing = 100;

  if (labels.length === 3) {
    let usedZones = [];

    for (let i = 0; i < labels.length; i++) {
      let label = labels[i];
      let word = labelWords[i];
      let newW = textWidth(word) + 20;
      let newH = 40;
      label.w = newW;
      label.h = newH;

      let x = constrain(labelPositions[i].x(), newW / 2 + margin, width - newW / 2 - margin);
      let y = constrain(labelPositions[i].y(), newH / 2 + margin, height - newH / 2 - margin);

      for (let zone of usedZones) {
        if (abs(y - zone.y) < minVerticalSpacing) {
          y = zone.y + minVerticalSpacing;
        }
      }

      Body.setPosition(label.body, { x, y });
      usedZones.push({ y, h: newH });
    }
  }
}

function repositionWalls() {
  let thickness = 100;
  Body.setPosition(bottomWall, { x: width / 2, y: height + thickness / 2 });
  Body.setPosition(topWall, { x: width / 2, y: -thickness / 2 });
  Body.setPosition(leftWall, { x: -thickness / 2, y: height / 2 });
  Body.setPosition(rightWall, { x: width + thickness / 2, y: height / 2 });
}
