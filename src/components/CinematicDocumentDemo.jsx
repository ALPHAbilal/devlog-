import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { Plus, Type, Code, MessageSquare, Heading, Folder, Table, Image, AlertCircle, MousePointer2, Save, Check } from 'lucide-react';

/**
 * CinematicDocumentDemo - "Next Level" Orchestration
 * 
 * Implements ref-based targeting and semantic camera framing.
 * - Cursor hits exact DOM elements (Refs).
 * - Component-relative coordinate mapping.
 * - Per-character typing for both Header and Code.
 * - Dynamic centering physics.
 */
const CinematicDocumentDemo = () => {
    const [blocks, setBlocks] = useState([]);
    const [saveStatus, setSaveStatus] = useState(null);
    const [showAddMenu, setShowAddMenu] = useState(false);

    // Refs for Target-Aware logic
    const viewportRef = useRef(null);
    const dividerRef = useRef(null);
    const codeIconRef = useRef(null);
    const headerRef = useRef(null);

    // 1. Perspective Motion Values
    const cursorX = useMotionValue(120); // % scale
    const cursorY = useMotionValue(120);
    const cursorOpacity = useMotionValue(0);

    const springConfig = { stiffness: 100, damping: 20, mass: 1 };
    const cameraSpringConfig = { stiffness: 45, damping: 25, mass: 1.5 };

    // Centered Tracking
    const cameraX = useSpring(useTransform(cursorX, (val) => (50 - val) * 0.6), cameraSpringConfig);
    const cameraY = useSpring(useTransform(cursorY, (val) => (40 - val) * 0.6), cameraSpringConfig);
    const cameraScale = useSpring(1, springConfig);
    const cameraBlur = useMotionValue(0);

    // --- Helper: Dynamic Coordinate Resolver ---
    const getTargetCoords = useCallback((el) => {
        if (!el || !viewportRef.current) return { x: 50, y: 50 };
        const viewRect = viewportRef.current.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        // Calculate center as % relative to viewport
        const x = ((elRect.left + elRect.width / 2 - viewRect.left) / viewRect.width) * 100;
        const y = ((elRect.top + elRect.height / 2 - viewRect.top) / viewRect.height) * 100;

        return { x, y };
    }, []);

    // --- High-Fidelity Mock Components ---

    const BlockDividerMock = ({ isHovered = false }) => (
        <div ref={dividerRef} className="relative h-10 -my-2 flex items-center justify-center pointer-events-none">
            <div className={`absolute inset-x-8 h-px transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'}`} />
            <div className={`bg-[#0d1117] border border-white/10 text-white/40 rounded-full w-7 h-7 flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100 scale-100 border-emerald-500/50 text-emerald-500 bg-emerald-500/10' : 'opacity-0 scale-90'}`}>
                <Plus size={16} />
            </div>
        </div>
    );

    const AddBlockRowMock = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-1 bg-[#0d1117]/90 backdrop-blur-md rounded-full px-2 py-1 border border-white/10 shadow-2xl my-3"
        >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white/40"><Plus size={18} /></div>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium text-white/40"><Type size={12} /><span>text</span></div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium text-white/40"><Heading size={12} /><span>heading</span></div>
            <div ref={codeIconRef} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium bg-white/10 text-white"><Code size={12} /><span>code</span></div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium text-white/40"><Table size={12} /><span>table</span></div>
        </motion.div>
    );

    const CodeBlockRaw = ({ content, filePath }) => {
        const lines = content.split('\n');
        return (
            <div className="group relative pt-5">
                {filePath && (
                    <div className="absolute -top-3 left-0 text-[10px] text-emerald-400 bg-[#0d1117] px-3 py-1.5 rounded-t font-mono border border-white/10 border-b-0">
                        {filePath}
                    </div>
                )}
                <div className="bg-[#01060b] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    <div className="flex">
                        <div className="select-none text-white/10 text-[11px] font-mono p-4 pr-3 text-right border-r border-white/5 bg-black/20">
                            {lines.map((_, i) => <div key={i} className="leading-7">{i + 1}</div>)}
                        </div>
                        <pre className="flex-1 p-5 pl-5 text-sm leading-7 font-mono overflow-hidden">
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

    // --- Character Typing Engine ---
    const typeInto = async (setter, fullText, delayRange = [30, 70]) => {
        for (let i = 0; i <= fullText.length; i++) {
            setter(fullText.slice(0, i));
            await new Promise(r => setTimeout(r, delayRange[0] + Math.random() * (delayRange[1] - delayRange[0])));
            if (i % 6 === 0) cameraX.set(cameraX.get() + (Math.random() - 0.5) * 0.4);
        }
    };

    // --- Timeline Logic ---
    const playTimeline = async () => {
        if (!viewportRef.current) return;

        // RESET
        setBlocks([{ id: 'h1', type: 'heading', content: '' }]);
        setSaveStatus(null);
        setShowAddMenu(false);
        cursorX.set(120); cursorY.set(120); cursorOpacity.set(0);
        cameraScale.set(1); cameraBlur.set(0);

        await new Promise(r => setTimeout(r, 1000));

        // 1. Header Typing & Entrance
        animate(cursorOpacity, 1, { duration: 0.5 });
        const initialTarget = getTargetCoords(headerRef.current);
        animate(cursorX, initialTarget.x + 5, { duration: 1.5 });
        animate(cursorY, initialTarget.y, { duration: 1.5 });

        await typeInto((content) => setBlocks(prev => prev.map(b => b.id === 'h1' ? { ...b, content } : b)), "Distributed Intelligence Core");
        await new Promise(r => setTimeout(r, 300));

        // 2. Move to Divider (Ref Aware)
        const divPoint = getTargetCoords(dividerRef.current);
        await Promise.all([
            animate(cursorX, divPoint.x, { duration: 1, ease: [0.22, 1, 0.36, 1] }),
            animate(cursorY, divPoint.y, { duration: 1, ease: [0.22, 1, 0.36, 1] })
        ]);

        // 3. Click Divider & Select Menu
        setShowAddMenu(true);
        await new Promise(r => setTimeout(r, 800));

        const menuPoint = getTargetCoords(codeIconRef.current);
        await Promise.all([
            animate(cursorX, menuPoint.x, { duration: 0.6 }),
            animate(cursorY, menuPoint.y, { duration: 0.6 })
        ]);

        // 4. Block Appearance
        setShowAddMenu(false);
        setBlocks(prev => [...prev, { id: 'c1', type: 'code', filePath: 'src/lib/sync.ts', content: '' }]);
        await new Promise(r => setTimeout(r, 500));

        // 5. Typing Sequence (Character Level)
        cameraScale.set(1.25);
        await typeInto(
            (content) => setBlocks(prev => prev.map(b => b.id === 'c1' ? { ...b, content } : b)),
            'const sync = async () => {\n  const res = await vault.pull();\n  return res.data;\n};',
            [20, 50]
        );

        // 6. Save & Resolve
        await new Promise(r => setTimeout(r, 1000));
        animate(cursorOpacity, 0, { duration: 0.8 });
        animate(cameraBlur, 8, { duration: 1.5 });
        cameraScale.set(1.3);

        setSaveStatus('saving');
        await new Promise(r => setTimeout(r, 1200));
        setSaveStatus('saved');

        await new Promise(r => setTimeout(r, 2000));
        animate(cameraBlur, 0, { duration: 2 });
        cameraScale.set(1);

        await new Promise(r => setTimeout(r, 4000));
        if (viewportRef.current) playTimeline();
    };

    useEffect(() => {
        playTimeline();
    }, []);

    return (
        <div ref={viewportRef} className="relative w-full aspect-[16/10] bg-[#02040a] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl font-sans text-white">
            {/* Background Texture */}
            <motion.div className="absolute inset-0 z-0" style={{ filter: useTransform(cameraBlur, (v) => `blur(${v}px)`) }}>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_70%)]" />
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                <motion.div className="absolute -inset-20 bg-gradient-to-tr from-emerald-500/10 via-transparent to-blue-500/10 blur-[100px]" animate={{ opacity: [0.3, 0.5, 0.3], rotate: [0, 5, 0], scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity }} />
            </motion.div>

            {/* Cinematic Viewport */}
            <motion.div
                className="relative w-full h-full p-12 md:p-14 z-10"
                style={{ x: cameraX, y: cameraY, scale: cameraScale, transformOrigin: 'center center' }}
                animate={{ rotateX: [0, 0.5, 0], rotateY: [0, 0.3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                {/* 1:1 Content */}
                <div className="max-w-4xl mx-auto space-y-2">
                    {blocks.map((block, i) => (
                        <div key={block.id}>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                                {block.type === 'heading' ? (
                                    <div ref={headerRef} className="text-3xl font-bold tracking-tight px-2 py-4 h-16">{block.content}</div>
                                ) : (
                                    <CodeBlockRaw content={block.content} filePath={block.filePath} />
                                )}
                            </motion.div>

                            {i === 0 && (
                                <div className="py-2">
                                    <BlockDividerMock isHovered={showAddMenu} />
                                    <AnimatePresence>
                                        {showAddMenu && <div className="flex justify-center"><AddBlockRowMock /></div>}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="pt-10 opacity-[0.03] font-mono text-[10px] tracking-[.3em] text-center uppercase">System_Waiting_For_Sequence</div>
                </div>
            </motion.div>

            {/* Precision Cursor */}
            <motion.div
                className="absolute z-50 pointer-events-none"
                style={{
                    left: useTransform(cursorX, (v) => `${v}%`),
                    top: useTransform(cursorY, (v) => `${v}%`),
                    opacity: cursorOpacity
                }}
            >
                <MousePointer2 className="w-6 h-6 fill-white stroke-[3px] drop-shadow-2xl" />
                <motion.div className="absolute -inset-4 bg-white/5 blur-xl rounded-full" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            </motion.div>

            {/* HUD Status */}
            <AnimatePresence>
                {saveStatus && (
                    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute bottom-16 right-16 p-6 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] flex items-center gap-5 z-20 shadow-2xl">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                            {saveStatus === 'saving' ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Save className="text-emerald-500 w-6 h-6" /></motion.div> : <Check className="text-emerald-500 w-6 h-6" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-[.3em] mb-1">Infrastructure_State</span>
                            <span className="font-mono text-white font-bold">{saveStatus === 'saving' ? 'WRITING_SNAPSHOT' : 'COMMIT_SUCCESSFUL'}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CinematicDocumentDemo;
