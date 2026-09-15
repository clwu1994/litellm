"""Message catalogs. English is the source language and has no catalog."""

from collections.abc import Mapping
from types import MappingProxyType
from typing import Final

from litellm.proxy.i18n.catalog.zh import EXACT_MESSAGES, TEMPLATE_MESSAGES
from litellm.proxy.i18n.matcher import Catalog, build_catalog

CATALOG: Final[Catalog] = build_catalog(EXACT_MESSAGES, TEMPLATE_MESSAGES)

CATALOGS: Final[Mapping[str, Catalog]] = MappingProxyType({"zh": CATALOG})
