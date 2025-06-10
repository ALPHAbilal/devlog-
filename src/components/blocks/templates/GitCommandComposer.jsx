import React, { useState, useEffect } from 'react';
import { GitBranch, AlertTriangle, Clock, Copy, Check, 
         RotateCcw, GitMerge, GitPullRequest, Hash, 
         FileText, Trash2, Edit3, RefreshCw, GitCommit, Plus } from 'lucide-react';

// Git scenarios with placeholders - defined outside component to avoid recreation
const scenarios = {
  'Stage & Commit': [
    {
      id: 'stage-files',
      name: 'Stage files',
      icon: Plus,
      options: [
        { 
          label: 'Stage specific file', 
          template: 'git add {file}',
          placeholders: [{ key: 'file', label: 'File path', default: '', type: 'file' }],
          safe: true 
        },
        { 
          label: 'Stage all changes', 
          template: 'git add .',
          placeholders: [],
          safe: true 
        },
        { 
          label: 'Stage with patch mode', 
          template: 'git add -p {file}',
          placeholders: [{ key: 'file', label: 'File path (optional)', default: '', type: 'file' }],
          safe: true 
        },
        { 
          label: 'Stage all tracked files', 
          template: 'git add -u',
          placeholders: [],
          safe: true 
        }
      ],
      description: 'Add files to staging area'
    },
    {
      id: 'commit-changes',
      name: 'Commit changes',
      icon: GitCommit,
      options: [
        { 
          label: 'Commit with message', 
          template: 'git commit -m "{message}"',
          placeholders: [{ key: 'message', label: 'Commit message', default: '', type: 'text' }],
          safe: true 
        },
        { 
          label: 'Commit all tracked changes', 
          template: 'git commit -am "{message}"',
          placeholders: [{ key: 'message', label: 'Commit message', default: '', type: 'text' }],
          safe: true 
        },
        { 
          label: 'Commit with detailed message', 
          template: 'git commit -m "{title}" -m "{description}"',
          placeholders: [
            { key: 'title', label: 'Commit title', default: '', type: 'text' },
            { key: 'description', label: 'Detailed description', default: '', type: 'text' }
          ],
          safe: true 
        },
        { 
          label: 'Commit with sign-off', 
          template: 'git commit -s -m "{message}"',
          placeholders: [{ key: 'message', label: 'Commit message', default: '', type: 'text' }],
          safe: true 
        }
      ],
      description: 'Create a new commit'
    },
    {
      id: 'check-status',
      name: 'Check status',
      icon: FileText,
      options: [
        { 
          label: 'Show status', 
          template: 'git status',
          placeholders: [],
          safe: true 
        },
        { 
          label: 'Show short status', 
          template: 'git status -s',
          placeholders: [],
          safe: true 
        },
        { 
          label: 'Show branch info', 
          template: 'git status -b',
          placeholders: [],
          safe: true 
        }
      ],
      description: 'View working tree status'
    },
    {
      id: 'view-changes',
      name: 'View changes',
      icon: GitBranch,
      options: [
        { 
          label: 'Show unstaged changes', 
          template: 'git diff',
          placeholders: [],
          safe: true 
        },
        { 
          label: 'Show staged changes', 
          template: 'git diff --staged',
          placeholders: [],
          safe: true 
        },
        { 
          label: 'Show changes in file', 
          template: 'git diff {file}',
          placeholders: [{ key: 'file', label: 'File path', default: '', type: 'file' }],
          safe: true 
        },
        { 
          label: 'Show word-level changes', 
          template: 'git diff --word-diff',
          placeholders: [],
          safe: true 
        }
      ],
      description: 'Compare file changes'
    }
  ],
  'Undo & Fix': [
    {
      id: 'undo-commit',
      name: 'Undo last commit',
      icon: RotateCcw,
      options: [
        { 
          label: 'Keep changes staged', 
          template: 'git reset --soft HEAD~{n}',
          placeholders: [{ key: 'n', label: 'Number of commits', default: '1', type: 'number' }],
          safe: true 
        },
        { 
          label: 'Keep changes unstaged', 
          template: 'git reset HEAD~{n}',
          placeholders: [{ key: 'n', label: 'Number of commits', default: '1', type: 'number' }],
          safe: true 
        },
        { 
          label: 'Discard changes', 
          template: 'git reset --hard HEAD~{n}',
          placeholders: [{ key: 'n', label: 'Number of commits', default: '1', type: 'number' }],
          safe: false 
        }
      ],
      description: 'Remove commits from history'
    },
    {
      id: 'amend-commit',
      name: 'Fix last commit',
      icon: Edit3,
      options: [
        { 
          label: 'Change commit message', 
          template: 'git commit --amend -m "{message}"',
          placeholders: [{ key: 'message', label: 'New commit message', default: '', type: 'text' }],
          safe: true 
        },
        { 
          label: 'Change author', 
          template: 'git commit --amend --author="{name} <{email}>"',
          placeholders: [
            { key: 'name', label: 'Author name', default: '', type: 'text' },
            { key: 'email', label: 'Author email', default: '', type: 'email' }
          ],
          safe: true 
        }
      ],
      description: 'Modify the most recent commit'
    },
    {
      id: 'unstage',
      name: 'Unstage files',
      icon: FileText,
      options: [
        { 
          label: 'Unstage specific file', 
          template: 'git reset HEAD {file}',
          placeholders: [{ key: 'file', label: 'File path', default: '', type: 'file' }],
          safe: true 
        },
        { 
          label: 'Discard file changes', 
          template: 'git checkout HEAD -- {file}',
          placeholders: [{ key: 'file', label: 'File path', default: '', type: 'file' }],
          safe: false 
        }
      ],
      description: 'Remove files from staging area'
    }
  ],
  'Branches': [
    {
      id: 'switch-branch',
      name: 'Switch branches',
      icon: GitBranch,
      options: [
        { 
          label: 'Create and switch', 
          template: 'git checkout -b {branch-name}',
          placeholders: [{ key: 'branch-name', label: 'New branch name', default: 'feature/', type: 'branch' }],
          safe: true 
        },
        { 
          label: 'Switch to existing', 
          template: 'git checkout {branch-name}',
          placeholders: [{ key: 'branch-name', label: 'Branch name', default: '', type: 'branch' }],
          safe: true 
        },
        { 
          label: 'Create from specific commit', 
          template: 'git checkout -b {branch-name} {commit}',
          placeholders: [
            { key: 'branch-name', label: 'New branch name', default: 'feature/', type: 'branch' },
            { key: 'commit', label: 'Commit hash or tag', default: '', type: 'commit' }
          ],
          safe: true 
        }
      ],
      description: 'Navigate between branches'
    },
    {
      id: 'merge-branch',
      name: 'Merge branches',
      icon: GitMerge,
      options: [
        { 
          label: 'Merge branch into current', 
          template: 'git merge {branch-name}',
          placeholders: [{ key: 'branch-name', label: 'Branch to merge', default: '', type: 'branch' }],
          safe: true 
        },
        { 
          label: 'Merge with custom message', 
          template: 'git merge {branch-name} -m "{message}"',
          placeholders: [
            { key: 'branch-name', label: 'Branch to merge', default: '', type: 'branch' },
            { key: 'message', label: 'Merge commit message', default: '', type: 'text' }
          ],
          safe: true 
        }
      ],
      description: 'Combine branch histories'
    },
    {
      id: 'delete-branch',
      name: 'Delete branch',
      icon: Trash2,
      options: [
        { 
          label: 'Delete local branch', 
          template: 'git branch -d {branch-name}',
          placeholders: [{ key: 'branch-name', label: 'Branch to delete', default: '', type: 'branch' }],
          safe: true 
        },
        { 
          label: 'Delete remote branch', 
          template: 'git push {remote} --delete {branch-name}',
          placeholders: [
            { key: 'remote', label: 'Remote name', default: 'origin', type: 'text' },
            { key: 'branch-name', label: 'Branch to delete', default: '', type: 'branch' }
          ],
          safe: false 
        }
      ],
      description: 'Remove branches'
    }
  ],
  'History': [
    {
      id: 'cherry-pick',
      name: 'Cherry-pick commits',
      icon: Hash,
      options: [
        { 
          label: 'Pick single commit', 
          template: 'git cherry-pick {commit}',
          placeholders: [{ key: 'commit', label: 'Commit hash', default: '', type: 'commit' }],
          safe: true 
        },
        { 
          label: 'Pick commit range', 
          template: 'git cherry-pick {start}..{end}',
          placeholders: [
            { key: 'start', label: 'Start commit (excluded)', default: '', type: 'commit' },
            { key: 'end', label: 'End commit (included)', default: '', type: 'commit' }
          ],
          safe: true 
        }
      ],
      description: 'Apply specific commits'
    },
    {
      id: 'rebase',
      name: 'Rebase branch',
      icon: GitPullRequest,
      options: [
        { 
          label: 'Rebase on branch', 
          template: 'git rebase {branch}',
          placeholders: [{ key: 'branch', label: 'Target branch', default: 'main', type: 'branch' }],
          safe: false 
        },
        { 
          label: 'Interactive rebase', 
          template: 'git rebase -i HEAD~{n}',
          placeholders: [{ key: 'n', label: 'Number of commits', default: '3', type: 'number' }],
          safe: false 
        }
      ],
      description: 'Rewrite branch history'
    }
  ],
  'Remote': [
    {
      id: 'remote-ops',
      name: 'Remote operations',
      icon: GitPullRequest,
      options: [
        { 
          label: 'Add remote', 
          template: 'git remote add {name} {url}',
          placeholders: [
            { key: 'name', label: 'Remote name', default: 'origin', type: 'text' },
            { key: 'url', label: 'Repository URL', default: '', type: 'url' }
          ],
          safe: true 
        },
        { 
          label: 'Push new branch', 
          template: 'git push -u {remote} {branch}',
          placeholders: [
            { key: 'remote', label: 'Remote name', default: 'origin', type: 'text' },
            { key: 'branch', label: 'Branch name', default: '', type: 'branch' }
          ],
          safe: true 
        },
        { 
          label: 'Force push (dangerous)', 
          template: 'git push --force {remote} {branch}',
          placeholders: [
            { key: 'remote', label: 'Remote name', default: 'origin', type: 'text' },
            { key: 'branch', label: 'Branch name', default: '', type: 'branch' }
          ],
          safe: false 
        }
      ],
      description: 'Work with remote repositories'
    }
  ],
  'Stash': [
    {
      id: 'stash-changes',
      name: 'Stash work',
      icon: Clock,
      options: [
        { 
          label: 'Stash with message', 
          template: 'git stash save "{message}"',
          placeholders: [{ key: 'message', label: 'Stash description', default: 'WIP: ', type: 'text' }],
          safe: true 
        },
        { 
          label: 'Apply specific stash', 
          template: 'git stash apply stash@{n}',
          placeholders: [{ key: 'n', label: 'Stash number', default: '0', type: 'number' }],
          safe: true 
        },
        { 
          label: 'Drop specific stash', 
          template: 'git stash drop stash@{n}',
          placeholders: [{ key: 'n', label: 'Stash number', default: '0', type: 'number' }],
          safe: false 
        }
      ],
      description: 'Temporarily save changes'
    }
  ],
  'Clone & Init': [
    {
      id: 'clone-init',
      name: 'Clone & Initialize',
      icon: GitBranch,
      options: [
        { 
          label: 'Clone repository', 
          template: 'git clone {url}',
          placeholders: [{ key: 'url', label: 'Repository URL', default: '', type: 'url' }],
          safe: true 
        },
        { 
          label: 'Clone to specific folder', 
          template: 'git clone {url} {folder}',
          placeholders: [
            { key: 'url', label: 'Repository URL', default: '', type: 'url' },
            { key: 'folder', label: 'Folder name', default: '', type: 'text' }
          ],
          safe: true 
        },
        { 
          label: 'Shallow clone', 
          template: 'git clone --depth {depth} {url}',
          placeholders: [
            { key: 'depth', label: 'History depth', default: '1', type: 'number' },
            { key: 'url', label: 'Repository URL', default: '', type: 'url' }
          ],
          safe: true 
        },
        { 
          label: 'Initialize new repository', 
          template: 'git init',
          placeholders: [],
          safe: true 
        },
        { 
          label: 'Initialize with branch name', 
          template: 'git init -b {branch}',
          placeholders: [{ key: 'branch', label: 'Initial branch name', default: 'main', type: 'branch' }],
          safe: true 
        }
      ],
      description: 'Start a new repository'
    }
  ],
  'View History': [
    {
      id: 'view-history',
      name: 'View History',
      icon: Clock,
      options: [
        { 
          label: 'Show commit log', 
          template: 'git log --oneline -n {n}',
          placeholders: [{ key: 'n', label: 'Number of commits', default: '10', type: 'number' }],
          safe: true 
        },
        { 
          label: 'Show graph log', 
          template: 'git log --graph --pretty=oneline --abbrev-commit -n {n}',
          placeholders: [{ key: 'n', label: 'Number of commits', default: '20', type: 'number' }],
          safe: true 
        },
        { 
          label: 'Show commit details', 
          template: 'git show {commit}',
          placeholders: [{ key: 'commit', label: 'Commit hash', default: 'HEAD', type: 'commit' }],
          safe: true 
        },
        { 
          label: 'Show file history', 
          template: 'git log --follow -p -- {file}',
          placeholders: [{ key: 'file', label: 'File path', default: '', type: 'file' }],
          safe: true 
        },
        { 
          label: 'Compare branches', 
          template: 'git diff {branch1}..{branch2}',
          placeholders: [
            { key: 'branch1', label: 'First branch', default: 'main', type: 'branch' },
            { key: 'branch2', label: 'Second branch', default: 'HEAD', type: 'branch' }
          ],
          safe: true 
        },
        { 
          label: 'Show reflog', 
          template: 'git reflog -n {n}',
          placeholders: [{ key: 'n', label: 'Number of entries', default: '10', type: 'number' }],
          safe: true 
        }
      ],
      description: 'Explore repository history'
    }
  ],
  'Tags': [
    {
      id: 'tags',
      name: 'Tag Management',
      icon: Hash,
      options: [
        { 
          label: 'Create lightweight tag', 
          template: 'git tag {tag-name}',
          placeholders: [{ key: 'tag-name', label: 'Tag name', default: 'v1.0.0', type: 'text' }],
          safe: true 
        },
        { 
          label: 'Create annotated tag', 
          template: 'git tag -a {tag-name} -m "{message}"',
          placeholders: [
            { key: 'tag-name', label: 'Tag name', default: 'v1.0.0', type: 'text' },
            { key: 'message', label: 'Tag message', default: 'Release version 1.0.0', type: 'text' }
          ],
          safe: true 
        },
        { 
          label: 'Tag specific commit', 
          template: 'git tag {tag-name} {commit}',
          placeholders: [
            { key: 'tag-name', label: 'Tag name', default: 'v1.0.0', type: 'text' },
            { key: 'commit', label: 'Commit hash', default: '', type: 'commit' }
          ],
          safe: true 
        },
        { 
          label: 'Push tag to remote', 
          template: 'git push {remote} {tag-name}',
          placeholders: [
            { key: 'remote', label: 'Remote name', default: 'origin', type: 'text' },
            { key: 'tag-name', label: 'Tag name', default: '', type: 'text' }
          ],
          safe: true 
        },
        { 
          label: 'Push all tags', 
          template: 'git push {remote} --tags',
          placeholders: [{ key: 'remote', label: 'Remote name', default: 'origin', type: 'text' }],
          safe: true 
        },
        { 
          label: 'Delete local tag', 
          template: 'git tag -d {tag-name}',
          placeholders: [{ key: 'tag-name', label: 'Tag to delete', default: '', type: 'text' }],
          safe: true 
        },
        { 
          label: 'Delete remote tag', 
          template: 'git push {remote} --delete {tag-name}',
          placeholders: [
            { key: 'remote', label: 'Remote name', default: 'origin', type: 'text' },
            { key: 'tag-name', label: 'Tag to delete', default: '', type: 'text' }
          ],
          safe: false 
        }
      ],
      description: 'Create and manage tags'
    }
  ],
  'Clean & Maintain': [
    {
      id: 'clean-maintain',
      name: 'Clean & Maintain',
      icon: Trash2,
      options: [
        { 
          label: 'Clean untracked files', 
          template: 'git clean -fd',
          placeholders: [],
          safe: false 
        },
        { 
          label: 'Clean with dry run', 
          template: 'git clean -fdn',
          placeholders: [],
          safe: true 
        },
        { 
          label: 'Garbage collection', 
          template: 'git gc --aggressive',
          placeholders: [],
          safe: true 
        },
        { 
          label: 'Prune remote branches', 
          template: 'git remote prune {remote}',
          placeholders: [{ key: 'remote', label: 'Remote name', default: 'origin', type: 'text' }],
          safe: true 
        },
        { 
          label: 'Check repository integrity', 
          template: 'git fsck --full',
          placeholders: [],
          safe: true 
        },
        { 
          label: 'Remove old reflog entries', 
          template: 'git reflog expire --expire={days}.days.ago --all',
          placeholders: [{ key: 'days', label: 'Days to keep', default: '30', type: 'number' }],
          safe: false 
        }
      ],
      description: 'Clean and optimize repository'
    }
  ],
  'Advanced': [
    {
      id: 'advanced',
      name: 'Advanced Operations',
      icon: GitPullRequest,
      options: [
        { 
          label: 'Start bisect', 
          template: 'git bisect start',
          placeholders: [],
          safe: true 
        },
        { 
          label: 'Mark bisect bad/good', 
          template: 'git bisect {state}',
          placeholders: [{ key: 'state', label: 'State (bad/good)', default: 'bad', type: 'text' }],
          safe: true 
        },
        { 
          label: 'Blame file', 
          template: 'git blame {file}',
          placeholders: [{ key: 'file', label: 'File path', default: '', type: 'file' }],
          safe: true 
        },
        { 
          label: 'Blame with line range', 
          template: 'git blame -L {start},{end} {file}',
          placeholders: [
            { key: 'start', label: 'Start line', default: '1', type: 'number' },
            { key: 'end', label: 'End line', default: '10', type: 'number' },
            { key: 'file', label: 'File path', default: '', type: 'file' }
          ],
          safe: true 
        },
        { 
          label: 'Create patch', 
          template: 'git format-patch -n {n} {commit}',
          placeholders: [
            { key: 'n', label: 'Number of commits', default: '1', type: 'number' },
            { key: 'commit', label: 'Starting commit', default: 'HEAD', type: 'commit' }
          ],
          safe: true 
        },
        { 
          label: 'Apply patch', 
          template: 'git apply {patch-file}',
          placeholders: [{ key: 'patch-file', label: 'Patch file path', default: '', type: 'file' }],
          safe: false 
        }
      ],
      description: 'Advanced Git operations'
    }
  ],
  'Submodules': [
    {
      id: 'submodules',
      name: 'Submodules',
      icon: GitMerge,
      options: [
        { 
          label: 'Add submodule', 
          template: 'git submodule add {url} {path}',
          placeholders: [
            { key: 'url', label: 'Submodule URL', default: '', type: 'url' },
            { key: 'path', label: 'Local path', default: '', type: 'text' }
          ],
          safe: true 
        },
        { 
          label: 'Initialize submodules', 
          template: 'git submodule update --init --recursive',
          placeholders: [],
          safe: true 
        },
        { 
          label: 'Update all submodules', 
          template: 'git submodule update --remote',
          placeholders: [],
          safe: true 
        },
        { 
          label: 'Remove submodule', 
          template: 'git submodule deinit -f {path} && git rm -f {path}',
          placeholders: [{ key: 'path', label: 'Submodule path', default: '', type: 'text' }],
          safe: false 
        },
        { 
          label: 'Clone with submodules', 
          template: 'git clone --recurse-submodules {url}',
          placeholders: [{ key: 'url', label: 'Repository URL', default: '', type: 'url' }],
          safe: true 
        }
      ],
      description: 'Manage Git submodules'
    }
  ],
  'Config': [
    {
      id: 'config',
      name: 'Configuration',
      icon: Edit3,
      options: [
        { 
          label: 'Set user name', 
          template: 'git config --global user.name "{name}"',
          placeholders: [{ key: 'name', label: 'Your name', default: '', type: 'text' }],
          safe: true 
        },
        { 
          label: 'Set user email', 
          template: 'git config --global user.email "{email}"',
          placeholders: [{ key: 'email', label: 'Your email', default: '', type: 'email' }],
          safe: true 
        },
        { 
          label: 'Set default branch', 
          template: 'git config --global init.defaultBranch {branch}',
          placeholders: [{ key: 'branch', label: 'Default branch name', default: 'main', type: 'branch' }],
          safe: true 
        },
        { 
          label: 'Set editor', 
          template: 'git config --global core.editor "{editor}"',
          placeholders: [{ key: 'editor', label: 'Editor command', default: 'vim', type: 'text' }],
          safe: true 
        },
        { 
          label: 'Enable color output', 
          template: 'git config --global color.ui auto',
          placeholders: [],
          safe: true 
        },
        { 
          label: 'Set merge tool', 
          template: 'git config --global merge.tool {tool}',
          placeholders: [{ key: 'tool', label: 'Merge tool name', default: 'vimdiff', type: 'text' }],
          safe: true 
        },
        { 
          label: 'List all settings', 
          template: 'git config --list',
          placeholders: [],
          safe: true 
        }
      ],
      description: 'Configure Git settings'
    }
  ]
};

