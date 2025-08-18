#!/usr/bin/env python3
"""Tests for Hello World Python implementation"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'examples'))

import unittest
from hello_world import hello_world

class TestHelloWorld(unittest.TestCase):
    """Test cases for hello_world function"""
    
    def test_hello_world_output(self):
        """Test that hello_world returns the correct string"""
        self.assertEqual(hello_world(), "Hello, World!")
    
    def test_hello_world_type(self):
        """Test that hello_world returns a string"""
        self.assertIsInstance(hello_world(), str)
    
    def test_hello_contains(self):
        """Test that output contains Hello"""
        self.assertIn("Hello", hello_world())

if __name__ == '__main__':
    unittest.main()