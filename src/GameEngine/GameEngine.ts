import { mat4, vec3 } from "wgpu-matrix";
import { Renderer } from "../renderer";
import { Mesh } from "../renderer/Mesh";
import { SandSimulation } from "../sand-simulation/SandSimulation";
import { Keyboard } from "./Keyboard";
import { Object3D } from "./Object3D";
import { Camera } from "./Camera";
import { BehaviorSubject } from "rxjs";

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
    this.sandSimulation.bindToTexture(this.renderer.imageTexture);

    const mesh = new Mesh(
      new Float32Array([1.0, -1.0, 0.0, -1.0, -1.0, 0.0, 0.0, 1.0, 0.0]),
      new Uint16Array([0, 1, 2]),
      mat4.identity(),
      new Float32Array([0, 0, 1, 0, 1, 1])
    );

    const mesh2 = new Mesh(
      new Float32Array([1.0, -1.0, 0.0, -1.0, -1.0, 0.0, 0.0, 1.0, 0.0]),
      new Uint16Array([0, 1, 2]),
      mat4.translation(vec3.create(1, 0, 0.0001)),
      new Float32Array([0, 0, 1, 0, 1, 1])
    );

    const gameObject1: GameObject = {
      update: (delta) => {
        const rotation = 15 * Math.PI/180;
        mat4.rotateZ(mesh.transform, delta * rotation, mesh.transform);
      },
    };

    renderer.meshes.push(...[mesh, mesh2]);
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
      camMovement[2] += this.moveSpeed * delta;
      moved = true;
    }
    if (this.keyboard.isDown("s")) {
      camMovement[2] -= this.moveSpeed * delta;
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
    if(moved){
      const new3D = this.camera.value.o3d.clone();
      vec3.add(new3D.position, camMovement, new3D.position);
      this.camera.value.o3d = new3D;
      this.camera.next(this.camera.value);
    }
    this.renderer.camera = this.camera.value.getTransfrom();
    this.gameObjects.forEach((i) => {
      i.update && i.update(delta);
    });
  }
}
