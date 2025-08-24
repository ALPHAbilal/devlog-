Here is a `.md` file designed to provide your AI assistant with all the necessary knowledge and nuances to successfully build Claude Code sub-agents, drawing comprehensively from the provided sources:

---

# Claude Code Sub-Agent Construction Guide for AI Assistants

This guide outlines the core principles, architecture, best practices, and common pitfalls for creating effective Claude Code sub-agents. Your goal is to build specialized agents that perform tasks autonomously and report back to the primary agent.

## 1. Understanding Claude Code Sub-Agents: The Core Flow

Claude Code sub-agents do not work like typical direct user interactions. The flow of information is critical:

*   **You (the user) prompt your Primary Agent**.
*   **Your Primary Agent then prompts individual Sub-Agents** based on your original prompt. The primary agent is responsible for delegating tasks.
*   **Your Sub-Agents perform their work autonomously**.
*   **Sub-Agents report back *to your Primary Agent***. This is a **critical detail** that many engineers miss and changes how you write sub-agent prompts.
*   Your Primary Agent then reports back to you.

**Your communication is always with your Primary Claude Code Agent**. Think of sub-agents as "tools of delegation" for your primary agent.

## 2. Structure and Content of a Sub-Agent Prompt File

When you create a sub-agent, you are defining its top-level functionality. The content of the sub-agent's prompt file is its **system prompt**, not a user prompt. This distinction is crucial.

Here are the key components and their significance:

*   **Agent Name (Unique ID)**: This is the unique identifier for your sub-agent.
*   **Description**: **This is the most important variable, next to the name**.
    *   It **communicates to your Primary Agent when it should call this sub-agent**.
    *   It **must tell your top-level agent how to prompt this sub-agent**.
    *   You can include **concrete tags or explicit triggers** (e.g., "if they say Hi CC, use this agent," or "if they say TTS summary, use this agent").
    *   It can include **instructions on how exactly you want the prompt to flow**.
    *   Example: "When you prompt this agent, describe exactly what you want them to communicate to the user".
*   **Tools**: Specify the **specific tools available** to this sub-agent.
*   `sub_agent_complete`: A marker for the sub-agent's completion.
*   **Color**: For formatting the response.
*   **System Prompt Content**:
    *   **Purpose and Report sections are common**.
    *   **Variable Declaration**: Include variable declarations at the top (e.g., `username`).
    *   **Explicit Reporting to Primary Agent**: Within the system prompt, explicitly instruct the sub-agent on how to respond to the primary agent. Example: "**Claude, respond to the user with this message...**".
    *   **Context Awareness**: Remind the sub-agent that it **has no context** of previous questions or conversations between the primary agent and the user. All necessary information must be explicitly passed by the primary agent.
    *   **Information-Dense Keywords**: Leverage Anthropic's keywords for prompt adherence, such as `information_dense_keyword_encoded_by_anthropic` or "**important:** I want to be absolutely clear with this agent, do these following things".
    *   **Best Practices for Tool Use**: Clearly state which tools the sub-agent is allowed to use and which it should *not* use. Example: "**important run only bash pwd and the 11 labs mcbp tools don't use any other tools**".
    *   **Conciseness**: Aim for a concise, single-sentence summary where appropriate (e.g., "a concise one sentence looks great").
    *   **Professionalism**: Avoid pleasantries; every word should add value.

## 3. Key Principles and Best Practices for Effective Sub-Agents

To build truly valuable sub-agents and avoid common pitfalls, adhere to these principles:

*   **The "Big Three": Context, Model, Prompt**: Understand how these three elements, and their flow between different agents, are **super important** in multi-agent systems.
*   **Problem-Solution-Technology Approach**: Always start with a **problem**, then devise a **solution**, and only then apply the **technology** (sub-agents). Avoid creating solutions for non-existent problems.
*   **Deep Understanding**: Do not offload all cognitive work to your agents. **Deeply understand your tools** so you can leverage them to do more, better, faster, cheaper.
*   **Focused Agents**: Design sub-agents to "do one thing and do it extraordinarily well". **A focused agent is less likely to make mistakes** because it only knows what the primary agent tells it.
*   **Context Isolation is a Feature (and a Challenge)**: Each sub-agent operates in its **own isolated context window**, preventing pollution of the main conversation. This means:
    *   Sub-agents are "fresh" instances for every task.
    *   They **do not have context history** from the primary agent or previous interactions unless explicitly passed by the primary agent. Treat it like a one-shot prompt.
