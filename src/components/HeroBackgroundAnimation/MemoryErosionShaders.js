// Advanced WebGL Shaders for Memory Erosion Effect

export const erosionVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  uniform float uTime;
  uniform float uErosionLevel;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    // Add subtle vertex displacement based on erosion
    vec3 pos = position;
    float displacement = sin(position.x * 10.0 + uTime) * 0.01 * uErosionLevel;
    pos.y += displacement;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const erosionFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uErosionLevel;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  
  // Noise function for organic erosion
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  // Fractal noise for more complex patterns
  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    
    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(st);
      st *= 2.0;
      amplitude *= 0.5;
    }
    
    return value;
  }
  
  void main() {
    vec2 st = vUv;
    vec4 color = texture2D(uTexture, st);
    
    // Calculate distance from mouse
    vec2 mousePos = uMouse / uResolution;
    float dist = distance(st, mousePos);
    float restoration = 1.0 - smoothstep(0.0, 0.3, dist);
    
    // Apply erosion effects
    float erosion = uErosionLevel * (1.0 - restoration);
    
    // 1. Noise-based alpha erosion
    float noiseValue = fbm(st * 5.0 + uTime * 0.1);
    float alphaErosion = step(erosion * 0.8, noiseValue);
    color.a *= mix(alphaErosion, 1.0, restoration);
    
    // 2. Color desaturation
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = mix(color.rgb, vec3(gray), erosion);
    
    // 3. Edge fragmentation
    float edge = fbm(st * 20.0 + uTime * 0.2);
    float edgeErosion = smoothstep(0.3, 0.7, edge + erosion);
    color.rgb *= mix(edgeErosion, 1.0, restoration * 0.5);
    
    // 4. Crystallization effect on full restoration
    if (restoration > 0.95) {
      // Add prismatic refraction
      vec2 refractOffset = vec2(
        sin(st.y * 10.0 + uTime) * 0.01,
        cos(st.x * 10.0 + uTime) * 0.01
      );
      
      vec4 refractR = texture2D(uTexture, st + refractOffset * 0.5);
      vec4 refractG = texture2D(uTexture, st);
      vec4 refractB = texture2D(uTexture, st - refractOffset * 0.5);
      
      color.r = refractR.r;
      color.g = refractG.g;
      color.b = refractB.b;
      
      // Add shimmer
      float shimmer = sin(st.x * 50.0 + st.y * 50.0 + uTime * 3.0) * 0.5 + 0.5;
      color.rgb += vec3(0.1, 0.3, 0.2) * shimmer * 0.3;
    }
    
    // 5. Glow effect near cursor
    float glow = exp(-dist * 5.0) * restoration;
    color.rgb += vec3(0.0, 1.0, 0.5) * glow * 0.3;
    
    gl_FragColor = color;
  }
`;

// Particle system for disintegration effect
export const particleVertexShader = `
  attribute float size;
  attribute float alpha;
  attribute vec3 velocity;
  
  varying float vAlpha;
  
  uniform float uTime;
  
  void main() {
    vAlpha = alpha;
    
    vec3 pos = position + velocity * uTime;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const particleFragmentShader = `
  varying float vAlpha;
  
  uniform vec3 uColor;
  
  void main() {
    vec2 uv = gl_PointCoord.xy * 2.0 - 1.0;
    float d = length(uv);
    
    if (d > 1.0) discard;
    
    float alpha = vAlpha * (1.0 - smoothstep(0.5, 1.0, d));
    gl_FragColor = vec4(uColor, alpha);
  }
`;

// Post-processing bloom shader for crystallized elements
export const bloomFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform float uBloomStrength;
  uniform float uBloomRadius;
  varying vec2 vUv;
  
  vec4 getBloom(sampler2D tex, vec2 uv, float radius) {
    vec4 sum = vec4(0.0);
    
    // 9-tap Gaussian blur
    sum += texture2D(tex, uv + vec2(-radius, -radius) * 0.01) * 0.05;
    sum += texture2D(tex, uv + vec2(0.0, -radius) * 0.01) * 0.09;
    sum += texture2D(tex, uv + vec2(radius, -radius) * 0.01) * 0.05;
    
    sum += texture2D(tex, uv + vec2(-radius, 0.0) * 0.01) * 0.09;
    sum += texture2D(tex, uv) * 0.36;
    sum += texture2D(tex, uv + vec2(radius, 0.0) * 0.01) * 0.09;
    
    sum += texture2D(tex, uv + vec2(-radius, radius) * 0.01) * 0.05;
    sum += texture2D(tex, uv + vec2(0.0, radius) * 0.01) * 0.09;
    sum += texture2D(tex, uv + vec2(radius, radius) * 0.01) * 0.05;
    
    return sum;
  }
  
  void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    vec4 bloom = getBloom(tDiffuse, vUv, uBloomRadius);
    
    // Extract bright areas
    float brightness = dot(bloom.rgb, vec3(0.299, 0.587, 0.114));
    bloom *= step(0.7, brightness);
    
    color += bloom * uBloomStrength;
    
    gl_FragColor = color;
  }
`;

// Utility function to create shader material
export const createErosionMaterial = (texture, uniforms = {}) => {
  return {
    vertexShader: erosionVertexShader,
    fragmentShader: erosionFragmentShader,
    uniforms: {
      uTexture: { value: texture },
      uTime: { value: 0 },
      uErosionLevel: { value: 0.5 },
      uMouse: { value: [0, 0] },
      uResolution: { value: [window.innerWidth, window.innerHeight] },
      ...uniforms
    },
    transparent: true,
    side: 'DoubleSide'
  };
};