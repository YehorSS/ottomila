import { Color, ShaderMaterial, Vector3, type Texture } from 'three';
import { EXAG, SIZE } from './geo';

/** The topographic look: grey hillshade, lighter snow up high, thin 50 m and orange 500 m contours, edges fading into the ground. */
export function topoMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      // the sun of the satellite pass (late morning in autumn, from the south-south-east), so 3D shading agrees with the photo's own shadows
      uLight: { value: new Vector3(0.34, 0.57, 0.74).normalize() },
      uSat: { value: null as Texture | null },
      uHasSat: { value: 0 },
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
      varying vec3 vN; varying float vM; varying vec2 vXZ; varying vec2 vUv;
      uniform float uEx;
      void main() {
        vN = normal; vM = position.y / uEx * 1000.; vXZ = position.xz; vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vN; varying float vM; varying vec2 vXZ; varying vec2 vUv;
      uniform vec3 uLight, uGround, uLow, uHigh, uSnow, uMinor, uIndex; uniform float uHalf, uHasSat; uniform sampler2D uSat;
      float line(float v, float width) { float w = fwidth(v) * width; float d = min(fract(v), 1. - fract(v)); return 1. - smoothstep(0., w, d); }
      void main() {
        vec3 n = normalize(vN);
        float shade = clamp(dot(n, uLight) * .9 + .12, 0., 1.);
        vec3 col = mix(uLow, uHigh, shade);
        float snow = smoothstep(5300., 6200., vM) * smoothstep(.45, .7, n.y);
        col = mix(col, uSnow * (.4 + .6 * shade), snow * .18);
        if (uHasSat > .5) {
          // the real surface: Sentinel-2 at 10 m, a little quieter so the orange lines lead
          vec3 sat = texture2D(uSat, vUv).rgb;
          float l = dot(sat, vec3(.299, .587, .114));
          sat = mix(vec3(l), sat, .82) * .9;
          col = sat * clamp(dot(n, uLight) * .45 + .68, .45, 1.12);
          col = mix(col, vec3(1.), line(vM / 100., 1.) * .07);
        } else {
          col = mix(col, uMinor, line(vM / 50., 1.) * .22);
        }
        col = mix(col, uIndex, line(vM / 500., 1.7) * .95);
        // fade the square's hard edge into the page
        float edge = smoothstep(uHalf, uHalf * .72, max(abs(vXZ.x), abs(vXZ.y)));
        // colours are used as written, like the 2D still; no extra colour-space step
        gl_FragColor = vec4(mix(uGround, col, edge), 1.);
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
