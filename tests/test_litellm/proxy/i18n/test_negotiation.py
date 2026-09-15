import pytest

from litellm.proxy.i18n.negotiation import negotiate_locale


@pytest.mark.parametrize(
    "header,expected",
    [
        (None, None),
        ("", None),
        ("zh", "zh"),
        ("zh-CN", "zh"),
        ("zh-Hant", "zh"),
        ("zh-TW", "zh"),
        ("zh-CN,zh;q=0.9,en;q=0.8", "zh"),
        ("zh,en", "zh"),
        ("en", None),
        ("en-US,en;q=0.9", None),
        ("en,zh", None),
        ("en;q=1.0,zh;q=0.7", None),
        ("zh;q=0.3,en;q=0.9", None),
        ("fr-FR", None),
        ("*", None),
        ("zh;q=0", None),
        ("ZH-cn", "zh"),
        ("  zh  ", "zh"),
        ("zh;q=notanumber,en", None),
        ("de,fr;q=0.8", None),
    ],
)
def test_negotiate_locale(header: str | None, expected: str | None) -> None:
    assert negotiate_locale(header) == expected
