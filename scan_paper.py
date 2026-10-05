import re

with open('paper_extracted_text.txt', 'r', encoding='utf-8') as f:
    text = f.read()

keywords = ['hardware', 'testbed', 'gpio', 'lm358', 'bpw34', '2n2222', 'servo', 'sg90', 'manchester', 'crc', '74,281', 'd_model', 'cgfp', 'tau', '0.80', 'burst', 'dataset', 'breadboard']
for kw in keywords:
    matches = list(re.finditer(re.escape(kw), text, re.IGNORECASE))
    print(f'Keyword: "{kw}" -> {len(matches)} occurrences')

print("\n--- SECTION HEADINGS FOUND ---")
for line in text.splitlines():
    line_clean = line.strip()
    if re.match(r'^(?:[0-9IVX]+\.|\b[A-Z\s]{4,}\b)\s+[A-Z]', line_clean) and len(line_clean) < 80:
        print(line_clean)
