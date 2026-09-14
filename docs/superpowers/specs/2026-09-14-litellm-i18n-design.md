# LiteLLM 国际化（zh / en）设计

状态：待评审
日期：2026-09-14
分支：feature/i18n

## 1. 背景

上游 LiteLLM 没有任何国际化能力，`ui/litellm-dashboard` 是英文硬编码，Python proxy 的错误消息也是英文硬编码。本 fork 需要新增国际化能力，先支持中文和英文，默认中文。

本设计的目标不只是"加一个语言包"，而是定义一套在 fork 场景下可持续的机制：能持续 merge upstream，且默认行为对现有 API 调用方零影响。

## 2. 范围

覆盖两个用户可见面：

- Admin UI dashboard（`ui/litellm-dashboard`，Next.js App Router）
- Python proxy 的用户可见消息（错误响应的 `message`、`detail`、`title`、pydantic 的 `msg`）

交付物包括：语言切换 UI、偏好持久化、翻译 catalog、术语规范、测试与 CI 校验。

## 3. 非目标

- 不做 URL 语言路由与 SEO（dashboard 是登录态后台，无 SEO 需求）
- 不做 Python raise 站点的消息 ID 重构（约 2200 处，upstream 合并成本不可接受）
- 不翻译日志、堆栈、开发者异常
- 不把 API 的默认语言改成中文
- 不做管理员配置的全局默认语言
- 不翻译 Model Hub 中来自模型数据源的描述文本
- 本阶段不新增 `zh-Hant`（繁体）catalog
- 本阶段不迁移存量的裸 `fetch` 调用

## 4. 兼容性契约

这是整个设计的地基，其余所有取舍由它推导。

### 4.1 触发规则

只有请求显式协商到中文时才翻译；其余一切情况完全不翻译。

| 请求 `Accept-Language` | 结果 |
| --- | --- |
| 缺失 | 不翻译（英文直通） |
| `zh`、`zh-CN`、`zh-SG`、`zh-Hans` | zh |
| `zh-TW`、`zh-HK`、`zh-Hant` | zh（已知限制，见 4.4） |
| `en`、`en-US`、`en-*` | 不翻译 |
| 其他任意语言 | 不翻译 |

判定依据是主语言子标签等于 `zh`。解析遵守 RFC 9110 的 q-value 语义。

服务端只维护一份 zh catalog。英文是源语言直通，不存在 en catalog，因此"未命中协商"与"不翻译"是同一件事。

### 4.2 语义不变量

不翻译时，响应的 **JSON 语义**与现有行为完全一致。具体地：

保持不变：`type`、`code`、`openai_code`、pydantic 错误的 `loc` 与 `type`、ProblemDetail 的 `type`（URI）、`headers`、HTTP status、所有非字符串值。

只允许变化：`message`、`detail`、`title`、`msg`。

翻译场景下同样只允许上述四个字段变化，其余字段必须逐字段全等。

### 4.3 无操作路径的逐字节一致性

translator 在"没有任何字段需要改动"时必须返回**原对象**（identity-preserving），而不是等值副本。

满足这一条时，无操作路径天然逐字节一致，因为上游代码路径里的 `JSONResponse(content={...})` 拿到的仍是同一个对象，序列化输入未变。

定位说明：对外的契约是 4.2 的语义不变量；逐字节一致是**无操作路径上的回归测试守卫**，不对外承诺为契约，因为字节级输出受 FastAPI/Python 序列化实现版本影响。这样既拿到强保证，又不会让依赖升级构成契约违约。

### 4.4 已知限制

`zh-Hant` / `zh-TW` / `zh-HK` 这轮映射到简体 zh catalog，繁体用户会看到简体。这样处理优于回退英文。待补 `zh-Hant` catalog 后改为精确映射，代码中留 TODO。

`RealtimePlayground.tsx:106` 使用 `new WebSocket`。浏览器 WebSocket API 不允许自定义请求头，该通道的服务端错误无法按 locale 翻译。本阶段该通道保持英文，后续可改为 query 参数传 locale。

## 5. 术语规范

### 5.1 判定档位

采用第 1 档：只保留品牌、厂商、协议、标准与 API 标识符的英文；业务实体正常使用中文。

保留英文：LiteLLM、OpenAI、Anthropic、Azure、Bedrock、Vertex、HTTP、JSON、JWT、SSO、OAuth、SAML、MCP、Webhook、SDK、CLI、URL、Base URL、API Key、Virtual Key、Token、Endpoint。

