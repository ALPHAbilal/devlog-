# Playwright MCP Complete Function Guide

## Overview
Playwright MCP is a browser automation tool that allows you to control web browsers programmatically. It's perfect for web scraping, automated testing, and browser-based automation tasks.

## 1. Navigation Functions

### `mcp__playwright__browser_navigate`
Navigate to a specific URL.
```javascript
// Parameters:
{
  "url": "https://example.com"  // Required: The URL to navigate to
}

// Use cases:
- Opening websites for scraping
- Starting automated tests
- Navigating to specific pages
```

### `mcp__playwright__browser_navigate_back`
Go back to the previous page in browser history.
```javascript
// No parameters required

// Use cases:
- Testing browser back button functionality
- Returning to previous state during automation
- Simulating user navigation patterns
```

### `mcp__playwright__browser_navigate_forward`
Go forward to the next page in browser history.
```javascript
// No parameters required

// Use cases:
- Testing browser forward button functionality
- Navigating through multi-step workflows
```

## 2. Browser Control Functions

### `mcp__playwright__browser_close`
Close the current page/browser.
```javascript
// No parameters required

// Use cases:
- Cleanup after automation tasks
- Freeing resources
- Ending test sessions
```

### `mcp__playwright__browser_resize`
Resize the browser window to specific dimensions.
```javascript
// Parameters:
{
  "width": 1920,   // Required: Width in pixels
  "height": 1080   // Required: Height in pixels
}

// Use cases:
- Testing responsive designs
- Taking screenshots at specific resolutions
- Simulating different device viewports
```

### `mcp__playwright__browser_install`
Install the browser if it's not already installed.
```javascript
// No parameters required

// Use cases:
- Setting up testing environment
- First-time setup
- Recovering from missing browser errors
```

## 3. Page Interaction Functions

### `mcp__playwright__browser_click`
Click on elements on the page.
```javascript
// Parameters:
{
  "element": "Login button",     // Required: Human-readable description
  "ref": "#login-btn",          // Required: Element selector/reference
  "button": "left",             // Optional: "left", "right", "middle" (default: "left")
  "doubleClick": false          // Optional: Perform double-click (default: false)
}

// Use cases:
- Clicking buttons, links, checkboxes
- Triggering interactive elements
- Simulating user interactions
- Right-clicking for context menus
```

### `mcp__playwright__browser_type`
Type text into input fields.
```javascript
// Parameters:
{
  "element": "Email input field",  // Required: Human-readable description
  "ref": "#email",                // Required: Element selector/reference
  "text": "user@example.com",     // Required: Text to type
  "slowly": false,                // Optional: Type one character at a time
  "submit": false                 // Optional: Press Enter after typing
}

// Use cases:
- Filling forms
- Entering search queries
- Testing input validation
- Automating data entry
```

### `mcp__playwright__browser_press_key`
Press specific keyboard keys.
```javascript
// Parameters:
{
  "key": "Enter"  // Required: Key name (e.g., "Enter", "Escape", "ArrowDown", "a")
}

// Use cases:
- Submitting forms
- Keyboard navigation
- Triggering keyboard shortcuts
- Accessibility testing
```

### `mcp__playwright__browser_hover`
Hover over elements to trigger hover states.
```javascript
// Parameters:
{
  "element": "Dropdown menu",  // Required: Human-readable description
  "ref": ".nav-menu"          // Required: Element selector/reference
}

// Use cases:
- Triggering dropdown menus
- Testing hover effects
- Revealing hidden content
- Tooltip interactions
```

### `mcp__playwright__browser_drag`
Drag and drop elements.
```javascript
// Parameters:
{
  "startElement": "Draggable item",   // Required: Source element description
  "startRef": "#item1",               // Required: Source element reference
  "endElement": "Drop zone",          // Required: Target element description
  "endRef": "#dropzone"               // Required: Target element reference
}

// Use cases:
- Testing drag-and-drop interfaces
- Reordering lists
- Moving elements in UI builders
- File upload via drag-and-drop
```

