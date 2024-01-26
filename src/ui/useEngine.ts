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

  const useEngineState = <T>(getter: (engine: GameEngine) => T, setter: (engine: GameEngine, value: T) => void, defaultValue?:T):[T|undefined, (val:T) => void] => {
    const [uiState, setUiState] = useState(engine.current ? getter(engine.current) : defaultValue);
  
    const setWholeState = (val: T) => {
      if(!engine.current){
        return;
      }
      console.log(uiState);
      setUiState(val);
      setter(engine.current, val);
    }
  
    return [uiState, setWholeState];
  }

  return {
    setGameSize,
    resetGame,
    brushSize,
    setBrushSize,
    useEngineState
  }
}