# >_ Devlog - Where Your Developer Journey Becomes Knowledge

> **Not just documentation. A living, breathing extension of your developer mind.**

Devlog transforms the chaos of learning, debugging, and building into an interconnected knowledge system that grows with you. Built on the philosophy that **every line of code, every debugging session, and every "aha!" moment deserves to be captured and connected**.

![Devlog Demo](demo.png)

## 🎨 Brand Identity

### Logo Design
The Devlog logo features a minimalist terminal prompt symbol `>_` that represents:
- **Developer Identity**: The terminal prompt is instantly recognizable to developers
- **Active Development**: The underscore suggests an active cursor, ongoing work
- **Simplicity**: Clean, professional design that scales well

### Logo Specifications
- **Primary Symbol**: `>_` (terminal prompt)
- **Colors**: 
  - Primary: `#10b981` (Accent Green)
  - Background: `#0a1628` (Dark Primary)
  - Secondary: `#1e3a5f` (Dark Secondary)
- **Font**: SF Mono, Monaco, Consolas (monospace)
- **Minimum Size**: 32px x 32px
- **File Formats**: SVG (scalable), PNG (raster)

### Logo Components
The logo is available in three variations:
1. **LogoMinimal**: Clean SVG with just the `>_` symbol
2. **LogoProfessional**: Detailed version with code editor window frame
3. **LogoIcon**: Simple gradient background with typography

### Usage Guidelines
- Always maintain adequate spacing around the logo
- Don't alter the colors or proportions
- Use on dark backgrounds for best visibility
- The logo should link to the dashboard/home when clickable

## 🎯 The Philosophy

We believe documentation should be:
- **Instant** - Capture thoughts as fast as they come
- **Infinite** - No limits on how you structure knowledge
- **Interconnected** - Ideas link naturally, forming your personal knowledge graph
- **Intelligent** - The system adapts to how developers actually think

This isn't about taking notes. It's about building a **second brain** that understands code, preserves context, and connects ideas across time and projects.

## 🌟 What Makes Journey Logger Different

### **Block-Based Philosophy**
Everything is a block. This simple concept unlocks infinite flexibility:
- Start with a thought, expand to code
- Mix documentation with live examples
- Preserve entire debugging sessions
- Structure flows naturally with your thinking

### **Speed-First Design**
- **Slash Commands** - Transform blocks instantly with `/`
- **Smart Markdown** - Write naturally, format automatically
- **Keyboard-First** - Every action optimized for speed
- **Focus Mode** - Dims distractions when you're in the zone
- **Inline Tagging** - Tag important concepts without leaving your flow

### **Built for Real Developer Workflows**
- **Code blocks that understand** - Syntax highlighting, line numbers, collapsible sections
- **AI conversation preservation** - Never lose that perfect ChatGPT explanation
- **Document linking** - Build your knowledge graph with `[[connections]]`
- **Instant search** - Find anything across all your documentation
- **Tables for data** - Compare options, track metrics, organize information

## 🚀 Core Features

### 1. **The Block System**
Each document is an infinite canvas of blocks that can be:

#### **Text Blocks**
- Full markdown support with live preview
- Floating formatting toolbar on selection
- Smart conversions (e.g., `##` → Heading block)
- Document linking with `[[Document Name]]`
- Focus mode for distraction-free writing
- **Tag System** - Select text and assign tags for organization
  - Create custom tags on the fly
  - Choose from existing tags
  - Tagged text syntax: `#tagname[selected text]`
  - Tags are extracted and hidden from content display
  - Visual tag badges appear below text blocks

#### **Code Blocks**
- **Syntax highlighting** for 20+ languages
- **File path tracking** - Connect code to project structure
- **Version tracking** - Track code evolution over time
  - Visual timeline connecting versions
  - "Original" and "v2, v3..." badges
  - One-click navigation between versions
- **Smart collapse** - Long code (15+ lines) auto-collapses
- **Compact view** - Massive code (100+ lines) shows summary
- **Line numbers** with proper alignment
- **Fullscreen mode** for focused coding
- **Auto-resize** editor that grows with content

#### **File Tree Blocks**
- **Visual project structure** - Build your project tree visually
- **Drag & drop** - Move (not copy) files and folders by dragging
- **Click to edit** - Rename items inline
- **Smart detection** - Files have extensions, folders don't
- **Duplicate warnings** - Orange highlighting for same-named items
- **Code block linking** - Connect to code blocks by file path
- **Nested navigation** - Expand/collapse folders
- **Add buttons** - Folder and file buttons at each level
- **Minimalist interface** - No text instructions, purely visual

#### **AI Conversation Blocks**
- **Chat-style interface** with distinct user/AI styling
- **Click-to-edit** any message
- **Copy messages** with one click
- **Collapse long responses** for easier scanning
- Professional typography optimized for readability

