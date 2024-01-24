import { GameEngine } from "./GameEngine/GameEngine";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

const App = () => {
  const [gameSize,setGameSize] = useState({ width: 64 * 2, height: 64 });
  const canvasContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {

    let destroyed = false;
    let engine: GameEngine | undefined;

    const loadEngine = async () => {
      engine = await GameEngine.createEngine(gameSize);
      canvasContainer.current?.appendChild(engine.canvas);
      engine.init();
      if(destroyed){
        destroyEngine();
      }
    };
    const destroyEngine = () => {
      destroyed = true;
      if(engine){
        engine.destroy();
        if(engine.canvas.parentElement == canvasContainer.current){
          canvasContainer.current?.removeChild(engine.canvas);
        }
      }
    }

    loadEngine();

    return destroyEngine;
  }, [gameSize]);

  return (
    <div>
      <div className="canvas-container" ref={canvasContainer}></div>
      Hello from react!
    </div>
  );
};

const reactRoot = createRoot(document.getElementById("app")!);

reactRoot.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
