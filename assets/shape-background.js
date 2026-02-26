const MOBILE_BREAKPOINT = 768;

const DEFAULT_CONFIG = {
  seed: 0.18,
  deformAmp: 0.2,
  noiseScale: 1.8,
  rotSpeed: 0.2,
  glow: 0.68,
  cameraZ: 2.7,
};

const BASE_STYLE_ID = "shape-background-style";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildConfig(config) {
  const merged = { ...DEFAULT_CONFIG, ...(config || {}) };
  return {
    seed: clamp(Number(merged.seed), 0, 1),
    deformAmp: clamp(Number(merged.deformAmp), 0.05, 0.5),
    noiseScale: clamp(Number(merged.noiseScale), 0.4, 4),
    rotSpeed: clamp(Number(merged.rotSpeed), 0.02, 1.2),
    glow: clamp(Number(merged.glow), 0, 1.5),
    cameraZ: clamp(Number(merged.cameraZ), 1.5, 6),
  };
}

function shouldDisableWebgl() {
  return window.innerWidth < MOBILE_BREAKPOINT || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function injectBaseStyle() {
  if (document.getElementById(BASE_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = BASE_STYLE_ID;
  style.textContent = `
    .shape-bg-host {
      position: relative;
      overflow: hidden;
      isolation: isolate;
    }

    .shape-bg-host > :not(.shape-bg-canvas):not(.shape-bg-fallback) {
      position: relative;
      z-index: 1;
    }

    .shape-bg-canvas,
    .shape-bg-fallback {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      display: block;
    }
  `;
  document.head.appendChild(style);
}

function createFallbackLayer(glow) {
  const layer = document.createElement("div");
  layer.className = "shape-bg-fallback";
  const warm = clamp(0.17 + glow * 0.2, 0.12, 0.38);
  const cool = clamp(0.13 + glow * 0.15, 0.1, 0.3);
  layer.style.background = [
    `radial-gradient(circle at 78% 22%, rgba(217, 119, 86, ${warm.toFixed(3)}), transparent 46%)`,
    `radial-gradient(circle at 22% 82%, rgba(108, 152, 214, ${cool.toFixed(3)}), transparent 52%)`,
    "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
  ].join(", ");
  return layer;
}

function createIcosahedron(subdivisions = 2) {
  const t = (1 + Math.sqrt(5)) / 2;
  const raw = [
    [-1, t, 0],
    [1, t, 0],
    [-1, -t, 0],
    [1, -t, 0],
    [0, -1, t],
    [0, 1, t],
    [0, -1, -t],
    [0, 1, -t],
    [t, 0, -1],
    [t, 0, 1],
    [-t, 0, -1],
    [-t, 0, 1],
  ];

  const vertices = raw.map((v) => normalizeVec3(v));
  let faces = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];

  for (let step = 0; step < subdivisions; step += 1) {
    const cache = new Map();
    const nextFaces = [];

    function midpoint(a, b) {
      const min = Math.min(a, b);
      const max = Math.max(a, b);
      const key = `${min}:${max}`;
      if (cache.has(key)) return cache.get(key);

      const va = vertices[a];
      const vb = vertices[b];
      const mid = normalizeVec3([
        (va[0] + vb[0]) * 0.5,
        (va[1] + vb[1]) * 0.5,
        (va[2] + vb[2]) * 0.5,
      ]);
      vertices.push(mid);
      const index = vertices.length - 1;
      cache.set(key, index);
      return index;
    }

    for (let i = 0; i < faces.length; i += 1) {
      const [a, b, c] = faces[i];
      const ab = midpoint(a, b);
      const bc = midpoint(b, c);
      const ca = midpoint(c, a);
      nextFaces.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }

    faces = nextFaces;
  }

  const positions = new Float32Array(vertices.length * 3);
  const normals = new Float32Array(vertices.length * 3);
  for (let i = 0; i < vertices.length; i += 1) {
    const v = vertices[i];
    positions[i * 3] = v[0];
    positions[i * 3 + 1] = v[1];
    positions[i * 3 + 2] = v[2];
    normals[i * 3] = v[0];
    normals[i * 3 + 1] = v[1];
    normals[i * 3 + 2] = v[2];
  }

  const indexData = new Uint16Array(faces.length * 3);
  for (let i = 0; i < faces.length; i += 1) {
    const face = faces[i];
    indexData[i * 3] = face[0];
    indexData[i * 3 + 1] = face[1];
    indexData[i * 3 + 2] = face[2];
  }

  return { positions, normals, indices: indexData };
}

function normalizeVec3(v) {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || "unknown shader compile error";
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vert = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const frag = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) || "unknown link error";
    gl.deleteProgram(program);
    throw new Error(info);
  }
  return program;
}

