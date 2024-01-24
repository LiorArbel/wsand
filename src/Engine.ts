type EngineSetupOptions = {
  width: number;
  height: number;
};

export class Engine {
  renderer: Function = () => {};
  canvas: HTMLCanvasElement;
  initialized = false;
  ecs = new ECS();

  constructor(opts: EngineSetupOptions = { height: 540, width: 1024 }) {
    this.canvas = document.createElement("canvas");
    this.initialize();
  }

  async initialize() {
    if (this.initialized) {
      console.warn("trying to initialize a started engine");
      return;
    }
    this.initialized = true;
  }
}

export {};
