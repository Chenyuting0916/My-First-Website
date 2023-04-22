import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

//init
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.background = new THREE.Color(0xffffff);
const light = new THREE.PointLight(0xc4c4c4, 2);
light.position.set(0,300,500);
scene.add(light);
const controls = new OrbitControls(camera, renderer.domElement);

//load
const loader = new GLTFLoader();

var loadedObj;
loader.load('adamHead.gltf', function (gltf) {
    loadedObj = gltf.scene;
    loadedObj.position.y += 0.8;
    scene.add(loadedObj);
});

camera.position.set(5, 0, 0);

function animate() {
    requestAnimationFrame(animate);
    loadedObj.rotation.y += 0.01;
    controls.update();
    renderer.render(scene, camera);
}

animate();