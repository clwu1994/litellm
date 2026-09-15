from litellm.proxy.i18n.translator import (
    TRANSLATABLE_FIELDS,
    translate_detail,
    translate_error_dict,
    translate_message,
    translate_problem,
    translate_validation_errors,
)
from litellm.types.proxy.management_endpoints.management_v1 import ProblemDetail


def test_translatable_fields_are_exactly_the_human_readable_whitelist() -> None:
    assert TRANSLATABLE_FIELDS == frozenset({"message", "detail", "title", "msg"})


def test_translate_message_no_locale_is_identity() -> None:
    assert translate_message("No models configured on proxy", None) == "No models configured on proxy"


def test_translate_message_unknown_locale_is_identity() -> None:
    assert translate_message("No models configured on proxy", "fr") == "No models configured on proxy"


def test_translate_message_translates_when_zh() -> None:
    assert translate_message("No models configured on proxy", "zh") == "proxy 上未配置任何模型"


def test_translate_message_unknown_message_falls_back_to_english() -> None:
    assert translate_message("Something upstream added later", "zh") == "Something upstream added later"


def test_translate_error_dict_no_locale_returns_same_object() -> None:
    payload = {"message": "No models configured on proxy", "type": "no_llm_router", "code": "500"}
    assert translate_error_dict(payload, None) is payload


def test_translate_error_dict_zh_changes_only_message() -> None:
    payload = {"message": "No models configured on proxy", "type": "no_llm_router", "param": None, "code": "500"}
    translated = translate_error_dict(payload, "zh")
    assert translated == {
        "message": "proxy 上未配置任何模型",
        "type": "no_llm_router",
        "param": None,
        "code": "500",
    }
    assert payload["message"] == "No models configured on proxy"


def test_translate_error_dict_unmatched_returns_same_object() -> None:
    payload = {"message": "brand new upstream message", "type": "x", "code": "500"}
    assert translate_error_dict(payload, "zh") is payload


def test_translate_error_dict_ignores_non_whitelisted_string_fields() -> None:
    payload = {"message": "No models configured on proxy", "type": "No models configured on proxy", "code": "500"}
    translated = translate_error_dict(payload, "zh")
    assert translated["type"] == "No models configured on proxy"


def test_translate_detail_str_is_translated() -> None:
    assert translate_detail("No models configured on proxy", "zh") == "proxy 上未配置任何模型"


def test_translate_detail_non_str_is_returned_unchanged() -> None:
    payload = {"a": 1}
    assert translate_detail(payload, "zh") is payload
    assert translate_detail(None, "zh") is None


def test_translate_detail_dict_message_key_is_translated() -> None:
    assert translate_detail({"message": "No models configured on proxy"}, "zh") == {"message": "proxy 上未配置任何模型"}


def test_translate_detail_list_of_strings_is_translated_elementwise() -> None:
    assert translate_detail(["No models configured on proxy"], "zh") == ("proxy 上未配置任何模型",)


def test_translate_detail_list_of_numbers_is_returned_unchanged() -> None:
    payload = [1, 2]
    assert translate_detail(payload, "zh") is payload


def test_translate_validation_errors_no_locale_returns_same_object() -> None:
    errors = [{"loc": ("body", "model"), "msg": "Field required", "type": "missing"}]
    assert translate_validation_errors(errors, None) is errors


def test_translate_validation_errors_preserves_loc_and_type() -> None:
    errors = [
        {"loc": ("body", "model"), "msg": "Admin-only endpoint. Not allowed to access this.", "type": "value_error"}
    ]
    translated = translate_validation_errors(errors, "zh")
    assert translated == (
        {"loc": ("body", "model"), "msg": "仅管理员可访问的 endpoint，无权访问。", "type": "value_error"},
    )


def test_translate_validation_errors_unmatched_returns_same_object() -> None:
    errors = [{"loc": ("body", "model"), "msg": "Field required", "type": "missing"}]
    assert translate_validation_errors(errors, "zh") is errors


def test_translate_problem_no_locale_returns_same_object() -> None:
    problem = ProblemDetail(type="urn:litellm:error:x", title="Unknown query parameter", status=400, detail="nope")
    assert translate_problem(problem, None) is problem


def test_translate_problem_keeps_type_uri_and_status() -> None:
    problem = ProblemDetail(type="urn:litellm:error:x", title="Unknown query parameter", status=400, detail="nope")
    translated = translate_problem(problem, "zh")
    assert translated.type == "urn:litellm:error:x"
    assert translated.status == 400
    assert translated.title == "未知的查询参数"
    assert translated.detail == "nope"


def test_translate_problem_unmatched_returns_same_object() -> None:
    problem = ProblemDetail(type="urn:litellm:error:x", title="Some new title", status=400, detail="Some new detail")
    assert translate_problem(problem, "zh") is problem
