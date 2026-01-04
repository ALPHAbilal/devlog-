import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { Plus, Type, Code, MessageSquare, Heading, Folder, FolderOpen, File, Table, AlertCircle, Target, Check, Save, MousePointer2, ChevronDown, ChevronRight, Clock } from 'lucide-react';

/**
 * CinematicDocumentDemo - Extended Infrastructure Edition
 * 
 * Showcases the full document lifecycle:
 * 1. Project Architecture (File Tree)
 * 2. Logic Implementation (Code)
 * 3. Verification & Tracking (Issue Tracker)
 */
const CinematicDocumentDemo = () => {
    const [blocks, setBlocks] = useState([]);
    const [saveStatus, setSaveStatus] = useState(null);
    const [showAddMenu, setShowAddMenu] = useState(false);

    // Refs for Target-Aware logic
    const viewportRef = useRef(null);
    const dividerRef = useRef(null);
    const codeIconRef = useRef(null);
    const fileTreeIconRef = useRef(null);
    const issueTrackerIconRef = useRef(null);
    const headerRef = useRef(null);

    // 1. Perspective Motion Values
    const cursorX = useMotionValue(120);
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
        const x = ((elRect.left + elRect.width / 2 - viewRect.left) / viewRect.width) * 100;
        const y = ((elRect.top + elRect.height / 2 - viewRect.top) / viewRect.height) * 100;
        return { x, y };
    }, []);

    // --- High-Fidelity Mock Components ---

    const FileTreeMock = () => (
        <div className="bg-[#0d1117]/50 rounded-xl p-4 border border-white/5 font-mono text-[11px] space-y-1 shadow-inner">
            <div className="flex items-center gap-2 text-emerald-400/80 mb-2 font-bold uppercase tracking-widest text-[9px]">Project_Structure</div>
            <div className="flex items-center gap-2 text-white/80 pl-2"><FolderOpen size={14} className="text-emerald-500/60" /><span>src</span></div>
            <div className="flex items-center gap-2 text-white/50 pl-6"><Folder size={14} /><span>components</span></div>
            <div className="flex items-center gap-2 text-white/90 pl-6"><FolderOpen size={14} className="text-emerald-500/60" /><span>lib</span></div>
            <div className="flex items-center gap-2 text-emerald-500 pl-10"><File size={14} /><span>sync.ts</span></div>
            <div className="flex items-center gap-2 text-white/40 pl-10"><File size={14} /><span>auth.ts</span></div>
            <div className="flex items-center gap-2 text-white/50 pl-2"><File size={14} /><span>package.json</span></div>
        </div>
    );

    const IssueTrackerMock = ({ status = 'active' }) => (
        <div className="bg-[#0d1117]/50 rounded-xl p-5 border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400/80 mb-2 font-bold uppercase tracking-widest text-[9px]">Verification_Timeline</div>
            <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"><Target size={12} className="text-emerald-500" /></div>
                <div className="text-sm font-bold text-white/90">Infrastructure Sync Milestone</div>
            </div>
            <div className="relative pl-6 space-y-6">
                <div className="absolute left-2.5 top-2 bottom-2 w-px bg-white/10" />
                <div className="relative flex items-start gap-3">
                    <div className={`absolute -left-5 w-4 h-4 rounded-full border-2 border-[#0d1117] flex items-center justify-center ${status === 'solved' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}>
                        {status === 'solved' ? <Check size={10} className="text-[#0d1117] stroke-[4]" /> : <div className="w-1.5 h-1.5 bg-[#0d1117] rounded-full" />}
                    </div>
                    <div className="flex-1">
                        <div className="text-[12px] font-medium text-white/90">Resolve Atomic Sync Drift</div>
                        <div className="text-[10px] text-white/40 mt-1">Verification of pull/push cycles across distributed cluster nodes.</div>
                        {status === 'solved' && <div className="mt-2 text-[9px] text-emerald-500 font-mono bg-emerald-500/10 px-2 py-1 rounded inline-block">COMMIT_SUCCESS_ID_482</div>}
                    </div>
                </div>
            </div>
        </div>
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

    const BlockDividerMock = ({ isHovered = false }) => (
        <div ref={dividerRef} className="relative h-10 -my-2 flex items-center justify-center pointer-events-none">
            <div className={`absolute inset-x-8 h-px transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'}`} />
            <div className={`bg-[#0d1117] border border-white/10 text-white/40 rounded-full w-7 h-7 flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100 scale-100 border-emerald-500/50 text-emerald-500 bg-emerald-500/10' : 'opacity-0 scale-90'}`}>
                <Plus size={16} />
            </div>
        </div>
    );

    const AddBlockRowMock = ({ highlightedMenu }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-1 bg-[#0d1117]/90 backdrop-blur-md rounded-full px-2 py-1 border border-white/10 shadow-2xl my-3"
        >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white/40"><Plus size={18} /></div>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <div ref={fileTreeIconRef} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors ${highlightedMenu === 'filetree' ? 'bg-white/10 text-white' : 'text-white/40'}`}><Folder size={12} /><span>tree</span></div>
            <div ref={codeIconRef} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors ${highlightedMenu === 'code' ? 'bg-white/10 text-white' : 'text-white/40'}`}><Code size={12} /><span>code</span></div>
            <div ref={issueTrackerIconRef} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors ${highlightedMenu === 'issue' ? 'bg-white/10 text-white' : 'text-white/40'}`}><AlertCircle size={12} /><span>issue</span></div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium text-white/40"><Type size={12} /><span>text</span></div>
        </motion.div>
    );

    // --- Typing Engine ---
    const typeInto = async (setter, fullText, delayRange = [20, 50]) => {
        for (let i = 0; i <= fullText.length; i++) {
            setter(fullText.slice(0, i));
            await new Promise(r => setTimeout(r, delayRange[0] + Math.random() * (delayRange[1] - delayRange[0])));
            if (i % 8 === 0) cameraX.set(cameraX.get() + (Math.random() - 0.5) * 0.3);
        }
    };

    // --- Timeline Logic ---
    const playTimeline = async () => {
        if (!viewportRef.current) return;

        // RESET
        setBlocks([{ id: 'h1', type: 'heading', content: '' }]);
        setSaveStatus(null);
        setShowAddMenu(null);
        cursorX.set(120); cursorY.set(120); cursorOpacity.set(0);
        cameraScale.set(1); cameraBlur.set(0);

        await new Promise(r => setTimeout(r, 1000));

        // 1. Header Reveal
        animate(cursorOpacity, 1, { duration: 0.5 });
        const hPos = getTargetCoords(headerRef.current);
        animate(cursorX, hPos.x + 10, { duration: 1.5 });
        animate(cursorY, hPos.y, { duration: 1.5 });
        await typeInto((content) => setBlocks([{ id: 'h1', type: 'heading', content }]), "Distributed Intelligent Sync");

        await new Promise(r => setTimeout(r, 500));

        // 2. Add File Tree
        const divPos = getTargetCoords(dividerRef.current);
        await Promise.all([animate(cursorX, divPos.x, { duration: 0.8 }), animate(cursorY, divPos.y, { duration: 0.8 })]);
        setShowAddMenu('filetree');
        await new Promise(r => setTimeout(r, 600));
        const treePos = getTargetCoords(fileTreeIconRef.current);
        await Promise.all([animate(cursorX, treePos.x, { duration: 0.4 }), animate(cursorY, treePos.y, { duration: 0.4 })]);

        setShowAddMenu(null);
        setBlocks(prev => [...prev, { id: 'tree1', type: 'filetree' }]);
        await new Promise(r => setTimeout(r, 800));

        // 3. Add Code Block 
        await Promise.all([animate(cursorX, divPos.x, { duration: 0.6 }), animate(cursorY, divPos.y + 10, { duration: 0.6 })]);
        setShowAddMenu('code');
        await new Promise(r => setTimeout(r, 600));
        const codePos = getTargetCoords(codeIconRef.current);
        await Promise.all([animate(cursorX, codePos.x, { duration: 0.4 }), animate(cursorY, codePos.y, { duration: 0.4 })]);

        setShowAddMenu(null);
        setBlocks(prev => [...prev, { id: 'c1', type: 'code', filePath: 'src/lib/sync.ts', content: '' }]);
        await new Promise(r => setTimeout(r, 800));

        // 4. Typing Sequence
        cameraScale.set(1.2);
        await typeInto(
            (content) => setBlocks(prev => prev.map(b => b.id === 'c1' ? { ...b, content } : b)),
            'const sync = async () => {\n  await vault.push("origin");\n  return { ok: true };\n};',
            [30, 60]
        );
        await new Promise(r => setTimeout(r, 800));

        // 5. Add Issue Tracker
        cameraScale.set(1.1);
        await Promise.all([animate(cursorX, divPos.x, { duration: 0.6 }), animate(cursorY, divPos.y + 20, { duration: 0.6 })]);
        setShowAddMenu('issue');
        await new Promise(r => setTimeout(r, 600));
        const issuePos = getTargetCoords(issueTrackerIconRef.current);
        await Promise.all([animate(cursorX, issuePos.x, { duration: 0.4 }), animate(cursorY, issuePos.y, { duration: 0.4 })]);

        setShowAddMenu(null);
        setBlocks(prev => [...prev, { id: 'i1', type: 'issue', status: 'active' }]);
        await new Promise(r => setTimeout(r, 1000));

        // 6. Resolution Animation
        setBlocks(prev => prev.map(b => b.id === 'i1' ? { ...b, status: 'solved' } : b));
        cameraScale.set(1.3);
        animate(cameraBlur, 8, { duration: 1.5 });
        animate(cursorOpacity, 0, { duration: 0.5 });

        setSaveStatus('saving');
        await new Promise(r => setTimeout(r, 1200));
        setSaveStatus('saved');

        // Loop 
        await new Promise(r => setTimeout(r, 3000));
        animate(cameraBlur, 0, { duration: 2 });
        cameraScale.set(1);
        await new Promise(r => setTimeout(r, 4000));
        if (viewportRef.current) playTimeline();
    };

    useEffect(() => {
        playTimeline();
    }, []);

    const [highlightedMenu, setHighlightedMenu] = useState(null);
    useEffect(() => { setHighlightedMenu(showAddMenu); }, [showAddMenu]);

    return (
        <div ref={viewportRef} className="relative w-full aspect-[16/10] bg-[#02040a] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl font-sans text-white">
            {/* Background */}
            <motion.div className="absolute inset-0 z-0" style={{ filter: useTransform(cameraBlur, (v) => `blur(${v}px)`) }}>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_70%)]" />
                <div className="absolute -inset-20 bg-gradient-to-tr from-emerald-500/10 via-transparent to-blue-500/10 blur-[100px]" animate={{ opacity: [0.3, 0.5, 0.3], rotate: [0, 5, 0] }} transition={{ duration: 10, repeat: Infinity }} />
            </motion.div>

            {/* Viewport */}
            <motion.div
                className="relative w-full h-full p-10 md:p-12 z-10"
                style={{ x: cameraX, y: cameraY, scale: cameraScale, transformOrigin: 'center center' }}
                animate={{ rotateX: [0, 0.4, 0], rotateY: [0, 0.2, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="max-w-4xl mx-auto space-y-2">
                    {blocks.map((block, i) => (
                        <div key={block.id}>
                            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                                {block.type === 'heading' && <div ref={headerRef} className="text-3xl font-bold tracking-tight px-2 py-4 h-16">{block.content}</div>}
                                {block.type === 'filetree' && <FileTreeMock />}
                                {block.type === 'code' && <CodeBlockRaw content={block.content} filePath={block.filePath} />}
                                {block.type === 'issue' && <IssueTrackerMock status={block.status} />}
                            </motion.div>

                            {i < blocks.length - 1 && i === 0 && (
                                <div className="py-2">
                                    <BlockDividerMock isHovered={!!showAddMenu} />
                                    <AnimatePresence>
                                        {showAddMenu && <div className="flex justify-center"><AddBlockRowMock highlightedMenu={highlightedMenu} /></div>}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="pt-8 opacity-[0.03] font-mono text-[9px] tracking-[.4em] text-center uppercase">System_Active_Orchestration</div>
                </div>
            </motion.div>

            {/* Cursor */}
            <motion.div className="absolute z-50 pointer-events-none" style={{ left: useTransform(cursorX, (v) => `${v}%`), top: useTransform(cursorY, (v) => `${v}%`), opacity: cursorOpacity }}>
                <MousePointer2 className="w-6 h-6 fill-white stroke-[3px] drop-shadow-2xl" />
                <motion.div className="absolute -inset-4 bg-white/5 blur-xl rounded-full" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            </motion.div>

            {/* HUD */}
            <AnimatePresence>
                {saveStatus && (
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute bottom-12 right-12 p-5 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] flex items-center gap-4 z-20 shadow-2xl">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                            {saveStatus === 'saving' ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Save className="text-emerald-500 w-5 h-5" /></motion.div> : <Check className="text-emerald-500 w-5 h-5" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-mono text-white/40 uppercase tracking-[.3em]">Snapshot_Sync</span>
                            <span className="font-mono text-white text-xs font-bold leading-tight">{saveStatus === 'saving' ? 'PUSHING_ASSETS' : 'DEPLOY_SUCCESS'}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CinematicDocumentDemo;