使用中文：模型、团队、用户、组织、预算、配额、护栏、路由、回退、缓存、花费、日志、密钥别名。

### 5.2 单一真源

术语清单放仓库根 `i18n/glossary.json`，作为唯一真源。

它**只在测试期**被读取，不是运行时资产，因此不做代码生成，也不需要同步校验。这样安排有事实依据：

- `ui/Dockerfile` 只 `COPY ui/litellm-dashboard/`，仓库根文件进不了 UI 构建上下文，所以它本来就不能充当运行时资产
- dashboard 侧术语校验只需要在 vitest 中读取仓库根文件
- Python 侧术语校验只需要在 pytest 中读取同一文件

两侧测试读同一份文件，漂移在结构上不可能发生。

### 5.3 校验算法

术语校验是**上下文敏感**的，不是 substring 黑名单。

数据形状：`{ "<英文术语>": ["<禁止出现的硬译>", ...] }`，例如 `{ "Endpoint": ["端点"], "Token": ["令牌"] }`。

算法：对每个翻译 key，取出 en 值与 zh 值。若 en 值命中某术语，且 zh 值包含该术语的任一禁止硬译，则报错。

这样 `JSON key`、`Redis key` 这类语境不会被误伤，因为术语表里没有裸单词 `key`。

## 6. Dashboard 架构

### 6.1 技术选型

react-i18next。理由：`next.config.mjs` 为 `output: "export"`，纯静态导出，没有 Node 服务与 middleware，next-intl 的 `[locale]` 路由方案要重构 48 个 `page.tsx` 与 4 个 `layout.tsx`，把导出体积翻倍，并叠加处理 proxy 的静态托管、`trailingSlash`、`assetPrefix` 组合，可能波及 `legacyPageRoutes`。react-i18next 不改路由树，风险最低。

### 6.2 目录结构

```
ui/litellm-dashboard/src/i18n/
  config.ts                 # SUPPORTED_LOCALES、DEFAULT_LOCALE="zh"、LOCALE_STORAGE_KEY、normalizeLocale
  resources.ts              # 静态 import zh/en 全部命名空间
  index.ts                  # 同步初始化 i18next，安装 locale-aware fetch
  installLocaleFetch.ts     # 全局 fetch 包装器
  glossary.ts               # 测试期读取仓库根 i18n/glossary.json
  locales/zh/*.json
  locales/en/*.json
ui/litellm-dashboard/src/contexts/LocaleProvider.tsx
ui/litellm-dashboard/src/components/Navbar/UserDropdown/LanguageSwitcher.tsx
```

### 6.3 初始化与静态导出

`index.ts` 在模块加载时同步初始化 i18next，用 `initImmediate: false` 配静态 resources。

初始语言：`typeof window !== "undefined" ? normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY)) ?? DEFAULT_LOCALE : DEFAULT_LOCALE`。

Next.js 的 App Router 在静态导出构建时会对 `"use client"` 组件做预渲染。由于初始化在模块加载时同步完成，预渲染出的 HTML 直接是中文。默认中文的用户首屏无闪烁。

显式选择 en 的用户，预渲染 HTML 是中文，hydration 后切换到 en。切换必须发生在 `useEffect` 中，保证首次客户端渲染与服务端 HTML 一致，不产生 hydration mismatch。

`<html lang>`：`layout.tsx` 中由 `lang="en"` 改为 `lang="zh"`，预渲染即正确。`LocaleProvider` 在 effect 中随切换更新 `document.documentElement.lang`。

### 6.4 偏好持久化

`localStorage`，key 为 `litellm_locale`。取值必须经 `normalizeLocale()` 归一为 `"zh" | "en"`，不信任原始字符串。

仓库规则禁止的是把 token 与 API key 放入 `localStorage`。语言偏好不是密钥，且需要跨浏览器关闭保留，与 `next-themes` 存主题的行为一致。

读写必须容错：浏览器隐私模式或存储被禁用时 `localStorage` 可能抛异常或不可用，此时静默退回默认 zh，不影响页面渲染。

不检测浏览器语言。需求是默认中文，不是跟随浏览器。

### 6.5 Accept-Language 全量注入

这是本设计唯一采用生产期全局补丁的地方，原因是仓库现状决定的。

