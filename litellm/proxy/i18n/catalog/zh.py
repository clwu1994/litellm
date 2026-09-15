"""Chinese messages. Technical terms stay in English per i18n/glossary.json."""

from collections.abc import Mapping
from types import MappingProxyType
from typing import Final

EXACT_MESSAGES: Final[Mapping[str, str]] = MappingProxyType(
    {
        "No models configured on proxy": "proxy 上未配置任何模型",
        "Admin-only endpoint. Not allowed to access this.": "仅管理员可访问的 endpoint，无权访问。",
        "Internal server error": "服务器内部错误",
        "Invalid query parameter": "无效的查询参数",
        "The request query parameters are invalid.": "请求的查询参数无效。",
        "Unknown query parameter": "未知的查询参数",
        "Crossed TPM / RPM / Max Parallel Request Limit": "已超出 TPM / RPM / 最大并发请求限制",
    }
)

TEMPLATE_MESSAGES: Final[Mapping[str, str]] = MappingProxyType({})