function perspectiveMatrix(fovRadians, aspect, near, far) {
  const out = new Float32Array(16);
  const f = 1.0 / Math.tan(fovRadians * 0.5);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
  return out;
}

function lookAtMatrix(eye, target, up) {
  const z = normalizeVec3([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
  const x = normalizeVec3([
    up[1] * z[2] - up[2] * z[1],
    up[2] * z[0] - up[0] * z[2],
    up[0] * z[1] - up[1] * z[0],
  ]);
  const y = [
    z[1] * x[2] - z[2] * x[1],
    z[2] * x[0] - z[0] * x[2],
    z[0] * x[1] - z[1] * x[0],
  ];

  const out = new Float32Array(16);
  out[0] = x[0];
  out[1] = y[0];
  out[2] = z[0];
  out[4] = x[1];
  out[5] = y[1];
  out[6] = z[1];
  out[8] = x[2];
  out[9] = y[2];
  out[10] = z[2];
  out[12] = -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]);
  out[13] = -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]);
  out[14] = -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]);
  out[15] = 1;
  return out;
}

function multiplyMatrix(a, b) {
  const out = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[column * 4 + row] =
        a[0 * 4 + row] * b[column * 4 + 0] +
        a[1 * 4 + row] * b[column * 4 + 1] +
        a[2 * 4 + row] * b[column * 4 + 2] +
        a[3 * 4 + row] * b[column * 4 + 3];
    }
  }
  return out;
}

function rotationXMatrix(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1,
  ]);
}

function rotationYMatrix(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1,
  ]);
}

