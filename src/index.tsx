import React, { useCallback, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { DEFAULT_GAME_SIZE } from "./ui/useEngine";
import { EngineProvider } from "./ui/engineContext";
import { GameControls } from "./ui/GameControls";

const App = () => {
  const canvasContainer = useRef<HTMLDivElement>(null);
  const [tempSize, setTempSize] = useState(DEFAULT_GAME_SIZE);
  const [gameSize, setGameSize] = useState(DEFAULT_GAME_SIZE);
  const [gameReset, setGameReset] = useState(false);

  const resetGame = useCallback(() => {
    setGameReset(true);
    setGameSize(tempSize);
    setTimeout(() => setGameReset(false), 0);
  }, []);

  return (
    <div>
      <div className="canvas-container" ref={canvasContainer}></div>
      {!gameReset && (
        <EngineProvider canvas={canvasContainer} gameSize={gameSize}>
          <div>
            Width:
            <input
              type="number"
              value={tempSize.width}
              onChange={(e) => {
                setTempSize({
                  width: Number(e.currentTarget.value),
                  height: tempSize.height,
                });
              }}
            />
            Height:
            <input
              type="number"
              value={tempSize.height}
              onChange={(e) => {
                setTempSize({
                  height: Number(e.currentTarget.value),
                  width: tempSize.width,
                });
              }}
            />
          </div>
          <input
            type="button"
            value={"reset"}
            onClick={() => {
              setGameSize(tempSize);
              resetGame();
            }}
          />
          <GameControls />
        </EngineProvider>
      )}
    </div>
  );
};

const reactRoot = createRoot(document.getElementById("app")!);

reactRoot.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
