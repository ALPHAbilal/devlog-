// GSAP Performance Optimizations for Quantum Documentation Field

export const optimizeGSAPPerformance = () => {
  if (!window.gsap) return;
  
  // Force GPU acceleration
  window.gsap.config({
    force3D: true,
    nullTargetWarn: false
  });
  
  // Custom ease for smooth particle movement
  if (window.CustomEase) {
    window.CustomEase.create("particleFloat", "0.4,0.0,0.2,1");
  }
};

// Device capability detection
export const getDeviceCapabilities = () => {
  const gpu = detectGPU();
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  
  return {
    isHighEnd: gpu.tier >= 2 && memory >= 8 && cores >= 4,
    isMidRange: gpu.tier >= 1 && memory >= 4,
    isLowEnd: gpu.tier < 1 || memory < 4 || cores < 4,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  };
};

// GPU detection helper
function detectGPU() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    return { tier: 0, renderer: 'unknown' };
  }
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
  
  // Simple GPU tier detection
  if (renderer.includes('NVIDIA') || renderer.includes('AMD')) {
    return { tier: 2, renderer };
  } else if (renderer.includes('Intel')) {
    return { tier: 1, renderer };
  }
  
  return { tier: 0, renderer };
}

// Particle count recommendations
export const getRecommendedParticleCount = () => {
  const caps = getDeviceCapabilities();
  
  if (caps.isHighEnd) return 30;
  if (caps.isMidRange) return 20;
  if (caps.isLowEnd) return 12;
  if (caps.isMobile) return 10;
  
  return 15; // Default fallback
};