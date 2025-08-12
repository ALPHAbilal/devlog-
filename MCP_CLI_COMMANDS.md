# MCP CLI Commands Reference

## Supabase MCP Server Setup Commands

### Option 1: Using add-json
```bash
claude mcp add-json supabase '{
    "command": "wsl",
    "args": [
        "npx",
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=zqcjipwiznesnbgbocnu"
    ],
    "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_c308d30229f8b3bce9b985c759b6666f23251a0a"
    }
}'
```

### Option 2: Direct add command
```bash
claude mcp add supabase -s local -e SUPABASE_ACCESS_TOKEN=sbp_c308d30229f8b3bce9b985c759b6666f23251a0a -- npx -y @supabase/mcp-server-supabase@latest
```

## Devlog MCP Server Setup

```bash
claude mcp add devlog -s user -e DEVLOG_API_KEY="dvlg_sk_prod_ab636fcc8dbd1d42771fc85d0af38bcd05b745742fd67ae1227c48ad7a74c7ba" -- npx -y devlog-mcp
```