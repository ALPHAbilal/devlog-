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
- **Text Blocks** - With full markdown support
- **Code Blocks** - Syntax highlighted code snippets
- **Heading Blocks** - For document structure
- **AI Chat Blocks** - Preserve AI conversations

### 2. **Slash Commands (/)**
Type `/` in any text block to quickly:
- `/code` → Create a code block
- `/h1` → Create a heading
- `/ai` → Start an AI conversation block
- And more...

### 3. **Smart Markdown**
Write naturally with markdown that renders in real-time:
- `**bold text**` → **bold text**
- `*italic*` → *italic*
- `` `inline code` `` → `inline code`
- `## Heading` + Enter → Auto-converts to Heading block

### 4. **Document Linking & Backlinks**
Build your personal knowledge graph:
- Create links with `[[Document Name]]`
- Automatic backlink tracking
- See all documents that reference the current one
- Navigate your knowledge network effortlessly

### 5. **Persistent & Searchable**
- Everything saves automatically to localStorage
- Search across all documents, tags, and content
- Never lose a thought or code snippet again

## 🎯 Use Cases

### For Learning
```
Create a document called [[React Hooks Deep Dive]]
Add code examples, link to [[useEffect Patterns]]
Save AI explanations about complex concepts
Build your personal React knowledge base
```

### For Project Documentation
```
Document: [[E-commerce Project]]
- Link to [[API Endpoints]]
- Link to [[Database Schema]]
- Add code snippets for key functions
- Track decisions and reasoning
```

### For Problem Solving
```
Document: [[Bug: Authentication Loop]]
- Add error messages as code blocks
- Save AI debugging conversations
- Link to [[JWT Implementation]]
- Document the solution for future reference
```

## 🛠️ Tech Stack

- **React** - UI framework
- **Vite** - Lightning fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router** - Navigation
- **Lucide Icons** - Beautiful icons
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

## 🔥 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Open command palette |
| `Enter` | Create new block |
| `Escape` | Exit edit mode |
| `[[` | Start document link |
| `## ` | Convert to heading |

## 🌈 Coming Soon

- [ ] Templates for common documentation patterns
- [ ] Export to Markdown/PDF
- [ ] Cloud sync
- [ ] Collaborative editing
- [ ] More block types (diagrams, tables, embeds)
- [ ] Plugin system

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
