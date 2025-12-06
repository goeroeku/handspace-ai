import * as THREE from "three";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// --- Configuration ---
const CONFIG = {
  blockCount: 12,
  colors: [0x4cc9f0, 0x4361ee, 0x3a0ca3, 0x7209b7, 0xf72585],
  pinchThreshold: 0.06,
  fistThreshold: 0.14,
  cameraPanSpeed: 0.15,
  handScale: 0.4,
};

// --- Global Variables ---
let scene, camera, renderer, raycaster;
let blocks = [];
let particles = [];
let stars = [];
let meteors = [];
let handLandmarker;
let webcam;
let lastVideoTime = -1;
let lastMeteorTime = 0;
let nextMeteorInterval = 0;

// Interaction State
let isDragging = false;
let draggedObject = null;
let hoveredObject = null;
let actionCooldown = 0;
let nextBlockId = 1;

let dragOffset = new THREE.Vector3();
let dragPlaneZ = 0;

// Hand Visuals
let handGroup;
let handJoints = [];
let handBones;
const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
];

const cursor = new THREE.Vector2();
const statusDiv = document.getElementById("status");
const loader = document.getElementById("loader");
const loaderText = document.getElementById("loader-text");

// --- Initialization ---
async function init() {
  setupScene();
  setupHandVisuals();
  nextMeteorInterval = THREE.MathUtils.randFloat(0.5, 2);

  try {
    await setupHandTracking();
    loader.style.display = "none";
    update();
  } catch (err) {
    loaderText.innerText = "Error: " + err.message;
    console.error(err);
  }
}

function setupScene() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000510, 0.025);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 8;

  checkOrientation();

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  document
    .getElementById("canvas-container")
    .appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xffffff, 8, 100);
  pointLight.position.set(5, 5, 8);
  scene.add(pointLight);
  const purpleLight = new THREE.PointLight(0xaa00ff, 4, 50);
  purpleLight.position.set(-5, -5, 2);
  scene.add(purpleLight);

  createGalaxyBackground();
  createStarfield();

  for (let i = 0; i < CONFIG.blockCount; i++) {
    spawnBlock();
  }

  raycaster = new THREE.Raycaster();
  window.addEventListener("resize", onWindowResize);
}

function setupHandVisuals() {
  handGroup = new THREE.Group();
  scene.add(handGroup);

  const jointGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const jointMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

  for (let i = 0; i < 21; i++) {
    const joint = new THREE.Mesh(jointGeo, jointMat.clone());
    handJoints.push(joint);
    handGroup.add(joint);
  }

  const lineGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(HAND_CONNECTIONS.length * 2 * 3);
  lineGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.9,
    linewidth: 3,
  });

  handBones = new THREE.LineSegments(lineGeo, lineMat);
  handGroup.add(handBones);

  handGroup.visible = false;
}

// Creates a star-shaped texture with gradient and glow effect
function createStarTexture(color) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, 64, 64);

  const centerX = 32;
  const centerY = 32;
  const outerRadius = 20;
  const innerRadius = 8;
  const spikes = 5;

  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();

  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, outerRadius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.shadowBlur = 10;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

// Creates a galaxy background with radial gradient and nebula effects
function createGalaxyBackground() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, "rgba(30, 15, 50, 0.9)");
  gradient.addColorStop(0.3, "rgba(20, 10, 40, 0.8)");
  gradient.addColorStop(0.6, "rgba(10, 5, 30, 0.6)");
  gradient.addColorStop(1, "rgba(0, 0, 10, 0.4)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 12; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 40 + Math.random() * 60;
    const nebulaGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const colors = [
      "rgba(100, 50, 200, 0.4)",
      "rgba(200, 100, 255, 0.3)",
      "rgba(50, 150, 255, 0.35)",
      "rgba(255, 100, 150, 0.3)",
      "rgba(150, 200, 255, 0.25)",
      "rgba(255, 150, 200, 0.25)",
    ];
    nebulaGradient.addColorStop(0, colors[Math.floor(Math.random() * colors.length)]);
    nebulaGradient.addColorStop(0.7, "rgba(0, 0, 0, 0)");
    nebulaGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = nebulaGradient;
    ctx.fillRect(0, 0, 512, 512);
  }

  for (let i = 0; i < 3; i++) {
    const centerX = 256 + (Math.random() - 0.5) * 100;
    const centerY = 256 + (Math.random() - 0.5) * 100;
    const spiralGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150);
    spiralGradient.addColorStop(0, "rgba(150, 100, 255, 0.2)");
    spiralGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = spiralGradient;
    ctx.fillRect(0, 0, 512, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const geometry = new THREE.PlaneGeometry(200, 200);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  });
  const background = new THREE.Mesh(geometry, material);
  background.position.z = -50;
  scene.add(background);
}

