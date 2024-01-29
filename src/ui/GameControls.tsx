import { mat4, vec3 } from "wgpu-matrix";
import { MatrixController } from "./MatrixController";
import { CameraController } from "./CameraController";
import { useEngine } from "./engineContext";
import React from "react";
import { BehaviorSubject, map } from "rxjs";

export function GameControls() {
  const { useEngineState,useEngineSubject, setBrushSize,brushSize } = useEngine();
  const [cameraMat, setCameraMat] = useEngineState(
    (engine) => engine.renderer.camera,
    (engine, cam) => (engine.renderer.camera = cam),
    mat4.multiply(
      mat4.perspective(70 * (Math.PI / 180), 2, 0.1, 200),
      mat4.translation(vec3.create(0, 0, -10))
    )
  );
  const [camera, setCamera] = useEngineSubject((engine) => engine.camera);

  return <div className="controls">
        {camera && <CameraController camera={camera} setCamera={setCamera} />}
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
      </div>
}
