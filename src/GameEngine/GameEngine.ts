import { mat4 } from "wgpu-matrix";
import { Renderer } from "../renderer";
import { Mesh } from "../renderer/Mesh";
import { SandSimulation } from "../sand-simulation/SandSimulation";

export class GameEngine {
  renderer: Renderer;
  sandSimulation: SandSimulation;
  canvas: HTMLCanvasElement;

  private constructor(
    canvas: HTMLCanvasElement,
    renderer: Renderer,
    size: { width: number; height: number }
  ) {
    this.renderer = renderer;
    this.canvas = canvas;
    this.sandSimulation = new SandSimulation(renderer.device, size, canvas);
    this.sandSimulation.bindToTexture(this.renderer.imageTexture);
    console.log("Game engine created");
  }

  public static async createEngine(size = { width: 64 * 2, height: 64 }) {
    const canvas = document.createElement("canvas");
    canvas.height = 512;
    canvas.width = 512 * 2;
    const renderer = await Renderer.createRenderer(canvas, size);
    const mesh = new Mesh(
      new Float32Array([1.0, -1.0, 0.0, -1.0, -1.0, 0.0, 0.0, 1.0, 0.0]),
      new Uint16Array([0, 1, 2]),
      mat4.identity(),
      new Float32Array([0,0,1,0,1,1])
    );
    renderer.meshes.push(mesh);
    return new GameEngine(canvas, renderer, size);
  }

  public init() {
    this.renderer.initRenderLoop();
    this.sandSimulation.initSimulationLoop();
  }

  public destroy() {
    this.renderer.destroy();
    this.sandSimulation.destroy();
  }
}
