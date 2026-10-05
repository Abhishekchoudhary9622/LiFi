"""
Telemetry Tokenizer for BASR.
Supports character/token representation of structured telemetry payloads:
- Keys: TEMP, HUM, MOTOR, VOLT, CURR, STATE, DEVICE, STATUS, etc.
- Digits: 0-9
- Symbols: =, ., ,, -, :, _, %, [MASK], [PAD], [CLS], [SEP], [UNK]
"""

from typing import List, Dict

SPECIAL_TOKENS = ["[PAD]", "[UNK]", "[CLS]", "[SEP]", "[MASK]"]
CHAR_VOCAB = (
    SPECIAL_TOKENS +
    list("0123456789") +
    list("ABCDEFGHIJKLMNOPQRSTUVWXYZ") +
    list("abcdefghijklmnopqrstuvwxyz") +
    list("=.,-_:; %/\\+*()[]{}<>!?#@$\"'")
)

TOKEN_TO_ID: Dict[str, int] = {tok: idx for idx, tok in enumerate(CHAR_VOCAB)}
ID_TO_TOKEN: Dict[int, str] = {idx: tok for idx, tok in enumerate(CHAR_VOCAB)}
VOCAB_SIZE = len(CHAR_VOCAB)

PAD_ID = TOKEN_TO_ID["[PAD]"]
UNK_ID = TOKEN_TO_ID["[UNK]"]
MASK_ID = TOKEN_TO_ID["[MASK]"]
CLS_ID = TOKEN_TO_ID["[CLS]"]
SEP_ID = TOKEN_TO_ID["[SEP]"]

def tokenize_payload(text: str, max_len: int = 48) -> List[int]:
    """Tokenizes text into token IDs with padding."""
    ids = [CLS_ID]
    for ch in text:
        ids.append(TOKEN_TO_ID.get(ch, UNK_ID))
    ids.append(SEP_ID)
    if len(ids) < max_len:
        ids.extend([PAD_ID] * (max_len - len(ids)))
    return ids[:max_len]

def decode_token_ids(ids: List[int]) -> str:
    """Decodes token IDs back into string, ignoring special control tokens."""
    chars = []
    for i in ids:
        if i in (PAD_ID, CLS_ID, SEP_ID):
            continue
        tok = ID_TO_TOKEN.get(i, "")
        if tok == "[MASK]":
            chars.append("_")
        else:
            chars.append(tok)
    return "".join(chars)
