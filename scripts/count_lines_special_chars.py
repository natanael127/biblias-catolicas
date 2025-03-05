#!/usr/bin/env python3

import re
import os
import argparse

def has_special_characters(line):
    """Check if a line contains any characters outside the classic ASCII range (0-255)."""
    out = False
    for char in line:
        if char not in " 0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-\n":
            out = True
    return out

def count_lines_with_special_chars(file_path):
    """Count the number of lines in a file that contain special characters."""
    if not os.path.isfile(file_path):
        print(f"Error: File '{file_path}' not found.")
        return
    
    total_lines = 0
    lines_with_special_chars = 0
    special_char_lines = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            for line_num, line in enumerate(file, 1):
                total_lines += 1
                if has_special_characters(line):
                    print(f"Line {line_num}: {line.strip()}")
                    lines_with_special_chars += 1
                    special_char_lines.append(line_num)
        
        print(f"File: {file_path}")
        print(f"Total lines: {total_lines}")
        print(f"Lines with special characters: {lines_with_special_chars}")
        print(f"Percentage: {(lines_with_special_chars / total_lines) * 100:.2f}%")
        
        if special_char_lines:
            print(f"Line numbers with special characters: {special_char_lines[:10]}{'...' if len(special_char_lines) > 10 else ''}")
    
    except Exception as e:
        print(f"An error occurred: {e}")

def main():
    # Create parser
    parser = argparse.ArgumentParser(
        description="Count the number of lines in a file that contain special characters."
    )
    
    # Add arguments
    parser.add_argument(
        "file_path", 
        help="Path to the file to analyze"
    )
    
    # Parse arguments
    args = parser.parse_args()
    
    # Process the file
    count_lines_with_special_chars(args.file_path)

if __name__ == "__main__":
    main()