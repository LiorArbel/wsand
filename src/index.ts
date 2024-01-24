import { GameEngine } from "./GameEngine/GameEngine";

async function comp() {
  const root = document.createElement("div");

  const canvasContainer = document.createElement("div");
  canvasContainer.className = "canvas-container";
  root.appendChild(canvasContainer);

  let engine: GameEngine|undefined;
  let canvas: HTMLCanvasElement|undefined;

  const reset = async() => {
    if(engine != undefined){
      engine.destroy();
    }
    engine = await GameEngine.createEngine();
    if(canvas != undefined){
      canvasContainer.removeChild(canvas);
    }
    canvas = engine.canvas;
    canvasContainer.appendChild(canvas);
    engine.init();
  }

  await reset();
  
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "reset simulation";
  resetBtn.addEventListener("click", () => {
    reset();
  })
  root.appendChild(resetBtn)

  return root;
}

setTimeout(async () => {
  const element = await comp();

  document.body.appendChild(element);
}, 0);
