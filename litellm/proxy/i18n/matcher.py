"""Template matching for English proxy messages, keyed by a curated Chinese catalog.

A category like `Invalid key = {key}` is authored close to the English source rather
than as a hand-written regex, and ambiguity between entries is rejected at build time
instead of being resolved by list order.
"""

from __future__ import annotations

import re
from collections.abc import Mapping
from types import MappingProxyType
from typing import Final, NamedTuple

_PLACEHOLDER: Final = re.compile(r"\{([a-z_][a-z0-9_]*)\}")


class CatalogError(ValueError):
    """Raised when a catalog cannot be applied unambiguously."""


class CompiledTemplate(NamedTuple):
    source: str
    regex: re.Pattern[str]
    translation: str


class Catalog(NamedTuple):
    exact: Mapping[str, str]
    patterns: tuple[CompiledTemplate, ...]

    def translate(self, message: str) -> str:
        exact: Final = self.exact.get(message)
        if exact is not None:
            return exact
        for template in self.patterns:
            match = template.regex.fullmatch(message)
            if match is not None:
                return template.translation.format(**match.groupdict())
        return message


def _placeholders(text: str) -> tuple[str, ...]:
    return tuple(_PLACEHOLDER.findall(text))


def build_pattern(template: str) -> re.Pattern[str]:
    """Turn a message template with `{name}` slots into an anchored regex with named groups."""
    chunks: Final = _PLACEHOLDER.split(template)
    return re.compile(
        "".join(re.escape(chunk) if index % 2 == 0 else f"(?P<{chunk}>.+?)" for index, chunk in enumerate(chunks))
    )


def _validate_placeholders(template: str, translation: str) -> None:
    source_placeholders: Final = _placeholders(template)
    translation_placeholders: Final = _placeholders(translation)
    if sorted(source_placeholders) != sorted(translation_placeholders):
        raise CatalogError(
            f"placeholder mismatch for template {template!r}: source has "
            f"{source_placeholders!r}, translation has {translation_placeholders!r}"
        )
    try:
        translation.format(**dict.fromkeys(source_placeholders, "X"))
    except (KeyError, IndexError, ValueError) as error:
        raise CatalogError(f"translation for template {template!r} cannot be formatted: {error}") from error


def _validate_no_ambiguity(
    exact: Mapping[str, str],
    patterns: tuple[CompiledTemplate, ...],
) -> None:
    for exact_source in exact:
        for pattern in patterns:
            if pattern.regex.fullmatch(exact_source) is not None:
                raise CatalogError(
                    f"ambiguous catalog: exact message {exact_source!r} also matches template {pattern.source!r}"
                )
    for pattern in patterns:
        for other in patterns:
            if other.source == pattern.source:
                continue
            if pattern.regex.fullmatch(other.source) is not None:
                raise CatalogError(
                    f"ambiguous catalog: template {pattern.source!r} also matches template {other.source!r}"
                )


def build_catalog(exact: Mapping[str, str], templates: Mapping[str, str]) -> Catalog:
    """Compile and validate a catalog. Raises CatalogError if it cannot be applied unambiguously."""
    for template, translation in templates.items():
        _validate_placeholders(template, translation)
    patterns: Final = tuple(
        CompiledTemplate(source=template, regex=build_pattern(template), translation=translation)
        for template, translation in templates.items()
    )
    _validate_no_ambiguity(exact, patterns)
    return Catalog(exact=MappingProxyType(dict(exact)), patterns=patterns)
