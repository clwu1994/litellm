import pytest

from litellm.proxy.i18n.matcher import CatalogError, build_catalog, build_pattern


def test_build_pattern_matches_placeholder_and_is_anchored() -> None:
    pattern = build_pattern("Invalid key = {key}. Retry.")
    match = pattern.fullmatch("Invalid key = sk-123. Retry.")
    assert match is not None
    assert match.group("key") == "sk-123"
    assert pattern.fullmatch("prefix Invalid key = sk-123. Retry.") is None


def test_build_pattern_escapes_regex_metacharacters() -> None:
    pattern = build_pattern("Missing (model) {model}?")
    assert pattern.fullmatch("Missing (model) gpt-4?") is not None
    assert pattern.fullmatch("Missing model gpt-4?") is None


def test_catalog_prefers_exact_match() -> None:
    catalog = build_catalog({"No models configured on proxy": "未配置模型"}, {})
    assert catalog.translate("No models configured on proxy") == "未配置模型"


def test_catalog_translates_template_and_fills_placeholders() -> None:
    catalog = build_catalog(
        {},
        {"Invalid key = {key}. Retry.": "无效的 key = {key}。请重试。"},
    )
    assert catalog.translate("Invalid key = sk-abc. Retry.") == "无效的 key = sk-abc。请重试。"


def test_catalog_returns_input_when_nothing_matches() -> None:
    catalog = build_catalog({"a": "b"}, {"x {y}": "z {y}"})
    assert catalog.translate("unrelated message") == "unrelated message"


def test_build_catalog_rejects_placeholder_mismatch() -> None:
    with pytest.raises(CatalogError, match="placeholder"):
        build_catalog({}, {"Invalid key = {key}": "无效的 key = {other}"})


def test_build_catalog_rejects_duplicate_placeholder_count() -> None:
    with pytest.raises(CatalogError, match="placeholder"):
        build_catalog({}, {"Key {key} and key {key}": "key {key}"})


def test_build_catalog_rejects_template_that_matches_another_template() -> None:
    with pytest.raises(CatalogError, match="ambiguous"):
        build_catalog(
            {},
            {
                "Invalid key = {key}": "a {key}",
                "Invalid key = {key} and model = {model}": "b {key} {model}",
            },
        )


def test_build_catalog_rejects_template_matching_an_exact_message() -> None:
    with pytest.raises(CatalogError, match="ambiguous"):
        build_catalog(
            {"Invalid key = sk-1"},
            {"Invalid key = {key}": "a {key}"},
        )


def test_build_catalog_accepts_disjoint_templates() -> None:
    catalog = build_catalog(
        {},
        {
            "Invalid key = {key}": "a {key}",
            "Missing model {model}": "b {model}",
        },
    )
    assert catalog.translate("Missing model gpt-4") == "b gpt-4"
