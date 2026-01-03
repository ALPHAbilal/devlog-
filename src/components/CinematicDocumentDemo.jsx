import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Sparkles, Code2, Terminal, Save, Check, MousePointer2 } from 'lucide-react';

/**
 * CinematicDocumentDemo
 * 
 * A high-fidelity demo component that simulates a professionally filmed
 * and edited video of the actual DevLog document page experience.
 * 
 * Features:
 * - Camera Controller (Zoom/Pan)
 * - Animated Cursor & Typing
 * - Focus Shift (Blur/Depth of field)
 * - Premium Infrastructure aesthetic
 */
const CinematicDocumentDemo = () => {
    const [blocks, setBlocks] = useState([]);
    const [cursorPos, setCursorPos] = useState({ x: '50%', y: '50%' });
    const [focusedIndex, setFocusedIndex] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);

    const cameraControls = useAnimation();
    const cursorControls = useAnimation();
    const contentRef = useRef(null);

    // Demo Script
    const playDemo = async () => {
        // 1. Reset
        setBlocks([]);
        setFocusedIndex(null);
        setSaveStatus(null);
        await cameraControls.start({ scale: 1, x: 0, y: 0, filter: 'blur(0px)', transition: { duration: 1 } });

        // 2. Move cursor to center
        await cursorControls.start({ opacity: 1, x: '50%', y: '40%', transition: { duration: 1.5, ease: "easeInOut" } });

        // 3. Zoom in on first block creation
        await Promise.all([
            cameraControls.start({ scale: 1.15, y: 50, transition: { duration: 2, ease: [0.22, 1, 0.36, 1] } }),
            cursorControls.start({ x: '30%', y: '20%', transition: { duration: 1, ease: "easeOut" } })
        ]);

        // 4. Add Heading (Simulated click + appearance)
        setBlocks([{ type: 'heading', content: 'Syncing Multi-Tab State', id: 'h1' }]);
        await new Promise(r => setTimeout(r, 800));

        // 5. Pan down to code block area
        await Promise.all([
            cameraControls.start({ y: -100, scale: 1.25, transition: { duration: 2.5, ease: "easeInOut" } }),
            cursorControls.start({ x: '25%', y: '45%', transition: { duration: 1.2 } })
        ]);

        // 6. Typing animation for Code Block
        setBlocks(prev => [...prev, {
            type: 'code',
            id: 'c1',
            filePath: 'src/shared/lib/sync.ts',
            content: '// Handled cross-tab race conditions'
        }]);

        await new Promise(r => setTimeout(r, 1000));

        setBlocks(prev => prev.map(b => b.id === 'c1' ? {
            ...b,
            content: '// Handled cross-tab race conditions\nwindow.addEventListener("storage", (e) => {\n  if (e.key === "sync-signal") updateState();\n});'
        } : b));

        // 7. Focus shift: Blur background, show "Saved"
        await cameraControls.start({ filter: 'blur(2px)', transition: { duration: 0.8 } });
        setSaveStatus('saving');

        await new Promise(r => setTimeout(r, 1200));
        setSaveStatus('saved');

        // 8. Final clear view & slow zoom out
        await Promise.all([
            cameraControls.start({ filter: 'blur(0px)', scale: 1, x: 0, y: 0, transition: { duration: 2 } }),
            new Promise(r => setTimeout(r, 3000))
        ]);

        // Loop
        playDemo();
    };

    useEffect(() => {
        playDemo();
    }, []);

    return (
        <div className="relative w-full aspect-[16/10] bg-dark-primary rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5">
            {/* Cinematic Camera Layer */}
            <motion.div
                animate={cameraControls}
                className="relative w-full h-full p-8 md:p-12"
            >
                {/* Document Header Mockup */}
                <div className="mb-12 opacity-40">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/30" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/30" />
                            <div className="w-3 h-3 rounded-full bg-green-500/30" />
                        </div>
                        <div className="h-4 w-32 bg-white/10 rounded-full" />
                    </div>
                </div>

                {/* Content Area */}
                <div className="max-w-3xl mx-auto space-y-8">
                    <AnimatePresence>
                        {blocks.map((block, i) => (
                            <motion.div
                                key={block.id}
                                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                className="relative"
                            >
                                {block.type === 'heading' ? (
                                    <h2 className="text-4xl font-bold text-white tracking-tight">
                                        {block.content}
                                        <motion.div
                                            className="h-1 bg-accent-green mt-2 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: '100px' }}
                                            transition={{ duration: 1 }}
                                        />
                                    </h2>
                                ) : (
                                    <div className="relative group">
                                        <div className="absolute -top-3 left-4 px-2 py-1 bg-dark-secondary border border-accent-green/30 rounded text-[10px] font-mono text-accent-green z-10">
                                            {block.filePath}
                                        </div>
                                        <div className="bg-[#010409] border border-white/10 rounded-xl p-6 font-mono text-sm leading-relaxed overflow-hidden">
                                            <pre className="text-emerald-400">
                                                <code>{block.content}</code>
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Cursor Overlay */}
            <motion.div
                animate={cursorControls}
                initial={{ opacity: 0 }}
                className="absolute pointer-events-none z-50 text-white"
                style={{ left: 0, top: 0 }}
            >
                <MousePointer2 className="w-6 h-6 fill-white drop-shadow-xl" />
                <motion.div
                    className="absolute inset-0 bg-white/30 rounded-full blur-xl"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </motion.div>

            {/* Global Status Overlays */}
            <AnimatePresence>
                {saveStatus && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-4 bg-dark-secondary/80 backdrop-blur-xl border border-accent-green/30 rounded-2xl flex items-center gap-4 z-[60]"
                    >
                        {saveStatus === 'saving' ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                <Save className="text-accent-green" />
                            </motion.div>
                        ) : (
                            <Check className="text-accent-green" />
                        )}
                        <span className="font-mono text-sm tracking-widest text-white uppercase">
                            {saveStatus === 'saving' ? 'Syncing Infrastructure...' : 'Knowledge Persisted'}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Decorative Glows */}
            <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent-green/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-accent-blue/10 blur-[120px] rounded-full pointer-events-none" />
        </div>
    );
};

export default CinematicDocumentDemo;
