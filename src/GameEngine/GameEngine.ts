import { Renderer } from "../renderer";
import { SandSimulation } from "../sand-compute/SandSimulation";

export class GameEngine{
    renderer: Renderer;
    sandSimulation: SandSimulation;
    canvas: HTMLCanvasElement;

    private constructor(canvas: HTMLCanvasElement, renderer: Renderer){
        this.renderer = renderer;
        this.canvas = canvas;
        const size = { width: 256 * 2, height: 256 };
        this.sandSimulation = new SandSimulation(renderer.device, size, canvas);
        this.sandSimulation.bindToTexture(this.renderer.imageTexture);
    }

    public static async createEngine(){
        const canvas = document.createElement("canvas");
        canvas.height = 512;
        canvas.width = 512*2;
        const renderer = await Renderer.createRenderer(canvas);
        return new GameEngine(canvas, renderer);
    }

    public init(){
        this.renderer.initRenderLoop();
        this.sandSimulation.initSimulationLoop();
    }
}