import { Color, ShaderMaterial, Vector3, type Texture } from 'three';
import { EXAG, SIZE } from './geo';

/** The topographic look: grey hillshade, lighter snow up high, thin 50 m and orange 500 m contours, edges fading into the ground. */
export function topoMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    uniforms: {
      // the sun of the satellite pass (late morning in autumn, from the south-south-east), so 3D shading agrees with the photo's own shadows
      uLight: { value: new Vector3(0.34, 0.57, 0.74).normalize() },
      uSat: { value: null as Texture | null },
      uHasSat: { value: 0 },
      uTexel: { value: 1 / 2048 },
      uHaze: { value: new Color('#5d6b7a') },
      // CC0 photo textures (Poly Haven) for close-range grain: R brightness, G/B normal
      uRock: { value: null as Texture | null },
      uSnowT: { value: null as Texture | null },
      uField: { value: null as Texture | null },
      uHasDetail: { value: 0 },
      uEx: { value: EXAG },
      uHalf: { value: SIZE / 2 },
      uGround: { value: new Color('#0b0f0d') },
      uLow: { value: new Color('#0d1311') },
      uHigh: { value: new Color('#474e48') },
      uSnow: { value: new Color('#a9b0aa') },
      uMinor: { value: new Color('#8d968e') },
      uIndex: { value: new Color('#ff6d1f') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying float vM; varying vec2 vXZ; varying vec2 vUv; varying float vAO; varying vec3 vW;
      attribute float ao;
      uniform float uEx;
      void main() {
        vN = normal; vM = position.y / uEx * 1000.; vXZ = position.xz; vUv = uv; vAO = ao; vW = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vN; varying float vM; varying vec2 vXZ; varying vec2 vUv; varying float vAO; varying vec3 vW;
      uniform vec3 uLight, uGround, uLow, uHigh, uSnow, uMinor, uIndex, uHaze; uniform float uHalf, uHasSat, uTexel, uHasDetail; uniform sampler2D uSat, uRock, uSnowT, uField;
      vec3 tri(sampler2D t, vec3 p, vec3 w) { return texture2D(t, p.zy).rgb * w.x + texture2D(t, p.xz).rgb * w.y + texture2D(t, p.xy).rgb * w.z; }
      float h3(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float vn(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
        return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
      float fbm(vec3 p) { return .5 * vn(p) + .3 * vn(p * 2.1) + .2 * vn(p * 4.3); }
      float line(float v, float width) { float w = fwidth(v) * width; float d = min(fract(v), 1. - fract(v)); return 1. - smoothstep(0., w, d); }
      void main() {
        vec3 gN = normalize(vN), n = gN;
        float dist = length(vW - cameraPosition);
        float near = 1. - smoothstep(1.5, 10., dist);
        float mid = 1. - smoothstep(6., 22., dist);
        vec3 col;
        if (uHasSat > .5) {
          // the real surface: Sentinel-2 at 10 m
          vec3 sat = texture2D(uSat, vUv).rgb;
          // a light unsharp mask brings back the edges of crevasses and ribs
          vec3 blur = .25 * (texture2D(uSat, vUv + vec2(uTexel, 0.)).rgb + texture2D(uSat, vUv - vec2(uTexel, 0.)).rgb + texture2D(uSat, vUv + vec2(0., uTexel)).rgb + texture2D(uSat, vUv - vec2(0., uTexel)).rgb);
          sat = clamp(sat + (sat - blur) * .8, 0., 1.);
          float l = dot(sat, vec3(.299, .587, .114));
          sat = mix(vec3(l), sat, .82) * .9;
          float steep = 1. - smoothstep(.42, .8, gN.y);
          // where the photo is bright and the slope holds it, it is snow; elsewhere rock
          float snowy = smoothstep(.5, .7, l) * (1. - steep * .6);
          float detail = 0.;
          if (uHasDetail > .5 && near > 0.) {
            // close-range texture: rock wraps the walls from three sides, snow lies flat; two scales so nothing repeats
            vec3 tw = pow(abs(gN), vec3(4.)); tw /= tw.x + tw.y + tw.z;
            vec3 r1 = tri(uRock, vW / .16, tw), r2 = tri(uRock, vW / .045, tw);
            vec3 s1 = texture2D(uSnowT, vW.xz / .22).rgb, s2 = texture2D(uSnowT, vW.xz / .055).rgb;
            vec3 rk = (r1 + r2) * .5, sn = (s1 + s2) * .5;
            vec3 d = mix(rk, sn, snowy);
            detail = (d.r - .5) * near;
            vec2 nd = (d.gb - .5) * 2.;
            n = normalize(n + vec3(nd.x, 0., -nd.y) * .85 * near);
          }
          if (uHasDetail > .5 && mid > 0.) detail += (texture2D(uField, vW.xz / .9).r - .5) * .7 * mid;
          col = sat * clamp(dot(n, uLight) * .6 + .6, .35, 1.2);
          col *= 1. + detail * 1.5;
          col = mix(col, vec3(1.), line(vM / 100., 1.) * .07);
        } else {
          float shade = clamp(dot(n, uLight) * .9 + .12, 0., 1.);
          col = mix(uLow, uHigh, shade);
          float snow = smoothstep(5300., 6200., vM) * smoothstep(.45, .7, n.y);
          col = mix(col, uSnow * (.4 + .6 * shade), snow * .18);
          col = mix(col, uMinor, line(vM / 50., 1.) * .22);
        }
        col = mix(col, uIndex, line(vM / 500., 1.7) * .95);
        // fade the square's hard edge into the page
        // gullies see less sky
        col *= mix(.5, 1.05, smoothstep(.15, .95, vAO));
        // air: far slopes drift into a cool haze
        col = mix(col, uHaze, (1. - exp(-dist * .028)) * .6);
        float edge = smoothstep(uHalf, uHalf * .72, max(abs(vXZ.x), abs(vXZ.y)));
        // colours are used as written, like the 2D still; the square's edge dissolves into the sky behind
        gl_FragColor = vec4(col, edge);
      }`,
  });
}

/** Same look drawn on a 2D canvas, for browsers without WebGL. */
export function drawStill(cv: HTMLCanvasElement, h: Float32Array, n: number): void {
  cv.width = cv.height = n;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(n, n);
  const L = [-0.55, 0.75, -0.35], ll = Math.hypot(...L);
  for (let r = 1; r < n - 1; r++) for (let c = 1; c < n - 1; c++) {
    const i = r * n + c;
    const dx = (h[i + 1] - h[i - 1]) / 60, dz = (h[i + n] - h[i - n]) / 60;
    const nl = Math.hypot(dx, 1, dz);
    const shade = Math.min(1, Math.max(0, ((-dx * L[0] + L[1] - dz * L[2]) / nl / ll) * 0.85 + 0.28));
    let R = 18 + (108 - 18) * shade, G = 26 + (116 - 26) * shade, B = 22 + (109 - 22) * shade;
    const band = (k: number) => Math.floor(h[i] / k) !== Math.floor(h[i + 1] / k) || Math.floor(h[i] / k) !== Math.floor(h[i + n] / k);
    if (band(500)) { R = 255; G = 109; B = 31; } else if (band(50)) { R = R * 0.7 + 141 * 0.3; G = G * 0.7 + 150 * 0.3; B = B * 0.7 + 142 * 0.3; }
    img.data.set([R, G, B, 255], i * 4);
  }
  ctx.putImageData(img, 0, 0);
}
