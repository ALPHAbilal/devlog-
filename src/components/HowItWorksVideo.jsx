import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import CinematicDocumentDemo from './CinematicDocumentDemo';
import { staggerContainer, staggerItem } from '@/shared/lib';

const showcaseItems = [
  {
    id: 'capture',
    title: 'Instant Capture',
    description: 'Paste code snippets, save solutions, and document fixes in seconds. No formatting required.',
    customComponent: <CinematicDocumentDemo />, // NEW: Use high-fidelity cinematic demo
    accentColor: 'rgba(255, 255, 255, 0.03)', // Subtle mono accent
  },
  {
    id: 'connect',
    title: 'Smart Connections',
    description: 'Link related solutions with @mentions. Build your interconnected knowledge graph effortlessly.',
    videoUrl: '/videos/connect-demo.mp4',
    gifUrl: '/gifs/connect-demo.gif',
    posterUrl: '/images/connect-poster.jpg',
    accentColor: 'rgba(255, 255, 255, 0.04)', // Subtle mono accent
  },
  {
    id: 'search',
    title: 'Lightning Search',
    description: 'Find any solution in milliseconds. Your entire development history at your fingertips.',
    videoUrl: '/videos/search-demo.mp4',
    gifUrl: '/gifs/search-demo.gif',
    posterUrl: '/images/search-poster.jpg',
    accentColor: 'rgba(255, 255, 255, 0.05)', // Subtle mono accent
  }
];

