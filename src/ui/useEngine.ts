import { useCallback, useEffect, useRef, useState } from "react";
import { GameEngine } from "../GameEngine/GameEngine";

export const DEFAULT_GAME_SIZE = { width: 64 * 2, height: 64 };
export const DEFAULT_BRUSH_SIZE = 5;

export const useEngine = (canvasContainer: React.RefObject<HTMLElement>) => {
  const engine = useRef<GameEngine>();
  const [gameSize, setGameSize] = useState(DEFAULT_GAME_SIZE);
  const [gameReset, setGameReset] = useState(false);
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);
  const resetGame = useCallback(() => {
    setGameReset(true);
    setTimeout(() => setGameReset(false), 0);
  },[])

  useEffect(() => {
    let destroyed = false;

    const loadEngine = async () => {
      engine.current = await GameEngine.createEngine(gameSize);
      if (destroyed) {
        destroyEngine();
        return;
      }
      canvasContainer.current?.appendChild(engine.current.canvas);
      setBrushSize(engine.current.sandSimulation.brushSize)
      engine.current.init();
    };
    const destroyEngine = () => {
      destroyed = true;
      if (engine.current) {
        engine.current.destroy();
        if (engine.current.canvas.parentElement == canvasContainer.current) {
          canvasContainer.current?.removeChild(engine.current.canvas);
        }
      }
    };

    loadEngine();

    return destroyEngine;
  }, [gameSize, gameReset]);

  useEffect(() => {
    if(engine.current){
      engine.current.sandSimulation.brushSize = brushSize;
    }
  }, [brushSize]);

  return {
    setGameSize,
    resetGame,
    brushSize,
    setBrushSize
  }
}