**已验证的现状**：`src/lib/http/client.ts` 的文件注释声称它是全仓库唯一允许调用 `fetch` 的地方，但事实不成立。`eslint-suppressions.json` 中 `no-restricted-syntax` 有 205 处存量豁免，分布在 39 个文件；其中 `src/components/networking.tsx`（8163 行）占 150 处。eslint 规则只匹配裸标识符 `fetch(`，`window.fetch` 与 `globalThis.fetch` 直接逃逸；`axios` 在 `package.json` 中是依赖。因此在 `client.ts` 单点注入无法覆盖存量请求，会产生"大部分界面中文、个别错误英文"的隐蔽缺陷。

**方案**：单一全局 locale-aware fetch 包装器。

- 位置：`src/i18n/installLocaleFetch.ts`
- 安装：在 `src/i18n/index.ts` 模块作用域调用，以 `typeof window !== "undefined"` 守卫。模块作用域先于任何组件渲染执行，避免 effect 时序与首批请求竞争
- 幂等：包装器上打标记，重复安装直接返回
- 只追加不覆盖：仅当请求未携带 `Accept-Language` 时写入，调用方显式指定的值优先
- 取值：`normalizeLocale(i18n.language)`，调用时求值，因此切换语言后立即生效
- header 形态：必须同时正确处理对象、二维数组、`Headers` 实例三种 `HeadersInit`
- 覆盖面：`client.ts` 的 `fetch`、`api.ts` 的 `globalThis.fetch`（openapi-fetch 注入点）、`networking.tsx` 的 150 处、其余 38 个文件的直接调用，全部自动命中

**实施前必须验证**：检索是否存在模块作用域把 `fetch` 捕获为局部引用（如 `const f = fetch` / `= window.fetch`）后长期持有的写法。若有，该引用会逃逸包装器，需单独处理。

**lint 强化**：把 `no-restricted-syntax` 的选择器从 `callee.name='fetch'` 扩展到 `window.fetch`、`globalThis.fetch` 与对 `fetch` 的赋值，禁止新增旁路。205 处存量豁免按仓库既有惯例后续收敛，不塞进本轮。

**CI 契约**：新增测试断言经 `apiClient` 与经 `networking.tsx` 的请求都带上 `Accept-Language`，并断言调用方显式值不被覆盖。

### 6.6 语言切换器

放在 `src/components/Navbar/UserDropdown/` 下，所有登录用户可用。调用 `i18n.changeLanguage()` 并写入 `localStorage`。

不做管理员配置的全局默认语言。

### 6.7 命名空间与 key 约定

按路由区拆命名空间：`common`、`nav`、`keys`、`teams`、`users`、`models`、`logs`、`playground`、`guardrails`、`settings`、`errors`。

key 使用语义命名（如 `keys.table.title`），禁止用英文原文当 key，否则改文案即破坏 key。

`metadata.title` 是产品名，保持不动。

## 7. Python 架构

### 7.1 目录结构

新包 `litellm/proxy/i18n/`，全部是新文件，新文件不产生 merge 冲突：

```
litellm/proxy/i18n/
  __init__.py        # install(app)、translate_error_dict、negotiate_locale
  negotiation.py     # Accept-Language q-value 解析
  matcher.py         # 模板编译与查找
  translator.py      # 纯函数 translator 与字段白名单
  glossary.py        # 测试期读取仓库根 i18n/glossary.json
  catalog/zh.py      # 中文 catalog
```

### 7.2 匹配语义

catalog 为两级结构：

- 精确 map：静态文案走 O(1) 字典查找
- 模板列表：带插值的文案使用作者友好的 helper，例如 `pattern("Invalid proxy server token passed. Received API Key = {api_key}")`，内部对字面量做 `re.escape` 并把 `{name}` 转为命名捕获组，避免手写正则

命中后用 `{name}` 回填中文模板；未命中原样返回英文。

catalog 规模在几十到一两百条，且只在错误路径执行，不做过度优化。

### 7.3 歧义拒绝

catalog 构建期必须拒绝存在歧义的模板，不允许靠列表顺序解决。约束包括：

- 任一模板 A 不得匹配另一模板 B 的规范样例
- 不允许存在可被多个模板同时命中的输入
- 精确 map 与模板列表之间的遮蔽关系必须显式检测

这是构建期校验，违反即测试失败。

### 7.4 locale 协商

`Accept-Language` 没有现成依赖可用，`starlette` 与 `fastapi` 都不解析。按 RFC 9110 手写约 25 行 q-value 解析。

这是对"标准优先于手写"的刻意偏离：标准本身是 RFC 9110，实现极小，为解析一个请求头把 babel 加入 proxy 运行时依赖不划算。

