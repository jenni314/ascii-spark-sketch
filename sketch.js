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
let paragraphBody;

function setup() {
  createCanvas(windowWidth, windowHeight);
  window.addEventListener('resize', () => {
    resizeCanvas(windowWidth, windowHeight);
    repositionStaticElements();
  });
  createCanvas(windowWidth, windowHeight);
  textFont('Inter');
  textAlign(CENTER, CENTER);

  engine = Engine.create();
  engine.world.gravity.y = 0;
  world = engine.world;

  let thickness = 100;
  bottomWall = Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, { isStatic: true });
  topWall = Bodies.rectangle(width / 2, -thickness / 2, width, thickness, { isStatic: true });
  leftWall = Bodies.rectangle(-thickness / 2, height / 2, thickness, height, { isStatic: true });
  rightWall = Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, { isStatic: true });
  World.add(world, [bottomWall, topWall, leftWall, rightWall]);

  addStaticLabel(width * 0.10, height * 0.05, "Empathy");
  addStaticLabel(width * 0.75, height * 0.3, "Experience");
  addStaticLabel(width * 0.4, height * 0.65, "Culture");

  let paraText = "I'm a product designer who builds engaging branding and digital experiences — designed through empathy, shaped by culture, and brought to life through design thinking.";
  let paraW = width < 810 ? width - 60 : min(width * 0.35, 400);
  let paraH = 120;
  let paraX = width - paraW / 2 - 40;
  let paraY = height - paraH / 2 - 40;
  paragraphBody = Bodies.rectangle(paraX, paraY, paraW, paraH, {
    isStatic: true,
    restitution: 0.9
  });
  paragraphBody.labelText = paraText;
  paragraphBody.labelWidth = paraW;
  paragraphBody.labelHeight = paraH;
  paragraphBody.labelAlign = 'LEFT';
  World.add(world, paragraphBody);
}

function draw() {
  
  // transparent background for Framer embedding
  clear();
  Engine.update(engine);
  detectCollisions();

  if (frameCount % 40 === 0 && letterBodies.length < 50) {
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

  // Bezier curves between static elements
  if (labels.length >= 3 && paragraphBody) {
    let a = labels[0];
    let b = labels[1];
    let c = labels[2];
    let d = paragraphBody;

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
    let cxr = c.body.position.x + c.w / 2;
    let dx = d.position.x - d.labelWidth / 1.9;
    let dy = d.position.y;

   // Empathy → Experience
bezier(ax, ay, ax + 120, ay + 100, bx + 10, by - 0, bx, by);

// Experience → Culture
bezier(bxr, by, bxr + 100, by + 100, cx - 400, cy - 30, cx, cy);

// Culture → Paragraph
bezier(cxr, cy, cxr + 500, cy - 10, dx - 400, dy - 60, dx, dy);

  }

  drawingContext.setLineDash([]);
  let pos = paragraphBody.position;
  push();
  translate(pos.x - paragraphBody.labelWidth / 2, pos.y - paragraphBody.labelHeight / 2);
  noStroke();
  fill('#161616');
  textFont('Inter');
  textSize(16);
  textAlign(LEFT, TOP);
  text(paragraphBody.labelText, 0, 0, paragraphBody.labelWidth);
  pop();
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
    textFont('Inter');
    textSize(24);
    this.w = textWidth(letter) + 16;
    this.h = 32;
    this.body = Bodies.rectangle(x, y, this.w, this.h, {
      restitution: 0.9,
      friction: 0.1,
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
    textFont('Inter');
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
    textFont('Inter');
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
    noStroke();
    fill('#161616');
    textFont('Inter');
    textSize(32);
    textAlign(CENTER, CENTER);
    text(this.textContent, 0, 0);
    pop();
  }
}

function addStaticLabel(x, y, word) {
  let label = new StaticLabel(x, y, word);
  labels.push(label);
}

function repositionStaticElements() {
  // Remove old labels and recreate them
  for (let label of labels) {
    World.remove(world, label.body);
  }
  labels = [];

  // Recreate labels at new screen-relative positions
  addStaticLabel(width * 0.25, height * 0.25, "Empathy");
  addStaticLabel(width * 0.75, height * 0.3, "Experience");
  addStaticLabel(width * 0.5, height * 0.75, "Culture");

  // Update paragraph
  World.remove(world, paragraphBody);
  let paraText = "I'm a product designer who builds engaging branding and digital experiences — designed through empathy, shaped by culture, and brought to life through design thinking.";
  let paraW = width < 810 ? width - 60 : min(width * 0.35, 400);
  let paraH = 120;
  let paraX = width - paraW / 2 - 40;
  let paraY = height - paraH / 2 - 40;
  paragraphBody = Bodies.rectangle(paraX, paraY, paraW, paraH, {
    isStatic: true,
    restitution: 0.9
  });
  paragraphBody.labelText = paraText;
  paragraphBody.labelWidth = paraW;
  paragraphBody.labelHeight = paraH;
  paragraphBody.labelAlign = 'LEFT';
  World.add(world, paragraphBody);
}