### `mcp__playwright__browser_select_option`
Select options from dropdown menus.
```javascript
// Parameters:
{
  "element": "Country dropdown",     // Required: Human-readable description
  "ref": "#country-select",         // Required: Element selector/reference
  "values": ["United States"]       // Required: Array of values to select
}

// Use cases:
- Form automation
- Testing select elements
- Multi-select handling
- Filter/sort operations
```

### `mcp__playwright__browser_file_upload`
Upload files to file input elements.
```javascript
// Parameters:
{
  "paths": ["/path/to/file1.pdf", "/path/to/file2.jpg"]  // Required: Array of file paths
}

// Use cases:
- Testing file upload functionality
- Automating document submissions
- Bulk file uploads
- Testing file type validation
```

## 4. Content Capture Functions

### `mcp__playwright__browser_take_screenshot`
Capture screenshots of the page or specific elements.
```javascript
// Parameters:
{
  "filename": "homepage.png",      // Optional: Custom filename
  "fullPage": true,               // Optional: Capture full scrollable page
  "raw": false,                   // Optional: Return PNG instead of JPEG
  "element": "Header section",     // Optional: Element description (with ref)
  "ref": "#header"                // Optional: Element reference (with element)
}

// Use cases:
- Visual regression testing
- Documentation screenshots
- Error reporting
- Design reviews
- Monitoring UI changes
```

### `mcp__playwright__browser_snapshot`
Get accessibility tree snapshot (better than screenshots for automation).
```javascript
// No parameters required

// Returns: Structured representation of page content

// Use cases:
- Understanding page structure
- Finding elements for automation
- Accessibility testing
- Content extraction
- Better than screenshots for finding elements
```

### `mcp__playwright__browser_evaluate`
Execute JavaScript code on the page.
```javascript
// Parameters:
{
  "function": "() => { return document.title; }",     // Required: JS function
  "element": "Button",   // Optional: Element description (with ref)
  "ref": "#btn"         // Optional: Element reference (with element)
}

// Use cases:
- Extracting data not visible in DOM
- Modifying page state
- Complex interactions
- Custom automation logic
- Getting computed styles
```

## 5. Monitoring & Debugging Functions

### `mcp__playwright__browser_console_messages`
Retrieve all console messages from the page.
```javascript
// No parameters required

// Returns: Array of console messages (log, error, warning, etc.)

// Use cases:
- Debugging JavaScript errors
- Monitoring console output
- Testing error handling
- Performance monitoring
- Tracking analytics calls
```

### `mcp__playwright__browser_network_requests`
Get all network requests made by the page.
```javascript
// No parameters required

// Returns: Array of network requests with details

// Use cases:
- API monitoring
- Performance analysis
- Testing API calls
- Debugging failed requests
- Security auditing
```

### `mcp__playwright__browser_handle_dialog`
Handle JavaScript dialogs (alert, confirm, prompt).
```javascript
// Parameters:
{
  "accept": true,              // Required: Accept or dismiss dialog
  "promptText": "User input"   // Optional: Text for prompt dialogs
}

// Use cases:
- Handling unexpected alerts
- Testing dialog functionality
- Automating confirmations
- Bypassing blocking dialogs
```

## 6. Tab Management Functions

### `mcp__playwright__browser_tab_list`
List all open browser tabs.
```javascript
// No parameters required

// Returns: Array of tabs with their details

// Use cases:
- Managing multiple tabs
- Finding specific tabs
- Debugging tab states
- Multi-tab automation
```

### `mcp__playwright__browser_tab_new`
Open a new browser tab.
```javascript
// Parameters:
{
  "url": "https://example.com"  // Optional: URL to open in new tab
}

// Use cases:
- Multi-tab workflows
- Parallel operations
- Opening reference pages
- Testing tab functionality
```