### 7.5 translator 契约

translator 必须是纯函数：输入 error/response dict，输出结构完全相同的 dict，只允许改变白名单字段。

允许变化：`message`、`detail`、`title`、`msg`。

禁止变化：`type`、`code`、`openai_code`、`loc`、ProblemDetail 的 `type`、`headers`、status、所有非字符串值。

无操作时必须返回原对象，见 4.3。

### 7.6 接线点

全部改动集中在 `litellm/proxy/proxy_server.py` 第 1663 到 1829 行这一段，总计约 5 处小改动。这是全部 upstream 冲突面。

1. `openai_exception_handler`：`exc.to_dict()` 外套一层 `translate_error_dict(payload, request)`，一行改动
2. `otel_request_validation_exception_handler`：翻译每个 error 的 `msg`，以及 management-v1 分支的 `title` 与 `detail`。`loc` 与 `type` 绝对不动
3. 新增 `@app.exception_handler(HTTPException)`：**不重写已渲染的 body**。做法是克隆一个同 status、同 headers、`detail` 换成译文的 `HTTPException`，再委托 FastAPI 默认 handler。这样默认语义、headers、status 完全不动，且不需要 parse 再 render
4. 兜底 `Exception` handler 中写死的 `"Internal server error"` 接上翻译
5. `ManagementProblem` 的 `title` 与 `detail` 接上翻译，`type` URI 不译

`HTTPException` 的 `detail` 仅在 `isinstance(detail, str)` 时翻译；`dict`、`list`、`None` 一律原样保留。这一点必须显式实现，因为 `detail` 不保证是字符串。

新包通过 `install(app)` 一次注册 `HTTPException` handler。

## 8. 测试策略

### 8.1 Dashboard

- `config.ts`：`normalizeLocale` 的归一化行为、`DEFAULT_LOCALE` 等于 `zh`
- `LocaleProvider`：存储值优先于默认值、缺省为 zh、切换后持久化并更新 `<html lang>`
- `installLocaleFetch`：缺失时追加、调用方显式值优先、幂等、三种 `HeadersInit` 形态、经 `apiClient` 与经 `networking.tsx` 的请求都带上 header
- 中英 key 完全对齐，这是防漏翻最有价值的一条
- 术语校验：按 5.3 的上下文敏感算法
- 默认值断言：专门断言默认 locale 是 zh，以及 zh 渲染输出

存量 796 个测试文件大量断言英文文案，因此在 `tests/setupTests.ts` 中把测试环境 locale 固定为 `en`，让存量测试保持通过。测试环境固定 en 是工程约定，不改变生产默认值。

### 8.2 Python

路径镜像 `litellm/`，放 `tests/test_litellm/proxy/i18n/`，命名 `test_<filename>.py`。

- 协商：q 值排序、区域标签、通配、缺失 header、大小写、非法格式
- 匹配：精确、模板、未命中回退、占位符保真
- catalog 完整性：zh 与 en 占位符集合相等、出现次数一致、渲染后无残留 `{xxx}`
- 歧义拒绝：模板 A 不得匹配模板 B 的规范样例
- 结构不变量：递归断言白名单外字段全等，包括 `type`、`code`、`openai_code`、`loc`、ProblemDetail 的 `type`、非字符串值
- handler 级端到端：带 `Accept-Language: zh` 得到中文；不带 header 时与英文基线逐字节一致
- 漂移检测：用一组从代码中真实抓取的 message 断言 catalog 仍能命中。这是防上游改文案导致静默回退英文的主要手段

测试需满足仓库的 mutation testing 要求（>90% kill rate），因此上述断言需精确到能在实现被破坏时失败。

## 9. 分阶段实施

### Phase 0：机制与纵切

Phase 0 先产出三份 inventory，避免后续边做边发现导致 catalog 返工：

- Python message inventory：扫描 `ProxyException` 与 `HTTPException` raise 站点得到的粗名单
- Dashboard string inventory：扫描 JSX 硬编码文案与数据数组、toast、校验分支中的字符串
- 术语 inventory：`i18n/glossary.json` 初版

然后交付可演示的完整纵切：react-i18next 机制、全局 fetch 包装器、`LocaleProvider`、语言切换器、外壳区域抽取（`layout`、navbar、login、common 组件）、Python i18n 包，以及由 Python message inventory 中调用频次最高的条目构成的初版 catalog（目标约 30 条，具体条目由 inventory 决定，不预先拍定）。

