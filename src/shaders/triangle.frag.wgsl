@group(0) @binding(1) var _sampler: sampler;
@group(0) @binding(2) var _texture: texture_2d<f32>;

@fragment
fn main(@location(0) in_color: vec3<f32>, @location(1) uv: vec2<f32>) -> @location(0) vec4<f32> {
    // return textureSample(_texture, _sampler, vec2(uv.x, 1-uv.y));
    return vec4<f32>(uv, 0.0, 1.0);
}