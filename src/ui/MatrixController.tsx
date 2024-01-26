import React from "react";
import { Mat4 } from "wgpu-matrix";
import "./MatrixController.css";

export const MatrixController = ({ mat, onChange:outerOnChange }: { mat: Mat4, onChange: (val: Mat4)=>void }) => {
    const onChange = (val: number, index: number) => {
        const newMat = [...mat];
        newMat[index] = val;
        outerOnChange(newMat);
    }
  return (
    <div className="matrix-container">
      {[...Array(4).keys()].map((i) => (
        <div key={i} className="matrix-row-container">
          {[...Array(4).keys()].map((j) => (
            <input
            key={i+','+j}
              type="number"
              onChange={e => onChange(Number(e.currentTarget.value), i*4 + j)}
              value={mat[i*4 + j]}
              style={{
                width: "1.5em",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