完成后可端到端切换语言。

**本设计文档对应的实现计划只覆盖 Phase 0。** Phase 1 至 N 是批量抽取工作，按区域各自立计划与评审，不并入同一份实现计划。

### Phase 1 至 N：按区域抽取

按 6.7 的命名空间逐个路由区抽取文案，每区一个独立可评审的增量，按 Phase 0 的 inventory 消化。

### 覆盖率定义

翻译覆盖率定义为：**可用户观察字符串中已进入 i18n catalog 的比例**。

不使用"JSON key 数 / JSX 字符串数"这类比值，后者容易产生漂亮但无意义的数字。

### 规模预期

JSX 硬编码可见文案 700 处起步，另有大量字符串藏在数据数组、toast、表单校验与错误分支中，dashboard 实际抽取量远超 700。Python 侧可控，因为不碰 raise 站点。

## 10. 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| 上游改文案导致静默回退英文 | 漂移检测测试，用真实 message 断言 catalog 仍命中 |
| 存量测试断言英文文案 | 测试环境固定 locale 为 en，生产默认仍为 zh |
| 模板过宽或相互遮蔽导致错误翻译 | 构建期歧义拒绝，见 7.3 |
| locale JSON 推高 bundle | 先静态引入，等 bundle 预算报警再改按需加载；留意 `eslint-budgets.json` 与 `knip.json` 需登记新文件 |
| 静态导出下非默认语言有一次切换 | 已接受并记录，见 6.3 |
| 全局 fetch 包装器被模块作用域捕获的引用绕过 | 实施前检索 `const x = fetch` 类写法，见 6.5 |
| 新增裸 fetch 旁路 | lint 规则扩展到 `window.fetch` 与 `globalThis.fetch`，见 6.5 |
| WebSocket 通道无法传 locale | 已记录为限制，见 4.4 |
| 繁体用户看到简体 | 已记录为限制，待补 zh-Hant catalog，见 4.4 |
| upstream 冲突 | 冲突面限于 `proxy_server.py` 约 5 处改动，其余全为新文件 |

## 11. 附录：已验证的仓库事实

以下事实经实际检索确认，是本设计各项取舍的依据。

- `ui/litellm-dashboard/next.config.mjs` 使用 `output: "export"`，另有 `assetPrefix: "/litellm-asset-prefix"`、`trailingSlash: true`
- dashboard 无任何 i18n 依赖
- dashboard 有 48 个 `page.tsx`、4 个 `layout.tsx`
- `app/layout.tsx` 硬编码 `lang="en"`
- JSX 中硬编码可见文案 700 处起步
- 展示服务端错误消息的位置 252 处
- `src/lib/http/client.ts` 为全仓库唯一允许直接 `fetch` 的文件的说法不成立：205 处 `no-restricted-syntax` 豁免分布在 39 个文件，`networking.tsx` 占 150 处
- eslint 规则选择器为 `CallExpression[callee.name='fetch']`，不匹配 `window.fetch` 与 `globalThis.fetch`
- `src/lib/http/api.ts:52` 以 `globalThis.fetch` 作为 openapi-fetch 的 fetch 注入点
- `axios` 在 `package.json` 中是依赖，当前 `src` 中无 import
- `RealtimePlayground.tsx:106` 使用 `new WebSocket`
- `src/lib/http/runtime.ts` 已有 `registerBaseUrlGetter` / `registerAuthTokenGetter` 等依赖注入缝
- `src/components/Navbar/UserDropdown/` 已存在
- `tests/setupTests.ts` 是 vitest 全局 setup 入口，`tests/jsdomFetchEnv.ts` 提供环境
- dashboard 有 796 个测试文件
- proxy 侧有 305 处 `ProxyException(` 与 1908 处 `HTTPException(`
- 测试中精确断言错误文案的位置 17 处
- `litellm/proxy/proxy_server.py` 的异常处理器位于 1663 至 1829 行
- 无 `@app.exception_handler(HTTPException)`，当前走 FastAPI 默认实现
- `Accept-Language` 在 `litellm/` 中无任何既有使用
- `pyproject.toml` 无 babel / langcodes 等 locale 依赖
- `ui/Dockerfile` 只 `COPY ui/litellm-dashboard/`，仓库根文件无法进入 UI 构建上下文
- `backend/routes/allowlist.py` 列出控制面路径前缀（本设计最终未采用路径门控，因为 `litellm/` 不可依赖 `backend/`，且 `pyproject.toml` 未打包该目录）
