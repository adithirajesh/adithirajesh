import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Water } from './objects/Water';
import { Ground } from './objects/Ground';
import { setupUI } from './ui';
import { fill } from 'three/src/extras/TextureUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { TextureLoader, RepeatWrapping, Mesh, PlaneGeometry, MeshStandardMaterial } from 'three';
import { highpModelNormalViewMatrix } from 'three/tsl';

// Animation
const clock = new THREE.Clock();

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.001, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);


const loader = new THREE.TextureLoader();
loader.setPath('/skybox/');
const environmentMap = loader.load([
  'px.png','nx.png','py.png','ny.png','pz.png','nz.png'
]);

const poolTexture = new THREE.TextureLoader().load('/threejs-water-shader/ocean_floor.png');
const noiseTexture = loader.load('/threejs-water-shader/noise.png');


new RGBELoader().load('./assets/sky.hdr', function(hdrTexture) {
  hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = hdrTexture;
  // scene.background = new THREE.Color("#00152e");
  scene.background = hdrTexture;
  scene.environmentIntensity = 0.5; // Optional: to show it as background
})

const backgroundloader = new THREE.TextureLoader();
loader.load('./assets/background.png', function(texture){
  scene.background = texture;
});
// Camera position
camera.position.set(10,0,10);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Add some light to see the ground material
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
// scene.add(ambientLight);



const waterResolution = { size: 512 };
const water = new Water({
  environmentMap: environmentMap,
  resolution: waterResolution.size
  
});
water.scale.set(2,2,2) // Adjust the scale to fit your scene
 // Adjust the position to fit your scene
water.renderOrder = 0; 

const modelloader = new GLTFLoader();
modelloader.load(
  '/models/glass.glb',  // path to your exported .glb
  function (gltf) {
    const model = gltf.scene;
    model.traverse((child) => {
  if (child.isMesh) {
    child.material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0,
      transmission: 0.9,
      thickness: 0.1,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      
    });
    child.renderOrder = 1;
  }

});
    const box = new THREE.Box3().setFromObject(model);
    const containerHeight = box.max.y - box.min.y;
    const containerCenter = new THREE.Vector3();
    box.getCenter(containerCenter);
    


    // water.position.set(center.x, box.min.y + waterHeight / 2, center.z);

    model.scale.set(0.3,0.3,0.3);  // scale if necessary
    model.position.set(0,0,-0.5);
    scene.add(model);
  },
  function (xhr) {  // called while loading
    console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
  },
  function (error) {
    console.error('Error loading GLTF model:', error);
  }
  
);
water.scale.set(1.7, 1, 1.7); // Adjust the scale to fit your scene
water.position.set(0.2, 15, 0.1); // Adjust the position to fit your scene
scene.add(water);

const bubbleGeometry = new THREE.BufferGeometry();
const bubbleCount = 150;
const positions = new Float32Array(bubbleCount * 3);
const radius = 0.9; // slightly less than water radius
const height = 2; // full water height

function createCircleTexture(size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'white');       // center
  gradient.addColorStop(1, 'rgba(255,255,255,0)'); // edges
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

for (let i = 0; i < bubbleCount; i++) {
  const angle = Math.random() * Math.PI * 2; // around the circle
  const r = radius * (0.8 + 0.2 * Math.random()); // slightly random radius
  positions[i * 3] = r * Math.cos(angle); // x
  positions[i * 3 + 1] = Math.random() * height-1; // y (height)
  positions[i * 3 + 2] = r * Math.sin(angle); // z
}

bubbleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const bubbleMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, opacity: 0.7, depthWrite: false, map: createCircleTexture() });
const bubbles = new THREE.Points(bubbleGeometry, bubbleMaterial);
water.add(bubbles); // add to water mesh

//add ripples
let duck = null;
const duckloader = new GLTFLoader();
duckloader.load(
  '/models/duck.glb',  // path to your exported .glb
  function (gltf) {
    duck = gltf.scene;
    duck.traverse((child) => {
  if (child.isMesh) {
    child.material = new THREE.MeshPhysicalMaterial({
      color: "#F7F2BE",

      
    });
    child.renderOrder = 2;
  }

});
    duck.scale.set(0.5,0.5,0.5);  // scale if necessary
    scene.add(duck);
  },
  function (xhr) {  // called while loading
    console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
  },
  function (error) {
    console.error('Error loading GLTF model:', error);
  },

);

// Parameters: size, divisions, colorCenterLine, colorGrid
const grid = new THREE.GridHelper(10, 10, 0xffffff, 0x888888);

function spawnFirework(scene, position) {
const particleCount = 50;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: blue,
    size: 0.08,
    transparent: false,
    opacity: 1,
  });

  const firework = new THREE.Points(geometry, material);
  firework.position.copy(position);
  scene.add(firework);

  // Animate fade out + scale
  let opacity = 1;
   function animate() {
    requestAnimationFrame(animate);
    opacity -= 0.005;
    firework.material.opacity = opacity;
    firework.scale.multiplyScalar(1.05);

    if (opacity <= 0) {
      scene.remove(firework);
      geometry.dispose();
      material.dispose();
    }
  }
  animate();

}

