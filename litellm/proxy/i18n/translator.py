"""Pure translation of human-readable fields in proxy error payloads.

Every function is identity-preserving: when nothing needs to change it returns the
same object it was given, so the untranslated path serializes exactly as it did before.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from types import MappingProxyType
from typing import Final

from litellm.proxy.i18n.catalog import CATALOGS
from litellm.proxy.i18n.matcher import Catalog
from litellm.types.proxy.management_endpoints.management_v1 import ProblemDetail

TRANSLATABLE_FIELDS: Final[frozenset[str]] = frozenset({"message", "detail", "title", "msg"})

_ERROR_DICT_FIELDS: Final[tuple[str, ...]] = ("message",)
_VALIDATION_FIELDS: Final[tuple[str, ...]] = ("msg",)
_DETAIL_FIELDS: Final[tuple[str, ...]] = ("message", "detail", "title", "msg")
_PROBLEM_FIELDS: Final[tuple[str, ...]] = ("title", "detail")


def catalog_for(locale: str | None) -> Catalog | None:
    if locale is None:
        return None
    return CATALOGS.get(locale)


def translate_message(message: str, locale: str | None) -> str:
    catalog: Final = catalog_for(locale)
    if catalog is None:
        return message
    return catalog.translate(message)


def _translate_mapping(
    mapping: Mapping[str, object],
    fields: tuple[str, ...],
    locale: str | None,
) -> Mapping[str, object]:
    translated: Final = MappingProxyType(
        {
            key: translate_message(value, locale) if key in fields and isinstance(value, str) else value
            for key, value in mapping.items()
        }
    )
    return translated if translated != mapping else mapping


def translate_error_dict(error_dict: Mapping[str, object], locale: str | None) -> Mapping[str, object]:
    if locale is None:
        return error_dict
    return _translate_mapping(error_dict, _ERROR_DICT_FIELDS, locale)


def translate_detail(detail: object, locale: str | None) -> object:
    if locale is None:
        return detail
    if isinstance(detail, str):
        return translate_message(detail, locale)
    if isinstance(detail, Mapping):
        return _translate_mapping(detail, _DETAIL_FIELDS, locale)
    if isinstance(detail, (list, tuple)):
        return _translate_sequence(detail, _DETAIL_FIELDS, locale)
    return detail


def _translate_item(item: object, fields: tuple[str, ...], locale: str | None) -> object:
    if isinstance(item, Mapping):
        return _translate_mapping(item, fields, locale)
    if isinstance(item, str):
        return translate_message(item, locale)
    return item


def _translate_sequence(
    items: Sequence[object],
    fields: tuple[str, ...],
    locale: str | None,
) -> Sequence[object]:
    translated: Final = tuple(_translate_item(item, fields, locale) for item in items)
    changed: Final = any(new_item is not original for new_item, original in zip(translated, items))
    return translated if changed else items


def translate_validation_errors(errors: Sequence[object], locale: str | None) -> Sequence[object]:
    if locale is None:
        return errors
    return _translate_sequence(errors, _VALIDATION_FIELDS, locale)


def translate_problem(problem: ProblemDetail, locale: str | None) -> ProblemDetail:
    if locale is None:
        return problem
    dumped: Final = problem.model_dump()
    translated: Final = _translate_mapping(dumped, _PROBLEM_FIELDS, locale)
    if translated is dumped:
        return problem
    return problem.model_copy(update=translated)
