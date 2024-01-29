import {
  useContext,
  createContext,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  useMemo,
} from "react";
import { GameEngine } from "../GameEngine/GameEngine";
import React from "react";
import { BehaviorSubject } from "rxjs";

const EngineContext = createContext<GameEngine | null>(null);

export const DEFAULT_GAME_SIZE = { width: 64 * 2, height: 64 };
export const DEFAULT_BRUSH_SIZE = 5;

export function EngineProvider({
  children,
  canvas,
  gameSize,
}: {
  canvas: React.RefObject<HTMLElement>;
  gameSize: { width: number; height: number };
} & React.PropsWithChildren) {
  const [engine, setEngine] = useState<GameEngine>();

  useEffect(() => {
    let destroyed = false;

    const loadEngine = async () => {
      const engine = await GameEngine.createEngine(gameSize);
      if (destroyed) {
        destroyEngine();
        return;
      }
      canvas.current?.appendChild(engine.canvas);
      engine.init();
      setEngine(engine);
    };
    const destroyEngine = () => {
      destroyed = true;
      if (engine) {
        engine.destroy();
        if (engine.canvas.parentElement == canvas.current) {
          canvas.current?.removeChild(engine.canvas);
        }
      }
    };

    loadEngine();

    return destroyEngine;
  }, [gameSize]);

  return !engine ? (
    <div>loading engine...</div>
  ) : (
    <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>
  );
}

export const useEngine = () => {
  const engine = useContext(EngineContext);
  if (!engine) {
    throw "Trying to use engine before it initialized";
  }
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);

  const useEngineSubject2 = <T,>(
    getter: (engine: GameEngine) => BehaviorSubject<T>
  ): [T | undefined, (val: T) => void] => {
    const sub = getter(engine);
    const [uiState, setUiState] = useState(sub.value);
    useEffect(() => {
      const subscription = sub.subscribe((newVal) => {
        setUiState(newVal);
      });

      return () => {
        subscription.unsubscribe();
      };
    }, [sub]);

    return [uiState, (setVal) => sub.next(setVal)];
  };

  const useEngineSubject = <T,>(
    getter: (engine: GameEngine) => BehaviorSubject<T>
  ):[T, (val: T) => void] => {
    const bs = getter(engine);
    const subscribe = useCallback((onChange: () => void) => {
      const subscription= bs.subscribe(onChange)
      return () => subscription.unsubscribe;
    }, [getter]);
    const value = useSyncExternalStore(subscribe, () => bs.value);

    const setValue = useCallback((val: T) => bs.next(val), [getter]);

    return [value, setValue];
  };

  const useEngineState = <T,>(
    getter: (engine: GameEngine) => T,
    setter: (engine: GameEngine, value: T) => void,
    defaultValue?: T
  ): [T | undefined, (val: T) => void] => {
    const [uiState, setUiState] = useState(
      engine ? getter(engine) : defaultValue
    );

    const setWholeState = (val: T) => {
      if (!engine) {
        return;
      }
      console.log(uiState);
      setUiState(val);
      setter(engine, val);
    };

    return [uiState, setWholeState];
  };

  useEffect(() => {
    if (engine) {
      engine.sandSimulation.brushSize = brushSize;
    }
  }, [brushSize]);

  return {
    useEngineSubject,
    useEngineState,
    setBrushSize,
    brushSize,
  };
};
