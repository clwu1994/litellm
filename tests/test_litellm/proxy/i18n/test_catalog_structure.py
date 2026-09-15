import json
from pathlib import Path

from litellm.proxy.i18n.catalog.zh import EXACT_MESSAGES, TEMPLATE_MESSAGES

GLOSSARY_PATH = Path(__file__).resolve().parents[4] / "i18n" / "glossary.json"


def squeeze(value: str) -> str:
    return value.replace(" ", "").lower()


def test_glossary_is_readable_from_the_repo_root() -> None:
    assert GLOSSARY_PATH.is_file()


def test_zh_catalog_does_not_use_banned_technical_term_translations() -> None:
    glossary: dict[str, list[str]] = json.loads(GLOSSARY_PATH.read_text(encoding="utf-8"))
    forbidden = tuple((banned, term) for term, banned_list in glossary.items() for banned in banned_list)
    for source, translation in (*EXACT_MESSAGES.items(), *TEMPLATE_MESSAGES.items()):
        normalized_source = squeeze(source)
        normalized_translation = squeeze(translation)
        for banned, term in forbidden:
            if squeeze(term) not in normalized_source:
                continue
            assert squeeze(banned) not in normalized_translation, (
                f"term {term!r} must stay in English, but {translation!r} contains {banned!r}"
            )
