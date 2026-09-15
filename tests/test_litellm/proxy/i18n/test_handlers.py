import json

import pytest
from fastapi import FastAPI
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request

from litellm.proxy.i18n.handlers import handle_http_exception, install_i18n, locale_for_request


def _request(accept_language: str | None) -> Request:
    headers = [] if accept_language is None else [(b"accept-language", accept_language.encode())]
    return Request({"type": "http", "method": "GET", "path": "/", "headers": headers, "query_string": b""})


def test_locale_for_request_reads_header() -> None:
    assert locale_for_request(_request("zh-CN")) == "zh"
    assert locale_for_request(_request("en-US")) is None
    assert locale_for_request(_request(None)) is None


def test_install_i18n_registers_http_exception_handler() -> None:
    app = FastAPI()
    install_i18n(app)
    assert app.exception_handlers[StarletteHTTPException] is handle_http_exception


@pytest.mark.asyncio
async def test_handle_http_exception_translates_detail_when_zh() -> None:
    exc = StarletteHTTPException(status_code=403, detail="Admin-only endpoint. Not allowed to access this.")
    response = await handle_http_exception(_request("zh"), exc)
    assert json.loads(response.body)["detail"] == "仅管理员可访问的 endpoint，无权访问。"


@pytest.mark.asyncio
async def test_handle_http_exception_preserves_status_and_headers() -> None:
    exc = StarletteHTTPException(
        status_code=429,
        detail="Admin-only endpoint. Not allowed to access this.",
        headers={"Retry-After": "30"},
    )
    response = await handle_http_exception(_request("zh"), exc)
    assert response.status_code == 429
    assert response.headers["Retry-After"] == "30"


@pytest.mark.asyncio
async def test_handle_http_exception_no_locale_matches_default_handler() -> None:
    from fastapi.exception_handlers import http_exception_handler

    exc = StarletteHTTPException(status_code=403, detail="Admin-only endpoint. Not allowed to access this.")
    ours = await handle_http_exception(_request(None), exc)
    default = await http_exception_handler(_request(None), exc)
    assert ours.body == default.body
    assert ours.status_code == default.status_code


@pytest.mark.asyncio
async def test_handle_http_exception_en_locale_matches_default_handler() -> None:
    from fastapi.exception_handlers import http_exception_handler

    exc = StarletteHTTPException(status_code=403, detail="Admin-only endpoint. Not allowed to access this.")
    ours = await handle_http_exception(_request("en-US"), exc)
    default = await http_exception_handler(_request("en-US"), exc)
    assert ours.body == default.body


@pytest.mark.asyncio
async def test_handle_http_exception_dict_detail_is_preserved_even_with_a_translatable_key() -> None:
    from fastapi.exception_handlers import http_exception_handler

    exc = StarletteHTTPException(status_code=400, detail={"code": 7, "message": "No models configured on proxy"})
    ours = await handle_http_exception(_request("zh"), exc)
    default = await http_exception_handler(_request("zh"), exc)
    assert ours.body == default.body


@pytest.mark.asyncio
async def test_handle_http_exception_sequence_detail_is_preserved() -> None:
    from fastapi.exception_handlers import http_exception_handler

    exc = StarletteHTTPException(status_code=400, detail=["No models configured on proxy"])
    ours = await handle_http_exception(_request("zh"), exc)
    default = await http_exception_handler(_request("zh"), exc)
    assert ours.body == default.body
