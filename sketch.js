// Matter.js setup
let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body;

let engine, world;
let letterBodies = [];
let leftWall, rightWall, topWall, bottomWall;
let labels = [];
let introAlpha = 0;
let introYOffset = 30;


let introHeader = "Hi – I'm Jennifer Lee";
let introParagraph = "A product designer who builds engaging branding and digital experiences – designed through empathy, shaped by culture, and brought to life through design thinking.";

const labelWords = ["Empathy", "Experience", "Culture"];
let labelPositions = [
  { x: () => width * 0.60 },
  { x: () => width * 0.80 },
  { x: () => width * 0.75 }
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

  textAlign(CENTER, CENTER);
  engine = Engine.create();
  engine.world.gravity.y = 0;
  world = engine.world;

  for (let i = 0; i < labelWords.length; i++) {
    addStaticLabel(labelPositions[i].x(), 0, labelWords[i]);
  }

  let thickness = 100;
  bottomWall = Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, { isStatic: true });
  topWall = Bodies.rectangle(width / 2, -thickness / 2, width, thickness, { isStatic: true });
  leftWall = Bodies.rectangle(-thickness / 2, height / 2, thickness, height, { isStatic: true });
  rightWall = Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, { isStatic: true });
  World.add(world, [bottomWall, topWall, leftWall, rightWall]);

  repositionStaticElements();
}

function draw() {
  if (width !== windowWidth || height !== windowHeight) {
    resizeCanvas(windowWidth, windowHeight);
    repositionStaticElements();
    repositionWalls();
  }

  clear();

   // Responsive header + paragraph block
 
  // Animate fade-in and slide-up
introAlpha = lerp(introAlpha, 255, 0.05);
introYOffset = lerp(introYOffset, 0, 0.05);

let isMobile = width < 810;

// Shared position values
let introBoxWidth = isMobile ? width * 0.8 : width * 0.5;
let introBoxX = isMobile ? (width - introBoxWidth) / 2 : 40;

let headerHeight = 32 * 2;
let paragraphHeight = 24 * 4;
let introBoxH = headerHeight + 24 + paragraphHeight;

let introBoxY = isMobile ? 40 + introYOffset
  : (height - introBoxH) / 2 + introYOffset;

// Render header + paragraph
push();
noStroke();
fill(255, introAlpha);
textAlign(isMobile ? CENTER : LEFT, TOP);

// Header
textSize(32);
textLeading(38);
text(introHeader, introBoxX, introBoxY, introBoxWidth);

// Paragraph
textSize(16);
textLeading(22);
let paragraphY = introBoxY + headerHeight + 12;
text(introParagraph, introBoxX, paragraphY, introBoxWidth);
pop();


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

  // Check for overlap with intro box
  let pos = l.body.position;
  let overlapsIntro =
    pos.x > introBoxX &&
    pos.x < introBoxX + introBoxWidth &&
    pos.y > introBoxY &&
    pos.y < introBoxY + introBoxH;

  if (overlapsIntro) {
    drawingContext.filter = "blur(16px)";
    l.display();
    drawingContext.filter = "none";
  } else {
    l.display();
  }
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

    bezier(ax, ay, ax + 40, ay + 40, bx - 40, by - 40, bx, by);

    let bxr = b.body.position.x + b.w / 2;
    let cx = c.body.position.x - c.w / 2;
    let cy = c.body.position.y;

    bezier(bxr, by, bxr + 60, by + 100, cx - 60, cy - 80, cx, cy);
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
      if (dx < (letter.w / 2 + label.w / 2) && dy < (letter.h / 2 + label.h / 2)) {
        letter.clicked();
      }
    }
  }
}

function mousePressed() {
  for (let l of letterBodies) {
    if (l.isMouseOver()) l.clicked();
  }
}

class FloatingLetter {
  constructor(x, y, letter) {
    this.letter = letter;
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
    let dir = p5.Vector.sub(createVector(mouseX, mouseY), createVector(pos.x, pos.y));
    if (dir.mag() < 150) {
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
    textSize(24);
    fill(this.color);
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
    if (!this.hasChanged) {
      this.color = color(random(255), random(255), random(255));
      this.hasChanged = true;
    }
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
    textSize(24);
    fill('#ffffff');
    textAlign(CENTER, CENTER);
    text(this.textContent, 0, 0);
    pop();
  }
}

function repositionStaticElements() {
  let isMobile = width < 810;
  let labelCount = labels.length;
  let verticalPadding = 180;
  let totalHeight = height - 2 * verticalPadding;
  let spacing = totalHeight / (labelCount - 1);

  for (let i = 0; i < labelCount; i++) {
    let label = labels[i];
    let word = labelWords[i];

    let labelX, labelY;

    if (isMobile) {
      // 🟢 Mobile: vertically stacked below intro, zig-zag horizontal layout
      // Alternate x positions: 30%, 70%, 40%, etc.
      let zigzagPercents = [0.3, 0.7, 0.4, 0.65, 0.5]; // Add more if needed
      labelX = width * zigzagPercents[i % zigzagPercents.length];

      // Estimate header + paragraph height
      let estimatedHeaderHeight = 42;
      let estimatedParagraphHeight = 24 * 4;
      let baseY = 80 + estimatedHeaderHeight + 12 + estimatedParagraphHeight + 60;

      labelY = baseY + i * 80;
    } else {
      // 🖥️ Desktop: keep predefined x position from labelPositions
      labelX = labelPositions[i].x();
      labelY = verticalPadding + i * spacing;
    }

    textSize(24);
    let labelW = textWidth(word) + 20;
    let labelH = 40;

    label.w = labelW;
    label.h = labelH;

    Body.setPosition(label.body, { x: labelX, y: labelY });
  }
}

function repositionWalls() {
  let thickness = 100;
  Body.setPosition(bottomWall, { x: width / 2, y: height + thickness / 2 });
  Body.setPosition(topWall, { x: width / 2, y: -thickness / 2 });
  Body.setPosition(leftWall, { x: -thickness / 2, y: height / 2 });
  Body.setPosition(rightWall, { x: width + thickness / 2, y: height / 2 });
}