// Creates a starfield with colorful twinkling stars
function createStarfield() {
  const starColors = [
    "#ffffff",
    "#ffff00",
    "#00ffff",
    "#ff00ff",
    "#00ff00",
    "#ff8800",
    "#8888ff",
    "#ff88ff",
  ];

  const starCount = 2500;

  for (let i = 0; i < starCount; i++) {
    const color = starColors[Math.floor(Math.random() * starColors.length)];
    const texture = createStarTexture(color);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });

    const sprite = new THREE.Sprite(material);

    sprite.position.set(
      THREE.MathUtils.randFloatSpread(100),
      THREE.MathUtils.randFloatSpread(100),
      THREE.MathUtils.randFloatSpread(100)
    );

    const size = THREE.MathUtils.randFloat(0.08, 0.4);
    sprite.scale.set(size, size, 1);

    const willTwinkle = Math.random() > 0.4;

    sprite.userData = {
      baseOpacity: THREE.MathUtils.randFloat(0.6, 1.0),
      twinkleSpeed: willTwinkle ? THREE.MathUtils.randFloat(0.5, 2.0) : 0,
      twinkleOffset: Math.random() * Math.PI * 2,
      baseSize: size,
      twinkling: willTwinkle,
    };

    scene.add(sprite);
    stars.push(sprite);
  }
}

// Creates a rounded/oval texture for meteor head with glow effect
function createMeteorHeadTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  const centerX = 64;
  const centerY = 64;
  
  const outerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 64);
  outerGradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
  outerGradient.addColorStop(0.3, "rgba(200, 220, 255, 0.8)");
  outerGradient.addColorStop(0.6, "rgba(150, 180, 255, 0.4)");
  outerGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  
  ctx.fillStyle = outerGradient;
  ctx.fillRect(0, 0, 128, 128);
  
  const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30);
  coreGradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
  coreGradient.addColorStop(0.5, "rgba(255, 240, 200, 0.9)");
  coreGradient.addColorStop(1, "rgba(255, 200, 150, 0.6)");
  
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 25, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

// Creates a meteor with long burning trail and glowing head
function createMeteor() {
  const startX = THREE.MathUtils.randFloatSpread(60);
  const startY = 30 + Math.random() * 20;
  const startZ = THREE.MathUtils.randFloatSpread(20);

  const direction = new THREE.Vector3(
    THREE.MathUtils.randFloat(-0.3, 0.3),
    -1,
    THREE.MathUtils.randFloat(-0.1, 0.1)
  ).normalize();

  const trailLength = 100;
  const trailLines = [];
  
  for (let layer = 0; layer < 3; layer++) {
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(trailLength * 3);
    const trailColors = new Float32Array(trailLength * 3);
    
    for (let i = 0; i < trailLength; i++) {
      trailPositions[i * 3] = startX;
      trailPositions[i * 3 + 1] = startY;
      trailPositions[i * 3 + 2] = startZ;
    }
    
    trailGeometry.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
    trailGeometry.setAttribute("color", new THREE.BufferAttribute(trailColors, 3));

    const trailMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1.0 - layer * 0.2,
      blending: THREE.AdditiveBlending,
      linewidth: 5 - layer,
    });

    const trail = new THREE.Line(trailGeometry, trailMaterial);
    trailLines.push({
      geometry: trailGeometry,
      positions: trailPositions,
      colors: trailColors,
      material: trailMaterial,
      line: trail
    });
  }

  const headTexture = createMeteorHeadTexture();
  const headMaterial = new THREE.SpriteMaterial({
    map: headTexture,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    color: 0xffffff,
  });
  const head = new THREE.Sprite(headMaterial);
  head.scale.set(0.4, 0.4, 1);

  const glowBlueTexture = createMeteorHeadTexture();
  const glowBlueMaterial = new THREE.SpriteMaterial({
    map: glowBlueTexture,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    color: 0xaaccff,
  });
  const glowBlue = new THREE.Sprite(glowBlueMaterial);
  glowBlue.scale.set(0.52, 0.52, 1);

  const glowWhiteTexture = createMeteorHeadTexture();
  const glowWhiteMaterial = new THREE.SpriteMaterial({
    map: glowWhiteTexture,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    color: 0xffffff,
  });
  const glowWhite = new THREE.Sprite(glowWhiteMaterial);
  glowWhite.scale.set(0.68, 0.68, 1);

  const meteor = new THREE.Group();
  trailLines.forEach(trail => {
    meteor.add(trail.line);
  });
  meteor.add(glowWhite);
  meteor.add(glowBlue);
  meteor.add(head);

  meteor.position.set(startX, startY, startZ);

  meteor.userData = {
    direction: direction,
    speed: THREE.MathUtils.randFloat(0.3, 0.6),
    life: 1.0,
    trailLength: trailLength,
    trailLines: trailLines,
    head: head,
    glowBlue: glowBlue,
    glowWhite: glowWhite,
  };

  scene.add(meteor);
  meteors.push(meteor);
}

