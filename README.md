# 🧭 Journey Logger - Your Personal Developer Documentation System

> **Transform your learning journey into an interconnected knowledge base**

Journey Logger is a powerful, block-based documentation system designed specifically for developers. It's where you capture code snippets, AI conversations, learning notes, and project insights - all in one beautifully organized, searchable, and interconnected space.

![Journey Logger Demo](demo.png)

## 🌟 What is Journey Logger?

Journey Logger is not just another note-taking app. It's a **living documentation system** that grows with you:

- 📝 **Block-Based Editor** - Create infinite documents with different content types
- 🔗 **Knowledge Graph** - Link documents together with `[[Document Name]]` syntax
- 🤖 **AI Conversation Preservation** - Save and organize ChatGPT/Claude discussions
- ⚡ **Lightning Fast** - Slash commands and markdown shortcuts for rapid documentation
- 🎨 **Developer-First Design** - Dark theme optimized for long coding sessions

## 🚀 Key Features

### 1. **Infinite Block Documents**
Each document is an infinite canvas where you can add different types of blocks:
- **Text Blocks** - With full markdown support and formatting toolbar
- **Code Blocks** - Syntax highlighted with 14+ languages
- **Heading Blocks** - For document structure
- **AI Chat Blocks** - Preserve AI conversations

### 2. **Slash Commands (/)**
Type `/` in any text block to quickly:
- `/text` → Create a text block
- `/code` → Create a code block
- `/h1`, `/h2`, `/h3` → Create headings
- `/ai` → Start an AI conversation block
- Navigate with arrow keys and Enter to select

### 3. **Smart Markdown with Visual Formatting**
Write naturally with markdown that renders in real-time:
- `**bold text**` → **bold text**
- `*italic*` → *italic*
- `` `inline code` `` → `inline code`
- `~~strikethrough~~` → ~~strikethrough~~
- `## Heading` + Enter → Auto-converts to Heading block
- **NEW**: Select text to see floating formatting toolbar
- **NEW**: Keyboard shortcuts:
  - `Ctrl/Cmd + B` → Bold
  - `Ctrl/Cmd + I` → Italic
  - `Ctrl/Cmd + Shift + S` → Strikethrough
  - `Ctrl/Cmd + K` → Create link
  - `Ctrl/Cmd + `` ` → Inline code

### 4. **Enhanced Code Blocks**
Professional code editing experience:
- **Syntax Highlighting** - Powered by Prism with Night Owl theme
- **Line Numbers** - Clean, readable line numbering
- **Auto-resize** - Editor grows with your code
- **Smart Collapse** - Long code blocks (15+ lines) auto-collapse
- **Compact View** - Very large blocks (100+ lines) show summary
- **Fullscreen Mode** - Distraction-free coding
- **14+ Languages** - JS, TS, Python, CSS, HTML, and more
- **Keyboard Shortcuts**:
  - `Tab` → Insert 2 spaces
  - `Escape` → Cancel editing
  - `Ctrl/Cmd + Enter` → Save and exit
  - `Ctrl/Cmd + S` → Save

### 5. **Document Linking & Backlinks**
Build your personal knowledge graph:
- Create links with `[[Document Name]]`
- Automatic backlink tracking
- See all documents that reference the current one
- Click any link to navigate instantly
- Create new documents on-the-fly from links

### 6. **Focus Mode**
**NEW**: Enhanced writing experience:
- Other blocks dim to 40% opacity when editing
- Helps maintain concentration on current content
- Smooth transitions for professional feel
- Click anywhere to exit focus mode

### 7. **Persistent & Searchable**
- Everything saves automatically to localStorage
- Search across all documents, tags, and content
- Never lose a thought or code snippet again

## 🎯 Use Cases

### For Learning
```
Create a document called [[React Hooks Deep Dive]]
Add code examples with syntax highlighting
Link to [[useEffect Patterns]] and [[Custom Hooks]]
Save AI explanations with proper formatting
Build your personal React knowledge base
```

