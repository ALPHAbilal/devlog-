#!/usr/bin/env python3
import json
import sys
import subprocess
import re

try:
    input_data = json.loads(sys.stdin.read())
except json.JSONDecodeError as e:
    print(f"Error: {e}")
    sys.exit(1)

tool_input = input_data.get("tool_input", {})
file_path = tool_input.get("file_path", "")

# Check if the file is a TypeScript file
if re.search(r"\.(ts|tsx)$", file_path):
    try:
        result = subprocess.run(
            [
                "npx",
                "tsc",
                "--noEmit",
                "--skipLibCheck",
                file_path
            ],
            check=True,
            capture_output=True,
            text=True,
            cwd="."
        )
        print(f"✅ TypeScript check passed for {file_path}")
    except subprocess.CalledProcessError as e:
        print(f"⚠️ TypeScript errors detected in {file_path} - please review", file=sys.stderr)
        if e.stdout:
            print(e.stdout, file=sys.stderr)
        if e.stderr:
            print(e.stderr, file=sys.stderr)
        # Exit with code 2 to indicate validation failure (blocks the operation)
        sys.exit(2)
    except FileNotFoundError:
        print("⚠️ TypeScript not found. Install with: npm install -g typescript", file=sys.stderr)
        sys.exit(0)  # Don't block if TypeScript isn't available

sys.exit(0)