function createNumberTexture(number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 15;
  ctx.strokeRect(7, 7, 242, 242);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 160px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 10;
  ctx.fillText(number, 128, 128);

  return new THREE.CanvasTexture(canvas);
}

function spawnBlock(pos = null) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const color =
    CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
  const numTexture = createNumberTexture(nextBlockId++);

  const material = new THREE.MeshPhysicalMaterial({
    color: color,
    map: numTexture,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.2,
    thickness: 1.0,
    clearcoat: 1.0,
    transparent: true,
    opacity: 1.0,
    emissive: color,
    emissiveIntensity: 0.5,
  });

  const block = new THREE.Mesh(geometry, material);

  if (pos) {
    block.position.copy(pos);
  } else {
    block.position.set(
      THREE.MathUtils.randFloatSpread(10),
      THREE.MathUtils.randFloatSpread(6),
      THREE.MathUtils.randFloatSpread(4) - 2
    );
  }

  block.userData = {
    rotSpeed: { x: Math.random() * 0.01, y: Math.random() * 0.01 },
    floatOffset: Math.random() * 100,
    baseY: block.position.y,
    id: nextBlockId - 1,
  };

  scene.add(block);
  blocks.push(block);
  return block;
}

async function setupHandTracking() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 1,
  });
  webcam = document.getElementById("webcam-preview");
  const constraints = {
    video: { facingMode: "user", width: 640, height: 480 },
  };
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        webcam.srcObject = stream;
        webcam.addEventListener("loadeddata", resolve);
      })
      .catch((err) => {
        loaderText.innerText = "Camera Access Denied / Not Available";
        reject(err);
      });
  });
}

function update() {
  requestAnimationFrame(update);
  detectHands();
  animateBlocks();
  animateParticles();
  animateStars();
  animateMeteors();
  spawnMeteors();
  renderer.render(scene, camera);
}

function detectHands() {
  if (!handLandmarker || !webcam.videoWidth) return;

  let startTimeMs = performance.now();
  if (lastVideoTime !== webcam.currentTime) {
    lastVideoTime = webcam.currentTime;
    const results = handLandmarker.detectForVideo(webcam, startTimeMs);

    if (results.landmarks.length > 0) {
      processGestures(results.landmarks[0]);
      handGroup.visible = true;
    } else {
      handGroup.visible = false;
      statusDiv.innerText = "No hand detected";
      statusDiv.style.color = "#555";
      statusDiv.style.borderColor = "#555";
      hoveredObject = null;
      isDragging = false;
    }
  }
}

