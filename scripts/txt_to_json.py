import os
import re
import json
import argparse

ABBREVIATION = [
    "Gn", "Ex", "Lv", "Nm", "Dt", "Js", "Jz", "Rt", "1Sm", "2Sm",
    "1Rs", "2Rs", "1Cr", "2Cr", "Esd", "Ne", "Tb", "Jt", "Est",
    "Jó", "Sl", "1Mc", "2Mc", "Pr", "Ecl", "Ct", "Sb", "Eclo", "Is",
    "Jr", "Lm", "Br", "Ez", "Dn", "Os", "Jl", "Am", "Ab",
    "Jn", "Mq", "Na", "Hab", "Sf", "Ag", "Zc", "Ml",
    "Mt", "Mc", "Lc", "Jo", "At", "Rm", "1Cor", "2Cor", "Gl", "Ef",
    "Fl", "Cl", "1Ts", "2Ts", "1Tm", "2Tm", "Tt", "Fm", "Hb", "Tg",
    "1Pd", "2Pd", "1Jo", "2Jo", "3Jo", "Jd", "Ap"
]

def parse_chapter_content(chapter_path):

    chapter_content = None
    input_encodings = ['utf-16-le', 'utf-8']

    for encoding in input_encodings:
        with open(chapter_path, 'r', encoding=encoding) as f:
            try:
                chapter_content = f.read()
            except UnicodeDecodeError:
                pass

    if chapter_content is None:
        raise ValueError(f"Failed to decode file {chapter_path} with encodings {", ".join(input_encodings)}")

    # Split the content into lines
    lines = chapter_content.splitlines()
    # Remove empty lines
    lines = [line for line in lines if line.strip()]

    # Save back joining the lines and giving new line at the end
    output_encoding = 'utf-8'
    with open(chapter_path, 'w', encoding=output_encoding) as f:
        f.write('\n'.join(lines) + '\n')

    # Remove lines that does not start with a number
    lines = [line for line in lines if re.match(r'^\d+', line)]
    # Remove numbers followed by dot and spaces in the beginning of the line
    lines = [re.sub(r'^\d+\.\s+', '', line) for line in lines]
    # Remove any trailing spaces
    lines = [line.rstrip() for line in lines]

    return lines

def parse_book_name(raw_name):
    # Remove the number followed by spaces before the book name
    parsed_name = re.sub(r'^\d+\s+', '', raw_name)
    # Remove any trailing spaces
    parsed_name = parsed_name.rstrip()

    return parsed_name

def create_dir_if_not_exists(path):
    if not os.path.exists(path):
        os.makedirs(path)

def main(txt_dir, json_dir):
    # Find bibles
    create_dir_if_not_exists(json_dir)
    bibles_list = os.listdir(txt_dir)
    bibles_list = [bible for bible in bibles_list if os.path.isdir(os.path.join(txt_dir, bible))]
    bibles_list.sort()
    for bible_name in bibles_list:
        bible_path = os.path.join(txt_dir, bible_name)
        out_dict = {"bible": {}}
        bible_dict = out_dict["bible"]
        bible_dict["name"] = bible_name
        bible_dict["books"] = []
        books_dict = bible_dict["books"]
        books_list = os.listdir(bible_path)
        books_list.sort()
        for k, book_name in enumerate(books_list):
            book_parsed = parse_book_name(book_name)
            this_book_dict = {
                "name": book_parsed,
                "abbreviation": ABBREVIATION[k],
                "chapters": [],
            }
            print(f"Parsing book ({ABBREVIATION[k]}) {book_parsed} from bible {bible_name}")
            book_path = os.path.join(bible_path, book_name)
            chapters_list = os.listdir(book_path)
            chapters_list.sort()
            for chapter_file_name in chapters_list:
                chapter_path = os.path.join(book_path, chapter_file_name)
                verses_dict = parse_chapter_content(chapter_path)
                this_book_dict["chapters"].append(verses_dict)
            books_dict.append(this_book_dict)
        out_path = os.path.join(json_dir, bible_name + ".json")
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(out_dict, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Convert Bible text files to JSON format')
    parser.add_argument('--txt-dir', type=str, required=True,
                        help='Directory containing the input text files')
    parser.add_argument('--json-dir', type=str, required=True,
                        help='Directory where JSON files will be saved')

    args = parser.parse_args()

    main(args.txt_dir, args.json_dir)
