// Temporal upsampling for smoother animations at lower frame rates
export class TemporalUpsampler {
  constructor() {
    this.previousFrame = null;
    this.currentFrame = null;
    this.interpolationFactor = 0;
    this.lastUpdateTime = 0;
  }
  
  update(particles, timestamp) {
    if (!this.previousFrame) {
      this.previousFrame = this.cloneParticleState(particles);
      this.currentFrame = this.cloneParticleState(particles);
      this.lastUpdateTime = timestamp;
      return particles;
    }
    
    // Store previous state
    this.previousFrame = this.currentFrame;
    this.currentFrame = this.cloneParticleState(particles);
    
    // Calculate interpolation factor
    const deltaTime = timestamp - this.lastUpdateTime;
    this.interpolationFactor = Math.min(deltaTime / 16.67, 1); // Target 60fps
    this.lastUpdateTime = timestamp;
    
    return particles;
  }
  
  interpolate(particles, renderTimestamp) {
    if (!this.previousFrame || !this.currentFrame) return particles;
    
    // Calculate smooth interpolation factor
    const timeSinceUpdate = renderTimestamp - this.lastUpdateTime;
    const t = Math.min(timeSinceUpdate / 16.67, 1);
    
    // Interpolate particle positions
    return particles.map((particle, i) => {
      const prev = this.previousFrame[i];
      const curr = this.currentFrame[i];
      
      if (!prev || !curr) return particle;
      
      return {
        ...particle,
        x: prev.x + (curr.x - prev.x) * t,
        y: prev.y + (curr.y - prev.y) * t,
        energy: prev.energy + (curr.energy - prev.energy) * t,
        radius: prev.radius + (curr.radius - prev.radius) * t
      };
    });
  }
  
  cloneParticleState(particles) {
    return particles.map(p => ({
      x: p.x,
      y: p.y,
      energy: p.energy,
      radius: p.radius
    }));
  }
}

