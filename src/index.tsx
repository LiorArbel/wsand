import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { DEFAULT_GAME_SIZE, useEngine } from "./ui/useEngine";

const App = () => {
  const [tempSize, setTempSize] = useState(DEFAULT_GAME_SIZE);
  const canvasContainer = useRef<HTMLDivElement>(null);
  const {resetGame, setBrushSize, brushSize, setGameSize} = useEngine(canvasContainer);

  return (
    <div>
      <div className="canvas-container" ref={canvasContainer}></div>
      <div className="controls">
        Brush size:
        <input
          type="range"
          min={1}
          max={100}
          value={brushSize}
          onChange={(e) => {
            setBrushSize(
              Number(e.currentTarget.value)
            );
          }}
        />
        {brushSize}
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
      </div>
    </div>
  );
};

const reactRoot = createRoot(document.getElementById("app")!);

reactRoot.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
