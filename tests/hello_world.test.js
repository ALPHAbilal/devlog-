// Test for Hello World JavaScript implementation
const { helloWorld } = require('../examples/hello_world.js');

describe('Hello World Tests', () => {
    test('should return Hello, World!', () => {
        expect(helloWorld()).toBe('Hello, World!');
    });
    
    test('should return a string', () => {
        expect(typeof helloWorld()).toBe('string');
    });
    
    test('should include Hello', () => {
        expect(helloWorld()).toContain('Hello');
    });
});