function buildProgramState(gl, config) {
  const vertexSource = `
    precision highp float;

    attribute vec3 aPosition;
    attribute vec3 aNormal;

    uniform mat4 uProjection;
    uniform mat4 uView;
    uniform mat4 uModel;
    uniform float uTime;
    uniform float uSeed;
    uniform float uDeformAmp;
    uniform float uNoiseScale;
    uniform vec3 uCameraPos;

    varying float vLight;
    varying vec3 vWorld;
    varying float vPulse;
    varying float vFlow;
    varying vec3 vNormalWorld;
    varying vec3 vViewDir;

    float hash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);

      float n000 = hash(i + vec3(0.0, 0.0, 0.0));
      float n100 = hash(i + vec3(1.0, 0.0, 0.0));
      float n010 = hash(i + vec3(0.0, 1.0, 0.0));
      float n110 = hash(i + vec3(1.0, 1.0, 0.0));
      float n001 = hash(i + vec3(0.0, 0.0, 1.0));
      float n101 = hash(i + vec3(1.0, 0.0, 1.0));
      float n011 = hash(i + vec3(0.0, 1.0, 1.0));
      float n111 = hash(i + vec3(1.0, 1.0, 1.0));

      float nx00 = mix(n000, n100, f.x);
      float nx10 = mix(n010, n110, f.x);
      float nx01 = mix(n001, n101, f.x);
      float nx11 = mix(n011, n111, f.x);
      float nxy0 = mix(nx00, nx10, f.y);
      float nxy1 = mix(nx01, nx11, f.y);
      return mix(nxy0, nxy1, f.z);
    }

    float fbm(vec3 p) {
      float value = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 4; i++) {
        value += noise(p) * amp;
        p = p * 2.03 + vec3(11.3, 7.1, 5.7);
        amp *= 0.5;
      }
      return value;
    }

    void main() {
      float breath = 0.5 + 0.5 * sin(uTime * 0.86 + uSeed * 6.2831);
      vec3 samplePos = aPosition * uNoiseScale;
      float flowA = fbm(samplePos + vec3(0.0, uTime * 0.32, uSeed * 4.1));
      float flowB = fbm(samplePos * 1.95 + vec3(uSeed * 9.2, 0.0, -uTime * 0.46));
      float microWave = sin(flowA * 16.0 + aPosition.y * 8.0 - uTime * 2.1) * 0.045;
      float blendFlow = (flowA - 0.5) * 0.78 + (flowB - 0.5) * 0.44 + microWave;
      float amp = uDeformAmp * (0.5 + breath * 0.74);
      vec3 displaced = aPosition + aNormal * (blendFlow * amp);

      vec4 world = uModel * vec4(displaced, 1.0);
      vec3 normalWorld = normalize(mat3(uModel) * normalize(aNormal + vec3(blendFlow * 0.18)));
      vec3 lightDir = normalize(vec3(-0.35, 0.7, 0.38));
      vLight = clamp(dot(normalWorld, lightDir) * 0.5 + 0.5, 0.0, 1.0);
      vWorld = world.xyz;
      vPulse = breath;
      vFlow = flowA * 0.65 + flowB * 0.35;
      vNormalWorld = normalWorld;
      vViewDir = normalize(uCameraPos - world.xyz);

      gl_Position = uProjection * uView * world;
    }
  `;

  const fragmentSource = `
    precision highp float;

    varying float vLight;
    varying vec3 vWorld;
    varying float vPulse;
    varying float vFlow;
    varying vec3 vNormalWorld;
    varying vec3 vViewDir;

    uniform float uGlow;
    uniform float uTime;

    void main() {
      vec3 normal = normalize(vNormalWorld);
      vec3 viewDir = normalize(vViewDir);
      vec3 lightA = normalize(vec3(-0.35, 0.72, 0.38));
      vec3 lightB = normalize(vec3(0.58, 0.31, -0.74));

      float ndlA = max(dot(normal, lightA), 0.0);
      float ndlB = max(dot(normal, lightB), 0.0);
      float specA = pow(max(dot(normal, normalize(lightA + viewDir)), 0.0), 64.0);
      float specB = pow(max(dot(normal, normalize(lightB + viewDir)), 0.0), 36.0);
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.2);
      float microRipples = 0.5 + 0.5 * sin(vFlow * 24.0 + uTime * 1.85 + vWorld.y * 8.0);

      vec3 steelDark = vec3(0.08, 0.09, 0.12);
      vec3 steelBright = vec3(0.28, 0.31, 0.38);
      vec3 steel = mix(steelDark, steelBright, clamp(vLight * 0.78 + microRipples * 0.22, 0.0, 1.0));
      vec3 skyTint = vec3(0.49, 0.58, 0.73) * (0.22 + 0.38 * smoothstep(-0.2, 0.9, normal.y));
      vec3 warmTint = vec3(0.85, 0.47, 0.34) * (0.18 + 0.26 * microRipples);
      vec3 highlights = vec3(0.73, 0.8, 0.95) * specA + vec3(0.94, 0.58, 0.4) * specB;

      vec3 rimColor = mix(
        vec3(0.54, 0.64, 0.82),
        vec3(0.9, 0.52, 0.38),
        0.5 + 0.5 * sin(uTime * 0.6 + vFlow * 10.0)
      );
      vec3 rim = rimColor * fresnel * (0.28 + uGlow * 0.9);
      float breathWave = 0.94 + 0.08 * sin(uTime * 0.92 + vPulse * 2.3 + vFlow * 7.0);

      vec3 color = steel;
      color += skyTint * (0.45 + ndlA * 0.4);
      color += warmTint * (0.35 + ndlB * 0.3);
      color += highlights * (0.55 + vPulse * 0.45);
      color += rim;
      color = clamp(color * breathWave, 0.0, 1.0);

      float alpha = 0.86 + fresnel * 0.1;
      gl_FragColor = vec4(color, alpha);
    }
  `;

  const program = createProgram(gl, vertexSource, fragmentSource);
  const geometry = createIcosahedron(2);

  const vao = {
    position: gl.createBuffer(),
    normal: gl.createBuffer(),
    index: gl.createBuffer(),
  };

  if (!vao.position || !vao.normal || !vao.index) {
    throw new Error("Failed to create WebGL buffers");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vao.position);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, vao.normal);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vao.index);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);

  const attribPosition = gl.getAttribLocation(program, "aPosition");
  const attribNormal = gl.getAttribLocation(program, "aNormal");

  return {
    program,
    geometry,
    vao,
    attribPosition,
    attribNormal,
    uniforms: {
      projection: gl.getUniformLocation(program, "uProjection"),
      view: gl.getUniformLocation(program, "uView"),
      model: gl.getUniformLocation(program, "uModel"),
      time: gl.getUniformLocation(program, "uTime"),
      seed: gl.getUniformLocation(program, "uSeed"),
      deformAmp: gl.getUniformLocation(program, "uDeformAmp"),
      noiseScale: gl.getUniformLocation(program, "uNoiseScale"),
      glow: gl.getUniformLocation(program, "uGlow"),
      cameraPos: gl.getUniformLocation(program, "uCameraPos"),
    },
    config,
  };
}

