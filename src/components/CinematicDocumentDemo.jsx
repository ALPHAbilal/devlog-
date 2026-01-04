import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { Copy, Check, MousePointer2, Save, Code, FileText, ChevronDown } from 'lucide-react';

/**
 * CinematicDocumentDemo - Motion 11 High-Precision Edition
 * 
 * Recreates the DevLog document page with deterministic camera tracking.
 * - Camera pull-tracking via useSpring (Linked to cursor)
 * - Biomechanical constants for human-like momentum
 * - animate() timeline orchestration
 */
const CinematicDocumentDemo = () => {
    const [blocks, setBlocks] = useState([]);
    const [saveStatus, setSaveStatus] = useState(null);
    const scope = useRef(null);

    // 1. Linked Motion Values for Deterministic Tracking
    const cursorX = useMotionValue(1000); // Start far off-screen
    const cursorY = useMotionValue(1000);
    const cursorOpacity = useMotionValue(0);

    // Camera values pull towards the cursor with spring physics
    const springConfig = { stiffness: 100, damping: 20, mass: 1 };
    const cameraSpringConfig = { stiffness: 40, damping: 20, mass: 2 }; // Softer, heavier pull for cinematic feel

    // Optimized Centered Tracking: 
    // We want the camera to shift its view to keep the cursor relatively central when zooming.
    // Tracking intensity increased to 0.4 for dramatic cinematic follow.
    const cameraX = useSpring(useTransform(cursorX, (val) => (400 - val) * 0.4), cameraSpringConfig);
    const cameraY = useSpring(useTransform(cursorY, (val) => (300 - val) * 0.4), cameraSpringConfig);
    const cameraScale = useSpring(1, springConfig);
    const cameraBlur = useMotionValue(0);

    // 1:1 Block UI Components
    const BlockWrapper = ({ children, isFocused = true }) => (
        <div className={`group block-wrapper relative transition-all duration-700 mb-10 ${isFocused ? 'opacity-100' : 'opacity-20'}`}>
            {children}
        </div>
    );

    const HeadingBlockRaw = ({ content }) => (
        <div className="text-text-primary px-2 py-1 tracking-tight font-bold text-3xl">
            {content}
        </div>
    );

    const CodeBlockRaw = ({ content, filePath }) => {
        const lines = content.split('\n');
        return (
            <div className="group relative pt-5">
                {filePath && (
                    <div className="absolute -top-3 left-0 text-[10px] text-accent-green/90 
                          bg-dark-primary px-3 py-1.5 rounded-t font-mono z-30
                          border border-accent-green/30 border-b-0">
                        {filePath}
                    </div>
                )}
                <div className="bg-[#01060b] border border-white/10 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                    <div className="flex">
                        <div className="select-none text-text-secondary/20 text-[11px] font-mono p-4 pr-3 text-right border-r border-white/5 bg-black/20">
                            {lines.map((_, i) => <div key={i} className="leading-7">{i + 1}</div>)}
                        </div>
                        <pre className="flex-1 p-5 pl-5 overflow-hidden text-sm leading-7 font-mono">
                            <code className="text-[#9cdcfe]">
                                {content.split(/(\/\/.*|\bwindow\b|\bevent\b|\bif\b|\bconst\b|\bfunction\b)/g).map((part, i) => {
                                    if (part.startsWith('//')) return <span key={i} className="text-[#6a9955]">{part}</span>;
                                    if (['window', 'event', 'if', 'const', 'function'].includes(part)) return <span key={i} className="text-[#c586c0]">{part}</span>;
                                    if (part.includes('"')) return <span key={i} className="text-[#ce9178]">{part}</span>;
                                    return part;
                                })}
                            </code>
                        </pre>
                    </div>
                </div>
            </div>
        );
    };

    // Choreography Engine
    useEffect(() => {
        const playTimeline = async () => {
            if (!scope.current) return;

            // RESET
            setBlocks([]);
            setSaveStatus(null);
            cursorX.set(800);
            cursorY.set(600);
            cursorOpacity.set(0);
            cameraScale.set(1);
            cameraBlur.set(0);

            await new Promise(r => setTimeout(r, 1000));

            // SEQUENCE 1: Entrance
            // Move cursor in; Camera naturally "pulls" towards it via useSpring link
            const entrance = animate(cursorOpacity, 1, { duration: 0.5 });
            animate(cursorX, 200, { duration: 1.5, ease: [0.22, 1, 0.36, 1] });
            animate(cursorY, 150, { duration: 1.5, ease: [0.22, 1, 0.36, 1] });
            await entrance;

            // SEQUENCE 2: Heading
            setBlocks([{ id: 'h1', type: 'heading', content: 'Atomic Sync Layer' }]);
            await new Promise(r => setTimeout(r, 800));

            // SEQUENCE 3: Navigate to Code
            animate(cursorX, 150, { duration: 1.2, ease: [0.22, 1, 0.36, 1] });
            animate(cursorY, 400, { duration: 1.2, ease: [0.22, 1, 0.36, 1] });
            cameraScale.set(1.1); // Zoom in as we approach
            await new Promise(r => setTimeout(r, 600));

            // SEQUENCE 4: Typing Simulation
            setBlocks(prev => [...prev, {
                id: 'c1', type: 'code', filePath: 'src/lib/runtime.ts',
                content: '// Init sequence'
            }]);

            const codeParts = [
                '// Init sequence\nconst sync = () => {',
                '// Init sequence\nconst sync = () => {\n  const id = "node_01";',
                '// Init sequence\nconst sync = () => {\n  const id = "node_01";\n  broadcast(id);\n};'
            ];

            for (const part of codeParts) {
                setBlocks(prev => prev.map(b => b.id === 'c1' ? { ...b, content: part } : b));
                await new Promise(r => setTimeout(r, 500));
            }

            // SEQUENCE 5: Save & Blur (Infrastructure Capture)
            animate(cursorOpacity, 0, { duration: 0.8 });
            animate(cameraBlur, 8, { duration: 1 });
            cameraScale.set(1.35); // Stronger cinematic zoom

            setSaveStatus('saving');
            await new Promise(r => setTimeout(r, 1200));
            setSaveStatus('saved');

            // SEQUENCE 6: Reset View
            await new Promise(r => setTimeout(r, 2000));
            animate(cameraBlur, 0, { duration: 2 });
            cameraScale.set(1);

            await new Promise(r => setTimeout(r, 4000));
            if (scope.current) playTimeline();
        };

        playTimeline();
    }, []);

    return (
        <div ref={scope} className="relative w-full aspect-[16/10] bg-[#02040a] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
            {/* 1. Backdrop Layer (Shimmer Fix + Cinematic Overlays) */}
            <motion.div
                className="absolute inset-0 z-0"
                style={{ filter: useTransform(cameraBlur, (v) => `blur(${v}px)`) }}
            >
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_70%)]" />
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

                {/* Cinematic Light Leak */}
                <motion.div
                    className="absolute -inset-20 bg-gradient-to-tr from-emerald-500/10 via-transparent to-blue-500/10 blur-[100px] pointer-events-none"
                    animate={{
                        opacity: [0.3, 0.5, 0.3],
                        rotate: [0, 5, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>

            {/* 2. Cinematic Viewport (With Tracking + Drift) */}
            <motion.div
                className="relative w-full h-full p-20 md:p-28 z-10"
                style={{
                    x: cameraX,
                    y: cameraY,
                    scale: cameraScale,
                    transformOrigin: 'center center'
                }}
                animate={{
                    // Subtle Handheld Drift
                    rotateX: [0, 0.5, 0],
                    rotateY: [0, 0.3, 0],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                {/* Meta Header */}
                <div className="flex items-center justify-between mb-20 opacity-10">
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-white" />)}
                    </div>
                    <div className="font-mono text-[8px] tracking-[.5em] uppercase">Secured_Vault_Channel</div>
                </div>

                {/* 1:1 Content */}
                <div className="max-w-4xl mx-auto space-y-4">
                    <AnimatePresence>
                        {blocks.map((block) => (
                            <motion.div
                                key={block.id}
                                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <BlockWrapper>
                                    {block.type === 'heading' ? (
                                        <HeadingBlockRaw content={block.content} />
                                    ) : (
                                        <CodeBlockRaw content={block.content} filePath={block.filePath} />
                                    )}
                                </BlockWrapper>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Infrastructure Placeholder */}
                    <div className="pt-10 opacity-[0.03]">
                        <div className="border border-dashed border-white/50 rounded-2xl h-16 flex items-center justify-center font-mono text-[10px] uppercase tracking-[.3em]">
                            Waiting_For_Sequence_Input...
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 3. High-Precision Cursor */}
            <motion.div
                className="absolute z-50 pointer-events-none"
                style={{ x: cursorX, y: cursorY, opacity: cursorOpacity }}
            >
                <MousePointer2 className="w-6 h-6 fill-white stroke-[3px] text-white drop-shadow-2xl" />
                <motion.div
                    className="absolute -inset-4 bg-white/5 blur-xl rounded-full"
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </motion.div>

            {/* 4. Global HUD (Save Success) */}
            <AnimatePresence>
                {saveStatus && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute bottom-16 right-16 p-6 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] flex items-center gap-5 z-20 shadow-[-20px_20px_60px_rgba(0,0,0,0.5)]"
                    >
                        <div className="w-12 h-12 rounded-full bg-accent-green/10 flex items-center justify-center border border-accent-green/30">
                            {saveStatus === 'saving' ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                    <Save className="text-accent-green w-6 h-6" />
                                </motion.div>
                            ) : (
                                <Check className="text-accent-green w-6 h-6" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-[.3em] mb-1">Infrastructure_State</span>
                            <span className="font-mono text-white font-bold tracking-tighter">
                                {saveStatus === 'saving' ? 'WRITING_SNAPSHOT' : 'COMMIT_SUCCESSFUL'}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CinematicDocumentDemo;
