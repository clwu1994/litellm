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
        "Invalid API key": "无效的 API Key",
        "Invalid Authorization header format": "Authorization 请求头格式无效",
        "No API key provided": "未提供 API Key",
        "Authentication Error, No api key passed in.": "认证错误，未传入 api key。",
        "Invalid credentials used to access UI.": "访问 UI 的凭据无效。",
        (
            "Invalid credentials used to access UI.\nCheck 'UI_USERNAME', 'UI_PASSWORD' in .env file"
        ): "访问 UI 的凭据无效。\n请检查 .env 文件中的 'UI_USERNAME' 和 'UI_PASSWORD'",
        "No connected db.": "没有已连接的数据库。",
        "Invalid JWT token": "无效的 JWT Token",
        "Token Expired": "该 Token 已过期",
        (
            "DB not connected. This endpoint needs a database; set DATABASE_URL to a PostgreSQL connection string "
            "(postgresql://...) to enable it. See https://docs.litellm.ai/docs/proxy/virtual_keys"
        ): (
            "数据库未连接。该 endpoint 需要数据库；请将 DATABASE_URL 设置为 PostgreSQL 连接字符串"
            "（postgresql://...）以启用。参见 https://docs.litellm.ai/docs/proxy/virtual_keys"
        ),
        "This uses the enterprise folder - only available on the Docker image.": "此功能使用 enterprise 目录，仅在 Docker 镜像中可用。",
        "Key not found.": "未找到 Key。",
        "Invalid key format.": "Key 格式无效。",
        "Key Hash not found.": "未找到 Key Hash。",
        "Key not found in database": "数据库中未找到该 Key",
        "Invalid key_alias": "无效的 key_alias",
        "You are not authorized to check another user's keys": "你无权查看其他用户的 Key",
        "either key or key_alias must be provided": "必须提供 key 或 key_alias",
        "Prisma Client is not initialized": "Prisma Client 未初始化",
        "Database not connected": "数据库处于未连接状态。",
        "Please provide start_date and end_date": "请提供 start_date 和 end_date",
        "Start date and end date are required": "必须提供开始日期和结束日期",
        "Cannot edit config-based model. Store model in DB via /model/new first.": (
            "无法编辑基于 config 的模型。请先通过 /model/new 将模型存入数据库。"
        ),
        "Model updates only supported for DB-stored models": "仅支持更新存储在数据库中的模型",
        "Only proxy admins can change a model's blocked flag.": "只有 proxy 管理员才能修改模型的 blocked 标记。",
    }
)

TEMPLATE_MESSAGES: Final[Mapping[str, str]] = MappingProxyType(
    {
        (
            "Authentication Error, Invalid proxy server token passed. Received API Key = {api_key}, "
            "Key Hash (Token) ={token}. Unable to find token in cache or `LiteLLM_VerificationTokenTable`"
        ): (
            "认证错误，无效的 proxy server Token。收到的 API Key = {api_key}，Key Hash (Token) ={token}。"
            "无法在缓存或 `LiteLLM_VerificationTokenTable` 中找到该 Token"
        ),
        "Access forbidden: Route {route} not allowed": "访问被拒绝：route {route} 不在允许范围内",
        (
            "Authentication Error - Expired Key. Key Expiry time {expiry_time} and current time {current_time}"
        ): "认证错误 - Key 已过期。Key 过期时间 {expiry_time}，当前时间 {current_time}",
        (
            "Key with alias '{key_alias}' already exists. Unique key aliases across all keys are required."
        ): "别名 '{key_alias}' 的 Key 已存在。所有 Key 的别名必须唯一。",
        "Required param {param} not in data": "请求数据中缺少必填参数 {param}",
        "Invalid sort_order: {sort_order}. Must be one of: asc, desc": "无效的 sort_order: {sort_order}。必须是以下之一：asc、desc",
        "Model {model_id} not found on proxy.": "proxy 上未找到模型 {model_id}。",
    }
)
