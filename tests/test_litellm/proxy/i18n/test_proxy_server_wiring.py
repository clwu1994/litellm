import json

import pytest
from fastapi import FastAPI
from starlette.requests import Request

from litellm.proxy.i18n.handlers import install_i18n
from litellm.proxy._types import ProxyException


def _request(accept_language: str | None) -> Request:
    headers = [] if accept_language is None else [(b"accept-language", accept_language.encode())]
    return Request({"type": "http", "method": "GET", "path": "/", "headers": headers, "query_string": b""})


def test_real_proxy_app_has_i18n_http_exception_handler_registered() -> None:
    from starlette.exceptions import HTTPException as StarletteHTTPException

    from litellm.proxy.proxy_server import app

    assert StarletteHTTPException in app.exception_handlers


@pytest.mark.asyncio
async def test_real_proxy_app_translates_proxy_exception_message() -> None:
    from litellm.proxy.proxy_server import app

    handler = app.exception_handlers[ProxyException]
    exc = ProxyException(message="No models configured on proxy", type="no_llm_router", param=None, code=500)

    zh_response = await handler(_request("zh-CN"), exc)
    zh_body = json.loads(zh_response.body)
    assert zh_body["error"]["message"] == "proxy 上未配置任何模型"
    assert zh_body["error"]["type"] == "no_llm_router"
    assert zh_body["error"]["code"] == "500"

    en_response = await handler(_request(None), exc)
    default_response = await handler(_request("en-US"), exc)
    assert en_response.body == default_response.body
    assert json.loads(en_response.body)["error"]["message"] == "No models configured on proxy"
