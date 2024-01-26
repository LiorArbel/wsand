import React, { useEffect } from "react";
import { useState } from "react";
import { Mat4, Vec3, mat4, vec3 } from "wgpu-matrix";

export function CameraController({
  setCameraMat,
}: {
  setCameraMat: (m: Mat4) => void;
}) {
  const [cameraPos, setCameraPos] = useState<Vec3>(vec3.create(0, 0, -10));
  const [fov, setFov] = useState(70);
  const [zNear, setZNear] = useState(0);
  const [zFar, setZFar] = useState(300);
  const [cameraRotation, setCameraRotation] = useState(
    0
  );

  useEffect(() => {
    const projectionMatrix = mat4.perspective(
      fov * (Math.PI / 180),
      2,
      0.1,
      200
    );

    // const viewMatrix = mat4.rotateY(mat4.translation(cameraPos), cameraRotation*Math.PI/180);
    const viewMatrix = mat4.translate(mat4.rotationY(cameraRotation*Math.PI/180), cameraPos);

    // Combine projection and view matrix
    const viewProjMatrix = mat4.multiply(projectionMatrix, viewMatrix);
    setCameraMat(
        viewProjMatrix
    );
  }, [cameraPos, fov, cameraRotation]);

  return (
    <div>
      <div>
        position: x
        <input
          type="number"
          onChange={(e) =>
            setCameraPos(
              vec3.create(Number(e.target.value), cameraPos[1], cameraPos[2])
            )
          }
          value={cameraPos[0]}
        />
        y
        <input
          type="number"
          onChange={(e) =>
            setCameraPos(
              vec3.create(cameraPos[0], Number(e.target.value), cameraPos[2])
            )
          }
          value={cameraPos[1]}
        />
        z
        <input
          type="number"
          onChange={(e) =>
            setCameraPos(
              vec3.create(cameraPos[0], cameraPos[1], Number(e.target.value))
            )
          }
          value={cameraPos[2]}
        />
      </div>
      <div>
        fov
        <input
          type="number"
          onChange={(e) => setFov(Number(e.target.value))}
          value={fov}
        />
      </div>
      <div>
        rotation
        <input 
            type="number"
            onChange={e => setCameraRotation(Number(e.target.value))}
            value={cameraRotation}
        />
      </div>
    </div>
  );
}
