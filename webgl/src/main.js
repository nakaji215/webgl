import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';

// シーンの作成
const scene = new THREE.Scene();

// カメラの作成（視野角、アスペクト比、近くのクリップ面、遠くのクリップ面）
const camera = new THREE.PerspectiveCamera(
    75, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
);

// レンダラーの作成
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// リサイズ対応
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

// カメラコントロールの追加
const controls = new OrbitControls(camera, renderer.domElement);

// 物理エンジンの設定
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // 重力を設定

// 地面の作成（長方形の立方体）
const groundShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 5)); // (幅, 厚さ, 奥行き)
const groundBody = new CANNON.Body({ mass: 0 });
groundBody.addShape(groundShape);
groundBody.position.set(0, -0.5, 0); // 地面の位置を設定
world.addBody(groundBody);

// 地面のメッシュを作成
const groundGeometry = new THREE.BoxGeometry(10, 1, 10); // (幅, 高さ, 奥行き)
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x008800 });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.position.set(0, -0.5, 0); // メッシュの位置を調整
scene.add(groundMesh);

// 立方体を保存する配列
const boxMeshes = [];

// ライトの追加
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // 環境光
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 平行光源
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// カメラの位置を設定
camera.position.set(0, 5, 10);

// ランダムな形状を作成する関数
function createRandomShape(position) {
    // ランダムに選択する形状の種類
    const shapes = ['box', 'sphere', 'cylinder'];
    const shapeType = shapes[Math.floor(Math.random() * shapes.length)];

    // 物理ボディの作成
    let shape;
    switch (shapeType) {
        case 'box':
            shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
            break;
        case 'sphere':
            shape = new CANNON.Sphere(0.5);
            break;
        case 'cylinder':
            shape = new CANNON.Cylinder(0.5, 0.5, 0.5, 8);
            break;
    }
    const body = new CANNON.Body({ mass: 1 });
    body.addShape(shape);
    body.position.copy(position);
    world.addBody(body);

    // メッシュの作成
    let geometry;
    switch (shapeType) {
        case 'box':
            geometry = new THREE.BoxGeometry(1, 1, 1);
            break;
        case 'sphere':
            geometry = new THREE.SphereGeometry(0.5, 32, 32);
            break;
        case 'cylinder':
            geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
            break;
    }
    const material = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 物理ボディとメッシュを関連付け
    body.mesh = mesh;
    mesh.body = body;
    boxMeshes.push(mesh); // 形状のメッシュを配列に追加
}

// マウスクリックのレイキャスト設定
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// クリックイベントで形状を作成
window.addEventListener('click', (event) => {
    // マウス座標を正規化
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // レイキャストを地面に向けて行う
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(groundMesh);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        createRandomShape(new THREE.Vector3(intersect.point.x, 5, intersect.point.z)); // クリックした位置の真上に形状を設定
    }
});

// リセットボタンのクリックイベント
document.getElementById('reset-button').addEventListener('click', () => {
    // 物理ボディを削除
    boxMeshes.forEach(mesh => {
        if (mesh.body) {
            world.removeBody(mesh.body);
        }
        scene.remove(mesh);
    });

    // 配列をクリア
    boxMeshes.length = 0;
});

// アニメーションループの作成
function animate() {
    requestAnimationFrame(animate);

    // 物理シミュレーションの更新
    world.step(1 / 60);

    // すべてのメッシュの位置を更新
    scene.children.forEach((child) => {
        if (child.body) {
            child.position.copy(child.body.position);
            child.quaternion.copy(child.body.quaternion);
        }
    });

    // レンダリング
    renderer.render(scene, camera);
}

// アニメーション開始
animate();
