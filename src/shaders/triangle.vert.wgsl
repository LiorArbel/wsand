struct UBO {
  modelViewProj: mat4x4<f32>,
  primaryColor: vec4<f32>,
  accentColor: vec4<f32>,
  deltaTime: f32
};

struct MeshUniforms {
  transform: mat4x4<f32>
}

@group(0) @binding(0)
var<uniform> uniforms: UBO;

@group(1) @binding(0)
var<uniform> mesh_uniforms: MeshUniforms;

struct VSOut {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec3<f32>,
    @location(1) uv: vec2<f32>,
};

@vertex
fn main(@location(0) in_pos: vec3<f32>, @location(1) in_color: vec3<f32>, @location(2) uv: vec2<f32>, @location(3) normal: vec3<f32>) -> VSOut {
    var vs_out: VSOut;
    let base_view = mat4x4f(
      1.0, 0.0, 0.0, 0.0,
      0.0, 1.0, 0.0, 0.0, 
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 0.0, 1.0
    );
    vs_out.position = base_view*uniforms.modelViewProj * mesh_uniforms.transform * vec4<f32>(in_pos, 1.0);
    // vs_out.color = in_color + vec3<f32>(0,0.0,0.0);
    vs_out.color = vec3(uv, 0);
    vs_out.uv = uv;
    return vs_out;
}