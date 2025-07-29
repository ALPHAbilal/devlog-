import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const VanishingSolution = () => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const cursorRef = useRef(null);
  const saveIconRef = useRef(null);
  const timelineRef = useRef(null);

  // Code snippets that developers lose
  const lostSolutions = [
    "// That ChatGPT regex that finally worked after 2 hours",
    "// The npm fix from a deleted Stack Overflow answer", 
    "// That perfect async/await pattern from 3am",
    "// The CSS trick that solved the layout bug",
    "// Terminal command that fixed node_modules"
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    const textElement = textRef.current;
    const cursor = cursorRef.current;
    const saveIcon = saveIconRef.current;
    let currentIndex = 0;

    // Create main timeline
    const mainTimeline = gsap.timeline({ repeat: -1 });

    const animateSnippet = (snippet) => {
      const chars = snippet.split('');
      const timeline = gsap.timeline();
      
      // Reset text
      textElement.innerHTML = '';
      
      // 1. Typing animation
      chars.forEach((char, i) => {
        timeline.add(() => {
          textElement.innerHTML += char;
          // Move cursor to end of text
          const rect = textElement.getBoundingClientRect();
          gsap.set(cursor, { 
            left: rect.width + 5,
            opacity: 1 
          });
        }, i * 0.05); // Realistic typing speed
      });

      // 2. Pause to read
      timeline.to({}, { duration: 2 });

      // 3. Random deletion (memory loss)
      // Create array of indices to delete randomly
      const deleteIndices = [];
      for (let i = chars.length - 1; i >= 0; i--) {
        deleteIndices.push(i);
      }
      // Shuffle for random deletion
      deleteIndices.sort(() => Math.random() - 0.5);
      
      // Delete characters randomly, leaving some behind
      deleteIndices.slice(0, Math.floor(chars.length * 0.7)).forEach((index, i) => {
        timeline.add(() => {
          const currentText = textElement.innerHTML.split('');
          if (currentText[index] && currentText[index] !== ' ') {
            currentText[index] = '<span class="eroding">' + currentText[index] + '</span>';
            textElement.innerHTML = currentText.join('');
            
            // Frantic cursor movement
            gsap.to(cursor, {
              x: `random(-20, 20)`,
              y: `random(-5, 5)`,
              duration: 0.1,
              repeat: 1,
              yoyo: true,
              ease: "none"
            });
            
            // Fade out the character
            gsap.to(textElement.querySelector('.eroding:last-child'), {
              opacity: 0,
              filter: 'blur(2px)',
              scale: 0.8,
              duration: 0.3,
              onComplete: function() {
                const currentText = textElement.innerHTML.split('');
                currentText[index] = ' ';
                textElement.innerHTML = currentText.join('');
              }
            });
          }
        }, i * 0.1);
      });

      // 4. Panic phase - cursor blinks rapidly
      timeline.to(cursor, {
        opacity: 0,
        duration: 0.05,
        repeat: 10,
        yoyo: true,
        ease: "none"
      });

      // 5. Devlog saves the day
      timeline.to(saveIcon, {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: "back.out(1.7)",
        onStart: () => {
          gsap.set(saveIcon, { scale: 0, opacity: 0 });
        }
      });

      // 6. Save animation - remaining text crystallizes
      timeline.to(textElement, {
        color: '#00ff88',
        textShadow: '0 0 20px rgba(0, 255, 136, 0.5)',
        duration: 0.3
      });

      // Add save pulse effect
      timeline.to(saveIcon, {
        scale: 1.2,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });

      // 7. Fade out everything
      timeline.to([textElement, cursor, saveIcon], {
        opacity: 0,
        duration: 0.5,
        delay: 1
      });

      return timeline;
    };

    // Build main timeline with all snippets
    lostSolutions.forEach((snippet, index) => {
      mainTimeline.add(animateSnippet(snippet));
    });

    timelineRef.current = mainTimeline;

    // Background of already lost code (very faint)
    const bgFragments = [
      { text: "function solve() {", top: "10%", left: "5%" },
      { text: "return result;", top: "25%", left: "80%" },
      { text: "await Promise.all", top: "70%", left: "15%" },
      { text: "} catch (err) {", top: "85%", left: "70%" },
      { text: "// TODO: fix this", top: "40%", left: "60%" }
    ];

    const bgContainer = document.createElement('div');
    bgContainer.className = 'lost-fragments';
    containerRef.current.appendChild(bgContainer);

    bgFragments.forEach(fragment => {
      const el = document.createElement('div');
      el.className = 'lost-fragment';
      el.textContent = fragment.text;
      el.style.top = fragment.top;
      el.style.left = fragment.left;
      bgContainer.appendChild(el);
      
      // Subtle floating animation
      gsap.to(el, {
        y: "random(-10, 10)",
        x: "random(-5, 5)",
        opacity: "random(0.03, 0.08)",
        duration: "random(4, 6)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: "random(0, 2)"
      });
    });

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="vanishing-solution-container"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 1
      }}
    >
      <div className="animation-stage" style={{
        position: 'relative',
        width: '80%',
        maxWidth: '800px',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div 
          ref={textRef}
          className="code-text"
          style={{
            fontFamily: 'Monaco, Consolas, monospace',
            fontSize: 'clamp(14px, 2vw, 20px)',
            color: 'rgba(255, 255, 255, 0.8)',
            whiteSpace: 'nowrap',
            position: 'relative'
          }}
        />
        <span 
          ref={cursorRef}
          className="cursor"
          style={{
            position: 'absolute',
            width: '2px',
            height: '24px',
            backgroundColor: '#00ff88',
            opacity: 0
          }}
        />
        <div
          ref={saveIconRef}
          className="save-icon"
          style={{
            position: 'absolute',
            right: '-50px',
            width: '40px',
            height: '40px',
            opacity: 0,
            transform: 'scale(0)'
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        </div>
      </div>

      <style>{`
        .vanishing-solution-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .lost-fragments {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .lost-fragment {
          position: absolute;
          font-family: Monaco, Consolas, monospace;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.05);
          white-space: nowrap;
        }

        .eroding {
          display: inline-block;
          transition: all 0.3s ease;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .cursor {
          animation: blink 1s infinite;
        }
      `}</style>
    </div>
  );
};

export default VanishingSolution;