### `mcp__playwright__browser_tab_select`
Switch to a specific tab by index.
```javascript
// Parameters:
{
  "index": 0  // Required: Tab index (0-based)
}

// Use cases:
- Switching between tabs
- Multi-tab automation
- Testing tab interactions
- Managing workflow states
```

### `mcp__playwright__browser_tab_close`
Close a specific tab.
```javascript
// Parameters:
{
  "index": 1  // Optional: Tab index to close (current tab if not provided)
}

// Use cases:
- Cleanup after operations
- Managing tab count
- Closing popup tabs
- Resource management
```

## 7. Waiting Functions

### `mcp__playwright__browser_wait_for`
Wait for specific conditions before proceeding.
```javascript
// Parameters (use one):
{
  "text": "Loading complete",    // Wait for text to appear
  "textGone": "Loading...",     // Wait for text to disappear
  "time": 5                     // Wait for specific seconds
}

// Use cases:
- Waiting for dynamic content
- Handling loading states
- Synchronizing with animations
- Ensuring page readiness
- Avoiding race conditions
```

## Common Automation Patterns

### 1. Login Automation
```javascript
// Navigate to login page
browser_navigate({ url: "https://example.com/login" })

// Fill credentials
browser_type({ 
  element: "Username field", 
  ref: "#username", 
  text: "user@example.com" 
})

browser_type({ 
  element: "Password field", 
  ref: "#password", 
  text: "password123" 
})

// Submit form
browser_click({ 
  element: "Login button", 
  ref: "#login-btn" 
})

// Wait for redirect
browser_wait_for({ text: "Dashboard" })
```

### 2. Data Extraction
```javascript
// Navigate to page
browser_navigate({ url: "https://example.com/data" })

// Get page snapshot for structure
browser_snapshot()

// Extract specific data
browser_evaluate({ 
  function: "() => { 
    return Array.from(document.querySelectorAll('.data-row'))
      .map(row => row.textContent); 
  }" 
})
```

### 3. Form Testing
```javascript
// Test form validation
browser_type({ 
  element: "Email field", 
  ref: "#email", 
  text: "invalid-email" 
})

browser_click({ 
  element: "Submit button", 
  ref: "#submit" 
})

// Check for error message
browser_wait_for({ text: "Invalid email format" })

// Take screenshot of error state
browser_take_screenshot({ 
  filename: "validation-error.png" 
})
```

### 4. Multi-Tab Workflow
```javascript
// Open first tab
browser_navigate({ url: "https://source.com" })

// Open second tab
browser_tab_new({ url: "https://destination.com" })

// Switch back to first tab
browser_tab_select({ index: 0 })

// Copy data from first tab
let data = browser_evaluate({ 
  function: "() => document.querySelector('.data').textContent" 
})

// Switch to second tab
browser_tab_select({ index: 1 })

// Paste data
browser_type({ 
  element: "Input field", 
  ref: "#input", 
  text: data 
})
```

## Best Practices

1. **Always use browser_snapshot() first** - It's better than screenshots for finding elements
2. **Use meaningful element descriptions** - Helps with debugging and maintenance
3. **Add waits for dynamic content** - Prevents race conditions
4. **Handle errors gracefully** - Use try-catch patterns
5. **Clean up resources** - Close tabs and browser when done
6. **Use specific selectors** - IDs are best, then classes, then other attributes
7. **Test responsive behavior** - Use browser_resize for different viewports
8. **Monitor console and network** - Helps debug issues quickly

## Common Issues and Solutions

### Browser Already in Use
- Solution: Close existing browser with `browser_close()` first

### Element Not Found
- Solution: Use `browser_snapshot()` to see current page structure
- Add waits for dynamic elements

### Timeout Errors
- Solution: Increase wait times or use `browser_wait_for()`
- Check network tab for slow requests

### Screenshot Issues
- Solution: Ensure page is fully loaded first
- Use `fullPage: true` for long pages

### Dialog Blocking
- Solution: Set up dialog handler before triggering action