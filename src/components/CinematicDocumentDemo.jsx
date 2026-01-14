import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { Plus, Type, Code, MessageSquare, Heading, Folder, FolderOpen, File, Table, AlertCircle, Target, Check, Save, MousePointer2, ChevronDown, ChevronRight, Clock } from 'lucide-react';

/**
 * CinematicDocumentDemo - Expert Tracking Edition
 * 
 * Implements the DEFINITIVE solution for scale-invariant camera centering:
 * 1. Mathematical Correction: newY = currentY + (diff / scale)
 * 2. Point-of-Action Centering: Targets always hit 40% viewport height.
 * 3. Spring Decoupling: Targets are set on MotionValues, Springs handle the silk.
 */
const CinematicDocumentDemo = () => {
    const [blocks, setBlocks] = useState([]);
    const [saveStatus, setSaveStatus] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);

    const viewportRef = useRef(null);
    const cameraRef = useRef(null); // The transformed container
    const headerRef = useRef(null);
    const dividerRefs = useRef({});
    const menuIconRefs = useRef({});
    const blockRefs = useRef({});

    // 1. Perspective Motion Values
    const cursorX = useMotionValue(110);
    const cursorY = useMotionValue(110);
    const cursorOpacity = useMotionValue(0);

    const springConfig = { stiffness: 100, damping: 20, mass: 1 };
    const cameraSpringConfig = { stiffness: 80, damping: 35, mass: 1 };

    // --- Expert Anchor Tracking ---
    // Target values (Layer 1)
    const cameraY_target = useMotionValue(0);
    const cameraScale_target = useMotionValue(1);

    // Animated Springs (Layer 2)
    const cameraY = useSpring(cameraY_target, cameraSpringConfig);
    const cameraScale = useSpring(cameraScale_target, springConfig);
    const cameraX = useSpring(useTransform(cursorX, (v) => 50 - v), cameraSpringConfig);
    const cameraBlur = useMotionValue(0);

    // 2. Shake Values (for typing)
    const shakeX = useMotionValue(0);
    const shakeY = useMotionValue(0);

    // Inverse Scale for Cursor
    const cursorInverseScale = useTransform(cameraScale, (s) => 1 / s);

    // --- Helper: Centering Engine (Scale-Invariant) ---
    const centerOnElement = useCallback((el) => {
        if (!el || !viewportRef.current || !cameraRef.current) return;

        // 1. Get Viewport/Container Geometry
        const viewportRect = viewportRef.current.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        // 2. Extract Current State via DOMMatrix (Absolute Source of Truth)
        // This ensures the formula works even if called mid-animation
        const matrix = new DOMMatrix(getComputedStyle(cameraRef.current).transform);
        const currentY = matrix.m42;
        const currentScale = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b) || 1;

        // 3. The Target: We want the element's CENTER to be at 40% of the VIEWPORT container
        // We calculate positions relative to the VIEWPORT CONTAINER (demo box)
        const targetInnerY = viewportRect.height * 0.4;
        const elementInnerY = (elRect.top + elRect.height / 2) - viewportRect.top;

        // 4. Calculate the discrepancy in physical viewport pixels
        const diffInViewportPixels = targetInnerY - elementInnerY;

        // 5. The Magic: To compensate for a viewport shift of X, we must shift the 
        // underlying content by (X / Scale) because the content is already being scaled.
        const targetYDelta = diffInViewportPixels / currentScale;
        const newTargetY = currentY + targetYDelta;

        // 6. Set the target (The useSpring will handle the smooth transition)
        cameraY_target.set(newTargetY);
    }, [cameraY_target]);

    const getContentCoords = useCallback((el) => {
        if (!el || !viewportRef.current) return { x: 50, y: 50 };
        const canvas = viewportRef.current.querySelector('.content-canvas');
        if (!canvas) return { x: 50, y: 50 };

        const canvasRect = canvas.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        return {
            x: ((elRect.left + elRect.width / 2 - canvasRect.left) / canvasRect.width) * 100,
            y: ((elRect.top + elRect.height / 2 - canvasRect.top) / canvasRect.height) * 100
        };
    }, []);

    // --- High-Fidelity Mock Components ---

    const FileTreeMock = () => (
        <div className="bg-[#0d1117]/50 rounded-xl p-4 border border-white/5 font-mono text-[11px] space-y-1 shadow-inner">
            <div className="flex items-center gap-2 text-emerald-400/80 mb-2 font-bold uppercase tracking-widest text-[9px]">Architecture_View</div>
            <div className="flex items-center gap-2 text-white/80 pl-2"><FolderOpen size={14} className="text-emerald-500/60" /><span>src</span></div>
            <div className="flex items-center gap-2 text-white/50 pl-6"><Folder size={14} /><span>components</span></div>
            <div className="flex items-center gap-2 text-white/90 pl-6"><FolderOpen size={14} className="text-emerald-500/60" /><span>lib</span></div>
            <div className="flex items-center gap-2 text-emerald-500 pl-10"><File size={14} /><span>sync.ts</span></div>
        </div>
    );

    const IssueTrackerMock = ({ status = 'active' }) => (
        <div className="bg-[#0d1117]/50 rounded-xl p-5 border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400/80 mb-2 font-bold uppercase tracking-widest text-[9px]">Verification_Cycle</div>
            <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"><Target size={12} className="text-emerald-500" /></div>
                <div className="text-sm font-bold text-white/90">Infrastructure Sync</div>
            </div>
            <div className="relative pl-6 space-y-4">
                <div className="absolute left-2.5 top-2 bottom-2 w-px bg-white/10" />
                <div className="relative flex items-start gap-3">
                    <div className={`absolute -left-5 w-4 h-4 rounded-full border-2 border-[#0d1117] flex items-center justify-center transition-colors duration-500 ${status === 'solved' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}>
                        {status === 'solved' ? <Check size={10} className="text-[#0d1117] stroke-[4]" /> : <div className="w-1.5 h-1.5 bg-[#0d1117] rounded-full" />}
                    </div>
                    <div className="flex-1">
                        <div className="text-[12px] font-medium text-white/90">Resolve Atomic Sync Drift</div>
                        <div className="text-[10px] text-white/40 mt-1">Verification of distributed node cycles.</div>
                        {status === 'solved' && <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="mt-2 text-[9px] text-emerald-500 font-mono bg-emerald-500/10 px-2 py-1 rounded inline-block">COMMIT_SUCCESS_ID_482</motion.div>}
                    </div>
                </div>
            </div>
        </div>
    );

    const CodeBlockRaw = ({ content, filePath }) => {
        const lines = content.split('\n');
        return (
            <div className="group relative pt-5 code-block-target">
                {filePath && (
                    <div className="absolute -top-3 left-0 text-[10px] text-emerald-400 bg-[#0d1117] px-3 py-1.5 rounded-t font-mono border border-white/10 border-b-0">{filePath}</div>
                )}
                <div className="bg-[#01060b] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    <div className="flex">
                        <div className="select-none text-white/10 text-[11px] font-mono p-4 pr-3 text-right border-r border-white/5 bg-black/20">
                            {lines.map((_, i) => <div key={i} className="leading-7">{i + 1}</div>)}
                        </div>
                        <pre className="flex-1 p-5 pl-5 text-[13px] leading-7 font-mono overflow-hidden">
                            <code className="text-[#9cdcfe]">
                                {content.split(/(\/\/.*|\bwindow\b|\bevent\b|\bif\b|\bconst\b|\bfunction\b|\basync\b|\bawait\b|\breturn\b)/g).map((part, i) => {
                                    if (part.startsWith('//')) return <span key={i} className="text-[#6a9955]">{part}</span>;
                                    if (['window', 'event', 'if', 'const', 'function', 'async', 'await', 'return'].includes(part)) return <span key={i} className="text-[#c586c0]">{part}</span>;
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

    const BlockDividerMock = ({ blockId, isHovered = false }) => (
        <div ref={el => dividerRefs.current[blockId] = el} className="relative h-10 -my-2 flex items-center justify-center pointer-events-none">
            <div className={`absolute inset-x-8 h-px transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'}`} />
            <div className={`bg-[#0d1117] border border-white/10 text-white/40 rounded-full w-7 h-7 flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100 scale-100 border-emerald-500/50 text-emerald-500 bg-emerald-500/10' : 'opacity-0 scale-90'}`}>
                <Plus size={16} />
            </div>
        </div>
    );

    const AddBlockRowMock = ({ blockId }) => (
        <motion.div initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex items-center gap-1 bg-[#0d1117]/90 backdrop-blur-md rounded-full px-2 py-1 border border-white/10 shadow-2xl my-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white/40"><Plus size={18} /></div>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <div ref={el => menuIconRefs.current[`${blockId}-tree`] = el} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium text-white/40 transition-colors"><Folder size={12} /><span>tree</span></div>
            <div ref={el => menuIconRefs.current[`${blockId}-code`] = el} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium text-white/40 transition-colors"><Code size={12} /><span>code</span></div>
            <div ref={el => menuIconRefs.current[`${blockId}-issue`] = el} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium text-white/40 transition-colors"><AlertCircle size={12} /><span>issue</span></div>
        </motion.div>
    );

    // --- Typing Engine ---
    const typeInto = async (setter, fullText, delayRange = [20, 50]) => {
        for (let i = 0; i <= fullText.length; i++) {
            setter(fullText.slice(0, i));
            await new Promise(r => setTimeout(r, delayRange[0] + Math.random() * (delayRange[1] - delayRange[0])));
            if (i % 6 === 0) {
                shakeX.set((Math.random() - 0.5) * 0.4);
                shakeY.set((Math.random() - 0.5) * 0.4);
                setTimeout(() => { shakeX.set(0); shakeY.set(0); }, 50);
            }
        }
    };

    // --- Storyboard Timeline ---
    const playTimeline = async () => {
        if (!viewportRef.current) return;

        // Act 0: Reset
        setBlocks([{ id: 'h1', type: 'heading', content: '' }]);
        setSaveStatus(null);
        setActiveMenuId(null);
        cursorX.set(110); cursorY.set(90); cursorOpacity.set(0);
        cameraScale_target.set(1); cameraBlur.set(0);
        cameraY_target.set(0);

        await new Promise(r => setTimeout(r, 1500));

        // Act 1: Foundation
        animate(cursorOpacity, 1, { duration: 0.5 });
        const hPos = getContentCoords(headerRef.current);
        await Promise.all([animate(cursorX, hPos.x + 10, { duration: 1 }), animate(cursorY, hPos.y, { duration: 1 })]);
        centerOnElement(headerRef.current);
        await typeInto((content) => setBlocks([{ id: 'h1', type: 'heading', content }]), "Distributed Intelligent Sync");
        await new Promise(r => setTimeout(r, 600));

        // Act 2: Architecture
        const d1 = getContentCoords(dividerRefs.current['h1']);
        await Promise.all([animate(cursorX, d1.x, { duration: 0.7 }), animate(cursorY, d1.y, { duration: 0.7 })]);
        centerOnElement(dividerRefs.current['h1']);
        setActiveMenuId('h1');
        await new Promise(r => setTimeout(r, 600));
        const treeIcon = getContentCoords(menuIconRefs.current['h1-tree']);
        await Promise.all([animate(cursorX, treeIcon.x, { duration: 0.4 }), animate(cursorY, treeIcon.y, { duration: 0.4 })]);

        setActiveMenuId(null);
        setBlocks(prev => [...prev, { id: 'tree1', type: 'filetree' }]);
        await new Promise(r => setTimeout(r, 800)); // Sync pause

        // Act 3: Implementation
        const d2 = getContentCoords(dividerRefs.current['tree1']);
        await Promise.all([animate(cursorX, d2.x, { duration: 0.6 }), animate(cursorY, d2.y, { duration: 0.6 })]);
        centerOnElement(dividerRefs.current['tree1']);
        setActiveMenuId('tree1');
        await new Promise(r => setTimeout(r, 600));
        const codeIcon = getContentCoords(menuIconRefs.current['tree1-code']);
        await Promise.all([animate(cursorX, codeIcon.x, { duration: 0.4 }), animate(cursorY, codeIcon.y, { duration: 0.4 })]);

        setActiveMenuId(null);
        setBlocks(prev => [...prev.slice(0, 2), { id: 'c1', type: 'code', filePath: 'src/lib/sync.ts', content: '' }]);
        await new Promise(r => setTimeout(r, 800));

        cameraScale_target.set(1.2);
        // Wait for zoom to start before measuring
        await new Promise(r => setTimeout(r, 200));
        centerOnElement(blockRefs.current['c1']);

        await typeInto(
            (content) => setBlocks(prev => prev.map(b => b.id === 'c1' ? { ...b, content } : b)),
            'const sync = async () => {\n  await vault.push("origin");\n  return { ok: true };\n};',
            [30, 60]
        );
        await new Promise(r => setTimeout(r, 800));

        // Act 4: Verification
        const d3 = getContentCoords(dividerRefs.current['c1']);
        cameraScale_target.set(1.1);
        await Promise.all([animate(cursorX, d3.x, { duration: 0.6 }), animate(cursorY, d3.y, { duration: 0.6 })]);
        centerOnElement(dividerRefs.current['c1']);
        setActiveMenuId('c1');
        await new Promise(r => setTimeout(r, 600));
        const issueIcon = getContentCoords(menuIconRefs.current['c1-issue']);
        await Promise.all([animate(cursorX, issueIcon.x, { duration: 0.4 }), animate(cursorY, issueIcon.y, { duration: 0.4 })]);

        setActiveMenuId(null);
        setBlocks(prev => [...prev.slice(0, 3), { id: 'i1', type: 'issue', status: 'active' }]);
        await new Promise(r => setTimeout(r, 600));
        centerOnElement(blockRefs.current['i1']);
        await new Promise(r => setTimeout(r, 1200));

        // Act 5: Resolution & Infinite Burst
        setBlocks(prev => prev.map(b => b.id === 'i1' ? { ...b, status: 'solved' } : b));
        await new Promise(r => setTimeout(r, 800));

        // Start the infinite impression
        animate(cursorOpacity, 0, { duration: 0.3 });
        cameraScale_target.set(0.9); // Zoom out slightly to see the speed

        // Rapid fire block generation - visible "infinite creation" effect
        const dummyTypes = ['heading', 'text', 'code', 'issue'];
        const dummyContents = [
            "Scaling Mesh Nodes...",
            "Validating auth cycles...",
            "const mesh = new Cluster();",
            "Latency verification: 12ms",
            "Re-routing sync traffic...",
            "Sync engine stabilized.",
        ];

        for (let i = 0; i < 24; i++) {
            const id = `inf-${i}`;
            const type = dummyTypes[i % dummyTypes.length];
            setBlocks(prev => [...prev, {
                id,
                type: type === 'text' ? 'heading' : type, // Simplify for speed
                content: dummyContents[i % dummyContents.length],
                status: 'solved',
                filePath: type === 'code' ? 'src/core/mesh.ts' : null
            }]);

            // Wait for block to render, then follow it with camera
            await new Promise(r => setTimeout(r, 80)); // Consistent fast timing

            // Only center on first 16 blocks - after that, stop following
            // to avoid showing empty space below the last blocks
            if (i < 16) {
                const newBlock = blockRefs.current[id];
                if (newBlock) {
                    centerOnElement(newBlock);
                }
            }

            // Small additional delay for visual rhythm (gets slightly faster)
            await new Promise(r => setTimeout(r, Math.max(40, 80 - (i * 5))));
        }

        // Act 6: Cinematic Pull-Away - smooth zoom out until blocks become thin lines
        const currentY = cameraY_target.get();
        const currentScale = cameraScale_target.get();

        // Single smooth animation for both scale and position
        // Using easeOut for that cinematic "pulling away" feel
        const pullAwayDuration = 2.5; // seconds

        animate(cameraScale_target, 0.12, {
            duration: pullAwayDuration,
            ease: [0.16, 1, 0.3, 1] // Custom ease: slow start, smooth deceleration
        });

        animate(cameraY_target, 0, {
            duration: pullAwayDuration,
            ease: [0.16, 1, 0.3, 1]
        });

        // Wait for the pull-away animation to complete
        await new Promise(r => setTimeout(r, pullAwayDuration * 1000));

        // Hold at maximum zoom-out (blocks appear as thin lines)
        await new Promise(r => setTimeout(r, 1200));

        // Quick fade transition before restart
        animate(cursorOpacity, 0, { duration: 0.3 });

        // Reset and loop
        await new Promise(r => setTimeout(r, 500));
        cameraScale_target.set(1);
        cameraY_target.set(0);
        await new Promise(r => setTimeout(r, 300));
        if (viewportRef.current) playTimeline();
    };

    useEffect(() => {
        playTimeline();
    }, []);

    return (
        <div ref={viewportRef} className="relative w-full aspect-[16/10] bg-[#02040a] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl font-sans text-white">
            {/* Ambient FX */}
            <motion.div className="absolute inset-0 z-0" style={{ filter: useTransform(cameraBlur, (v) => `blur(${v}px)`) }}>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_70%)]" />
                <motion.div className="absolute -inset-20 bg-gradient-to-tr from-emerald-500/10 via-transparent to-blue-500/10 blur-[100px]" animate={{ opacity: [0.3, 0.5, 0.3], rotate: [0, 5, 0] }} transition={{ duration: 10, repeat: Infinity }} />
            </motion.div>

            {/* Stable Camera Container */}
            <motion.div
                ref={cameraRef}
                className="relative w-full h-full z-10"
                style={{
                    x: useTransform([cameraX, shakeX], ([cx, sx]) => cx + sx),
                    y: useTransform([cameraY, shakeY], ([cy, sy]) => cy + sy),
                    scale: cameraScale,
                    transformOrigin: 'center center'
                }}
                animate={{ rotateX: [0, 0.15, 0], rotateY: [0, 0.1, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            >
                {/* Content Canvas */}
                <div className="content-canvas relative w-full h-full p-12 md:p-16 max-w-4xl mx-auto">
                    <div className="space-y-1">
                        {blocks.map((block) => (
                            <React.Fragment key={block.id}>
                                <motion.div
                                    ref={el => blockRefs.current[block.id] = el}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    {block.type === 'heading' && <div ref={headerRef} className="text-3xl font-bold tracking-tight px-2 py-4 min-h-[4rem]">{block.content}</div>}
                                    {block.type === 'filetree' && <FileTreeMock />}
                                    {block.type === 'code' && <CodeBlockRaw content={block.content} filePath={block.filePath} />}
                                    {block.type === 'issue' && <IssueTrackerMock status={block.status} />}
                                </motion.div>

                                <div className="py-2">
                                    <BlockDividerMock blockId={block.id} isHovered={activeMenuId === block.id} />
                                    <AnimatePresence>
                                        {activeMenuId === block.id && (
                                            <div className="flex justify-center">
                                                <AddBlockRowMock blockId={block.id} />
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="pt-8 opacity-[0.03] font-mono text-[9px] tracking-[.4em] text-center uppercase">System_Active_Orchestration</div>

                    {/* Content-Pinned Precision Cursor */}
                    <motion.div
                        className="absolute z-50 pointer-events-none"
                        style={{
                            left: useTransform(cursorX, (v) => `${v}%`),
                            top: useTransform(cursorY, (v) => `${v}%`),
                            opacity: cursorOpacity,
                            scale: cursorInverseScale
                        }}
                    >
                        <MousePointer2 className="w-6 h-6 fill-white stroke-[3px] drop-shadow-2xl" />
                        <motion.div className="absolute -inset-4 bg-white/5 blur-xl rounded-full" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                    </motion.div>
                </div>
            </motion.div>

            {/* Static HUD */}
            <AnimatePresence>
                {saveStatus && (
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-12 right-12 p-5 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] flex items-center gap-4 z-20 shadow-2xl">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                            {saveStatus === 'saving' ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Save className="text-emerald-500 w-5 h-5" /></motion.div> : <Check className="text-emerald-500 w-5 h-5" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-mono text-white/40 uppercase tracking-[.3em]">Snapshot_Sync</span>
                            <span className="font-mono text-white text-xs font-bold leading-tight">{saveStatus === 'saving' ? 'PUSH_ASSETS' : 'DEPLOY_SUCCESS'}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CinematicDocumentDemo;
