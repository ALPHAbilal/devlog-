# Storyboard: Cinematic Document Lifecycle

This document defines the narrative flow and "camera script" for the `CinematicDocumentDemo`. The goal is to showcase the platform's ability to bridge architectural planning, code execution, and milestone verification.

---

## 🎭 The Narrative Flow

### Act 1: The Foundation (0s - 3s)
*   **Scene:** A blank, dark canvas with a subtle emerald glow.
*   **Action:** 
    *   The cursor enters from the top-right.
    *   **Header Typing:** The title "Distributed Intelligent Sync" is typed char-by-char with slight camera jitters.
*   **Camera:** Panned slightly up, neutral zoom (1.0x).
*   **Goal:** Establish the document context.

### Act 2: Architectural Mapping (3s - 7s)
*   **Scene:** Moving to the first interaction point.
*   **Action:**
    *   Cursor hops to the **Divider** immediately below the header.
    *   **Add Block Menu** appears.
    *   Cursor selects the **File Tree** icon.
    *   **File Tree Block** manifests, showing the `src/lib/sync.ts` structure.
*   **Camera:** Slow pan down to center the new block.
*   **Goal:** Show that we are working within a real project context.

### Act 3: Implementation (7s - 15s)
*   **Scene:** Diving into the "Work Zone".
*   **Action:**
    *   Cursor hops to the **Divider** below the File Tree.
    *   **Add Block Menu** appears -> Cursor selects **Code**.
    *   A clean, "NightOwl" themed code block appears.
    *   **The Coding Burst:** The `sync` function is typed at high-speed (human-like variability), with camera "keystroke" jitters.
*   **Camera:** Zoom-in to **1.2x**. The camera centers the "Action Point" (where the cursor is typing) to keep it at 40% viewport height.
*   **Goal:** Demonstrate high-fidelity code creation and the "Infrastructure" aesthetic.

### Act 4: Verification & Closure (15s - 22s)
*   **Scene:** The "Commit" and "Verify" phase.
*   **Action:**
    *   Cursor hops to the **Divider** below the Code block.
    *   **Add Block Menu** appears -> Cursor selects **Issue Tracker**.
    *   The **Issue Tracker** appears with a "Milestone: Infrastructure Sync".
    *   **The Resolution:** The active "Sync Drift" issue automatically flips from a red "Active" state to an emerald "Solved" state with a checkmark.
    *   **HUD HUD:** The "Snapshot Sync" and "Deploy Success" indicators appear in the bottom-right.
*   **Camera:** Zoom-out slightly to **1.1x** to frame the whole sequence, then a final fade/blur.
*   **Goal:** Close the loop between code and tracking, proving the "Fix" is captured.

---

## 🛠 Technical Requirements
- **Tracking:** 1:1 Direct Follow (Cursor pins to content).
- **Physics:** Decoupled Jitter (Separate `shakeX/Y` motion values).
- **Fidelity:** Inverse-scaled cursor (0.8x during 1.25x zoom).
