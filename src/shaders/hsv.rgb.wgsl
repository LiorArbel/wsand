fn rgbToHsv(c: vec3<f32>) -> vec3<f32> {
    var K = vec4<f32>(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    var p = mix(vec4<f32>(c.bg, K.wz), vec4<f32>(c.gb, K.xy), step(c.b, c.g));
    var q = mix(vec4<f32>(p.xyw, c.r), vec4<f32>(c.r, p.yzx), step(p.x, c.r));

    var d = q.x - min(q.w, q.y);
    var e = 1.0e-10;
    return vec3<f32>(abs(vec3((q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x)));
}

fn hsvToRgb(c: vec3<f32>) -> vec3<f32> {
    var K = vec4<f32>(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    var p = abs(fract(vec3<f32>(c.x) + K.xyz) * 6.0 - vec3<f32>(K.w));
    return c.z * mix(vec3<f32>(K.x), clamp(p - vec3<f32>(K.x), vec3(0.0), vec3(1.0)), c.y);
}