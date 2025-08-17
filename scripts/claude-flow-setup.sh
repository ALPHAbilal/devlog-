#!/bin/bash

# Claude-Flow Setup Script for Devlog Project
# This script automates the setup and initialization of Claude-Flow for the Devlog project

set -e

echo "🚀 Claude-Flow Setup for Devlog Project"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
    
    # Check Node.js version
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2)
        echo -e "${GREEN}✅ Node.js version: v$NODE_VERSION${NC}"
    else
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    # Check npm version
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        echo -e "${GREEN}✅ npm version: $NPM_VERSION${NC}"
    else
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
}

# Initialize Claude-Flow if not already done
init_claude_flow() {
    echo -e "${YELLOW}🔧 Initializing Claude-Flow...${NC}"
    
    if [ ! -d ".claude-flow" ]; then
        npx claude-flow@alpha init --force
        echo -e "${GREEN}✅ Claude-Flow initialized${NC}"
    else
        echo -e "${GREEN}✅ Claude-Flow already initialized${NC}"
    fi
}

# Setup memory namespaces for Devlog
setup_memory_namespaces() {
    echo -e "${YELLOW}💾 Setting up memory namespaces...${NC}"
    
    # Create Devlog-specific namespaces
    npx claude-flow@alpha memory namespace create devlog-content
    npx claude-flow@alpha memory namespace create devlog-code
    npx claude-flow@alpha memory namespace create devlog-ai
    npx claude-flow@alpha memory namespace create devlog-workflow
    
    echo -e "${GREEN}✅ Memory namespaces created${NC}"
}

# Initialize hive-mind for Devlog
init_hive_mind() {
    echo -e "${YELLOW}🐝 Initializing Hive-Mind for Devlog...${NC}"
    
    # Check if hive-mind is already initialized
    if npx claude-flow@alpha hive-mind status 2>/dev/null | grep -q "No active hive"; then
        echo "Initializing new hive-mind session for Devlog development..."
        npx claude-flow@alpha hive-mind spawn "Devlog Development Coordinator" \
            --agents 5 \
            --namespace devlog-main \
            --strategy adaptive
        echo -e "${GREEN}✅ Hive-Mind initialized${NC}"
    else
        echo -e "${GREEN}✅ Hive-Mind already active${NC}"
    fi
}

# Display status and next steps
show_status() {
    echo ""
    echo -e "${GREEN}🎉 Claude-Flow Setup Complete!${NC}"
    echo "======================================="
    echo ""
    echo "📊 Status:"
    npx claude-flow@alpha memory stats
    echo ""
    npx claude-flow@alpha hive-mind status
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Start a swarm for a specific task:"
    echo "   npm run flow:swarm \"Build feature X\" --claude"
    echo ""
    echo "2. Launch the hive-mind wizard:"
    echo "   npm run flow:hive"
    echo ""
    echo "3. Check memory and agent status:"
    echo "   npm run flow:memory"
    echo "   npm run flow:status"
    echo ""
    echo "4. For help with Claude-Flow commands:"
    echo "   npm run flow:help"
    echo ""
    echo "💡 Tips:"
    echo "- Use --claude flag for Claude Code integration"
    echo "- Check .claude/commands/ for detailed documentation"
    echo "- Memory is persisted in .swarm/memory.db"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    init_claude_flow
    setup_memory_namespaces
    init_hive_mind
    show_status
}

# Run main function
main