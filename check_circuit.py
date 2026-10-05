import re

with open('paper_extracted_text.txt', 'r', encoding='utf-8') as f:
    text = f.read()

words = ['resistor', 'capacitor', 'ohm', 'kohm', 'kΩ', 'gain', 'feedback', 'transimpedance', 'tia', '2n2222', 'transistor', 'vcc', 'gnd', 'ground', 'schematic', 'breadboard', 'wiring']
for w in words:
    matches = list(re.finditer(r'\b' + re.escape(w), text, re.IGNORECASE))
    print(f"{w}: {len(matches)} occurrences")
    for m in matches[:3]:
        snippet = text[max(0, m.start()-60):min(len(text), m.end()+60)].replace('\n', ' ')
        print(f"   ...{snippet}...")
