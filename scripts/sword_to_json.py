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

    bib = {'bible': {}}
    bib['bible']['name'] = bible_version
    bib['bible']['books'] = []
    books_out_list = bib['bible']['books']

    for book in books:
        print(f"Processing book: {book.name}")
        chapters = []
        for chapter in range(1, book.num_chapters+1):
            verses = []
            for verse in range(1, len(book.get_indicies(chapter))+1 ):
                verses.append(
                    bible.get(books=[book.name], chapters=[chapter], verses=[verse])
                )
            chapters.append(verses)
        books_out_list.append({
            'name': book.name,
            'abbreviation': book.preferred_abbreviation,
            'chapters': chapters
        })
    
    return bib

def write_json(bible_dict, output_file):
    with open(output_file, 'w') as outfile:  
        json.dump(bible_dict, outfile, indent=4)


def main():
    parser = argparse.ArgumentParser(
        description='Conversor de módulo Bíblia SWORD para formato JSON',
    )
    parser.add_argument('--input', required=True, help='Caminho para o arquivo do módulo SWORD da Bíblia')
    parser.add_argument('--output', required=False, help='Caminho para o arquivo JSON de saída (opcional, padrão: mesmo nome do input com extensão .json)')
    args = parser.parse_args()

    # Se output não foi fornecido, usa o mesmo nome do arquivo de entrada com extensão .json
    output_file = args.output
    if not output_file:
        splited_path = args.input.split('.')
        base_name = "".join(splited_path[:-1])
        output_file = base_name + '.json'
        print(f"Saída padrão: {output_file}")

    bible_dict = generate_dict(args.input)
    write_json(bible_dict, output_file)

if __name__ == "__main__":
    main()
