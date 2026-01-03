import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Copy, Check, MousePointer2, Save, Code, FileText, ChevronDown } from 'lucide-react';

/**
 * CinematicDocumentDemo - Refined Animation Engine
 * 
 * High-fidelity 1:1 reconstruction with synchronized parallel choreography.
 * Features:
 * - Dynamic Follow: Camera tracks cursor area in parallel.
 * - Spring Physics: Natural cursor momentum and overshoot.
 * - Off-screen Entrance: Prevents initial focus jumps.
 * - Refined Typography/Fidelity.
 */
const CinematicDocumentDemo = () => {
    const [blocks, setBlocks] = useState([]);
    const [saveStatus, setSaveStatus] = useState(null);
    const [typedContent, setTypedContent] = useState("");

    const cameraControls = useAnimation();
    const cursorControls = useAnimation();

    // 1:1 Block UI Components (High-Fidelity Mocks)
    const BlockWrapper = ({ children, isFocused = true }) => (
        <div className={`group block-wrapper relative transition-all duration-500 mb-10 ${isFocused ? 'opacity-100' : 'opacity-30'}`}>
            {children}
        </div>
    );

    const HeadingBlockRaw = ({ content, level = 1 }) => (
        <div className={`text-text-primary px-2 py-1 tracking-tight font-bold ${level === 1 ? 'text-3xl' : 'text-2xl'}`}>
            {content}
        </div>
    );

    const CodeBlockRaw = ({ content, language = 'javascript', filePath }) => {
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

    const playDemo = async () => {
        // RESET: Clear state and move cursor/camera to start (off-screen)
        setBlocks([]);
        setSaveStatus(null);
        setTypedContent("");

        // Initial hidden state
        cursorControls.set({ opacity: 0, x: '120%', y: '120%' });
        cameraControls.set({ scale: 1, x: 0, y: 0, filter: 'blur(0px)' });

        await new Promise(r => setTimeout(r, 1000));

        // STEP 1: Parallel Entrance
        // Camera starts leaning as cursor enters smoothly
        await Promise.all([
            cursorControls.start({
                opacity: 1, x: '45%', y: '20%',
                transition: { type: 'spring', stiffness: 40, damping: 15 }
            }),
            cameraControls.start({
                x: -20, y: 30, scale: 1.05,
                transition: { duration: 1.5, ease: [0.22, 1, 0.36, 1] }
            })
        ]);

        // STEP 2: Heading Action
        setBlocks([{ id: 'h1', type: 'heading', content: 'Syncing Distributed State' }]);

        // STEP 3: Dynamic Follow to Code Block Position
        await Promise.all([
            cursorControls.start({
                x: '30%', y: '55%',
                transition: { type: 'spring', stiffness: 60, damping: 18 }
            }),
            cameraControls.start({
                y: -120, x: 20, scale: 1.15,
                transition: { duration: 2, ease: [0.22, 1, 0.36, 1] }
            })
        ]);

        // STEP 4: Code Block Appearance & Follow-Typing
        setBlocks(prev => [...prev, {
            id: 'c1', type: 'code', filePath: 'src/lib/sync.ts', language: 'typescript',
            content: '// Signal start'
        }]);

        await new Promise(r => setTimeout(r, 800));

        // Refined Typing Sequence
        const contentParts = [
            '// Signal start\nwindow.',
            '// Signal start\nwindow.addEventListener',
            '// Signal start\nwindow.addEventListener("storage", (e)',
            '// Signal start\nwindow.addEventListener("storage", (e) => {\n  if (e.key === "sync") refresh();\n});'
        ];

        for (const part of contentParts) {
            setBlocks(prev => prev.map(b => b.id === 'c1' ? { ...b, content: part } : b));
            // Subtle camera "jitter" or lean during typing follow
            cameraControls.start({ x: 25, transition: { duration: 0.2 } });
            await new Promise(r => setTimeout(r, 400));
        }

        // STEP 5: Infrastructure "Capture" - Cinematic Focus
        await cursorControls.start({ x: '110%', opacity: 0, transition: { duration: 0.8 } });

        await cameraControls.start({
            filter: 'blur(5px)', scale: 1.2,
            transition: { duration: 1.2, ease: "easeInOut" }
        });

        setSaveStatus('saving');
        await new Promise(r => setTimeout(r, 1200));
        setSaveStatus('saved');

        // STEP 6: Final Resolution & Pull back
        await new Promise(r => setTimeout(r, 2000));
        await cameraControls.start({
            filter: 'blur(0px)', scale: 1, x: 0, y: 0,
            transition: { duration: 2.5, ease: [0.22, 1, 0.36, 1] }
        });

        // Loop
        await new Promise(r => setTimeout(r, 4000));
        playDemo();
    };

    useEffect(() => {
        playDemo();
    }, []);

    return (
        <div className="relative w-full aspect-[16/10] bg-[#020617] rounded-[2rem] overflow-hidden border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            {/* Infrastructure Texture */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5" />

            {/* Synchronized Viewport */}
            <motion.div
                animate={cameraControls}
                className="relative w-full h-full p-16 md:p-24"
                style={{ transformOrigin: 'center center' }}
            >
                {/* Mock Top Bar Persistence */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-8 opacity-20 pointer-events-none">
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-white/20" />)}
                    </div>
                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    <div className="font-mono text-[9px] uppercase tracking-[0.3em]">Runtime: Knowledge_Node_04</div>
                </div>

                {/* 1:1 Content Frame */}
                <div className="max-w-4xl mx-auto space-y-2">
                    <AnimatePresence>
                        {blocks.map((block) => (
                            <motion.div
                                key={block.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
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
                    <div className="pt-8 opacity-[0.08] pointer-events-none">
                        <div className="border border-dashed border-white/30 rounded-2xl h-14 flex items-center justify-center font-mono text-xs uppercase tracking-widest gap-3">
                            <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center">+</div>
                            Initialize Block_Sequence
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Synchronized Cursor Layer */}
            <motion.div
                animate={cursorControls}
                className="absolute z-[100] drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] pointer-events-none"
                style={{ left: 0, top: 0 }}
            >
                <MousePointer2 className="w-6 h-6 fill-white stroke-[3.5px] text-white" />
                <motion.div
                    className="absolute -inset-4 bg-white/10 blur-2xl rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </motion.div>

            {/* Global Status HUD */}
            <AnimatePresence>
                {saveStatus && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute bottom-16 right-16 p-6 bg-black/80 backdrop-blur-3xl border border-accent-green/30 rounded-[2rem] flex items-center gap-5 z-[120] shadow-2xl"
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${saveStatus === 'saving' ? 'border-accent-green/20' : 'border-accent-green'}`}>
                            {saveStatus === 'saving' ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                    <Save className="text-accent-green w-6 h-6" />
                                </motion.div>
                            ) : (
                                <Check className="text-accent-green w-6 h-6" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-accent-green/50 uppercase tracking-[0.2em] mb-1">Vault Status</span>
                            <span className="font-mono text-white font-bold">
                                {saveStatus === 'saving' ? 'ENCRYPTING_PAYLOAD' : 'SEQUENCE_STABILIZED'}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CinematicDocumentDemo;
