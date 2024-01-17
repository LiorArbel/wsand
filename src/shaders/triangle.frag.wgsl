@group(0) @binding(1) var ourSampler: sampler;
@group(0) @binding(2) var ourTexture: texture_2d<f32>;

@fragment
fn main(@location(0) in_color: vec3<f32>, @location(1) uv: vec2<f32>) -> @location(0) vec4<f32> {
    return textureSample(ourTexture, ourSampler, 1-uv);
    // return vec4<f32>(in_color, 1.0);
}