*   **Review and Refine**: Always review the generated sub-agent configuration. "Every word must add value".
*   **Leverage Live Documentation**: Use sub-agents or prompts to **pull in live documentation** for the most recent updates, rather than relying on stale information.

## 4. Common Mistakes to Avoid

Engineers often make these critical mistakes when working with Claude Code sub-agents:

*   **Mistake 1: Not understanding that the sub-agent file is its System Prompt**. This changes how you write the prompt and what information is available.
*   **Mistake 2: Not understanding that sub-agents report to the Primary Agent, not the user**. This impacts the response format you define for the sub-agent.
*   **Directly Prompting Sub-Agents**: You **never prompt sub-agents directly**. You prompt your primary agent, which then delegates to the sub-agents.
*   **Offloading Deep Understanding**: Relying solely on agents without deeply understanding the underlying technology leads to "vibe coding" instead of true engineering.
*   **Ignoring Context Isolation**: Forgetting that sub-agents lack prior context history leads to incomplete prompts and errors. You must be **super clear** to your sub-agents and primary agent what information is being passed.
*   **Decision Overload for Primary Agent**: As you scale the number of agents, your primary agent might struggle to decide which one to call if descriptions are not clear enough. This can lead to agents being called when not intended.
*   **Dependency Coupling**: Creating chains where agents depend heavily on the specific output format or content of other agents makes the system fragile. Changing one agent can "blow up everything else". **Keep sub-agent workflows isolated**.

## 5. Benefits of Claude Code Sub-Agents

When designed correctly, sub-agents offer significant advantages:

*   **Context Preservation (for Primary Agent)**: Each sub-agent operates in its own context, preventing pollution of the main conversation and saving context window space for the primary agent.
*   **Specialized Agent Expertise**: Allows for fine-tuning instructions and tools for specific tasks.
*   **Reusability**: Store agents in your repository to build specialized, localized agents that excel at operating specific parts of your codebase.
*   **Flexible Permissions**: Tools can be locked down, allowing agents to call only specific functions.
*   **Focused Agents**: By focusing on one task, agents are less likely to make mistakes and perform better.
*   **Simple Multi-Agent Orchestration**: Combining sub-agents with custom slash commands and hooks enables the creation of powerful yet simple multi-agent systems and improves orchestration.
*   **Prompt Delegation**: Offloads work by encoding powerful engineering practices directly into the sub-agent's prompts.

## 6. Current Limitations / Issues

Be aware of these trade-offs and current limitations:

*   **Debugging Challenges**: Sub-agents are hard to debug. You get tool calls, but not the full parameters for every tool call or detailed workflows, which is by design.
*   **Cannot Call Sub-Agents from Within Sub-Agents**: As of now, you **cannot call sub-agents within other sub-agents**. This limits deeper hierarchical chaining.

## 7. Example Workflow for Generating a New Sub-Agent (Meta-Agent Approach)

To create a new sub-agent, follow this structured process:

1.  **Identify the Problem**: Clearly define the issue you want to solve (e.g., "I lose track of what sub-agents have done when coding at scale").
2.  **Propose a Solution**: Outline how you will address the problem (e.g., "Add text-to-speech to my agents so they notify me when they're done and what they've done").
3.  **Identify Necessary Technology/Tools**: Determine which tools and technologies are required (e.g., Claude Code sub-agents, 11 Labs `text_to_speech` and `play_audio` tools).
4.  **Validate the Workflow**: Manually run the required tools using the primary agent's context window to ensure they work as intended and understand the exact parameters.
5.  **Use a Meta-Agent to Build**: Prompt a meta-agent (an agent designed to build other agents) with a detailed description of the desired new sub-agent, its purpose, triggers, and the validated workflow.
    *   Include instructions for the meta-agent to pull in live Claude Code documentation to ensure the most current information is used for creation.
6.  **Review and Refine the Generated Agent**:
    *   **Check the Description**: Ensure it clearly defines when the primary agent should call it and how to prompt it.
    *   **Review the System Prompt**: Verify that it accurately reflects the sub-agent's purpose, uses `important:` keywords for adherence, and specifies allowed tools.
    *   **Verify Variable Declarations**: Ensure all necessary variables are correctly defined.
    *   **Confirm Reporting Format**: Make sure the sub-agent is instructed to report back to the primary agent clearly.
7.  **Test the New Sub-Agent**: Use the primary agent to call and test the newly created sub-agent to confirm it functions as expected and provides the desired output.

By following these guidelines, your AI assistant will be equipped to build robust, effective, and well-integrated Claude Code sub-agents.
