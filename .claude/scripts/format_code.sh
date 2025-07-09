#!/bin/bash
# format_code.sh - Auto-format code files in journey-log-compass project

echo "🎨 Auto-formatting files in journey-log-compass..."

# Loop through all files that Claude just edited
for file in $CLAUDE_FILE_PATHS; do
    echo "Processing: $file"
    
    case "$file" in
        *.py)
            # Format Python files
            if command -v black &> /dev/null; then
                black "$file"
                echo "✅ Formatted Python file with Black"
            fi
            ;;
        *.js|*.jsx)
            # Format JavaScript files
            if command -v prettier &> /dev/null; then
                prettier --write "$file"
                echo "✅ Formatted JavaScript file with Prettier"
            else
                echo "⚠️  Prettier not installed. Install with: npm install -g prettier"
            fi
            ;;
        *.json)
            # Format JSON files
            if command -v jq &> /dev/null; then
                jq . "$file" > "$file.tmp" && mv "$file.tmp" "$file"
                echo "✅ Formatted JSON file with jq"
            fi
            ;;
        *.css)
            # Format CSS files
            if command -v prettier &> /dev/null; then
                prettier --write "$file"
                echo "✅ Formatted CSS file with Prettier"
            fi
            ;;
    esac
    
    # Log the formatting action
    echo "$(date): Formatted $file" >> .claude/logs/formatting.log
done

echo "✅ journey-log-compass formatting complete!"