function updateHandVisuals(landmarks) {
  const positions = handBones.geometry.attributes.position.array;

  const indexTip = landmarks[8];
  const anchorVector = new THREE.Vector3(
    (1 - indexTip.x) * 2 - 1,
    -indexTip.y * 2 + 1,
    0.5
  );
  anchorVector.unproject(camera);
  const dir = anchorVector.sub(camera.position).normalize();
  const dist = (0 - camera.position.z) / dir.z;
  const anchorPos = camera.position.clone().add(dir.multiplyScalar(dist));

  landmarks.forEach((lm, index) => {
    const rawVec = new THREE.Vector3(
      (1 - lm.x) * 2 - 1,
      -lm.y * 2 + 1,
      0.5
    );
    rawVec.unproject(camera);
    const rawDir = rawVec.sub(camera.position).normalize();
    const rawDist = (0 - camera.position.z) / rawDir.z;
    const rawPos = camera.position
      .clone()
      .add(rawDir.multiplyScalar(rawDist));

    const diff = rawPos.clone().sub(anchorPos);
    const scaledDiff = diff.multiplyScalar(CONFIG.handScale);

    handJoints[index].position.copy(anchorPos).add(scaledDiff);
  });

  let posIndex = 0;
  HAND_CONNECTIONS.forEach((pair) => {
    const start = handJoints[pair[0]].position;
    const end = handJoints[pair[1]].position;

    positions[posIndex++] = start.x;
    positions[posIndex++] = start.y;
    positions[posIndex++] = start.z;
    positions[posIndex++] = end.x;
    positions[posIndex++] = end.y;
    positions[posIndex++] = end.z;
  });

  handBones.geometry.attributes.position.needsUpdate = true;
}

function processGestures(landmarks) {
  updateHandVisuals(landmarks);

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const wrist = landmarks[0];
  const middleMCP = landmarks[9];

  const x = (1 - indexTip.x) * 2 - 1;
  const y = -indexTip.y * 2 + 1;

  cursor.set(x, y);
  raycaster.setFromCamera(cursor, camera);

  if (!isDragging) {
    if (indexTip.x < 0.1) camera.position.x += CONFIG.cameraPanSpeed;
    if (indexTip.x > 0.9) camera.position.x -= CONFIG.cameraPanSpeed;
    
    if (y > 0.6) {
      camera.position.y += CONFIG.cameraPanSpeed;
    }
    if (y < -0.6) {
      camera.position.y -= CONFIG.cameraPanSpeed;
    }
  }

  const pinchDist = Math.hypot(
    thumbTip.x - indexTip.x,
    thumbTip.y - indexTip.y
  );
  const middleToWrist = distance(middleTip, wrist);

  const isFist =
    distance(indexTip, wrist) < CONFIG.fistThreshold &&
    distance(middleTip, wrist) < CONFIG.fistThreshold &&
    distance(ringTip, wrist) < CONFIG.fistThreshold &&
    distance(pinkyTip, wrist) < CONFIG.fistThreshold;

  const isPinching =
    pinchDist < CONFIG.pinchThreshold && !isFist && middleToWrist > 0.2;

  const isThumbsUp =
    thumbTip.y < indexTip.y &&
    thumbTip.y < middleMCP.y &&
    distance(indexTip, wrist) < 0.2 &&
    !isPinching &&
    !isFist;

  handJoints.forEach((j) => j.material.color.setHex(0x00ffff));
  if (handBones.material) {
    handBones.material.color.setHex(0x00ffff);
  }

  if (isFist) {
    handJoints.forEach((j) => j.material.color.setHex(0xff0000));
    if (handBones.material) {
      handBones.material.color.setHex(0xff0000);
    }
  } else if (isPinching) {
    handJoints[4].material.color.setHex(0xffff00);
    handJoints[8].material.color.setHex(0xffff00);
    if (handBones.material) {
      handBones.material.color.setHex(0xffff00);
    }
  } else if (isThumbsUp) {
    [1, 2, 3, 4].forEach((i) =>
      handJoints[i].material.color.setHex(0x00ff00)
    );
    if (handBones.material) {
      handBones.material.color.setHex(0x00ff00);
    }
  }

  if (actionCooldown > 0) actionCooldown--;

  if (isDragging && draggedObject) {
    statusDiv.innerText = `🤏 Dragging #${draggedObject.userData.id}`;
    statusDiv.style.color = "#ffff00";
    statusDiv.style.borderColor = "#ffff00";

    const vector = new THREE.Vector3(x, y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();

    if (dir.z !== 0) {
      const t = (dragPlaneZ - camera.position.z) / dir.z;
      const intersectionPoint = camera.position
        .clone()
        .add(dir.multiplyScalar(t));
      const newPos = intersectionPoint.sub(dragOffset);
      draggedObject.position.copy(newPos);

      const handAngle = Math.atan2(
        middleTip.y - wrist.y,
        middleTip.x - wrist.x
      );
      draggedObject.rotation.z = -handAngle;
    }

    if (!isPinching || isFist) {
      isDragging = false;
      draggedObject.userData.baseY = draggedObject.position.y;
      draggedObject = null;
    }
  } else {
    const intersects = raycaster.intersectObjects(blocks);

    if (
      hoveredObject &&
      (!intersects.length || intersects[0].object !== hoveredObject)
    ) {
      hoveredObject.material.emissiveIntensity = 0.5;
      hoveredObject.scale.set(1, 1, 1);
      hoveredObject = null;
    }

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj !== hoveredObject) {
        hoveredObject = obj;
        hoveredObject.material.emissiveIntensity = 1.0;
        hoveredObject.scale.set(1.1, 1.1, 1.1);
      }

      const id = hoveredObject.userData.id;

      if (isFist) {
        statusDiv.innerText = `💥 Destroy #${id}`;
        statusDiv.style.color = "#ff0000";
        statusDiv.style.borderColor = "#ff0000";
        explodeBlock(hoveredObject);
        hoveredObject = null;
      } else if (isPinching) {
        isDragging = true;
        draggedObject = hoveredObject;
        dragPlaneZ = draggedObject.position.z;

        const vector = new THREE.Vector3(x, y, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const t = (dragPlaneZ - camera.position.z) / dir.z;
        const intersectPoint = camera.position
          .clone()
          .add(dir.multiplyScalar(t));

        dragOffset.copy(intersectPoint).sub(draggedObject.position);
      } else if (isThumbsUp && actionCooldown === 0) {
        statusDiv.innerText = `👍 Copy #${id}`;
        statusDiv.style.color = "#00ff00";
        statusDiv.style.borderColor = "#00ff00";
        duplicateBlock(hoveredObject);
        actionCooldown = 60;
      } else {
        statusDiv.innerText = `🖐 Hover #${id}`;
        statusDiv.style.color = "#00ffff";
        statusDiv.style.borderColor = "#00ffff";
      }
    } else {
      if (isFist) {
        statusDiv.innerText = "✊ Fist";
        statusDiv.style.color = "#ff0000";
        statusDiv.style.borderColor = "#ff0000";
      } else if (isPinching) {
        statusDiv.innerText = "🤏 Pinch";
        statusDiv.style.color = "#ffff00";
        statusDiv.style.borderColor = "#ffff00";
      } else {
        statusDiv.innerText = "🖐 Find Target";
        statusDiv.style.color = "#00ffff";
        statusDiv.style.borderColor = "#00ffff";
      }
    }
  }
}

