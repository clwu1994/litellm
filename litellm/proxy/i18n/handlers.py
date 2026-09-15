"""HTTP-boundary translation wiring. The only module that knows about FastAPI."""

from __future__ import annotations

from typing import Final

from fastapi import FastAPI
from fastapi.exception_handlers import http_exception_handler as _default_http_exception_handler
from fastapi.responses import Response
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request

from litellm.proxy.i18n.negotiation import negotiate_locale
from litellm.proxy.i18n.translator import translate_detail

_ACCEPT_LANGUAGE: Final = "accept-language"


def locale_for_request(request: Request) -> str | None:
    return negotiate_locale(request.headers.get(_ACCEPT_LANGUAGE))


async def handle_http_exception(request: Request, exc: StarletteHTTPException) -> Response:
    translated_detail: Final = translate_detail(exc.detail, locale_for_request(request))
    if translated_detail is exc.detail:
        return await _default_http_exception_handler(request, exc)
    return await _default_http_exception_handler(
        request,
        StarletteHTTPException(
            status_code=exc.status_code,
            detail=translated_detail,  # pyright: ignore[reportArgumentType]  # starlette stubs say str|None
            headers=exc.headers,
        ),
    )


def install_i18n(app: FastAPI) -> None:
    app.add_exception_handler(
        StarletteHTTPException,
        handle_http_exception,  # pyright: ignore[reportArgumentType]  # FastAPI widens the handler's exc to Exception
    )
