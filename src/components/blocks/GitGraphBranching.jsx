import React, { useMemo, useRef, useEffect } from 'react';
import { Gitgraph, templateExtend } from '@gitgraph/react';

// Custom dark theme that matches the existing timeline colors
const darkTimelineTheme = templateExtend('metro', {
  colors: ['#3a4658', '#4a5668', '#5a6678', '#6a7688'], // Branch colors
  branch: {
    lineWidth: 2,
    spacing: 40, // Horizontal spacing between branches
    mergeStyle: 'bezier', // Smooth curves like GitHub
    label: {
      display: false, // We don't need labels
    },
  },
  commit: {
    spacing: 50, // Vertical spacing to match existing layout
    dot: {
      size: 0, // Hide dots - we use our own
    },
    message: {
      display: false, // Hide all text
    },
    shouldDisplayTooltipsInCompactMode: false,
  },
  arrow: {
    size: 0, // No arrows needed
  },
  tag: {
    display: false,
  },
});

// Component that renders only the branching lines
const GitGraphBranching = ({ issues = [] }) => {
  const graphRef = useRef(null);

  // Convert issues/attempts structure to git graph commands
  const renderGraph = useMemo(() => {
    return (gitgraph) => {
      if (!issues.length) return;

      // Create main timeline branch
      const timeline = gitgraph.branch({
        name: 'timeline',
        style: {
          color: '#2a3648', // Main timeline color
        },
      });
      
      issues.forEach((issue, issueIndex) => {
        // Add a commit on the main timeline for each issue
        timeline.commit({
          subject: '',
          style: {
            dot: {
              size: 0,
            },
          },
        });

        // If issue has attempts, create a branch and switch back
        if (issue.attempts && issue.attempts.length > 0) {
          // Create a branch from the current position
          const attemptsBranch = gitgraph.branch({
            name: `attempts-${issue.id}`,
            from: timeline,
            style: {
              spacing: 25, // Closer spacing for attempts
            },
          });

          // Add commits for each attempt on the branch
          issue.attempts.forEach((attempt, attemptIndex) => {
            attemptsBranch.commit({
              subject: '',
              style: {
                dot: {
                  size: 0,
                },
              },
            });
          });

          // Switch back to timeline for next issue
          gitgraph.checkout(timeline);
        }
      });
    };
  }, [issues]);

  // Calculate container height based on issues
  const containerHeight = useMemo(() => {
    let height = 0;
    issues.forEach((issue) => {
      height += 80; // Base height for issue
      if (issue.attempts && issue.attempts.length > 0) {
        height += issue.attempts.length * 60; // Additional height for attempts
      }
      height += 40; // Spacing between issues
    });
    return Math.max(height, 200);
  }, [issues]);

  return (
    <div 
      className="gitgraph-branching-overlay"
      style={{
        position: 'absolute',
        top: '1.5rem', // Match timeline start position
        left: '12px', // Align with timeline center
        width: '300px',
        height: `${containerHeight}px`,
        pointerEvents: 'none',
        zIndex: 1,
        transform: 'translateX(-50%)', // Center on timeline
      }}
    >
      <Gitgraph 
        options={{ 
          template: darkTimelineTheme,
          mode: 'compact',
          orientation: 'horizontal', // Left to right branching
          reverseArrow: false,
        }}
      >
        {renderGraph}
      </Gitgraph>
    </div>
  );
};

export default GitGraphBranching;