### For Project Documentation
```
Document: [[E-commerce Project]]
- Link to [[API Endpoints]]
- Link to [[Database Schema]]
- Add collapsible code snippets for key functions
- Use focus mode for distraction-free writing
- Track decisions with formatted text
```

### For Problem Solving
```
Document: [[Bug: Authentication Loop]]
- Add error messages as syntax-highlighted code blocks
- Save AI debugging conversations
- Link to [[JWT Implementation]]
- Use the formatting toolbar for emphasis
- Document the solution for future reference
```

## 🛠️ Tech Stack

- **React** - UI framework
- **Vite** - Lightning fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router** - Navigation
- **Lucide Icons** - Beautiful icons
- **Prism React Renderer** - Syntax highlighting
- **LocalStorage** - Data persistence

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/journey-logger.git

# Navigate to project directory
cd journey-logger

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🎨 Design Philosophy

Journey Logger follows these core principles:

1. **Speed First** - Every interaction should be fast. Slash commands, keyboard shortcuts, and instant search.

2. **Block Philosophy** - Everything is a block. This allows infinite flexibility in how you structure your documents.

3. **Connection Over Collection** - Documents should link to each other, creating a web of knowledge rather than isolated notes.

4. **Developer Focused** - Dark theme, code highlighting, markdown support - built by developers, for developers.

5. **Minimal Yet Powerful** - Clean interface that reveals advanced features progressively.

## 🔥 Keyboard Shortcuts

### General
| Shortcut | Action |
|----------|--------|
| `/` | Open command palette |
| `Enter` | Create new block |
| `Escape` | Exit edit mode |
| `[[` | Start document link |

### Text Formatting
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + B` | Bold |
| `Ctrl/Cmd + I` | Italic |
| `Ctrl/Cmd + Shift + S` | Strikethrough |
| `Ctrl/Cmd + K` | Create link |
| `Ctrl/Cmd + `` ` | Inline code |

### Code Blocks
| Shortcut | Action |
|----------|--------|
| `Tab` | Insert 2 spaces |
| `Ctrl/Cmd + Enter` | Save and exit |
| `Ctrl/Cmd + S` | Save |
| `Escape` | Cancel editing |

### Markdown Shortcuts
| Syntax | Result |
|--------|--------|
| `## Heading` + Enter | Converts to Heading block |
| `**text**` | Bold text |
| `*text*` | Italic text |
| `` `code` `` | Inline code |
| `[[Document]]` | Document link |

## 🌈 Recent Updates

### Phase 1: Slash Commands ✅
- Command palette with keyboard navigation
- Quick block creation
- Smart command filtering

### Phase 2: Smart Markdown ✅
- Real-time markdown rendering
- Auto-conversion of headings
- Inline formatting support

### Phase 3: Block Linking & References ✅
- Document linking with [[syntax]]
- Backlinks tracking
- Link navigation

### Phase 4: Enhanced Code Blocks ✅
- Syntax highlighting with Prism
- Line numbers
- Auto-collapse for long code
- Compact view for very large blocks
- Fullscreen editing mode

### Phase 5: Visual Enhancements ✅
- Floating formatting toolbar
- Focus mode for distraction-free writing
- Keyboard shortcuts for formatting

## 🚧 Coming Soon

### Phase 6: Templates
- [ ] Template library
- [ ] Custom templates
- [ ] Quick starts for common patterns

### Future Enhancements
- [ ] Export to Markdown/PDF
- [ ] Cloud sync
- [ ] Collaborative editing
- [ ] More block types (diagrams, tables, embeds)
- [ ] Plugin system
- [ ] Vim keybindings option
- [ ] Theme customization

## 🤝 Contributing

Journey Logger is open source and welcomes contributions! Whether it's:
- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🎨 Design enhancements

Please feel free to submit a PR or open an issue.

## 📄 License

MIT License - feel free to use Journey Logger for your personal or commercial projects.

## 🙏 Acknowledgments

Inspired by tools like Notion, Obsidian, and Roam Research, but built specifically for the developer workflow.

---

**Start your documentation journey today!** 🚀

*Remember: The best documentation is the one you actually write. Journey Logger makes that process enjoyable.*