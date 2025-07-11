PS C:\Users\User004\Desktop\ma\devlog-> git stash
Saved working directory and index state WIP on main: 6351b7e fix: resolve merge conflicts by accepting feature branch deletions
PS C:\Users\User004\Desktop\ma\devlog-> git checkout feature/optimization-enhancements
Switched to branch 'feature/optimization-enhancements'
Your branch is up to date with 'origin/feature/optimization-enhancements'.
Successfully rebased and updated refs/heads/feature/optimization-enhancements.
PS C:\Users\User004\Desktop\ma\devlog-> git push --force-with-lease origin feature/optimization-enhancements
Enumerating objects: 14, done.
Delta compression using up to 12 threads
Compressing objects: 100% (5/5), done.
Writing objects: 100% (6/6), 840 bytes | 840.00 KiB/s, done.
Total 6 (delta 4), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (4/4), completed with 4 local objects.
To https://github.com/ALPHAbilal/devlog-.git
   c1afeda..6351b7e  feature/optimization-enhancements -> feature/optimization-enhancements
PS C:\Users\User004\Desktop\ma\devlog-> git checkout main
Switched to branch 'main'
Your branch is ahead of 'origin/main' by 2 commits.
  (use "git push" to publish your local commits)
PS C:\Users\User004\Desktop\ma\devlog-> git stash pop
On branch main
Your branch is ahead of 'origin/main' by 2 commits.
  (use "git push" to publish your local commits)

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   current_logs.md

no changes added to commit (use "git add" and/or "git commit -a")
Dropped refs/stash@{0} (25468fc88867b546db7f4787e010e650f10dd945)
PS C:\Users\User004\Desktop\ma\devlog->