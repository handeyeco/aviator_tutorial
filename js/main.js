const Colors = {
  brownDark: 0x23190F,
  brown: 0x59332E,
  white: 0xD8D0D1,
  blue: 0x68C3C0,
  pink: 0xF5986E,
  red: 0xF25346,
};

let mousePos = {x: 0, y: 0},
    hemisphereLight,
    ambientLight,
    shadowLight,
    aspectRatio,
    fieldOfView,
    nearPlane,
    container,
    airplane,
    farPlane,
    renderer,
    camera,
    height,
    width,
    scene,
    sea,
    sky;

window.addEventListener('load', init, false);

function init() {
  createScene();
  createLights();
  createSea();
  createSky();
  createPlane();

  document.addEventListener('mousemove', handleMouseMove, false);

  loop();
}

function createScene() {
  height = window.innerHeight;
  width = window.innerWidth;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xF7D9AA, 100, 950);
  aspectRatio = width / height;
  fieldOfView = 60;
  nearPlane = 1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );

  camera.position.x = 0;
  camera.position.y = 100;
  camera.position.z = 200;

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });

  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;

  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);
}

function handleWindowResize() {
  height = window.innerHeight;
  width = window.innerWidth;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function createLights() {
  hemisphereLight = new THREE.HemisphereLight(0xAAAAAA, 0x000000, 0.9);
  ambientLight = new THREE.AmbientLight(0xDC8874, 0.2);

  shadowLight = new THREE.DirectionalLight(0xFFFFFF, 0.9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  scene.add(hemisphereLight);
  scene.add(ambientLight);
  scene.add(shadowLight);
}

function Sea() {
  let geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  geom.mergeVertices();

  this.waves = [];
  for (let i = 0, v; i < geom.vertices.length; i++) {
    v = geom.vertices[i];
    this.waves.push({
      y: v.y,
      x: v.x,
      z: v.z,
      ang: Math.random() * Math.PI * 2,
      amp: 5 + Math.random() * 15,
      speed: 0.016 + Math.random() * 0.032
    });
  }

  let mat = new THREE.MeshPhongMaterial({
    color: Colors.blue,
    transparent: true,
    opacity: 0.6,
    flatShading: true,
  });

  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.receiveShadow = true;
}

Sea.prototype.moveWaves = function () {
  let verts = this.mesh.geometry.vertices;

  for (let i = 0, v, vprops; i < verts.length; i++) {
    v = verts[i];
    vprops = this.waves[i];
    v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
    v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;
    vprops.ang += vprops.speed;
  }

  this.mesh.geometry.verticesNeedUpdate = true;

  sea.mesh.rotation.z += 0.005;
}

function createSea() {
  sea = new Sea();
  sea.mesh.position.y = -600;
  scene.add(sea.mesh);
  console.log(scene);
}

function Cloud() {
  this.mesh = new THREE.Object3D();

  let geom = new THREE.BoxGeometry(20, 20, 20);
  let mat = new THREE.MeshPhongMaterial({
    color: Colors.white,
  });

  for (let i = 0, n = 3 + Math.floor(Math.random() * 3), m, s; i < n; i++) {
    m = new THREE.Mesh(geom, mat);
    m.position.x = i * 15;
    m.position.y = Math.random() * 10;
    m.position.z = Math.random() * 10;
    m.rotation.y = Math.random() * Math.PI * 2;
    m.rotation.z = Math.random() * Math.PI * 2;

    s = 0.1 + Math.random() * 0.9;
    m.scale.set(s, s, s);
    m.castShadow = true;
    m.receiveShadow = true;

    this.mesh.add(m);
  };
}

function Sky() {
  this.mesh = new THREE.Object3D();
  this.nClouds = 20;

  let stepAngle = Math.PI * 2 / this.nClouds;

  for (let i = 0, c, a, h, s; i < this.nClouds; i++) {
    a = stepAngle * i;
    h = 750 + Math.random() * 200;
    s = 1 + Math.random() * 2;
    c = new Cloud();
    c.mesh.position.x = Math.cos(a) * h;
    c.mesh.position.y = Math.sin(a) * h;
    c.mesh.position.z = -400 - Math.random() * 400;
    c.mesh.rotation.z = a + Math.PI / 2;
    c.mesh.scale.set(s, s, s);

    this.mesh.add(c.mesh);
  }
}

function createSky() {
  sky = new Sky();
  sky.mesh.position.y = -600;
  scene.add(sky.mesh);
}

function AirPlane() {
  this.mesh = new THREE.Object3D();

  let geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
  let matCockpit = new THREE.MeshPhongMaterial({
    color: Colors.red,
    flatShading: true,
  });

  geomCockpit.vertices[4].y -= 10;
  geomCockpit.vertices[4].z += 20;
  geomCockpit.vertices[5].y -= 10;
  geomCockpit.vertices[5].z -= 20;
  geomCockpit.vertices[6].y += 30;
  geomCockpit.vertices[6].z += 20;
  geomCockpit.vertices[7].y += 30;
  geomCockpit.vertices[7].z -= 20;

  let cockpit = new THREE.Mesh(geomCockpit, matCockpit);
  cockpit.castShadow = true;
  cockpit.receiveShadow = true;
  this.mesh.add(cockpit);

  let geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
  let matEngine = new THREE.MeshPhongMaterial({
    color: Colors.white,
    flatShading: true,
  });
  let engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 40;
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);

  let geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
  let matTailPlane = new THREE.MeshPhongMaterial({
    color: Colors.red,
    flatShading: true,
  });
  let tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
  tailPlane.position.set(-35, 25, 0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  this.mesh.add(tailPlane);

  let geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
  let matSideWing = new THREE.MeshPhongMaterial({
    color: Colors.red,
    flatShading: true,
  });
  let sideWing = new THREE.Mesh(geomSideWing, matSideWing);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);

  let geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
  let matPropeller = new THREE.MeshPhongMaterial({
    color: Colors.brown,
    flatShading: true,
  });
  this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;

  let geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
  let matBlade = new THREE.MeshPhongMaterial({
    color: Colors.brownDark,
    flatShading: true,
  });
  let blade = new THREE.Mesh(geomBlade, matBlade);
  blade.position.set(8, 0, 0);
  blade.castShadow = true;
  blade.receiveShadow = true;

  this.propeller.add(blade);
  this.propeller.position.set(50, 0, 0);
  this.mesh.add(this.propeller);
}

function createPlane() {
  airplane = new AirPlane();
  airplane.mesh.scale.set(0.25, 0.25, 0.25);
  airplane.mesh.position.y = 100;
  scene.add(airplane.mesh);
}

function loop() {
  sky.mesh.rotation.z += 0.01;

  updatePlane();
  sea.moveWaves();

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function updatePlane() {
  let targetX = normalize(mousePos.x, -0.75, 0.75, -100, 100);
  let targetY = normalize(mousePos.y, -0.75, 0.75, 25, 175);

  airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * 0.1;

  airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY) * 0.0064;
  airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * 0.0128;

  airplane.propeller.rotation.x += 0.3;
}

function normalize(v, vmin, vmax, tmin, tmax){
	let nv = Math.max(Math.min(v, vmax), vmin);
	let dv = vmax - vmin;
	let pc = (nv - vmin) / dv;
	let dt = tmax - tmin;
	let tv = tmin + (pc * dt);
	return tv;
}

function handleMouseMove(e) {
  let x = -1 + (e.clientX / width) * 2;
  let y = 1 - (e.clientY / height) * 2;
  mousePos = {x, y};
}