// GPU-accelerated filter utilities
export class GPUFilters {
  constructor(canvas) {
    this.canvas = canvas;
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = canvas.width;
    this.offscreenCanvas.height = canvas.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', {
      willReadFrequently: false,
      alpha: true
    });
    
    // Check for WebGL support
    this.webglCanvas = document.createElement('canvas');
    this.gl = this.webglCanvas.getContext('webgl2') || this.webglCanvas.getContext('webgl');
    this.hasWebGL = !!this.gl;
    
    if (this.hasWebGL) {
      this.initWebGL();
    }
  }
  
  initWebGL() {
    const gl = this.gl;
    
    // Vertex shader
    const vertexShader = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;
    
    // Bloom fragment shader
    const bloomShader = `
      precision mediump float;
      uniform sampler2D u_image;
      uniform vec2 u_resolution;
      uniform float u_intensity;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 texelSize = 1.0 / u_resolution;
        vec4 color = vec4(0.0);
        
        // 9-tap Gaussian blur
        color += texture2D(u_image, v_texCoord + vec2(-1.0, -1.0) * texelSize) * 0.045;
        color += texture2D(u_image, v_texCoord + vec2(0.0, -1.0) * texelSize) * 0.122;
        color += texture2D(u_image, v_texCoord + vec2(1.0, -1.0) * texelSize) * 0.045;
        color += texture2D(u_image, v_texCoord + vec2(-1.0, 0.0) * texelSize) * 0.122;
        color += texture2D(u_image, v_texCoord) * 0.332;
        color += texture2D(u_image, v_texCoord + vec2(1.0, 0.0) * texelSize) * 0.122;
        color += texture2D(u_image, v_texCoord + vec2(-1.0, 1.0) * texelSize) * 0.045;
        color += texture2D(u_image, v_texCoord + vec2(0.0, 1.0) * texelSize) * 0.122;
        color += texture2D(u_image, v_texCoord + vec2(1.0, 1.0) * texelSize) * 0.045;
        
        // Add bloom
        vec4 original = texture2D(u_image, v_texCoord);
        gl_FragColor = original + color * u_intensity;
      }
    `;
    
    // Compile shaders
    this.bloomProgram = this.createProgram(vertexShader, bloomShader);
    
    // Set up buffers
    this.setupBuffers();
  }
  
  createProgram(vertexSource, fragmentSource) {
    const gl = this.gl;
    
    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link failed:', gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  }
  
  createShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile failed:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  setupBuffers() {
    const gl = this.gl;
    
    // Create position buffer
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    // Create texture coordinate buffer
    const texCoords = new Float32Array([
      0, 1,
      1, 1,
      0, 0,
      1, 0,
    ]);
    
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    
    this.positionBuffer = positionBuffer;
    this.texCoordBuffer = texCoordBuffer;
  }
  
  applyBloom(ctx, intensity = 0.5) {
    if (!this.hasWebGL) {
      // Fallback to CSS filters
      ctx.filter = `blur(1px) brightness(1.1)`;
      return;
    }
    
    const gl = this.gl;
    const canvas = this.canvas;
    
    // Copy canvas to WebGL texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Use bloom shader
    gl.useProgram(this.bloomProgram);
    
    // Set uniforms
    const resolutionLoc = gl.getUniformLocation(this.bloomProgram, 'u_resolution');
    const intensityLoc = gl.getUniformLocation(this.bloomProgram, 'u_intensity');
    gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
    gl.uniform1f(intensityLoc, intensity);
    
    // Render
    this.render();
    
    // Copy back to canvas
    ctx.drawImage(this.webglCanvas, 0, 0);
    
    // Clean up
    gl.deleteTexture(texture);
  }
  
  render() {
    const gl = this.gl;
    
    gl.viewport(0, 0, this.webglCanvas.width, this.webglCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Set attributes
    const positionLoc = gl.getAttribLocation(this.bloomProgram, 'a_position');
    const texCoordLoc = gl.getAttribLocation(this.bloomProgram, 'a_texCoord');
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    
    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  
  applyDepthOfField(ctx, particles, mousePos, quality) {
    if (quality < 3) return;
    
    // Sort particles by depth
    const sortedParticles = [...particles].sort((a, b) => b.z - a.z);
    
    // Group by depth layers
    const layers = [
      { depth: 0, particles: [] },
      { depth: 33, particles: [] },
      { depth: 66, particles: [] },
      { depth: 100, particles: [] }
    ];
    
    sortedParticles.forEach(particle => {
      const layerIndex = Math.floor(particle.z / 25);
      if (layers[layerIndex]) {
        layers[layerIndex].particles.push(particle);
      }
    });
    
    // Render each layer with appropriate blur
    layers.forEach((layer, i) => {
      if (layer.particles.length === 0) return;
      
      const blur = i * 0.5;
      if (blur > 0) {
        ctx.save();
        ctx.filter = `blur(${blur}px)`;
      }
      
      // Render particles in this layer
      layer.particles.forEach(particle => {
        // Render particle (simplified version)
        ctx.fillStyle = `rgba(6, 182, 212, ${particle.energy * 0.8})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      
      if (blur > 0) {
        ctx.restore();
      }
    });
  }
}

// Adaptive quality manager
export class AdaptiveQualityManager {
  constructor() {
    this.targetFPS = 55;
    this.minFPS = 30;
    this.qualityLevels = ['minimal', 'low', 'medium', 'high'];
    this.currentLevel = 3; // Start at high
    this.frameHistory = [];
    this.adjustmentCooldown = 0;
  }
  
  update(frameTime) {
    this.frameHistory.push(frameTime);
    if (this.frameHistory.length > 60) {
      this.frameHistory.shift();
    }
    
    if (this.adjustmentCooldown > 0) {
      this.adjustmentCooldown--;
      return;
    }
    
    // Calculate average FPS
    const avgFrameTime = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length;
    const fps = 1000 / avgFrameTime;
    
    // Adjust quality based on performance
    if (fps < this.minFPS && this.currentLevel > 0) {
      this.currentLevel--;
      this.adjustmentCooldown = 60; // Wait 1 second before next adjustment
    } else if (fps > this.targetFPS && this.currentLevel < this.qualityLevels.length - 1) {
      this.currentLevel++;
      this.adjustmentCooldown = 60;
    }
  }
  
  getQuality() {
    return this.qualityLevels[this.currentLevel];
  }
  
  getSettings() {
    const settings = {
      minimal: {
        particleCount: 30,
        connectionRadius: 0,
        renderTrails: false,
        renderGlow: false,
        renderDataFlow: false,
        useWorker: false
      },
      low: {
        particleCount: 50,
        connectionRadius: 100,
        renderTrails: false,
        renderGlow: true,
        renderDataFlow: false,
        useWorker: false
      },
      medium: {
        particleCount: 80,
        connectionRadius: 150,
        renderTrails: true,
        renderGlow: true,
        renderDataFlow: true,
        useWorker: true
      },
      high: {
        particleCount: 120,
        connectionRadius: 200,
        renderTrails: true,
        renderGlow: true,
        renderDataFlow: true,
        useWorker: true
      }
    };
    
    return settings[this.getQuality()];
  }
}