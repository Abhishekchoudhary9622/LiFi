import re

with open('paper_extracted_text.txt', 'r', encoding='utf-8') as f:
    text = f.read()

out = []
def add_section(title, start_pattern, end_pattern):
    out.append(f"\n=================== {title} ===================\n")
    m1 = re.search(start_pattern, text, re.IGNORECASE)
    if m1:
        p1 = m1.start()
        m2 = re.search(end_pattern, text[p1:], re.IGNORECASE)
        if m2:
            p2 = p1 + m2.start()
            out.append(text[p1:p2].strip())
        else:
            out.append(text[p1:p1+3000].strip())
    else:
        out.append(f"NOT FOUND: {start_pattern}")

add_section("SECTION IV PHYSICAL TESTBED", r"IV\.\s+PHYSICAL", r"V\.\s+BURST")
add_section("SECTION V BASR", r"V\.\s+BURST-AWARE", r"VI\.\s+CONFIDENCE")
add_section("SECTION VI CGFP", r"VI\.\s+CONFIDENCE-GATED", r"VII\.\s+EXPERIMENTAL")
add_section("SECTION XI ALGORITHMIC IMPLEMENTATION", r"XI\.\s+ALGORITHMIC", r"XII\.\s+RESULTS")
add_section("SECTION XII RESULTS", r"XII\.\s+RESULTS", r"XIII\.\s+DISCUSSION")
add_section("TABLE XII CGFP DECISION LOGIC", r"TABLE XII", r"DATA AVAILABILITY")

with open('extracted_sections.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(out))

print("Wrote extracted sections to extracted_sections.txt")
