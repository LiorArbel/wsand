import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { DEFAULT_GAME_SIZE, useEngine } from "./ui/useEngine";
import { mat4, vec3 } from "wgpu-matrix";
import { MatrixController } from "./ui/MatrixController";
import { CameraController } from "./ui/CameraController";

const rotationMat = mat4.rotationZ(10*(Math.PI/180));

const App = () => {
  const [tempSize, setTempSize] = useState(DEFAULT_GAME_SIZE);
  const canvasContainer = useRef<HTMLDivElement>(null);
  const { resetGame, setBrushSize, brushSize, setGameSize, useEngineState } =
    useEngine(canvasContainer);
  const [cameraMat, setCameraMat] = useEngineState(
    (engine) => engine.renderer.camera,
    (engine, cam) => (engine.renderer.camera = cam),
    mat4.multiply(mat4.perspective(70 * (Math.PI/180), 2, 0.1, 200), mat4.translation(vec3.create(0,0,-10)))
  );

  return (
    <div>
      <div className="canvas-container" ref={canvasContainer}></div>
      <div className="controls">
        <CameraController setCameraMat={setCameraMat} />
        Brush size:
        <input
          type="range"
          min={1}
          max={100}
          value={brushSize}
          onChange={(e) => {
            setBrushSize(Number(e.currentTarget.value));
          }}
        />
        {brushSize}
        <div>
          {cameraMat && (
            <MatrixController mat={cameraMat} onChange={setCameraMat} />
          )}
        </div>
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