#### **Heading Blocks**
- Three levels for document structure
- Auto-conversion from markdown
- Clean, hierarchical organization

#### **Table Blocks**
- **Dynamic tables** - Add/remove rows and columns on the fly
- **Cell editing** - Click to edit with full markdown support
- **Smart navigation** - Tab between cells, Enter for new rows
- **Column alignment** - Per-column text alignment control
- **Row reordering** - Drag and drop to reorganize
- **Export ready** - Copy as Markdown or download as CSV
- **Header toggle** - Optional header row styling
- **Tag support** - Use `#tagname[text]` syntax in cells

### 2. **Navigation & Organization**

#### **Dashboard**
- **Virtualized grid** - Handles thousands of documents smoothly
- **Compact cards** - See more at a glance
- **Smart search** - Find by title, content, or tags
- **Keyboard shortcuts**:
  - `Cmd/Ctrl + K` - Focus search
  - `Cmd/Ctrl + N` - Create new document
  - `/` - Quick search
  - `Escape` - Clear search

#### **Document Management**
- **Drag to reorder** blocks
- **Duplicate blocks** instantly
- **Move blocks** up/down
- **Convert between types** seamlessly
- **Professional controls** that appear on hover

### 3. **Visual Design Philosophy**

#### **Minimalist Yet Powerful**
- **Dark theme** optimized for long coding sessions
- **Subtle animations** that feel responsive, not distracting
- **Smart whitespace** - Centered grids with breathing room
- **Gradient accents** used sparingly for emphasis

#### **Attention to Detail**
- **Slim scrollbars** that fade when not needed
- **Edge fade effects** for infinite scroll illusion
- **Focus indicators** - Green accent bar on active blocks
- **Hover states** that reveal functionality progressively

### 4. **Developer Experience**

#### **Keyboard Shortcuts Everywhere**
- **Text Formatting**: `Cmd/Ctrl + B/I/K`
- **Code Editing**: `Tab` for indent, `Escape` to cancel
- **Navigation**: Arrow keys in command palette
- **Block Management**: `Enter` to add, `Escape` to exit
- **Quick Commands**: `/` for command palette
- **Create Block Types**: `/text`, `/code`, `/table`, `/tree`, `/ai`, `/heading`

#### **Smart Behaviors**
- **Auto-save** everything
- **Link autocomplete** for documents
- **Backlink tracking** automatic
- **Context preservation** between sessions
- **Tag intelligence** - System remembers all tags across documents

## 💡 Use Cases

### **Learning & Exploration**
```
Document: [[React Performance Deep Dive]]
- Add code snippets showing optimization techniques
- Link to [[useMemo Patterns]] and [[React.memo Usage]]
- Preserve ChatGPT explanation about render cycles
- Create tables comparing performance metrics
- Your understanding grows through connections
```

### **Debugging Sessions**
```
Document: [[WebSocket Connection Issues - Dec 2024]]
- Error messages in code blocks
- Step-by-step debugging process
- AI conversation about potential causes
- Link to [[WebSocket Best Practices]]
- Future you will thank present you
```

### **Project Documentation**
```
Document: [[E-Commerce Architecture]]
- System design in heading structure
- Code examples for key components
- Links to [[API Design]], [[Database Schema]]
- Living documentation that evolves with the project
```

### **Knowledge Building**
```
Your personal wiki emerges naturally:
- [[JavaScript Gotchas]] links to [[Closure Explained]]
- [[PostgreSQL Tips]] connects to [[Query Optimization]]
- [[Docker Commands]] references [[Container Best Practices]]
- Tag important concepts: #performance[memoization trick] #gotcha[async behavior]
- Knowledge compounds through connections and tags
```

## 🛠️ Technical Implementation

### **Tech Stack**
- **React 19** - Latest features and optimizations
- **Vite** - Lightning-fast HMR and builds
- **Tailwind CSS** - Utility-first styling
- **Prism React Renderer** - Beautiful syntax highlighting
- **LocalStorage** - Your data stays yours

### **Performance Features**
- **Virtualized lists** for unlimited documents
- **Lazy loading** for optimal initial load
- **Debounced saves** to prevent overwrites
- **Optimistic updates** for instant feedback

### **Architecture Decisions**
- **Local-first** - No servers, no accounts, just you and your knowledge
- **Block-based** - Composable, flexible, extensible
- **Plugin-ready** - Architecture supports future extensions
- **Export-friendly** - Your knowledge is portable

## 🎨 Design Principles

1. **Speed Over Everything**
   - If it slows you down, it's wrong
   - Keyboard shortcuts for everything
   - Instant feedback, no loading states

2. **Progressive Disclosure**
   - Simple by default
   - Power features reveal themselves
   - Nothing overwhelming on first use