function distance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function explodeBlock(block) {
  const count = 15;
  for (let i = 0; i < count; i++) {
    const geometry = new THREE.TetrahedronGeometry(0.2);
    const material = block.material.clone();
    material.transparent = true;
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(block.position);
    particle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3
      ),
      life: 1.0,
    };
    scene.add(particle);
    particles.push(particle);
  }
  scene.remove(block);
  blocks = blocks.filter((b) => b !== block);
}

function duplicateBlock(original) {
  const newBlock = spawnBlock(original.position.clone());
  newBlock.position.x += 1.5;
}

function animateBlocks() {
  const time = performance.now() * 0.001;
  blocks.forEach((block) => {
    if (block === draggedObject) return;
    block.rotation.x += block.userData.rotSpeed.x;
    block.rotation.y += block.userData.rotSpeed.y;
    block.position.y =
      block.userData.baseY +
      Math.sin(time + block.userData.floatOffset) * 0.1;
  });
}

function animateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.position.add(p.userData.velocity);
    p.rotation.x += 0.1;
    p.userData.life -= 0.02;
    p.scale.setScalar(p.userData.life);
    p.material.opacity = p.userData.life;
    if (p.userData.life <= 0) {
      scene.remove(p);
      particles.splice(i, 1);
    }
  }
}

// Animates twinkling stars
function animateStars() {
  const time = performance.now() * 0.001;
  stars.forEach((star) => {
    if (star.userData.twinkling) {
      const twinkle = Math.sin(time * star.userData.twinkleSpeed + star.userData.twinkleOffset) * 0.5 + 0.5;
      star.material.opacity = star.userData.baseOpacity * (0.3 + twinkle * 0.7);
      const scale = star.userData.baseSize * (0.8 + twinkle * 0.4);
      star.scale.set(scale, scale, 1);
    } else {
      star.material.opacity = star.userData.baseOpacity;
      star.scale.set(star.userData.baseSize, star.userData.baseSize, 1);
    }
  });
}

