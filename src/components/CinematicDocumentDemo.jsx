import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Copy, Check, MousePointer2, Save, Code, FileText, ChevronDown } from 'lucide-react';

/**
 * CinematicDocumentDemo - High-Fidelity 1:1 Reconstruction
 * 
 * Recreates the exact DevLog document page experience as a "filmed" cinematic demo.
 * Uses 1:1 block layouts (Heading, Code, Text) and a refined Motion interaction engine.
 */
const CinematicDocumentDemo = () => {
    const [blocks, setBlocks] = useState([]);
    const [saveStatus, setSaveStatus] = useState(null);

    const cameraControls = useAnimation();
    const cursorControls = useAnimation();

    // 1:1 Block UI Components (Mocked for Demo)
    const BlockWrapper = ({ children, isFocused = true, type }) => (
        <div className={`group block-wrapper relative transition-all duration-300 mb-8 ${isFocused ? 'opacity-100' : 'opacity-40'}`}>
            {children}
        </div>
    );

    const HeadingBlockRaw = ({ content, level = 2 }) => {
        const headingClasses = {
            1: 'text-3xl font-bold',
            2: 'text-2xl font-semibold',
            3: 'text-xl font-medium',
        };
        return (
            <div className={`text-text-primary ${headingClasses[level]} px-2 py-1`}>
                {content}
            </div>
        );
    };

    const CodeBlockRaw = ({ content, language = 'javascript', filePath }) => {
        const lines = content.split('\n');
        return (
            <div className="group relative overflow-visible pt-4">
                {filePath && (
                    <div className="absolute -top-3 left-0 text-[10px] text-accent-green/80 
                          bg-dark-primary px-2 py-1 rounded-t font-mono z-30
                          border border-accent-green/30 border-b-0">
                        {filePath}
                    </div>
                )}
                <div className="absolute top-2 right-2 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-[10px] text-text-secondary bg-dark-primary/80 px-2 py-1 rounded">{language}</div>
                    <Copy size={14} className="text-text-secondary" />
                </div>
                <div className="bg-[#01060b] border border-white/5 rounded-lg overflow-hidden ring-1 ring-white/5 shadow-2xl">
                    <div className="flex">
                        {/* Line Numbers */}
                        <div className="select-none text-text-secondary/30 text-[11px] font-mono p-4 pr-3 text-right border-r border-[#161b22]">
                            {lines.map((_, i) => (
                                <div key={i} className="leading-6">{i + 1}</div>
                            ))}
                        </div>
                        {/* Code Content (Refined nightOwl theme colors) */}
                        <pre className="flex-1 p-4 pl-4 overflow-x-auto text-sm leading-6 font-mono">
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

    // Demo Choreography Timeline
    const playDemo = async () => {
        // 1. Reset State
        setBlocks([]);
        setSaveStatus(null);
        await cameraControls.start({ scale: 1, x: 0, y: 0, filter: 'blur(0px)', transition: { duration: 0.5 } });
        await cursorControls.start({ opacity: 0, x: '80%', y: '80%', transition: { duration: 0 } });

        // 2. Introduction: Cursor slides in to the "Master View"
        await new Promise(r => setTimeout(r, 800));
        await cursorControls.start({ opacity: 1, x: '40%', y: '25%', transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } });

        // 3. Action: Create Heading Block
        setBlocks([{ id: 'h1', type: 'heading', level: 1, content: 'Reactive Sync Manager' }]);

        // 4. Zoom & Follow: Camera tightens on the action
        await Promise.all([
            cameraControls.start({ scale: 1.1, y: 80, transition: { duration: 2, ease: "easeInOut" } }),
            cursorControls.start({ x: '35%', y: '45%', transition: { duration: 1.5 } })
        ]);

        // 5. Typing Simulation: Code block appears
        setBlocks(prev => [...prev, {
            id: 'c1',
            type: 'code',
            filePath: 'src/shared/sync.ts',
            language: 'typescript',
            content: '// Stabilizing multi-tab state'
        }]);

        await new Promise(r => setTimeout(r, 1000));

        // Multi-step typing for realism
        const fullCode = '// Stabilizing multi-tab state\nwindow.addEventListener("storage", (e) => {\n  if (e.key === "sync") update();\n});';
        setBlocks(prev => prev.map(b => b.id === 'c1' ? { ...b, content: fullCode } : b));

        // 6. Focus Shift: The "Edit" is finished, infrastructure captures it
        await new Promise(r => setTimeout(r, 1200));
        await cameraControls.start({ filter: 'blur(3px)', scale: 1.05, transition: { duration: 1 } });

        setSaveStatus('saving');
        await new Promise(r => setTimeout(r, 1000));
        setSaveStatus('saved');

        // 7. Conclusion: Wide shot of the knowledge base
        await new Promise(r => setTimeout(r, 2000));
        await Promise.all([
            cameraControls.start({ filter: 'blur(0px)', scale: 1, x: 0, y: 0, transition: { duration: 2.5, ease: [0.22, 1, 0.36, 1] } }),
            cursorControls.start({ opacity: 0, x: '90%', transition: { duration: 1 } })
        ]);

        // Loop with longer pause
        await new Promise(r => setTimeout(r, 5000));
        playDemo();
    };

    useEffect(() => {
        playDemo();
    }, []);

    return (
        <div className="relative w-full aspect-[16/10] bg-[#0d1117] rounded-3xl overflow-hidden shadow-2xl border border-white/5">
            {/* System Gradient Backdrop */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.05)_0%,transparent_50%)]" />

            {/* Cinematic Perspective Container */}
            <motion.div
                animate={cameraControls}
                className="relative w-full h-full p-12 md:p-20"
                style={{ transformOrigin: 'center center' }}
            >
                {/* Actual App Layout Mockup (Top Bar) */}
                <div className="mb-16 flex items-center justify-between opacity-30 select-none">
                    <div className="flex items-center gap-6">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                        </div>
                        <div className="h-px w-24 bg-white/20" />
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest uppercase">
                        <span>Entry #842</span>
                        <div className="w-px h-3 bg-white/20" />
                        <span>Infrastructure_V3</span>
                    </div>
                </div>

                {/* 1:1 Block Document Content */}
                <div className="max-w-4xl mx-auto">
                    <AnimatePresence>
                        {blocks.map((block) => (
                            <motion.div
                                key={block.id}
                                initial={{ opacity: 0, x: -10, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, filter: 'blur(5px)' }}
                                transition={{ duration: 0.6 }}
                            >
                                <BlockWrapper type={block.type}>
                                    {block.type === 'heading' ? (
                                        <HeadingBlockRaw content={block.content} level={block.level} />
                                    ) : (
                                        <CodeBlockRaw
                                            content={block.content}
                                            language={block.language}
                                            filePath={block.filePath}
                                        />
                                    )}
                                </BlockWrapper>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Add Block Placeholder (Fidelity) */}
                    <div className="mt-8 h-10 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center opacity-20 group hover:opacity-100 transition-opacity cursor-pointer">
                        <div className="flex items-center gap-2 text-xs font-mono">
                            <div className="w-4 h-4 bg-white/10 rounded flex items-center justify-center">+</div>
                            <span>Click to add block...</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Cinematic OS Cursor */}
            <motion.div
                animate={cursorControls}
                className="absolute pointer-events-none z-[100] text-white"
                style={{ left: 0, top: 0 }}
            >
                <MousePointer2 className="w-5 h-5 fill-white stroke-[3px] drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
                {/* Subtle click interaction ring */}
                <motion.div
                    className="absolute -inset-2 border border-white/20 rounded-full"
                    animate={{ scale: [1, 1.8, 1], opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                />
            </motion.div>

            {/* Infrastructure Alert Overlays */}
            <AnimatePresence>
                {saveStatus && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute bottom-12 right-12 px-6 py-4 bg-[#0a0f16]/90 backdrop-blur-3xl border border-accent-green/30 rounded-2xl flex items-center gap-4 z-[110] shadow-[0_0_50px_rgba(16,185,129,0.15)]"
                    >
                        <div className="relative w-8 h-8 flex items-center justify-center">
                            {saveStatus === 'saving' ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-2 border-accent-green/20 border-t-accent-green rounded-full"
                                />
                            ) : (
                                <Check className="text-accent-green w-6 h-6" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-accent-green/60 uppercase tracking-tighter">System Output</span>
                            <span className="font-mono text-sm font-semibold text-white">
                                {saveStatus === 'saving' ? 'Processing Knowledge...' : 'Infrastructure Updated'}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Subtle Noise/Film Grain Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    );
};

export default CinematicDocumentDemo;
