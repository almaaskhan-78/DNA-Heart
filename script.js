import * as THREE from "three";

import { EffectComposer } from "https://unpkg.com/three@0.166.1/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.166.1/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://unpkg.com/three@0.166.1/examples/jsm/postprocessing/UnrealBloomPass.js";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 0, 5);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);

composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
);

composer.addPass(bloomPass);

const particleCount = 10000;

const geometry = new THREE.BufferGeometry();

const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i += 3) {

    positions[i] = (Math.random() - 0.5) * 40;
    positions[i + 1] = (Math.random() - 0.5) * 40;
    positions[i + 2] = (Math.random() - 0.5) * 40;

}

geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
);

const particleTexture = new THREE.TextureLoader().load(
    "https://threejs.org/examples/textures/sprites/disc.png"
);

const material = new THREE.PointsMaterial({
    color: 0xff1a3d,
    size: 0.08,
    map: particleTexture,
    transparent: true,
    alphaTest: 0.01,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
});

const particles = new THREE.Points(
    geometry,
    material
);

const dnaRadius = 1.2;
const dnaHeight = 8;
const dnaTurns = 8;
const pointsPerStrand = 500;

const dnaTargets = [];

for (let i = 0; i < pointsPerStrand; i++) {

    const t = (i / pointsPerStrand) * Math.PI * 2 * dnaTurns;

    const y = (i / pointsPerStrand) * dnaHeight - dnaHeight / 2;

    // Left strand
    dnaTargets.push(
        Math.cos(t) * dnaRadius,
        y,
        Math.sin(t) * dnaRadius
    );

    // Right strand
    dnaTargets.push(
        Math.cos(t + Math.PI) * dnaRadius,
        y,
        Math.sin(t + Math.PI) * dnaRadius
    );

}
const targets = [];

const particlePositions = geometry.attributes.position.array;

for (let i = 0; i < particleCount; i++) {

    if (i * 3 < dnaTargets.length) {

        targets.push(
            dnaTargets[i * 3],
            dnaTargets[i * 3 + 1],
            dnaTargets[i * 3 + 2]
        );

    } else {

        targets.push(
            particlePositions[i * 3],
            particlePositions[i * 3 + 1],
            particlePositions[i * 3 + 2]
        );

    }

}

const heartTargets = [];

const heartPoints = pointsPerStrand;

for (let i = 0; i < heartPoints; i++) {

    const t = (i / heartPoints) * Math.PI * 2;

    const x = 16 * Math.pow(Math.sin(t), 3);

    const y =
        13 * Math.cos(t)
        - 5 * Math.cos(2 * t)
        - 2 * Math.cos(3 * t)
        - Math.cos(4 * t);

    // Front layer
    heartTargets.push(
        x * 0.12,
        y * 0.12,
        -0.25
    );

    // Back layer
    heartTargets.push(
        x * 0.12,
        y * 0.12,
        0.25
    );

}
let morph = 0;
let morphing = false;


setTimeout(() => {

    morphing = true;

}, 5000);
scene.add(particles);
const lineGeometry = new THREE.BufferGeometry();

const linePositions = new Float32Array(dnaTargets.length);

lineGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(linePositions, 3)
);

const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xff1a3d,
    transparent: true,
    opacity: 0.45
});

const dnaLines = new THREE.LineSegments(
    lineGeometry,
    lineMaterial
);

scene.add(dnaLines);
const clock = new THREE.Clock();

function animate() {

    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // Increase morph amount
    if (morphing && morph < 1) {
        morph += 0.002;
    }

    // Calculate target positions
    for (let i = 0; i < pointsPerStrand; i++) {

        const t = (i / pointsPerStrand) * Math.PI * 2 * dnaTurns + time * 0.6;
        const y = (i / pointsPerStrand) * dnaHeight - dnaHeight / 2;

        // DNA positions
        const dnaLeftX = Math.cos(t) * dnaRadius;
        const dnaLeftY = y;
        const dnaLeftZ = Math.sin(t) * dnaRadius;

        const dnaRightX = Math.cos(t + Math.PI) * dnaRadius;
        const dnaRightY = y;
        const dnaRightZ = Math.sin(t + Math.PI) * dnaRadius;

        // Heart positions
        const heartIndex = i * 6;

        // Blend DNA -> Heart
        targets[i * 6] =
            dnaLeftX * (1 - morph) + heartTargets[heartIndex] * morph;

        targets[i * 6 + 1] =
            dnaLeftY * (1 - morph) + heartTargets[heartIndex + 1] * morph;

        targets[i * 6 + 2] =
            dnaLeftZ * (1 - morph) + heartTargets[heartIndex + 2] * morph;

        targets[i * 6 + 3] =
            dnaRightX * (1 - morph) + heartTargets[heartIndex + 3] * morph;

        targets[i * 6 + 4] =
            dnaRightY * (1 - morph) + heartTargets[heartIndex + 4] * morph;

        targets[i * 6 + 5] =
            dnaRightZ * (1 - morph) + heartTargets[heartIndex + 5] * morph;
    }

    // Smooth animation
    const positions = geometry.attributes.position.array;

    for (let i = 0; i < dnaTargets.length; i += 3) {

        positions[i] += (targets[i] - positions[i]) * 0.02;
        positions[i + 1] += (targets[i + 1] - positions[i + 1]) * 0.02;
        positions[i + 2] += (targets[i + 2] - positions[i + 2]) * 0.02;

    }

    geometry.attributes.position.needsUpdate = true;

    // Update connecting lines
    const lineArray = lineGeometry.attributes.position.array;

    let index = 0;

    for (let i = 0; i < pointsPerStrand; i++) {

        const left = i * 6;
        const right = left + 3;

        lineArray[index++] = positions[left];
        lineArray[index++] = positions[left + 1];
        lineArray[index++] = positions[left + 2];

        lineArray[index++] = positions[right];
        lineArray[index++] = positions[right + 1];
        lineArray[index++] = positions[right + 2];
    }

    lineGeometry.attributes.position.needsUpdate = true;

    // Camera movement
    camera.position.x = Math.sin(time * 0.2) * 2.5;
    camera.position.z = 5 + Math.cos(time * 0.2) * 0.5;

    camera.lookAt(scene.position);

    composer.render();
}

animate();
window.addEventListener("resize", () => {

    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    composer.setSize(window.innerWidth, window.innerHeight);

});