export function mountShapeBackground(container, configInput) {
  if (!container) return () => {};
  const config = buildConfig(configInput);
  injectBaseStyle();
  container.classList.add("shape-bg-host");

  const fallback = createFallbackLayer(config.glow);
  const canvas = document.createElement("canvas");
  canvas.className = "shape-bg-canvas";
  container.insertBefore(fallback, container.firstChild);
  container.insertBefore(canvas, fallback);

  if (shouldDisableWebgl()) {
    canvas.style.display = "none";
    return () => {
      canvas.remove();
      fallback.remove();
    };
  }

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    depth: true,
    premultipliedAlpha: true,
    powerPreference: "high-performance",
  });

  if (!gl) {
    canvas.style.display = "none";
    return () => {
      canvas.remove();
      fallback.remove();
    };
  }

  const state = buildProgramState(gl, config);
  const projection = new Float32Array(16);
  const view = lookAtMatrix([0, 0, config.cameraZ], [0, 0, 0], [0, 1, 0]);
  let raf = 0;

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const resize = () => {
    const rect = container.getBoundingClientRect();
    const mobile = window.innerWidth < MOBILE_BREAKPOINT;
    const dprCap = mobile ? 1.5 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    gl.viewport(0, 0, width, height);
    const nextProjection = perspectiveMatrix(Math.PI / 3.2, Math.max(rect.width / rect.height, 0.75), 0.1, 24);
    projection.set(nextProjection);
  };

  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  window.addEventListener("resize", resize, { passive: true });

  const start = performance.now();

  const draw = (now) => {
    const t = (now - start) * 0.001;
    const rotateY = rotationYMatrix(t * config.rotSpeed);
    const rotateX = rotationXMatrix(Math.sin(t * 0.4 + config.seed * Math.PI) * 0.23);
    const model = multiplyMatrix(rotateY, rotateX);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(state.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, state.vao.position);
    gl.enableVertexAttribArray(state.attribPosition);
    gl.vertexAttribPointer(state.attribPosition, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, state.vao.normal);
    gl.enableVertexAttribArray(state.attribNormal);
    gl.vertexAttribPointer(state.attribNormal, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.vao.index);

    gl.uniformMatrix4fv(state.uniforms.projection, false, projection);
    gl.uniformMatrix4fv(state.uniforms.view, false, view);
    gl.uniformMatrix4fv(state.uniforms.model, false, model);
    gl.uniform1f(state.uniforms.time, t);
    gl.uniform1f(state.uniforms.seed, config.seed);
    gl.uniform1f(state.uniforms.deformAmp, config.deformAmp);
    gl.uniform1f(state.uniforms.noiseScale, config.noiseScale);
    gl.uniform1f(state.uniforms.glow, config.glow);
    gl.uniform3f(state.uniforms.cameraPos, 0, 0, config.cameraZ);

    gl.drawElements(gl.TRIANGLES, state.geometry.indices.length, gl.UNSIGNED_SHORT, 0);

    raf = requestAnimationFrame(draw);
  };

  raf = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    window.removeEventListener("resize", resize);
    if (state.program) gl.deleteProgram(state.program);
    if (state.vao.position) gl.deleteBuffer(state.vao.position);
    if (state.vao.normal) gl.deleteBuffer(state.vao.normal);
    if (state.vao.index) gl.deleteBuffer(state.vao.index);
    canvas.remove();
    fallback.remove();
  };
}