function spawnMegaFirework(scene, positions) {
const particleCount = 50;
const colors=['#FF3CAC', '#2DE2E6', '#ffb6c1'];
for (let j = 0; j < colors.length; j++) {
  const color = colors[j];
  const particlepositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    particlepositions[i * 3] = (Math.random() - 0.5) * 2;
    particlepositions[i * 3 + 1] = (Math.random() - 0.5) * 2;
    particlepositions[i * 3 + 2] = (Math.random() - 0.5) * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(particlepositions, 3));

 const material = new THREE.PointsMaterial({
        size: 0.28,
        color:color,
        transparent: false,
        opacity: 1,
        map: createCircleTexture(64), // your radial gradient texture
        depthWrite: false,
      });

  const firework = new THREE.Points(geometry, material);
  firework.position.copy(positions[j]);
  scene.add(firework);

  // Animate fade out + scale
  let opacity = 1;
   function animate() {
    requestAnimationFrame(animate);
    opacity -= 0.001;
    firework.material.opacity = opacity;
    firework.scale.multiplyScalar(1.05);

    if (opacity <= 0) {
      scene.remove(firework);
      geometry.dispose();
      material.dispose();
    }
  }
  animate();
}
}

function animate() {
  const elapsedTime = clock.getElapsedTime();
  water.update(elapsedTime);
  controls.update();
  if (duck) {
    duck.position.y = water.position.y + water.scale.y / 2  -0.1;
  }
  
    // Get current water height at duck's (x, z)
    // Make duck float at water surface
  

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
  
}

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// fetch("http://127.0.0.1:5000/api/total_amount")
//     .then(res => res.json())
//     .then(data => {
//         console.log('Water amount:', data.total_amount);
//         console.log(THREE);
//         document.getElementById('waterAmount').textContent = data.total_amount;
//         const amount = data.total_amount; 
//         // Convert cents to dollars
//     });

function getRandomFireworkPositions(fireworkno, radius = 5, heightMin = 5, heightMax = 15) {
  const positions = [];
  for (let i = 0; i < fireworkno; i++) {
    const angle = Math.random() * Math.PI * 2; // around circle
    const r = Math.random() * radius; // random radius
    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle);
    const y = heightMin + Math.random() * (heightMax - heightMin); // random height
    positions.push(new THREE.Vector3(x, y, z));
  }
  return positions;
}

// Usage: generate 3 random positions
const fireworkPositions = getRandomFireworkPositions(3);

function showgoalpopup(){
  const popup = document.getElementById('goal-popup');
  popup.classList.add('show');
  setTimeout(() => {
    popup.classList.remove = 'show';
  }, 3000); // Hide after 3 seconds
}

function showNotification(name,amount){
  const container = document.getElementById("donation-notification");
  const notif = document.createElement("div");
  notif.className = "notification";
  notif.innerText = 'New contribution from: ' + name;
  container.appendChild(notif);
  console.log("notification shown");
  setTimeout(() => {
    notif.classList.add('show');
  }, 100); // Slight delay to allow CSS transition
  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => {
      container.removeChild(notif);
    }, 500); // Wait for transition to finish before removing
  }, 4000); // Show for 4 seconds
}


let fillPercent = 0; // Initial fill percentage (40% full)
const goalAmount = 10000;// Assuming the goal is 1000 cents (or $10)
const newgoalAmount = 10000; // New goal amount in cents (or $120)
let lastTotalAmount = 0; // To track the last fetched amount  
async function fetchtotalAmount(){
  try{
    const response = await fetch("http://127.0.0.1:5000/api/total_amount");
    const data = await response.json();
    const waterLevel = data.total_amount; 
    const name = data.latest_user;
    const name_list = data.contributors;
    console.log("Total amount from Flask:", data.total_amount);
    document.getElementById('waterAmount').textContent = data.total_amount;
    
    fillPercent = waterLevel / goalAmount; // Convert to a percentage (assuming 1000 is the max)
    console.log("Total percent from Flask:",fillPercent);
    animateFill();
    updateProgressBar(fillPercent);
    if (waterLevel > lastTotalAmount) {
      console.log('fireworks now');
      showNotification(name,data.latest_amount);
      spawnMegaFirework(scene, fireworkPositions);
      
      

    }
    if (waterLevel >= newgoalAmount) {
      console.log('Goal reached!'); 
      showgoalpopup();
      
      
// You can trigger any additional actions here
    }
    lastTotalAmount = waterLevel; // Update last total amount
  }catch (error) {
    console.error('Error fetching total amount:', error);
  }
}

fetchtotalAmount();
setInterval(fetchtotalAmount, 2000); // Fetch every 10 seconds

let currentFill = 0;

const waterHeight = 8;// Full height of the water cylinder

function updateProgressBar(percent) {
  const bar = document.getElementById('progressBarFill');
  if (bar) {
    bar.style.width = `${percent * 100}%`;
    // bar.textContent = Math.round(percent * 100) + '%';
  }
}

function updateWaterLevel(percent) {
    // Clamp between 0 and 1
    percent = Math.max(0, Math.min(1, percent));

    const fullHeight = waterHeight;
    water.scale.y = percent*waterHeight; // scale in height
    water.position.y =-3.2+(fullHeight * percent) / 2;
    // console.log("Water level updated to:", percent);
}

// // Set initial fi

function animateFill() {
    if (currentFill < fillPercent) {
        currentFill += 0.00003;

        if (currentFill > fillPercent) currentFill = fillPercent;
    } else if (currentFill > fillPercent) {
        currentFill -= 0.0005;
        if (currentFill < fillPercent) currentFill = fillPercent;
    }
    updateWaterLevel(currentFill);
    // console.log("Current fill:", currentFill);

    if (currentFill !== fillPercent) {
        requestAnimationFrame(animateFill);
    }
}

animateFill();

// function setFillPercent(newPercent) {
//     _fillPercent = THREE.MathUtils.clamp(newPercent, 0, 1);
//     requestAnimationFrame(animateFill);
// }


animate();
setupUI({ waterResolution, water });


