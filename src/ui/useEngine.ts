import { useCallback, useEffect, useRef, useState } from "react";
import { GameEngine } from "../GameEngine/GameEngine";
import { BehaviorSubject } from "rxjs";

export const DEFAULT_GAME_SIZE = { width: 64 * 2, height: 64 };
export const DEFAULT_BRUSH_SIZE = 5;

export const useEngine = (canvasContainer: React.RefObject<HTMLElement>) => {
  const [engine, setEngine] = useState<GameEngine>();
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
      const engine = await GameEngine.createEngine(gameSize);
      if (destroyed) {
        destroyEngine();
        return;
      }
      canvasContainer.current?.appendChild(engine.canvas);
      setBrushSize(engine.sandSimulation.brushSize)
      engine.init();
      setEngine(engine);
    };
    const destroyEngine = () => {
      destroyed = true;
      if (engine) {
        engine.destroy();
        if (engine.canvas.parentElement == canvasContainer.current) {
          canvasContainer.current?.removeChild(engine.canvas);
        }
      }
    };

    loadEngine();

    return destroyEngine;
  }, [gameSize, gameReset]);

  useEffect(() => {
    if(engine){
      engine.sandSimulation.brushSize = brushSize;
    }
  }, [brushSize]);

  const useEngineState = <T>(getter: (engine: GameEngine) => T, setter: (engine: GameEngine, value: T) => void, defaultValue?:T):[T|undefined, (val:T) => void] => {
    const [uiState, setUiState] = useState(engine ? getter(engine) : defaultValue);
  
    const setWholeState = (val: T) => {
      if(!engine){
        return;
      }
      console.log(uiState);
      setUiState(val);
      setter(engine, val);
    }
  
    return [uiState, setWholeState];
  }

  const useEngineSubject = (engine:GameEngine) => <T>(getter: (engine: GameEngine) => BehaviorSubject<T>) :[T|undefined, (val:T) => void] => {
    useCallback(() => {
      sub.subscribe(newVal => {
        setUiState(newVal);
      })
    }, [engine]);

    const sub = getter(engine);
    const [uiState, setUiState] = useState(sub.value);

    return [sub.value, (setVal) => sub.next(setVal)]
  }

  if(!engine){
    return undefined;
  }

  return {
    setGameSize,
    resetGame,
    brushSize,
    setBrushSize,
    useEngineState,
    useEngineSubject: useEngineSubject(engine)
  }
}