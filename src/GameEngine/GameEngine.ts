import { mat4, vec3 } from "wgpu-matrix";
import { Renderer } from "../renderer";
import { Mesh } from "../renderer/Mesh";
import { SandSimulation } from "../sand-simulation/SandSimulation";
import { Keyboard } from "./Keyboard";
import { Object3D } from "./Object3D";
import { Camera } from "./Camera";
import { BehaviorSubject } from "rxjs";
import { Texture } from "../renderer/Texture";

export interface GameObject {
  update?: (delta: number) => void;
  onDestroy?: () => void;
}

export class GameEngine {
  renderer: Renderer;
  sandSimulation: SandSimulation;
  canvas: HTMLCanvasElement;
  keyboard: Keyboard;
  camera: BehaviorSubject<Camera>;
  gameObjects: GameObject[] = [];
  moveSpeed = 3;

  private constructor(
    canvas: HTMLCanvasElement,
    renderer: Renderer,
    size: { width: number; height: number }
  ) {
    this.renderer = renderer;
    this.canvas = canvas;
    this.keyboard = new Keyboard(canvas);

    this.camera = new BehaviorSubject(
      new Camera(new Object3D(), (70 * Math.PI) / 180, 2, 0.1, 1000)
    );
    this.sandSimulation = new SandSimulation(renderer.device, size, canvas);

    const sandTexture = new Texture(renderer.device, new Uint8Array(size.height * size.width * 4), size);
    this.sandSimulation.bindToTexture(sandTexture.texture);

    const mesh = new Mesh(
      new Float32Array([1.0, -1.0, 0.0, -1.0, -1.0, 0.0, 0.0, 1.0, 0.0]),
      new Uint16Array([0, 1, 2]),
      mat4.translation(vec3.create(5, 0, 0.0001)),
      new Float32Array([0, 0, 1, 0, 1, 1])
    );

    const mesh2 = new Mesh(
      new Float32Array([1.0, -1.0, 0.0, -1.0, -1.0, 0.0, 0.0, 1.0, 0.0]),
      new Uint16Array([0, 1 , 2]),
      mat4.translation(vec3.create(-3, 0, 2)),
      new Float32Array([1, 0, 0, 1, 1, 1])
    );

    const mesh3 = new Mesh(
      new Float32Array([
        -1.0, -1.0, 0.0, 
        -1.0, 1.0, 0.0, 
        1.0, -1.0, 0.0, 
        1.0, -1.0, 0.0,
        -1.0, 1.0, 0.0,
        1.0, 1.0, 0.0
      ]),
      new Uint16Array([0, 1, 2, 3, 4, 5]),
      mat4.scale(mat4.translation(vec3.create(0,0,1.42)), vec3.create(2,1,1)),
      new Float32Array([
        0, 0,
        0, 1, 
        1, 0, 
        1, 0, 
        0, 1, 
        1, 1
      ])
    );
    mesh3.texture = sandTexture;

    const gameObject1: GameObject = {
      update: (delta) => {
        const rotation = 15 * Math.PI/180;
        mat4.rotateZ(mesh.transform, delta * rotation, mesh.transform);
      },
    };

    renderer.meshes.push(...[mesh, mesh2, mesh3]);
    this.gameObjects.push(gameObject1);
    console.log("Game engine created");
  }

  public static async createEngine(size = { width: 64 * 2, height: 64 }) {
    const canvas = document.createElement("canvas");
    canvas.height = 512;
    canvas.width = 512 * 2;
    canvas.tabIndex = 1;
    const renderer = await Renderer.createRenderer(canvas, size);

    return new GameEngine(canvas, renderer, size);
  }

  public init() {
    this.renderer.initRenderLoop();
    this.sandSimulation.initSimulationLoop();
    this.initGameLoop();
  }

  public destroy() {
    this.renderer.destroy();
    this.sandSimulation.destroy();
    this.destroyed = true;
  }

  destroyed = false;
  public initGameLoop() {
    let lastFrame = new Date().getTime();
    const loop = () => {
      const now = new Date().getTime();
      const delta = (now - lastFrame)/1000;
      lastFrame = now;
      this.update(delta);
      if (!this.destroyed) {
        requestAnimationFrame(loop);
      }
    };
    loop();
  }

  private update(delta: number) {
    const camMovement = vec3.create();
    let moved = false;
    if (this.keyboard.isDown("w")) {
      camMovement[2] -= this.moveSpeed * delta;
      moved = true;
    }
    if (this.keyboard.isDown("s")) {
      camMovement[2] += this.moveSpeed * delta;
      moved = true;
    }
    if (this.keyboard.isDown("a")) {
      camMovement[0] -= this.moveSpeed * delta;
      moved = true;
    }
    if (this.keyboard.isDown("d")) {
      camMovement[0] += this.moveSpeed * delta;
      moved = true;
    }
    if (this.keyboard.isDown("q")) {
      this.camera.value.o3d.rotation[1] += this.moveSpeed*10 * delta *Math.PI/180;
      moved = true;
    }
    if (this.keyboard.isDown("e")) {
      this.camera.value.o3d.rotation[1] -= this.moveSpeed*10 * delta *Math.PI/180;
      moved = true;
    }
    if(moved){
      const localForward = this.camera.value.o3d.getForwad();
      const new3D = this.camera.value.o3d.clone();
      vec3.add(new3D.position, vec3.transformQuat(camMovement,this.camera.value.o3d.getQuat()), new3D.position);
      this.camera.value.o3d = new3D;
      this.camera.next(this.camera.value);
    }
    this.renderer.camera = this.camera.value.getTransfrom();
    this.gameObjects.forEach((i) => {
      i.update && i.update(delta);
    });
  }
}
