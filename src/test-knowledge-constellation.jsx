import React from 'react';
import ReactDOM from 'react-dom/client';
import KnowledgeConstellation from './components/HeroBackgroundAnimation/KnowledgeConstellation';
import './styles/hero-knowledge-constellation.css';

// Test wrapper component
function TestKnowledgeConstellation() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative',
      background: '#0a1628',
      overflow: 'hidden'
    }}>
      <KnowledgeConstellation />
      
      {/* Test content overlay */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#ffffff',
          marginBottom: '16px',
          fontFamily: 'Inter, sans-serif'
        }}>
          Devlog
        </h1>
        <p style={{
          fontSize: '20px',
          color: 'rgba(255, 255, 255, 0.8)',
          fontFamily: 'Inter, sans-serif'
        }}>
          Your Second Brain for Code
        </p>
        <p style={{
          fontSize: '16px',
          color: 'rgba(255, 255, 255, 0.6)',
          marginTop: '8px',
          fontFamily: 'Inter, sans-serif'
        }}>
          Never Google The Same Error Twice
        </p>
      </div>
    </div>
  );
}

// Create test mount point
const testRoot = document.createElement('div');
testRoot.id = 'test-knowledge-constellation';
document.body.appendChild(testRoot);

// Clear existing content and mount test
document.getElementById('root').style.display = 'none';
ReactDOM.createRoot(testRoot).render(<TestKnowledgeConstellation />);

console.log('Knowledge Constellation test mounted! Check the animation:');
console.log('- Hover over nodes to see content previews');
console.log('- Click nodes to select them');
console.log('- Click and drag to create temporary connections');
console.log('- Select multiple nodes to create permanent connections');
console.log('- Watch the animation phases: Chaos → Discovery → Organization');