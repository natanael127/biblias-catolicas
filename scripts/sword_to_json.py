# Based on https://github.com/scrollmapper/bible_databases/blob/a228a19a29099a41c196c2a310cd93e50a390e30/scripts/sword_to_json.py
# TODO: verbose output

from pysword.modules import SwordModules
import argparse
import json

def generate_dict(source_file):
    modules = SwordModules(source_file)
    found_modules = modules.parse_modules()
    bible_version = list(found_modules.keys())[0]
    bible = modules.get_bible_from_module(bible_version)

    books = bible.get_structure()._books['ot'] + bible.get_structure()._books['nt']

    bib = {}
    bib['books'] = []

    for book in books:
        chapters = []
        for chapter in range(1, book.num_chapters+1):
            verses = []
            for verse in range(1, len(book.get_indicies(chapter))+1 ):
                verses.append({
                    'verse': verse,
                    'chapter': chapter,
                    'name': book.name + " " + str(chapter) + ":" + str(verse),
                    'text': bible.get(books=[book.name], chapters=[chapter], verses=[verse])
                    })
            chapters.append({
                'chapter': chapter,
                'name': book.name + " " + str(chapter),
                'verses': verses
            })
        bib['books'].append({
            'name': book.name,
            'chapters': chapters
        })
    
    return bib

def write_json(bible_dict, output_file):
    with open(output_file, 'w') as outfile:  
        json.dump(bible_dict, outfile, indent=4)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input')
    parser.add_argument('--output')
    args = parser.parse_args()

    bible_dict = generate_dict(args.input)
    write_json(bible_dict, args.output)

if __name__ == "__main__":
    main()
