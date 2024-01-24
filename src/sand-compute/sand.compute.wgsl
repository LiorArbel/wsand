@group(0) @binding(0)
var<storage, read> in_data: array<vec4<f32>>;
@group(0) @binding(1) 
var<storage, read_write> out_data: array<vec4<f32>>;
@group(1) @binding(0)
var out_image: texture_storage_2d<rgba8unorm, write>;
@group(1) @binding(1)
var<uniform> size: vec2<u32>;
@group(1) @binding(2)
var<uniform> frame: u32;
@group(1) @binding(3)
var<uniform> mouse: vec4<u32>;

const BOUNDS:f32 = -1;
const AIR:f32 = 0;
const SAND:f32 = 1;

fn getIndex(pos: vec2<u32>) -> u32 {
    let h = size.y;
    let w = size.x;

    return (pos.y % h) * w + (pos.x % w);
}

fn getData(pos: vec2<u32>) -> vec4<f32> {
    if pos.x >= size.x || pos.y >= size.y {
        return vec4(BOUNDS, 0, 0, 0);
    }
    return in_data[getIndex(pos)];
}

fn setData(pos: vec2<u32>, data: vec4<f32>) {
    if pos.x < size.x && pos.y < size.y {
        out_data[getIndex(pos)] = data;
    }
}

fn getNeighborhood(pos: vec2<u32>) -> Neighborhood {
    return Neighborhood(
        getData(pos),
        getData(pos + vec2(1, 0)),
        getData(pos + vec2(0, 1)),
        getData(pos + vec2(1, 1))
    );
}

fn writeNeighborhood(pos: vec2<u32>, n: Neighborhood) {
    setData(pos, n.c00);
    setData(pos + vec2(1, 0), n.c10);
    setData(pos + vec2(0, 1), n.c01);
    setData(pos + vec2(1, 1), n.c11);
}

fn drawNeighborhood(pos: vec2<u32>, n: Neighborhood) {
    textureStore(out_image, pos, vec4(n.c00.xyz, 1));
    if n.c10.a != BOUNDS {
        textureStore(out_image, pos + vec2(1, 0), vec4(n.c10.xyz, 1));
    }
    if n.c01.a != BOUNDS {
        textureStore(out_image, pos + vec2(0, 1), vec4(n.c01.xyz, 1));
    }
    if n.c11.a != BOUNDS {
        textureStore(out_image, pos + vec2(1, 1), vec4(n.c11.xyz, 1));
    }
}

// fn swap(a: vec3<f32>, b:vec3<f32>){
//     let temp = a;
//     a.rgb = b.rgb;
//     b = t.rgb;
// }

// var<workgroup> sharedBlock : array<u32, 4>;
        
struct Neighborhood {
            c00: vec4<f32>,
            c10: vec4<f32>,
            c01: vec4<f32>,
            c11: vec4<f32>,
        }

fn getOffset() -> vec2<u32> {
    if frame % 4 == 0 {
        return vec2(0, 0);
    } else if frame % 4 == 1 {
        return vec2(1, 1);
    } else if frame % 4 == 2 {
        return vec2(0, 1);
    }
    return vec2(1, 0);
}

fn hash43(p: vec3<u32>) -> vec4<f32> {
    var p4 = fract(vec4<f32>(p.xyzx) * vec4(.1031, .1030, .0973, .1099));
    p4 += dot(p4, p4.wzxy + 33.33);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}

        @compute @workgroup_size(1)fn main(
    @builtin(global_invocation_id) id: vec3u,
    @builtin(local_invocation_id) local_id: vec3u
) {
    let pos = id.xy * 2 + getOffset();

    let pos_index = getIndex(pos);

    let r = hash43(vec3(pos, frame));
    var neigh = getNeighborhood(pos);
    var c00 = neigh.c00;
    var c01 = neigh.c01;
    var c10 = neigh.c10;
    var c11 = neigh.c11;

    if c00.a != BOUNDS && mouse.z != 0 && distance(vec2<f32>(pos), vec2<f32>(mouse.xy)) < f32(mouse.w) {
        if mouse.z == 1 {
            let new_color = hsvToRgb(vec3(f32(frame) / 1000, 0.7, 1));
            neigh.c00 = vec4(new_color, SAND);
        } else {
            neigh.c00 = vec4(0, 0, 0, AIR);
        }
    }


    if neigh.c00.a == SAND && neigh.c01.a == SAND && neigh.c10.a == AIR && neigh.c11.a == AIR {
        let temp = neigh.c00;
        neigh.c00 = neigh.c10;
        neigh.c10 = temp;
    }

    if neigh.c10.a == SAND && neigh.c11.a == SAND && neigh.c00.a == AIR && neigh.c01.a == AIR {
        let temp = neigh.c01;
        neigh.c01 = neigh.c10;
        neigh.c10 = temp;
    }

    if neigh.c00.a == SAND && neigh.c01.a == AIR {
        let temp = neigh.c00;
        neigh.c00 = neigh.c01;
        neigh.c01 = temp;
    }

    if neigh.c10.a == SAND && neigh.c11.a == AIR {
        let temp = neigh.c10;
        neigh.c10 = neigh.c11;
        neigh.c11 = temp;
    }

    drawNeighborhood(pos, neigh);
    writeNeighborhood(pos, neigh);

    // if(out_data[pos_index].a > 0){
    //   textureStore(out_image, pos, vec4(out_data[pos_index].a,0,0, 0.0));
    // } else {
    //   textureStore(out_image, pos, vec4(0,0,1, 0.0));
    // }
}