export default function GitCommandComposer({ data, onUpdate }) {
  const [copied, setCopied] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [placeholderValues, setPlaceholderValues] = useState({});
  const [generatedCommand, setGeneratedCommand] = useState('');

  // Initialize data if needed
  const commandHistory = data.history || [];
  const savedPlaceholders = data.savedPlaceholders || {};
  
  // Reconstruct current scenario from saved ID
  let currentScenario = null;
  if (data.currentScenarioId && data.currentScenarioCategory) {
    const categoryScenarios = scenarios[data.currentScenarioCategory];
    if (categoryScenarios) {
      currentScenario = categoryScenarios.find(s => s.id === data.currentScenarioId);
      if (currentScenario) {
        currentScenario = { category: data.currentScenarioCategory, ...currentScenario };
      }
    }
  }

  const selectScenario = (category, scenario) => {
    onUpdate({
      ...data,
      currentScenarioId: scenario.id,
      currentScenarioCategory: category
    });
    setSelectedOption(null);
    setPlaceholderValues({});
    setGeneratedCommand('');
  };

  const selectOption = (option) => {
    setSelectedOption(option);
    
    // Initialize placeholder values with defaults or saved values
    const initialValues = {};
    option.placeholders.forEach(placeholder => {
      const savedValue = savedPlaceholders[`${currentScenario.id}-${option.label}-${placeholder.key}`];
      initialValues[placeholder.key] = savedValue || placeholder.default;
    });
    setPlaceholderValues(initialValues);
    
    // Generate initial command
    generateCommand(option.template, initialValues);
  };

  const updatePlaceholder = (key, value) => {
    const newValues = { ...placeholderValues, [key]: value };
    setPlaceholderValues(newValues);
    generateCommand(selectedOption.template, newValues);
    
    // Save placeholder value for future use
    const placeholderKey = `${currentScenario.id}-${selectedOption.label}-${key}`;
    onUpdate({
      ...data,
      savedPlaceholders: {
        ...savedPlaceholders,
        [placeholderKey]: value
      }
    });
  };

  const generateCommand = (template, values) => {
    let command = template;
    Object.entries(values).forEach(([key, value]) => {
      command = command.replace(`{${key}}`, value);
    });
    setGeneratedCommand(command);
  };

  const executeCommand = () => {
    if (!generatedCommand || generatedCommand.includes('{')) return;
    
    const timestamp = new Date().toISOString();
    const newHistory = [
      {
        command: generatedCommand,
        scenario: currentScenario.name,
        option: selectedOption.label,
        timestamp,
        safe: selectedOption.safe
      },
      ...commandHistory
    ].slice(0, 20);

    onUpdate({
      ...data,
      history: newHistory
    });

    copyToClipboard(generatedCommand);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const clearHistory = () => {
    onUpdate({ ...data, history: [] });
  };

  const clearScenario = () => {
    onUpdate({ 
      ...data, 
      currentScenarioId: null,
      currentScenarioCategory: null 
    });
    setSelectedOption(null);
    setPlaceholderValues({});
    setGeneratedCommand('');
  };

  const getInputType = (type) => {
    switch (type) {
      case 'number': return 'number';
      case 'email': return 'email';
      case 'url': return 'url';
      default: return 'text';
    }
  };

  const getPlaceholderHint = (type) => {
    switch (type) {
      case 'branch': return 'e.g., feature/user-auth';
      case 'file': return 'e.g., src/components/Header.jsx';
      case 'commit': return 'e.g., abc123 or HEAD~2';
      case 'url': return 'e.g., https://github.com/user/repo.git';
      default: return '';
    }
  };

  return (
    <>
      <div className="flex flex-col" style={{ height: '450px' }}>
      {/* Scenario selector */}
      {!currentScenario ? (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 text-text-secondary mb-4 flex-shrink-0">
            <GitBranch size={18} />
            <span className="text-sm font-medium">What do you need to do?</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 minimal-scrollbar relative">
            <div className="space-y-4 pb-2">
              {Object.entries(scenarios).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-xs uppercase tracking-wider text-text-secondary/50 mb-2 sticky top-0 
                                 bg-dark-primary/95 backdrop-blur-sm py-1 -mt-1 z-20">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {items.map((scenario) => {
                      const Icon = scenario.icon;
                      return (
                        <button
                          key={scenario.id}
                          onClick={() => selectScenario(category, scenario)}
                          className="p-3 border border-dark-secondary/50 rounded-lg
                                     hover:border-accent-green/50 hover:bg-dark-secondary/20
                                     transition-all text-left group"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon size={16} className="text-text-secondary group-hover:text-accent-green" />
                            <span className="text-sm font-medium text-text-primary">
                              {scenario.name}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary/70">
                            {scenario.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !selectedOption ? (
        /* Option selector */
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              {currentScenario.icon && <currentScenario.icon size={18} className="text-accent-green" />}
              <span className="text-sm font-medium text-text-primary">
                {currentScenario.name}
              </span>
            </div>
            <button
              onClick={clearScenario}
              className="text-xs text-text-secondary/50 hover:text-text-primary
                         transition-colors"
            >
              ← Back to scenarios
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 minimal-scrollbar">
            <div className="space-y-2 pb-2">
              {currentScenario.options.map((option, index) => (
              <button
                key={index}
                onClick={() => selectOption(option)}
                className={`w-full p-3 border rounded-lg transition-all text-left
                           ${option.safe 
                             ? 'border-dark-secondary/50 hover:border-accent-green/50' 
                             : 'border-red-500/30 hover:border-red-500/50'
                           }
                           hover:bg-dark-secondary/20`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-primary">
                    {option.label}
                  </span>
                  {!option.safe && (
                    <AlertTriangle size={14} className="text-red-500" />
                  )}
                </div>
                <code className="text-xs font-mono text-text-secondary/60 mt-1 block">
                  {option.template}
                </code>
              </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Placeholder form */
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                {currentScenario.icon && <currentScenario.icon size={18} className="text-accent-green" />}
                <span className="text-sm font-medium text-text-primary">
                  {selectedOption.label}
                </span>
              </div>
              <p className="text-xs text-text-secondary/70 mt-1">
                Fill in the values below
              </p>
            </div>
            <button
              onClick={() => setSelectedOption(null)}
              className="text-xs text-text-secondary/50 hover:text-text-primary
                         transition-colors"
            >
              ← Choose different
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 minimal-scrollbar">
            {/* Placeholder inputs */}
            <div className="space-y-3 mb-4">
            {selectedOption.placeholders.map((placeholder) => (
              <div key={placeholder.key}>
                <label className="text-xs text-text-secondary/70 block mb-1">
                  {placeholder.label}
                </label>
                <input
                  type={getInputType(placeholder.type)}
                  value={placeholderValues[placeholder.key] || ''}
                  onChange={(e) => updatePlaceholder(placeholder.key, e.target.value)}
                  placeholder={getPlaceholderHint(placeholder.type)}
                  className="w-full px-3 py-2 bg-dark-primary/30 border border-dark-secondary/50
                             rounded text-sm text-text-primary
                             focus:outline-none focus:ring-1 focus:ring-accent-green/50
                             focus:border-accent-green/50 transition-colors"
                />
              </div>
            ))}
          </div>

          {/* Generated command */}
          <div className={`p-4 rounded-lg border transition-all
                          ${selectedOption.safe 
                            ? 'bg-dark-secondary/20 border-dark-secondary/50' 
                            : 'bg-red-500/5 border-red-500/30'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs text-text-secondary/70 mb-2">Generated command:</p>
                <code className={`text-sm font-mono block
                                 ${generatedCommand.includes('{') 
                                   ? 'text-red-400' 
                                   : 'text-accent-green'}`}>
                  {generatedCommand}
                </code>
                {!selectedOption.safe && (
                  <div className="mt-3 text-xs text-red-400/70">
                    ⚠️ This command can cause data loss. Make sure you have backups.
                  </div>
                )}
              </div>
              
              <button
                onClick={executeCommand}
                disabled={generatedCommand.includes('{')}
                className={`p-2 rounded transition-all
                           ${generatedCommand.includes('{')
                             ? 'text-text-secondary/30 cursor-not-allowed'
                             : 'text-text-secondary/50 hover:text-text-primary hover:bg-dark-primary/50'
                           }`}
                title="Copy and add to history"
              >
                {copied === generatedCommand ? 
                  <Check size={16} className="text-green-500" /> : 
                  <Copy size={16} />
                }
              </button>
            </div>
          </div>

            {/* Recent values hint */}
            {Object.keys(savedPlaceholders).length > 0 && (
              <div className="mt-3 p-2 bg-dark-secondary/10 rounded">
                <p className="text-xs text-text-secondary/50">
                  💡 Your recent values are remembered
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Command history */}
    {commandHistory.length > 0 && (
      <div className="mt-6 border-t border-dark-secondary/30 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-text-secondary/50 uppercase tracking-wider">
              Command History
            </span>
            <button
              onClick={clearHistory}
              className="text-xs text-text-secondary/50 hover:text-red-400
                         transition-colors"
            >
              Clear
            </button>
          </div>
          
          <div className="space-y-1">
            {commandHistory.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded
                           bg-dark-secondary/10 hover:bg-dark-secondary/20
                           transition-colors group"
              >
                <div className="flex-1">
                  <code className="text-xs font-mono text-text-secondary">
                    {item.command}
                  </code>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-secondary/50">
                      {item.scenario} → {item.option}
                    </span>
                    <span className="text-xs text-text-secondary/30">•</span>
                    <span className="text-xs text-text-secondary/30">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => copyToClipboard(item.command)}
                  className="opacity-0 group-hover:opacity-100 p-1
                             text-text-secondary/50 hover:text-text-primary
                             transition-all"
                >
                  <Copy size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}