"""Request-scoped message translation for proxy error responses."""

from litellm.proxy.i18n.handlers import (
    handle_http_exception,
    install_i18n,
    locale_for_request,
)
from litellm.proxy.i18n.translator import (
    translate_detail,
    translate_error_dict,
    translate_message,
    translate_problem,
    translate_validation_errors,
)

__all__ = (
    "handle_http_exception",
    "install_i18n",
    "locale_for_request",
    "translate_detail",
    "translate_error_dict",
    "translate_message",
    "translate_problem",
    "translate_validation_errors",
)