// Spawns meteors at regular intervals
function spawnMeteors() {
  const time = performance.now() * 0.001;
  if (time - lastMeteorTime >= nextMeteorInterval) {
    createMeteor();
    lastMeteorTime = time;
    nextMeteorInterval = THREE.MathUtils.randFloat(0.5, 2);
  }
}

// Animates meteors with burning trail effect
function animateMeteors() {
  for (let i = meteors.length - 1; i >= 0; i--) {
    const meteor = meteors[i];
    const data = meteor.userData;

    meteor.position.add(
      data.direction.clone().multiplyScalar(data.speed)
    );

    const headPos = meteor.position;
    
    data.trailLines.forEach((trail, layerIndex) => {
      const positions = trail.positions;
      const colors = trail.colors;

      for (let j = (data.trailLength - 1) * 3; j >= 3; j -= 3) {
        positions[j] = positions[j - 3];
        positions[j + 1] = positions[j - 2];
        positions[j + 2] = positions[j - 1];
        
        colors[j] = colors[j - 3];
        colors[j + 1] = colors[j - 2];
        colors[j + 2] = colors[j - 1];
      }

      positions[0] = headPos.x;
      positions[1] = headPos.y;
      positions[2] = headPos.z;

      colors[0] = 1.0;
      colors[1] = 1.0;
      colors[2] = 1.0;

      for (let j = 1; j < data.trailLength; j++) {
        const t = j / (data.trailLength - 1);
        let r, g, b;
        
        if (t < 0.1) {
          const localT = t / 0.1;
          r = 1.0 - localT * 0.2;
          g = 1.0 - localT * 0.1;
          b = 1.0;
        } else if (t < 0.3) {
          const localT = (t - 0.1) / 0.2;
          r = 0.3 - localT * 0.1;
          g = 0.5 - localT * 0.1;
          b = 1.0 - localT * 0.2;
        } else if (t < 0.5) {
          const localT = (t - 0.3) / 0.2;
          r = 0.2 + localT * 0.3;
          g = 0.4 - localT * 0.2;
          b = 0.8 - localT * 0.3;
        } else if (t < 0.7) {
          const localT = (t - 0.5) / 0.2;
          r = 0.5 + localT * 0.4;
          g = 0.2 + localT * 0.3;
          b = 0.5 - localT * 0.3;
        } else {
          const localT = (t - 0.7) / 0.3;
          r = 0.9 - localT * 0.4;
          g = 0.5 - localT * 0.4;
          b = 0.2 - localT * 0.2;
        }
        
        colors[j * 3] = Math.max(0, Math.min(1, r));
        colors[j * 3 + 1] = Math.max(0, Math.min(1, g));
        colors[j * 3 + 2] = Math.max(0, Math.min(1, b));
      }
      
      trail.geometry.attributes.position.needsUpdate = true;
      trail.geometry.attributes.color.needsUpdate = true;

      trail.material.opacity = data.life * (1.0 - layerIndex * 0.2);
    });

    const distance = camera.position.distanceTo(meteor.position);
    const headScale = Math.max(0.15, Math.min(0.4, 6.67 / distance));
    data.head.scale.set(headScale, headScale, 1);
    
    const time = performance.now() * 0.001;
    if (data.glowBlue) {
      data.glowBlue.scale.set(headScale * 1.3, headScale * 1.3, 1);
      data.glowBlue.material.opacity = (0.6 + Math.sin(time * 12) * 0.2) * data.life;
    }
    if (data.glowWhite) {
      data.glowWhite.scale.set(headScale * 1.7, headScale * 1.7, 1);
      data.glowWhite.material.opacity = (0.4 + Math.sin(time * 8) * 0.15) * data.life;
    }

    data.life -= 0.005;

    if (
      meteor.position.y < -50 ||
      meteor.position.x < -60 ||
      meteor.position.x > 60 ||
      data.life <= 0
    ) {
      scene.remove(meteor);
      meteors.splice(i, 1);
    }
  }
}

function checkOrientation() {
  if (window.innerHeight > window.innerWidth) {
    camera.fov = 90;
  } else {
    camera.fov = 75;
  }
}

function onWindowResize() {
  checkOrientation();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();

