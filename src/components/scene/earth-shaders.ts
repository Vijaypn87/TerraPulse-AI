export const EARTH_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const EARTH_FRAG = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D waterMap;
  uniform sampler2D heatMap;
  uniform vec3 sunDir;
  uniform float nightBias;
  uniform float heat;
  uniform float dim;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vPosW);
    float ndl = dot(N, normalize(sunDir));

    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 city = texture2D(nightMap, vUv).rgb;
    float water = texture2D(waterMap, vUv).r;

    // Grade: deep teal oceans, slightly forested land.
    vec3 oceanTint = vec3(0.30, 0.62, 0.55);
    day = mix(day, day * oceanTint, water * 0.85);
    day = mix(day, day * vec3(0.9, 1.05, 0.88), 1.0 - water);

    // Day / night terminator (nightBias slides it toward darkness)
    float lit = smoothstep(-0.12, 0.28, ndl - nightBias * 0.55);
    vec3 col = day * 0.07 + day * lit * 1.15;

    // City lights on the dark side, warm
    float dark = 1.0 - smoothstep(-0.05, 0.22, ndl - nightBias * 0.55);
    col += city * vec3(1.0, 0.86, 0.5) * dark * (1.2 + nightBias);

    // Ocean glint
    vec3 R = reflect(-normalize(sunDir), N);
    float spec = pow(max(dot(R, V), 0.0), 140.0) * water * lit;
    col += vec3(0.7, 1.0, 0.85) * spec * 0.4;

    // Inner rim: emerald haze
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.2);
    col += vec3(0.16, 0.8, 0.5) * fres * (0.55 + 0.35 * lit);

    // Pollution heat overlay
    vec4 h = texture2D(heatMap, vUv);
    col = mix(col, h.rgb * 1.25, clamp(h.a * heat * 0.75, 0.0, 0.7));

    gl_FragColor = vec4(col * dim, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const ATMO_VERT = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const ATMO_FRAG = /* glsl */ `
  uniform vec3 sunDir;
  uniform float dim;
  uniform float inner; // earth radius / shell radius
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vPosW);
    float a = -dot(N, V);               // back faces: 0 at the shell silhouette .. max at the planet edge
    float edge = sqrt(1.0 - inner * inner);
    float g = pow(smoothstep(0.0, edge, a), 2.2);
    float sunSide = 0.35 + 0.65 * smoothstep(-0.5, 0.6, dot(N, normalize(sunDir)));
    vec3 c = mix(vec3(0.12, 0.75, 0.55), vec3(0.62, 0.95, 0.45), pow(g, 3.0));
    float k = g * sunSide * dim;
    gl_FragColor = vec4(c * k * 1.5, k);
  }
`;
