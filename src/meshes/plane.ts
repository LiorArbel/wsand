export function createPlaneMesh(){
    return new Float32Array([
        // pos
        -1.0, -1.0, 0.0,
        // color
        0.0, 1.0, 0.0,
        //uv,
        0.0, 0.0,
        // pos
        1.0, -1.0, 0.0,
        //color
        1.0, 0.0, 0.0,
        //uv
        1.0, 0.0,
        // pos
        1.0, 1.0, 0.0,
        //color
        0.0, 0.0, 1.0,
        //uv
        1.0, 1.0,
        // pos
        1.0, 1.0, 0.0,
        //color
        1.0, 0.0, 0.0,
        //uv
        1.0, 1.0,
        // pos
        -1.0, 1.0, 0.0,
        //color
        0.0, 1.0, 0.0,
        //uv
        0.0, 1.0,
        // pos
        -1.0, -1.0, 0.0,
        //color
        0.0, 0.0, 1.0,
        //uv
        0.0, 0.0,
      ]);    
}