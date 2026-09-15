"""RFC 9110 Accept-Language negotiation over the locales the proxy can serve.

English is the source language, so serving it is the no-translation outcome and only
Chinese carries a catalog. The first supported tag in descending preference order
decides, so a client that prefers English is never forced into Chinese merely because
Chinese is also acceptable.
"""

from __future__ import annotations

import re
from typing import Final

ZH: Final = "zh"
EN: Final = "en"
SUPPORTED_PRIMARY_SUBTAGS: Final[frozenset[str]] = frozenset({ZH, EN})

_TAG: Final = re.compile(r"^[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*$")


def _quality(params: str) -> float:
    for param in params.split(";"):
        name, _, value = param.partition("=")
        if name.strip().lower() != "q":
            continue
        try:
            return float(value.strip())
        except ValueError:
            return 0.0
    return 1.0


def _preference(index: int, part: str) -> tuple[float, int, str] | None:
    raw_tag, _, params = part.strip().partition(";")
    tag: Final = raw_tag.strip()
    quality: Final = _quality(params)
    if not tag or not _TAG.match(tag) or quality <= 0.0:
        return None
    return (quality, -index, tag)


def _ranked_tags(header: str) -> tuple[str, ...]:
    preferences: Final = (
        preference
        for preference in (_preference(index, part) for index, part in enumerate(header.split(",")))
        if preference is not None
    )
    return tuple(tag for _, _, tag in sorted(preferences, reverse=True))


def negotiate_locale(accept_language: str | None) -> str | None:
    """Return the locale to translate into, or None to serve the English source unchanged."""
    if not accept_language:
        return None
    for tag in _ranked_tags(accept_language):
        primary = tag.split("-", 1)[0].lower()
        if primary not in SUPPORTED_PRIMARY_SUBTAGS:
            continue
        return ZH if primary == ZH else None
    return None
