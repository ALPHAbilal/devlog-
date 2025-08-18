# 🚀 Claude-Flow Parameters Master Guide

> **Your complete reference for mastering Claude-Flow commands and making informed decisions about parameter values**

## 📋 Table of Contents
- [Strategy Parameter](#-strategy-parameter)
- [Mode Parameter](#-mode-parameter)
- [Agent Configuration](#-agent-configuration)
- [Execution Parameters](#%EF%B8%8F-execution-parameters)
- [Feature Flags](#-feature-flags)
- [Memory & Neural Parameters](#-memory--neural-parameters)
- [Performance Parameters](#-performance-parameters)
- [Command Templates](#-command-templates)
- [Decision Matrix](#-decision-matrix)

---

## 🎯 Strategy Parameter

**Parameter:** `--strategy <value>`

The strategy determines HOW agents approach your task. Think of it as setting the "mindset" of your AI team.

| Value | When to Use | What It Does | Best For |
|-------|------------|--------------|----------|
| `analysis` | Investigating issues, finding problems | Deep code inspection, metrics gathering | Performance audits, bug hunting, code reviews |
| `development` | Building new features | Full implementation with tests | Creating APIs, adding features, new components |
| `research` | Gathering information | Extensive searching and documentation | Learning codebases, finding best practices |
| `testing` | Creating test suites | Test-first approach, coverage focus | Unit tests, integration tests, E2E tests |
| `refactoring` | Improving existing code | Preserves functionality while improving | Clean code, optimization, restructuring |
| `architecture` | System design | High-level planning and structure | Microservices, database design, scalability |
| `migration` | Moving between technologies | Careful transition planning | Framework upgrades, language ports |
| `optimization` | Performance improvements | Profiling and enhancement | Speed improvements, memory reduction |
| `security` | Security analysis | Vulnerability detection | Security audits, penetration testing |
| `devops` | Infrastructure & deployment | CI/CD, containerization | Docker, Kubernetes, pipelines |
| `auto` | Let AI decide | Analyzes task and picks strategy | General tasks, when unsure |

### 💡 Strategy Examples

```bash
# For finding React performance issues
--strategy analysis

# For implementing a new feature
--strategy development

# For understanding how authentication works
--strategy research

# For improving code quality
--strategy refactoring
```

---

## 🏗️ Mode Parameter

**Parameter:** `--mode <value>`

The mode determines the ORGANIZATION structure of your agent swarm. Think of it as the management style.

| Value | When to Use | Structure | Pros | Cons |
|-------|------------|-----------|------|------|
| `centralized` | Simple tasks, clear requirements | Queen controls all | Fast decisions, consistent | Single point of failure |
| `distributed` | Complex tasks, parallel work | Peer-to-peer | Fault tolerant, scalable | Slower consensus |
| `hierarchical` | Large projects, multiple layers | Multi-level teams | Organized, specialized | More overhead |
| `mesh` | Highly collaborative tasks | Everyone connects to everyone | Maximum collaboration | Resource intensive |
| `adaptive` | Uncertain/changing requirements | Switches based on need | Flexible, optimal | Complex setup |

### 🔍 Mode Decision Guide

```bash
# For quick diagnostics
--mode centralized  # Fast, direct control

# For large feature development
--mode hierarchical  # Organized teams

# For exploration and research
--mode mesh  # Maximum knowledge sharing

# For production systems
--mode distributed  # Fault tolerance

# When requirements might change
--mode adaptive  # Flexibility
```

---

## 🤖 Agent Configuration

### Max Agents
**Parameter:** `--max-agents <number>` (Range: 1-20, Default: 5)

| Agent Count | Use Case | Performance Impact | Cost Impact |
|-------------|----------|-------------------|-------------|
| 1-3 | Simple, focused tasks | Fastest | Lowest |
| 4-6 | Standard features | Balanced | Moderate |
| 7-10 | Complex features | Good parallelism | Higher |
| 11-15 | Large systems | Maximum parallel | High |
| 16-20 | Enterprise projects | Requires management | Highest |

### 📊 Agent Selection Guide

```bash
# Quick bug fix
--max-agents 2

# Feature development
--max-agents 6

# System refactoring
--max-agents 10

# Full application build
--max-agents 15
```

### Agent Types (for hive-mind)
**Parameter:** `--agents <type,type,...>`

Available specialized agents:
- `architect` - System design and planning
- `coder` - Implementation specialist
- `tester` - Quality assurance
- `researcher` - Information gathering
- `security` - Security analysis
- `devops` - Infrastructure and deployment
- `frontend-expert` - UI/UX specialist
- `backend-dev` - Server-side specialist
- `ml-developer` - Machine learning tasks
- `perf-analyzer` - Performance optimization

---

## ⚙️ Execution Parameters

### Timeout
**Parameter:** `--timeout <minutes>` (Default: 60)

| Duration | Best For | Warning |
|----------|----------|---------|
| 15-30 | Quick tasks, bug fixes | May timeout on complex tasks |
| 60 | Standard features | Default, well-balanced |
| 120 | Complex features | Allows thorough analysis |
| 180+ | Full projects | Resource intensive |

### Parallel Execution
**Parameter:** `--parallel <true/false>` (Default: true)

| Value | When to Use | Impact |
|-------|------------|--------|
| `true` | Most tasks (recommended) | 2.8-4.4x faster, uses BatchTool |
| `false` | Sequential dependencies | Slower but predictable order |

---

## 🚩 Feature Flags

### Review Mode
**Parameter:** `--review-mode` or `--review-mode true`

| When Enabled | What Happens | Use For |
|--------------|--------------|---------|
| After implementation | Automatic code review | Production code, critical features |
| Adds ~20% time | Quality assurance pass | Security-sensitive code |

### Testing Mode
**Parameter:** `--testing-mode` or `--testing-mode true`

| When Enabled | What Happens | Use For |
|--------------|--------------|---------|
| During development | Generates tests automatically | TDD approach, critical features |
| Adds ~30% time | Creates unit/integration tests | High-reliability requirements |

### Analysis Mode
**Parameter:** `--analysis-mode` or `--analysis-mode true`

| When Enabled | What Happens | Use For |
|--------------|--------------|---------|
| Before implementation | Deep code analysis | Performance issues, architecture review |
| Enables profiling | Generates detailed metrics | Optimization tasks |

### Verbose Mode
**Parameter:** `--verbose` or `-v`

| When Enabled | What You See | Use For |
|--------------|--------------|---------|
| Always | Detailed execution logs | Debugging, understanding process |
| Real-time updates | Step-by-step progress | Learning, troubleshooting |

### Monitor Mode
**Parameter:** `--monitor`

| When Enabled | What You Get | Use For |
|--------------|--------------|---------|
| During execution | Real-time dashboard | Long-running tasks |
| Performance metrics | Live statistics | Optimization work |

---

## 💾 Memory & Neural Parameters

### Memory Namespace
**Parameter:** `--memory-namespace <name>` or `--namespace <name>`

| Purpose | Example | Benefit |
|---------|---------|---------|
| Isolate project memory | `--namespace auth-system` | Prevents memory conflicts |
| Organize by feature | `--namespace user-management` | Easy context switching |
| Share across sessions | `--namespace shared-knowledge` | Team collaboration |

### Memory Size (hive-mind)
**Parameter:** `--memory-size <MB>` (Default: 100)

| Size | Use Case | Sessions Supported |
|------|----------|-------------------|
| 50 | Quick tasks | 1-2 |
| 100 | Standard features | 3-5 |
| 200 | Complex projects | 5-10 |
| 500+ | Enterprise systems | Many |

### Neural Patterns
**Parameter:** `--neural-patterns enabled`

| When to Enable | Benefit | Cost |
|----------------|---------|------|
| Repetitive tasks | Learns from patterns | +10% processing time |
| Long projects | Improves over time | More memory usage |
| Similar features | Reuses knowledge | Initial training time |

---

## 🚀 Performance Parameters

### Auto-Scale
**Parameter:** `--auto-scale`

| When Enabled | What Happens | Best For |
|--------------|--------------|----------|
| During execution | Adds/removes agents as needed | Variable workloads |
| Based on load | Optimizes resource usage | Large projects |

### Consensus Type (hive-mind)
**Parameter:** `--consensus <type>`

| Type | Speed | Accuracy | Use Case |
|------|-------|----------|----------|
| `majority` | Fast | Good | General tasks |
| `weighted` | Medium | Better | Critical decisions |
| `byzantine` | Slow | Highest | Security-critical |

---

## 📝 Command Templates

### 🔍 Performance Diagnostic Template
```bash
npx claude-flow@alpha swarm "Your diagnostic task" \
  --strategy analysis \
  --mode distributed \
  --max-agents 8 \
  --analysis-mode true \
  --verbose \
  --monitor \
  --memory-namespace perf-analysis \
  --claude
```

### 🏗️ Feature Development Template
```bash
npx claude-flow@alpha swarm "Build your feature" \
  --strategy development \
  --mode hierarchical \
  --max-agents 10 \
  --testing-mode true \
  --review-mode true \
  --parallel true \
  --memory-namespace feature-name \
  --claude
```

### 🔬 Research & Learning Template
```bash
npx claude-flow@alpha swarm "Research topic" \
  --strategy research \
  --mode mesh \
  --max-agents 6 \
  --verbose \
  --memory-namespace research \
  --neural-patterns enabled \
  --claude
```

### 🛠️ Refactoring Template
```bash
npx claude-flow@alpha swarm "Refactor code" \
  --strategy refactoring \
  --mode centralized \
  --max-agents 5 \
  --testing-mode true \
  --review-mode true \
  --claude
```

### 🚨 Security Audit Template
```bash
npx claude-flow@alpha swarm "Security audit" \
  --strategy security \
  --mode distributed \
  --max-agents 12 \
  --analysis-mode true \
  --verbose \
  --timeout 180 \
  --claude
```

---

## 🎯 Decision Matrix

### Quick Decision Guide

| Your Task | Strategy | Mode | Agents | Flags to Enable |
|-----------|----------|------|--------|-----------------|
| Find performance issues | `analysis` | `distributed` | 6-8 | `--analysis-mode --monitor` |
| Add new feature | `development` | `hierarchical` | 5-10 | `--testing-mode --review-mode` |
| Fix bug | `auto` | `centralized` | 2-3 | `--verbose` |
| Refactor module | `refactoring` | `centralized` | 4-6 | `--testing-mode --review-mode` |
| Security audit | `security` | `distributed` | 8-12 | `--analysis-mode --verbose` |
| Learn codebase | `research` | `mesh` | 5-7 | `--verbose --neural-patterns` |
| Build from scratch | `development` | `hierarchical` | 10-15 | `--testing-mode --review-mode --monitor` |
| Optimize performance | `optimization` | `distributed` | 6-10 | `--analysis-mode --monitor` |
| Deploy to production | `devops` | `centralized` | 3-5 | `--review-mode --verbose` |

---

## 💡 Pro Tips

### 1. Start Small, Scale Up
```bash
# Start with
--max-agents 3 --timeout 30

# If needed, increase to
--max-agents 8 --timeout 90
```

### 2. Combine Flags for Power
```bash
# Maximum insight
--analysis-mode --verbose --monitor

# Maximum quality
--testing-mode --review-mode --neural-patterns enabled
```

### 3. Use Memory Namespaces
```bash
# Per feature
--namespace feature-auth
--namespace feature-payments

# Per environment
--namespace dev
--namespace staging
```

### 4. Save Common Configs
Create `claude-flow.config.json`:
```json
{
  "swarm": {
    "defaultStrategy": "analysis",
    "defaultMode": "distributed",
    "maxAgents": 8,
    "analysisMode": true,
    "verbose": true
  }
}
```

---

## 🎓 Learning Path

1. **Start with diagnostics:**
   ```bash
   --strategy analysis --analysis-mode --verbose
   ```

2. **Move to small features:**
   ```bash
   --strategy development --max-agents 5 --testing-mode
   ```

3. **Scale to complex tasks:**
   ```bash
   --mode hierarchical --max-agents 10 --review-mode --monitor
   ```

4. **Master with neural patterns:**
   ```bash
   --neural-patterns enabled --auto-scale --consensus weighted
   ```

---

## 📊 Performance Impact Reference

| Parameter | Speed Impact | Quality Impact | Resource Impact |
|-----------|--------------|----------------|-----------------|
| `--max-agents +5` | +40% faster | +20% better | +50% resources |
| `--parallel true` | 2.8-4.4x faster | Same | +30% memory |
| `--testing-mode` | -30% slower | +50% quality | +20% compute |
| `--review-mode` | -20% slower | +30% quality | +10% compute |
| `--analysis-mode` | -25% slower | +40% insights | +25% compute |
| `--neural-patterns` | -10% initial, +20% over time | +35% accuracy | +30% memory |
| `--verbose` | -5% slower | More insights | Minimal |
| `--monitor` | -3% slower | Real-time data | +10% resources |

---

## 🚀 Your Power Commands

### For React Performance Diagnostics (Your Use Case)
```bash
npx claude-flow@alpha swarm "Diagnose React document editor with blocks performance" \
  --strategy analysis \
  --mode distributed \
  --max-agents 8 \
  --analysis-mode \
  --monitor \
  --verbose \
  --memory-namespace doc-editor-perf \
  --timeout 90 \
  --claude
```

### For Implementing Performance Fixes
```bash
npx claude-flow@alpha swarm "Optimize React document editor performance" \
  --strategy optimization \
  --mode hierarchical \
  --max-agents 10 \
  --testing-mode \
  --review-mode \
  --monitor \
  --neural-patterns enabled \
  --memory-namespace doc-editor-optimization \
  --claude
```

---

## 📚 Remember

- **Strategy** = WHAT approach to take
- **Mode** = HOW to organize agents  
- **Max-agents** = HOW MANY workers
- **Flags** = WHAT FEATURES to enable
- **Memory** = WHERE to store knowledge
- **Always end with** `--claude` for Claude Code integration

---

*Use this guide to craft the perfect Claude-Flow command for any task. Each parameter is a tool in your arsenal - combine them wisely to achieve extraordinary results!*