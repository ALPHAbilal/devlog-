#!/usr/bin/env node

/**
 * Simple Hello World Script
 * Created by Claude Flow Swarm
 * 
 * This script demonstrates the most basic output in JavaScript
 */

// Main function to print greeting
function sayHello() {
    console.log("Hello, World!");
    console.log("👋 This script was created by Claude Flow Swarm!");
    console.log(`Current time: ${new Date().toLocaleString()}`);
}

// Execute the function
sayHello();

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sayHello };
}