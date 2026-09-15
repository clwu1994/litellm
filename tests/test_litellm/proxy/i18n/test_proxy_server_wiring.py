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


@pytest.mark.asyncio
async def test_real_proxy_app_translates_management_problem() -> None:
    from litellm.proxy.list_api.common import ManagementProblem
    from litellm.proxy.proxy_server import app
    from litellm.types.proxy.management_endpoints.management_v1 import ProblemDetail

    handler = app.exception_handlers[ManagementProblem]
    problem = ProblemDetail(
        type="urn:litellm:error:unknown-query-parameter",
        title="Unknown query parameter",
        status=400,
        detail="No models configured on proxy",
    )

    zh_body = json.loads((await handler(_request("zh-CN"), ManagementProblem(problem))).body)
    assert zh_body["title"] == "未知的查询参数"
    assert zh_body["detail"] == "proxy 上未配置任何模型"
    assert zh_body["type"] == "urn:litellm:error:unknown-query-parameter"
    assert zh_body["status"] == 400

    assert (await handler(_request(None), ManagementProblem(problem))).body == (
        await handler(_request("en-US"), ManagementProblem(problem))
    ).body
    assert (
        json.loads((await handler(_request(None), ManagementProblem(problem))).body)["title"]
        == "Unknown query parameter"
    )


@pytest.mark.asyncio
async def test_real_proxy_app_translates_validation_errors() -> None:
    from fastapi.exceptions import RequestValidationError

    from litellm.proxy.proxy_server import app

    handler = app.exception_handlers[RequestValidationError]
    exc = RequestValidationError(
        [{"loc": ("body", "model"), "msg": "No models configured on proxy", "type": "value_error"}]
    )

    zh_body = json.loads((await handler(_request("zh-CN"), exc)).body)
    assert zh_body["detail"][0]["msg"] == "proxy 上未配置任何模型"
    assert zh_body["detail"][0]["loc"] == ["body", "model"]
    assert zh_body["detail"][0]["type"] == "value_error"

    assert (await handler(_request(None), exc)).body == (await handler(_request("en-US"), exc)).body


@pytest.mark.asyncio
async def test_real_proxy_app_translates_internal_server_error() -> None:
    from litellm.proxy.proxy_server import app

    handler = app.exception_handlers[Exception]

    zh_body = json.loads((await handler(_request("zh-CN"), ValueError("boom"))).body)
    assert zh_body["error"]["message"] == "服务器内部错误"

    assert (await handler(_request(None), ValueError("boom"))).body == (
        await handler(_request("en-US"), ValueError("boom"))
    ).body
    assert (
        json.loads((await handler(_request(None), ValueError("boom"))).body)["error"]["message"]
        == "Internal server error"
    )
