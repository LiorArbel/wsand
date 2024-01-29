import React, { useCallback, useEffect } from "react";
import { useState } from "react";
import { Mat4, Vec3, mat4, vec3 } from "wgpu-matrix";
import { Camera } from "../GameEngine/Camera";
import { Object3D } from "../GameEngine/Object3D";
import { BehaviorSubject, map } from "rxjs";
import { useEngine } from "./engineContext";

export function CameraController({
  setCamera,
  camera,
}: {
  setCamera: (cam: Camera) => void;
  camera: Camera;
}) {
  const {useEngineSubject} = useEngine();
  const [cameraTran] = useEngineSubject(engine => {
    const posSubject = new BehaviorSubject(engine.camera.value.o3d);
    engine.camera.pipe(map(c => c.o3d)).subscribe(v => {
      posSubject.next(v);
    });
    return posSubject;
  });
  // const [cameraPos, setCameraPos] = useState<Vec3>(vec3.create(0, 0, -10));
  // const [fov, setFov] = useState(70);
  // const [zNear, setZNear] = useState(0.1);
  // const [zFar, setZFar] = useState(300);
  // const [cameraRotation, setCameraRotation] = useState(
  //   0
  // );

  // useEffect(() => {
  //   setCameraPos(camera.o3d.position);
  // }, [camera]);

  // useEffect(() => {
  //   const newCam = new Camera(new Object3D(cameraPos, vec3.create(0, cameraRotation*Math.PI/180, 0), vec3.create(1,1,1)), fov*Math.PI/180, 2, zNear, zFar);
  //   setCamera(newCam)
  // }, [cameraPos, fov, cameraRotation]);

  const commitCam = useCallback(() => {
    const newCam = new Camera(new Object3D(camera.o3d.position, camera.o3d.rotation, camera.o3d.scale), camera.fov, camera.aspect, camera.near, camera.far);
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
          value={cameraTran.position[0]}
        />
        y
        <input
          type="number"
          onChange={(e) =>{
            camera.o3d.position[1] = Number(e.target.value);
            commitCam();
          }}
          value={cameraTran.position[1]}
        />
        z
        <input
          type="number"
          onChange={(e) =>{
            camera.o3d.position[2] = Number(e.target.value);
            commitCam();
          }}
          value={cameraTran.position[2]}
        />
      </div>
      <div>
        fov
        <input
          type="number"
          onChange={(e) => {
              camera.fov = Number(e.target.value)*Math.PI/180;
              commitCam();
          }}
          value={camera.fov*180/Math.PI}
        />
      </div>
      <div>
        rotation
        <input
          type="number"
          onChange={(e) => {
            camera.o3d.rotation[1] = Number(e.target.value)*Math.PI/180
            commitCam();
          }}
          value={cameraTran.rotation[1]*Math.PI/180}
        />
      </div>
    </div>
  );
}
