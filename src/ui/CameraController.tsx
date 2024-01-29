import React, { useCallback } from "react";
import { Camera } from "../GameEngine/Camera";
import { Object3D } from "../GameEngine/Object3D";
import { BehaviorSubject, map } from "rxjs";
import { useEngine } from "./engineContext";
import { GameEngine } from "../GameEngine/GameEngine";

const round = (num: number) => {
  return Math.round(num*100)/100;
}

export function CameraController({
  setCamera,
  camera,
}: {
  setCamera: (cam: Camera) => void;
  camera: Camera;
}) {
  const { useEngineSubject } = useEngine();
  const camPosGetter = useCallback((engine:GameEngine) => {
    const posSubject = new BehaviorSubject(engine.camera.value.o3d);
    engine.camera.pipe(map((c) => c.o3d)).subscribe((v) => {
      posSubject.next(v);
    });
    return posSubject;
  }, [])
  const [cameraTran] = useEngineSubject(camPosGetter);

  const commitCam = useCallback(() => {
    const newCam = new Camera(
      new Object3D(camera.o3d.position, camera.o3d.rotation, camera.o3d.scale),
      camera.fov,
      camera.aspect,
      camera.near,
      camera.far
    );
    setCamera(newCam);
  }, [camera]);

  return (
    <div>
      <div>
        position: x
        <input
          type="number"
          onChange={(e) => {
            camera.o3d.position[0] = Number(e.target.value);
            commitCam();
          }}
          value={round(cameraTran.position[0])}
        />
        y
        <input
          type="number"
          onChange={(e) => {
            camera.o3d.position[1] = Number(e.target.value);
            commitCam();
          }}
          value={round(cameraTran.position[1])}
        />
        z
        <input
          type="number"
          onChange={(e) => {
            camera.o3d.position[2] = Number(e.target.value);
            commitCam();
          }}
          value={round(cameraTran.position[2])}
        />
      </div>
      <div>
        fov
        <input
          type="number"
          onChange={(e) => {
            camera.fov = (Number(e.target.value) * Math.PI) / 180;
            commitCam();
          }}
          value={(camera.fov * 180) / Math.PI}
        />
      </div>
      <div>
        rotation
        <input
          type="number"
          onChange={(e) => {
            camera.o3d.rotation[1] = (Number(e.target.value) * Math.PI) / 180;
            commitCam();
          }}
          value={round((cameraTran.rotation[1] * 180) / Math.PI)}
        />
      </div>
    </div>
  );
}
