import os
import re
import json

DATA_DIR = "data/"
TXT_DIR = os.path.join(DATA_DIR, "txt")
OUT_DIR = os.path.join(DATA_DIR, "json")

def parse_chapter_content(chapter_path):
    # List of encodings to try
    encodings = ['iso-8859-1', 'utf-16-le', 'utf-8']
    
    for encoding in encodings:
        try:
            with open(chapter_path, 'r', encoding=encoding) as f:
                chapter_content = f.read()
            # If we got here, the reading was successful
            return chapter_content.strip()  # Remove leading/trailing whitespace
        except UnicodeDecodeError:
            # If this encoding didn't work, continue to the next one
            continue
    
    # If we get here, none of the encodings worked
    raise ValueError(f"Failed to decode file {chapter_path} with encodings: {', '.join(encodings)}")

def parse_book_name(raw_name):
    # Remove the number followed by spaces before the book name
    parsed_name = re.sub(r'^\d+\s+', '', raw_name)
    # Remove any trailing spaces
    parsed_name = parsed_name.rstrip()

    return parsed_name

def main():
    # Find bibles
    bibles_list = os.listdir(TXT_DIR)
    bibles_list.sort()
    for bible_name in bibles_list:
        print(f"Bible: {bible_name}")
        bible_name = os.path.join(TXT_DIR, bible_name)
        bible_dict = {}
        bible_dict["name"] = bible_name
        bible_dict["books"] = []
        books_list = os.listdir(bible_name)
        books_list.sort()
        for book_name in books_list:
            book_parsed = parse_book_name(book_name)
            print(f"\tBook: {book_parsed}")
            book_path = os.path.join(bible_name, book_name)
            chapters_list = os.listdir(book_path)
            chapters_list.sort()
            for chapter_file_name in chapters_list:
                print(f"\t\tChapter: {chapter_file_name}")
                chapter_path = os.path.join(book_path, chapter_file_name)
                chapter_content = parse_chapter_content(chapter_path)
                print(chapter_content)
            input()

if __name__ == "__main__":
    main()