3. **Developer Empathy**
   - Built by developers who feel the pain
   - Every feature solves a real problem
   - No feature creep, just focused tools

4. **Beautiful Minimalism**
   - Dark theme that's easy on the eyes
   - Animations that guide, not distract
   - Every pixel has purpose

## 🚧 The Journey Continues

### **Recently Added**

#### **Table Block** (NEW!)
- **Editable tables** with dynamic rows and columns
- **Inline cell editing** - Click any cell to edit
- **Smart navigation** - Tab/Shift+Tab between cells, Enter for new rows
- **Column alignment** - Left, center, right alignment per column
- **Drag & drop rows** - Reorder rows by dragging
- **Header row toggle** - Optional header styling
- **Markdown support** in cells with tag support
- **Export options** - Copy as Markdown table or export to CSV
- **Responsive design** - Horizontal scroll for large tables
- **Visual controls** - Add/remove rows and columns on hover

#### **Landing Page Redesign**
- **Compact header** - Maximized content space (50% height reduction)
- **Professional branding** - New `>_` terminal prompt logo
- **User profile menu** - Account management with settings and sign out
- **Optimized card grid** - 260×160px cards (was 280×180px)
- **Increased density** - 5 columns max (was 4), 16px gaps (was 24px)
- **Refined typography** - Smaller, tighter text for more content visibility
- **Activity sparklines** - Visual contribution graphs on each card
  - 14-day activity visualization
  - Color-coded trends (green up, red down, gray flat)
  - Smooth gradient fills and animations
  - Generated based on document updates and block types

#### **UI/UX Improvements**
- **Speed-first philosophy** - Every element optimized for quick scanning
- **Minimalist approach** - Removed unnecessary taglines and text
- **Professional logo** - Three variations for different use cases
- **Smaller UI elements** - More content visible without scrolling
- **Subtle interactions** - Reduced hover scales and animation durations

#### **Previous Features**
- **Tag System** - Select and tag important text snippets for better organization
  - Tags no longer appear inline with text for cleaner reading
  - Visual tag badges below text blocks
  - Auto-extraction from content using #tagname[text] syntax
  - Tags are hidden in the actual text but displayed as badges
- **File Tree Block** - Visual project structure builder
  - Drag & drop interface for organizing files/folders
  - Click to edit names inline
  - Auto-detection: files have extensions, folders don't
  - Visual indicators for duplicate names (orange highlighting)
  - Links to code blocks with matching file paths
  - Add file/folder buttons at each level
  - Minimalist design with no text instructions
- **Code Block Enhancements**
  - File path field to connect with File Tree blocks
  - Version tracking system for code evolution (with feature flag)
  - Visual timeline connecting code versions
  - "Original" and "v2, v3..." version badges
  - Language selector dropdown fixed (CSS Peeper conflict resolved)
  - Improved syntax highlighting
- **Typography Improvements** - Increased icon and text sizes for better readability
- **Enhanced Navigation** - Back button replaces delete in document view
- **Improved Block Interactions** - Removed juggling movement on hover

### **Coming Next**
- **Templates** - Quick starts for common documentation patterns
- **Plugins** - Extend with your own block types
- **Sync** - Optional cloud backup
- **Collaboration** - Share specific documents
- **Export** - Markdown, PDF, static sites

### **Long-term Vision**
- **AI Integration** - Smart suggestions based on your knowledge
- **Graph Visualization** - See your knowledge connections
- **Advanced Search** - Query your second brain
- **API Access** - Integrate with your tools

## 🤝 Join the Journey

Devlog is open source because we believe great tools are built by communities, not companies.

### **Contribute**
- 🐛 Found a bug? Report it
- ✨ Have an idea? Share it
- 🔧 Want to code? PR welcome
- 📚 Love writing? Improve docs

### **Philosophy**
We're not building another note app. We're crafting a tool that respects how developers think, learn, and build. Every decision is filtered through: "Does this make capturing and connecting knowledge faster and more natural?"

## 📦 Getting Started

```bash
# Clone and enter
git clone https://github.com/yourusername/devlog.git
cd devlog

# Install dependencies
npm install

# Start your journey
npm run dev
```

That's it. No accounts. No setup. Just start documenting.

## 🙏 Acknowledgments

Inspired by tools that shaped us:
- **Notion** - Showed us blocks could be beautiful
- **Obsidian** - Proved knowledge graphs matter
- **Roam Research** - Pioneered bidirectional linking

Built for developers who've felt the pain of:
- Lost code snippets
- Forgotten solutions
- Scattered documentation
- Context switching chaos

---

**Your journey in code deserves to be remembered.**

Start building your second brain with Devlog. Because the best documentation is the one that grows with you.

*Remember: Documentation isn't about the past. It's about empowering your future self.*