function VideoShowcaseItem({ item, index }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [useGif, setUseGif] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, margin: "-100px" });

  // If this item has a custom component, render it instead
  if (item.customComponent) {
    return (
      <motion.div
        ref={containerRef}
        className={`showcase-item ${index % 2 === 1 ? 'showcase-item-reverse' : ''}`}
        variants={staggerItem}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {/* Content Section */}
        <div className="showcase-content">
          <div className="text-[11px] font-['JetBrains_Mono',_monospace] text-emerald-500/50 mb-2">
            SYSTEM_OP: CAPTURE_INIT
          </div>
          <h3 className="showcase-title font-['Arial',_sans-serif] text-[28px] font-medium tracking-tight mb-4">{item.title}</h3>
          <p className="showcase-description font-['Arial',_sans-serif] text-[16px] text-slate-400 leading-relaxed mb-6">{item.description}</p>

          <motion.div
            className="showcase-features"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="feature-tag font-['JetBrains_Mono',_monospace] text-[11px]">No setup required</div>
            <div className="feature-tag font-['JetBrains_Mono',_monospace] text-[11px]">Works instantly</div>
          </motion.div>
        </div>

        {/* Custom Component Section */}
        <div className="showcase-media relative">
          <div className="absolute -top-4 -right-4 font-['JetBrains_Mono',_monospace] text-[10px] text-slate-600 opacity-40">
            // LIVE_RUNTIME
          </div>
          {item.customComponent}
        </div>
      </motion.div>
    );
  }

  // Auto-play when in view
  useEffect(() => {
    if (videoRef.current && isInView && !useGif) {
      videoRef.current.play().catch(() => {
        // Fallback to GIF if video fails to play
        setUseGif(true);
      });
      setIsPlaying(true);
    } else if (videoRef.current && !isInView) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isInView, useGif]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      }
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className={`showcase-item ${index % 2 === 1 ? 'showcase-item-reverse' : ''}`}
      variants={staggerItem}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {/* Content Section */}
      <div className="showcase-content">
        <div className="text-[11px] font-['JetBrains_Mono',_monospace] text-emerald-500/50 mb-2">
          SYSTEM_OP: {item.id.toUpperCase()}_INIT
        </div>
        <h3 className="showcase-title font-['Arial',_sans-serif] text-[28px] font-medium tracking-tight mb-4">{item.title}</h3>
        <p className="showcase-description font-['Arial',_sans-serif] text-[16px] text-slate-400 leading-relaxed mb-6">{item.description}</p>

        <motion.div
          className="showcase-features"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="feature-tag font-['JetBrains_Mono',_monospace] text-[11px]">High performance</div>
          <div className="feature-tag font-['JetBrains_Mono',_monospace] text-[11px]">Local storage</div>
        </motion.div>
      </div>

      {/* Media Section */}
      <motion.div
        className="showcase-media relative"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        style={{ '--accent-color': item.accentColor }}
      >
        <div className="absolute -top-4 -right-4 font-['JetBrains_Mono',_monospace] text-[10px] text-slate-600 opacity-40">
          // MEDIA_PLAYBACK_{index + 1}
        </div>
        <div className="media-container">
          {useGif ? (
            <img
              src={item.gifUrl}
              alt={item.title}
              className="media-element"
              loading="lazy"
            />
          ) : (
            <video
              ref={videoRef}
              className="media-element"
              poster={item.posterUrl}
              loop
              muted
              playsInline
              onError={() => setUseGif(true)}
            >
              <source src={item.videoUrl} type="video/mp4" />
              <source src={item.videoUrl.replace('.mp4', '.webm')} type="video/webm" />
            </video>
          )}

          {/* Video Controls Overlay */}
          {!useGif && (
            <motion.div
              className="media-controls"
              initial={{ opacity: 0 }}
              animate={{ opacity: showControls ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={togglePlayPause}
                className="control-button play-pause"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>

              <button
                onClick={handleFullscreen}
                className="control-button fullscreen"
                aria-label="Fullscreen"
              >
                <Maximize2 size={18} />
              </button>
            </motion.div>
          )}

          {/* Decorative Elements */}
          <div className="media-decoration media-decoration-1" />
          <div className="media-decoration media-decoration-2" />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HowItWorksVideo() {
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const nextSlide = () => {
    setMobileActiveIndex((prev) => (prev + 1) % showcaseItems.length);
  };

  const prevSlide = () => {
    setMobileActiveIndex((prev) => (prev - 1 + showcaseItems.length) % showcaseItems.length);
  };

  return (
    <section className="how-it-works-video relative bg-[#0d1117]" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
      {/* Noise overlay for premium texture */}
      <div className="noise-overlay" />

      <div className="container-wrapper relative z-10">
        <motion.div
          className="section-header text-center mb-16 md:mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 mb-8">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500 text-[13px] font-['JetBrains_Mono',_monospace]">Infrastructure Visualization</span>
          </div>

          <h2
            className="text-white mb-6"
            style={{
              fontSize: 'clamp(36px, 5vw, 64px)',
              lineHeight: '1.1',
              letterSpacing: '-1.28px',
              fontWeight: 400,
              fontFamily: 'Arial, sans-serif'
            }}
          >
            See DevLog <br className="hidden md:block" />
            <span className="text-slate-500">In Real-Time Action</span>
          </h2>

          <p
            className="text-[18px] text-slate-400 max-w-2xl mx-auto leading-relaxed font-['Arial',_sans-serif]"
          >
            Watch how developers capture, organize, and find their solutions
            in milliseconds, without ever leaving the flow state.
          </p>
        </motion.div>

        {/* Desktop Layout */}
        <motion.div
          className="showcase-list desktop-only"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {showcaseItems.map((item, index) => (
            <VideoShowcaseItem key={item.id} item={item} index={index} />
          ))}
        </motion.div>

        {/* Mobile Carousel Layout */}
        <div className="mobile-carousel mobile-only">
          <AnimatePresence mode="wait">
            <motion.div
              key={mobileActiveIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <VideoShowcaseItem
                item={showcaseItems[mobileActiveIndex]}
                index={mobileActiveIndex}
              />
            </motion.div>
          </AnimatePresence>

          {/* Mobile Navigation */}
          <div className="carousel-navigation">
            <button
              onClick={prevSlide}
              className="carousel-nav-button"
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="carousel-indicators">
              {showcaseItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setMobileActiveIndex(index)}
                  className={`carousel-indicator ${index === mobileActiveIndex ? 'active' : ''}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="carousel-nav-button"
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="section-cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <p className="cta-text">
            Join thousands of developers who never lose a solution again
          </p>
          <button className="cta-button">
            Start Free Trial
            <svg
              className="cta-arrow"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M7 10H13M13 10L10 7M13 10L10 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </motion.div>
      </div>
    </section>
  );
}