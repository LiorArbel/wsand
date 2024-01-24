import { GameEngine } from "./GameEngine/GameEngine";
import { Renderer } from "./renderer";

async function comp() {
  const engine = await GameEngine.createEngine();
  const root = document.createElement("div");
  root.appendChild(engine.canvas);
  
  engine.init()

  return root;
}

setTimeout(async () => {
  const element = await comp();

  document.body.appendChild(element);
}, 0);
