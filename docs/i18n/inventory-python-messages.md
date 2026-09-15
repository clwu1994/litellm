# Python proxy message inventory (Phase 0)

Frozen first-pass list of translatable user-facing messages raised from `litellm/proxy`. Phase 1 and Task 5 consume this list. Treat the counts as a lower bound.

## Seed command and what it actually returned

The Step 3 seed command was run verbatim from the repository root:

```bash
grep -rhoE '(ProxyException|HTTPException)\([^)]*message="[^"]*"' litellm --include=*.py | sort -u > docs/i18n/inventory-python-messages.txt
```

It produced **0 lines**. That is a real result, not a mistake in the run, and it is worth understanding before trusting any list derived from it.

The pattern cannot match the code the way it is written. Two independent reasons:

- `grep` is line-based and `[^)]*` cannot cross a newline. In this repository almost every `ProxyException(` and `HTTPException(` call puts its arguments on the following lines, so `message="..."` is never on the same physical line as the opening parenthesis.
- Even on one line, the pattern only matches `ProxyException(message="...")`. `HTTPException` carries its text in `detail=`, never in `message=`, so no `HTTPException` can ever match.

For reference, the raw token counts in `litellm` at the time of this inventory are `ProxyException` 521 occurrences and `HTTPException(` 1910 occurrences. The interesting content is there, it is just not reachable with that pattern.

## Supplementary extraction used to build this list

Because the seed command is empty, this inventory is built from an equivalent but line-agnostic extraction over the same tree. It scans for `ProxyException(` and `HTTPException(`, balances parentheses while skipping over string literals to find the true end of the call, then collects the string literals passed as `message=` (for `ProxyException`) or `detail=` (for `HTTPException`) anywhere inside that call. The implementation is committed at `scripts/i18n/inventory_python_messages.py`; run it from the repository root to print every group below:

```bash
python3 scripts/i18n/inventory_python_messages.py
```

Result: 583 distinct messages across 837 call sites in 93 files. Of these, 128 distinct `ProxyException` messages come from 30 files, and 457 distinct `HTTPException` details come from 79 files.

The counts dedupe at three levels and do not form a partition. The 128 and 457 figures count each message once per exception kind, so they total 585: `Invalid API key` and `Please provide start_date and end_date` are raised both as a `ProxyException` `message=` and as an `HTTPException` `detail=`. The per-group counts further down sum to 609, because a message raised from files in different groups appears in each of those groups; within a group, a message that appears in more than one file is listed under each file but counted once.

This extraction is still a heuristic, and the next section states what it misses.

## Limitations, and one of them matters a lot

The extraction only sees string literals that are passed directly to `message=` or `detail=`. It misses:

- messages assigned after construction, e.g. `e = ProxyException(...)` followed by `e.message = f"..."`. The token error Task 5 adds is exactly this shape.
- messages joined with `+` or passed as a variable or constant. f-strings are captured, with each interpolation normalized to a `{...}` placeholder
- messages carried by enum indirection. `litellm/proxy/_types.py` defines `CommonProxyErrors` (7 members) and the messages are used as `CommonProxyErrors.<name>.value`, so no literal sits at the raise site
- messages nested inside dict payloads, e.g. `detail={"error": "..."}` or `detail={"message": "..."}`
- non-proxy user-facing strings: `litellm/proxy` is the scope here, not the SDK core under `litellm/`

The enum and attribute-assignment gaps are not edge cases. Every message in the Task 5 subset except `Internal server error` is invisible to both the seed grep and this extraction. A later phase that treats this file as the complete catalog of messages will ship a catalog that misses precisely the messages the plan pinned.

## Messages the Task 5 subset needs that neither extraction captures

These are the messages Task 4 seeds and Task 5 grows and pins in its drift test. The checkbox marks them as the initial catalog subset. The location column shows why the greps miss them.

- [x] `No models configured on proxy`
  - source: litellm/proxy/_types.py (CommonProxyErrors.no_llm_router)
- [x] `Admin-only endpoint. Not allowed to access this.`
  - source: litellm/proxy/_types.py (CommonProxyErrors.not_allowed_access)
- [x] `Internal server error`
  - source: litellm/proxy/proxy_server.py (HTTPException detail)
- [x] `Invalid query parameter`
  - source: litellm/proxy/list_api/list_framework.py, litellm/proxy/proxy_server.py
- [x] `The request query parameters are invalid.`
  - source: litellm/proxy/proxy_server.py
- [x] `Unknown query parameter`
  - source: litellm/proxy/list_api/common.py
- [x] `Crossed TPM / RPM / Max Parallel Request Limit`
  - source: litellm/proxy/_types.py (CommonProxyErrors.max_parallel_request_limit_reached)
- [x] `` Authentication Error, Invalid proxy server token passed. Received API Key = {api_key}, Key Hash (Token) ={token}. Unable to find token in cache or `LiteLLM_VerificationTokenTable` ``
  - source: litellm/proxy/auth/user_api_key_auth.py (assigned to e.message, line 2006)

## The `CommonProxyErrors` enum group

These 7 messages are reachable from many dashboard surfaces and are prime catalog candidates. They live in `litellm/proxy/_types.py` and are referenced by enum member, so no grep for a literal will find them. Four members are listed here; the other three, `no_llm_router`, `not_allowed_access`, and `max_parallel_request_limit_reached`, are pinned in the Task 5 subset above, where their message text lives.

- [x] `DB not connected. This endpoint needs a database; set DATABASE_URL to a PostgreSQL connection string (postgresql://...) to enable it. See https://docs.litellm.ai/docs/proxy/virtual_keys`
  - source: `litellm/proxy/_types.py`, `CommonProxyErrors.db_not_connected_error`
- [ ] `` You must be a LiteLLM Enterprise user to use this feature. If you have a license please set `LITELLM_LICENSE` in your env. Get a 7 day trial key here: https://www.litellm.ai/enterprise#trial. \nPricing: https://www.litellm.ai/#pricing ``
  - source: `litellm/proxy/_types.py`, `CommonProxyErrors.not_premium_user`
- [ ] `` Missing litellm-enterprise package. Please install it to use this feature. Run `pip install litellm-enterprise` ``
  - source: `litellm/proxy/_types.py`, `CommonProxyErrors.missing_enterprise_package`
- [x] `This uses the enterprise folder - only available on the Docker image.`
  - source: `litellm/proxy/_types.py`, `CommonProxyErrors.missing_enterprise_package_docker`

## Message groups by dashboard reachability

Groups are ordered by wave first, then by call-site count. Waves follow the same logic as the dashboard inventory: Wave 1 is the auth, key, model and budget surfaces the Task 5 selection criteria names, Wave 2 is other admin surfaces, Wave 3 is proxy core and experimental or backend-only surfaces.

| Wave | Message group | Distinct messages | Call sites | Files |
| --- | --- | ---: | ---: | ---: |
| 1 | Auth and RBAC | 59 | 66 | 11 |
| 1 | SSO and login | 53 | 64 | 2 |
| 1 | Key management | 47 | 58 | 1 |
| 1 | Spend and budgets | 30 | 37 | 2 |
| 1 | JWT key mapping | 15 | 23 | 1 |
| 1 | Model management | 14 | 23 | 1 |
| 1 | Teams | 16 | 20 | 2 |
| 1 | Users | 9 | 10 | 1 |
| 1 | Organizations and customers | 6 | 8 | 2 |
| 2 | Guardrails | 42 | 66 | 7 |
| 2 | Config overrides and router settings | 40 | 47 | 5 |
| 2 | Tools tags and search | 22 | 36 | 3 |
| 2 | Policy engine | 14 | 32 | 3 |
| 2 | Files and batches | 17 | 30 | 6 |
| 2 | Agents and A2A | 16 | 24 | 5 |
| 2 | Pass-through endpoints | 20 | 24 | 3 |
| 2 | Prompts | 20 | 23 | 1 |
| 2 | Vector stores | 14 | 20 | 3 |
| 2 | Access groups and workflows | 10 | 19 | 2 |
| 2 | Memory and caching | 14 | 19 | 2 |
| 2 | Credentials | 6 | 10 | 1 |
| 3 | Proxy core | 61 | 87 | 11 |
| 3 | MCP server | 42 | 68 | 9 |
| 3 | Other endpoints | 22 | 23 | 9 |

## Wave 1 detail: candidate messages

Every message extracted for the Wave 1 groups is listed below. `{...}` marks an interpolated value and means the entry needs a template, not an exact-string match. An unchecked box is not yet in the catalog.

### Auth and RBAC

59 distinct messages, 66 call sites, 11 files.

`litellm/proxy/auth/auth_checks.py`

- [ ] `` Authentication Error, Invalid proxy server token passed. key={hashed_token}, not found in db. Create key via `/key/generate` call. ``
- [ ] `Client-side 'metadata.tags' not allowed in request. 'reject_clientside_metadata_tags'={general_settings['reject_clientside_metadata_tags']}. Tags can only be set via API key metadata.`
- [ ] `Requests made with this agent's key must include the x-litellm-trace-id header.`
- [ ] `Team member not allowed to access model. User={valid_token.user_id}, Team={team_object.team_id}, Model={model}. Allowed member models = {member_allowed_models}`
- [ ] `Tool(s) {disallowed} are not in the allowed tools list for this key/team.`
- [ ] `User not allowed to access model. No default model access, only team models allowed. Tried to access {model}`
- [ ] `User not allowed to access vector store. Tried to access {vector_store_id}. Only allowed to access {object_permissions.vector_stores}`
- [ ] `{object_type.capitalize()} not allowed to access search tool: {search_tool_name}. `
- [ ] `{object_type} not allowed to access model. This {object_type} can only access models={models}. Tried to access {model}`

`litellm/proxy/auth/auth_checks_organization.py`

- [ ] `Only proxy admins can create new organizations. You are {user_object.user_role}`
- [ ] `Passed organization_id is None, please pass an organization_id in your request`
- [ ] `Passed organization_id is None, please specify the organization_id in your request. You are part of multiple organizations: {_user_organizations}`
- [ ] `Tried to access route={route} but you are not a member of any organization. Please contact the proxy admin to request access.`
- [ ] `You do not have a role within the selected organization. Passed organization_id: {passed_organization_id}. Please contact the organization admin to request access.`
- [ ] `You do not have the required role to call {route}. Your role is {_user_role_in_passed_org} in Organization {passed_organization_id}`
- [ ] `You do not have the required role to perform {route} in Organization {passed_organization_id}. Your role is {user_role} in Organization {passed_organization_id}`

`litellm/proxy/auth/auth_exception_handler.py`

- [ ] `Authentication Error, `

`litellm/proxy/auth/auth_utils.py`

- [ ] `Access forbidden: IP address {passed_in_ip} not allowed.`
- [x] `Access forbidden: Route {route} not allowed`
- [ ] `Request size is too large. Request size is {header_size_mb} MB. Max size is {max_request_size_mb} MB`
- [ ] `Request size is too large. Request size is {request_size_mb} MB. Max size is {max_request_size_mb} MB`
- [ ] `Response size is too large. Response size is {response_size_mb} MB. Max size is {max_response_size_mb} MB`

`litellm/proxy/auth/handle_jwt.py`

- [x] `Token Expired`  (x2)
- [ ] `Email domain not allowed. User email: {user_email}. Allowed domain: {jwt_handler.litellm_jwtauth.user_allowed_email_domain}`
- [x] `Invalid JWT token`
- [ ] `` No team has access to the requested model: {requested_model}. Checked teams={team_ids}. Check `/models` to see all available models. ``
- [ ] `` No teams found in token. `enforce_team_based_model_access` is set to True. Token must belong to a team. ``
- [ ] `No user or team id found in token. enforce_rbac is set to True. Token must belong to a proxy admin, team, or user.`
- [ ] `Role={rbac_role} not allowed to call model={model}. Allowed models={role_based_models}`
- [ ] `Role={rbac_role} not allowed to call route={route}. Allowed routes={role_based_routes}`
- [ ] `Team '{header_team_id}' from x-litellm-team-id header is not in your JWT's allowed teams. Allowed teams: {list(allowed_team_ids)}`
- [ ] `Unmatched token passed in. enforce_rbac is set to True. Token must belong to a proxy admin, team, or user.`

`litellm/proxy/auth/login_utils.py`

- [ ] `` No Database connected. Set DATABASE_URL in .env. If set, use `--detailed_debug` to debug issue. ``  (x2)
- [ ] `Invalid credentials used to access UI.\nNot valid credentials for {username}`
- [x] `Invalid credentials used to access UI.{env_credentials_hint}`
- [ ] `` Master Key not set for Proxy. Please set Master Key to use Admin UI. Set `LITELLM_MASTER_KEY` in .env or set general_settings:master_key in config.yaml.  https://docs.litellm.ai/docs/proxy/virtual_keys. If set, use `--detailed_debug` to debug issue. ``
- [ ] `` User has no password set. Please set a password for the user via `/user/update`. ``
- [ ] `` set Proxy master key to use UI. https://docs.litellm.ai/docs/proxy/virtual_keys. If set, use `--detailed_debug` to debug issue. ``

`litellm/proxy/auth/password_policy.py`

- [ ] `Password does not meet the required policy: must `

`litellm/proxy/auth/resolvers/grants.py`

- [ ] `Authentication Error, user '{user_id}' no longer exists.`
- [ ] `Team '{team_id}' is not in your team memberships.`

`litellm/proxy/auth/route_checks.py`

- [ ] `user not allowed to access this route, role= {_user_role}. Trying to access: {route}`  (x3)
- [ ] `Virtual key is not allowed to call this route. Only allowed to call routes: {valid_token.allowed_routes}. Tried to call route: {route}`
- [ ] `key not allowed to access this user's info. user_id={user_id}, key's user_id={valid_token.user_id}`
- [ ] `user not allowed to access this OpenAI routes, role= {_user_role}`
- [ ] `user not allowed to access this route, role= {_user_role}. Trying to access: {route} and updating invalid param: {param}. only user_email and password can be updated`
- [ ] `user not allowed to access this route. Route={route} is an admin only route`

`litellm/proxy/auth/user_api_key_auth.py`

- [x] `Authentication Error - Expired Key. Key Expiry time {expiry_time} and current time {current_time}`  (x3)
- [ ] `JWT Key Mapping: No registered mapping for {virtual_key_claim_field}='{claim_value}'. Access denied.`  (x2)
- [ ] `'allow_user_auth' not set or set to False`
- [x] `Invalid API key`
- [ ] `Invalid API key, no token associated`
- [x] `Invalid Authorization header format`
- [ ] `JWT Auth is an enterprise only feature. {CommonProxyErrors.not_premium_user.value}`
- [x] `No API key provided`
- [x] `No connected db.`
- [ ] `Oauth2 token validation is only available for premium users. `

`litellm/proxy/management_helpers/team_member_permission_checks.py`

- [ ] `Team member does not have permissions for endpoint: {route}. You only have access to the following endpoints: {team_member_permissions} for team {team_table.team_id}. To create keys for this team, please ask your proxy admin to check the team member permission settings and update the settings to allow team member users to create keys.`
- [ ] `User {user_api_key_dict.user_id} does not belong to team {team_table.team_id}. Team-scoped key management endpoints can only be used for keys in your own team.`

### SSO and login

53 distinct messages, 64 call sites, 2 files.

`litellm/proxy/management_endpoints/sso/saml_sso.py`

- [ ] `SAML response exceeds the maximum allowed size.`  (x2)
- [ ] `SAML response is not bound to this browser's login request.`  (x2)
- [ ] `Could not parse an IdP entityID/SSO URL/certificate from the SAML metadata.`
- [ ] `Could not process SAML response: {e}`
- [ ] `Invalid SAML configuration: {e}`
- [ ] `Invalid SP metadata: {', '.join(errors)}`
- [ ] `SAML SSO is not configured. Set SAML_IDP_METADATA_URL or SAML_IDP_METADATA_XML.`
- [ ] `SAML assertion contained an invalid subject or email: {e}`
- [ ] `SAML assertion did not contain a usable subject (NameID) or email.`
- [ ] `SAML assertion has already been used (replay detected).`
- [ ] `SAML assertion is missing the required ID attribute.`
- [ ] `SAML authentication failed: {reason or ', '.join(errors)}`
- [ ] `SAML response references an unknown or already-used login request.`
- [ ] `Unsolicited (IdP-initiated) SAML responses are disabled.`

`litellm/proxy/management_endpoints/ui_sso.py`

- [ ] `Failed to retrieve user information from SSO`  (x2)
- [ ] `GENERIC_AUTHORIZATION_ENDPOINT not set. Set it in .env file`  (x2)
- [ ] `GENERIC_CLIENT_SECRET not set. Set it in .env file`  (x2)
- [ ] `GENERIC_TOKEN_ENDPOINT not set. Set it in .env file`  (x2)
- [ ] `GENERIC_USERINFO_ENDPOINT not set. Set it in .env file`  (x2)
- [ ] `GOOGLE_CLIENT_SECRET not set. Set it in .env file`  (x2)
- [ ] `Invalid verification code`  (x2)
- [ ] `MICROSOFT_CLIENT_SECRET not set. Set it in .env file`  (x2)
- [ ] `Missing authorization code in callback`  (x2)
- [ ] `CLI login is not ready`
- [ ] `Could not resolve team model grants for this login. Please try again`
- [ ] `` Could not resolve the model grants for team: {team_id}. Please run `lite login` again ``
- [ ] `Error checking session status: {e}`
- [ ] `Failed to decode id_token JWT: {decode_err}`
- [ ] `Failed to process CLI SSO: {e}`
- [ ] `GENERIC_CLIENT_ID must be set when PKCE is enabled`
- [ ] `GENERIC_TOKEN_ENDPOINT must be set when PKCE is enabled`
- [ ] `Invalid CLI login session id`
- [ ] `Invalid CLI polling secret`
- [ ] `MICROSOFT_TENANT not set. Set it in .env file`
- [ ] `` Master Key not set for Proxy. Please set Master Key to use Admin UI. Set `LITELLM_MASTER_KEY` in .env or set general_settings:master_key in config.yaml.  https://docs.litellm.ai/docs/proxy/virtual_keys. If set, use `--detailed_debug` to debug issue. ``
- [ ] `` Master Key not set for Proxy. Set `LITELLM_MASTER_KEY` in .env or general_settings:master_key in config.yaml. ``
- [ ] `Missing SAMLResponse in callback request.`
- [ ] `OAuth error: {oauth_error}`
- [ ] `PKCE verifier not found in cache for state '{state}'. {cause}`
- [ ] `Prisma client not found. Set it in the proxy_server.py file`
- [ ] `Result not returned by SSO provider.`
- [ ] `SSO authentication failed - no result returned from provider`
- [ ] `SSO user info unavailable: {detail}.`
- [ ] `Token endpoint request failed: {exc}`
- [ ] `Token endpoint returned invalid JSON: {json_err}`
- [ ] `Token exchange failed: {detail}`
- [ ] `Token exchange failed: {response.status_code} - {response.text[:500]}`
- [ ] `Too many CLI login attempts. Try again later.`
- [ ] `User does not belong to team: {team_id}. Available teams: {user_teams}`
- [ ] `User is not in the restricted SSO group: {restricted_sso_group}. User groups: {team_ids}. Received SSO response: {received_response}`
- [ ] `` You must be a LiteLLM Enterprise user to use SSO for more than 5 users. If you have a license please set `LITELLM_LICENSE` in your env. If you want to obtain a license meet with us here: https://enterprise.litellm.ai/demo You are seeing this error message because You configured SSO (one of `MICROSOFT_CLIENT_ID`, `GOOGLE_CLIENT_ID`, `GENERIC_CLIENT_ID`, or SAML) in your env. Please unset it ``
- [ ] `` You must be a LiteLLM Enterprise user to use SSO. If you have a license please set `LITELLM_LICENSE` in your env. If you want to obtain a license meet with us here: https://enterprise.litellm.ai/demo You are seeing this error message because You set one of `MICROSOFT_CLIENT_ID`, `GOOGLE_CLIENT_ID`, or `GENERIC_CLIENT_ID` in your env. Please unset this ``
- [ ] `return_to does not match the configured control_plane_url`

### Key management

47 distinct messages, 58 call sites, 1 files.

`litellm/proxy/management_endpoints/key_management_endpoints.py`

- [x] `Key not found.`  (x4)
- [ ] `Authentication Error, `  (x3)
- [x] `Invalid key format.`  (x2)
- [x] `Key Hash not found.`  (x2)
- [ ] `Unable to find team object in database. Team ID: {data.team_id}`  (x2)
- [ ] `You are not allowed to access this key's info. Your role={user_api_key_dict.user_role}`  (x2)
- [ ] `You are not authorized to access this endpoint. No 'user_id' is associated with your API key.`  (x2)
- [ ] `` team_id is required for service account keys. Please specify `team_id` in the request body. ``  (x2)
- [ ] `Allocated RPM limit={allocated_rpm} + Key RPM limit={data.rpm_limit} is greater than {entity_type} RPM limit={entity_rpm_limit}`
- [ ] `Allocated RPM limit={model_specific_rpm_limit.get(model, 0)} + Key RPM limit={rpm_limit} is greater than {entity_type} RPM limit={entity_model_specific_rpm_limit}`
- [ ] `Allocated RPM limit={model_specific_rpm_limit.get(model, 0)} + Key RPM limit={rpm_limit} is greater than {entity_type} RPM limit={entity_rpm_limit}`
- [ ] `Allocated TPM limit={allocated_tpm} + Key TPM limit={data.tpm_limit} is greater than {entity_type} TPM limit={entity_tpm_limit}`
- [ ] `Allocated TPM limit={model_specific_tpm_limit.get(model, 0)} + Key TPM limit={tpm_limit} is greater than {entity_type} TPM limit={entity_model_specific_tpm_limit}`
- [ ] `Allocated TPM limit={model_specific_tpm_limit.get(model, 0)} + Key TPM limit={tpm_limit} is greater than {entity_type} TPM limit={entity_tpm_limit}`
- [ ] `Caller is not a member of organization_id={organization_id}`
- [ ] `Cannot assign a key to an organization without a user_id on the caller's token`
- [ ] `Failed to delete keys got None response from delete_verification_token`
- [x] `Invalid key_alias`
- [ ] `Invalid key_alias format. Must be 2-255 characters, start/end with alphanumeric, and only contain a-zA-Z0-9_-/.@.`
- [ ] `Key health check failed: {e}`
- [x] `Key not found in database`
- [ ] `Key not found. No key with key_alias='{key_alias}'.`
- [x] `Key with alias '{key_alias}' already exists. Unique key aliases across all keys are required.`
- [ ] `Key={key.token} has a rpm_limit={key.rpm_limit} which is greater than the team's rpm_limit={team.rpm_limit}.`
- [ ] `Key={key.token} has a tpm_limit={key.tpm_limit} which is greater than the team's tpm_limit={team.tpm_limit}.`
- [ ] `Multiple keys share key_alias='{key_alias}', so it cannot be used as an identifier.`
- [ ] `Non-admin users cannot remove the user_id from a key.`
- [ ] `Organization not found for organization_id={_org_id_to_check}`
- [ ] `Organization not found for organization_id={data.organization_id}`
- [ ] `Personal key creation has been restricted by admin. Allowed roles={personal_key_generation['allowed_user_roles']}. Your role={user_api_key_dict.user_role}`
- [ ] `Project reassignment is not supported. Use null to detach the key.`
- [x] `Required param {param} not in data`
- [ ] `Team member role {team_member_object.role} not in allowed_team_member_roles={team_key_generation['allowed_team_member_roles']}`
- [ ] `Team not found for team_id={data.team_id}. Non-admin users cannot create keys for non-existent teams.`
- [ ] `Team not found for team_id={data.team_id}. Non-admin users cannot set keys to non-existent teams.`
- [ ] `User={assigned_user_id} not assigned to team={team_table.team_id}`
- [ ] `User={change_initiated_by.user_id} is not a Proxy Admin or Team Admin for team={team.team_id}. Please ask your Proxy Admin to allow this action under 'Member Permissions' for this team.`
- [ ] `` User={key.user_id} is not a member of the team={team.team_id}. Check team members via `/team/info`. ``
- [ ] `User={user_api_key_dict.user_id} not assigned to team={team_table.team_id}`
- [x] `You are not authorized to check another user's keys`
- [ ] `You are not authorized to check this organization's keys`
- [ ] `You are not authorized to check this team's keys`
- [x] `either key or key_alias must be provided`
- [ ] `key_alias is required when auto_rotate=True and store_virtual_keys is enabled. This ensures stable secret naming during rotation.`
- [ ] `` prisma_client is required for service account keys. Please specify `prisma_client` in the request body. ``
- [ ] `` team_id does not exist in the database. Please specify a valid `team_id` in the request body. ``
- [ ] `{reserved_field} is immutable once set and cannot be changed via update.`

### Spend and budgets

30 distinct messages, 37 call sites, 2 files.

`litellm/proxy/management_endpoints/cost_tracking_settings.py`

- [ ] `Margin percentage for {provider} must be between 0 and 10 (0% to 1000%)`  (x2)
- [ ] `Discount for {provider} must be a number`
- [ ] `Discount for {provider} must be between 0 and 1 (0% to 100%)`
- [ ] `Fixed margin amount for {provider} must be a number`
- [ ] `Fixed margin amount for {provider} must be non-negative`
- [ ] `Margin config for {provider} cannot be empty. Must include 'percentage' and/or 'fixed_amount'`
- [ ] `Margin for {provider} must be a number (percentage) or dict with 'percentage' and/or 'fixed_amount'`
- [ ] `Margin percentage for {provider} must be a number`

`litellm/proxy/spend_tracking/spend_management_endpoints.py`

- [x] `Prisma Client is not initialized`  (x5)
- [ ] `/spend/tags Error`  (x2)
- [x] `Please provide start_date and end_date`  (x2)
- [ ] `/global/spend Error`
- [ ] `/global/spend/logs Error`
- [ ] `/spend/all_tag_names Error`
- [ ] `/spend/logs Error`
- [ ] `/spend/report endpoint `
- [ ] `Bad Request - Either 'model' or 'completion_response' must be provided`
- [ ] `Bad Request - messages must be provided if 'model' is provided`
- [x] `Database not connected`
- [ ] `Date range too large; maximum is {_SPEND_REPORT_MAX_RANGE_DAYS} days`
- [ ] `Invalid cache_hit_filter: {cache_hit_filter}. Must be one of: hit, miss`
- [ ] `Invalid date format: {date_str}. Expected: {expected}`
- [ ] `Invalid sort_by: {sort_by}. Must be one of: {', '.join(sorted(valid_sort_fields))}`
- [x] `Invalid sort_order: {sort_order}. Must be one of: asc, desc`
- [ ] `No organization_id associated with this API key; pass an organization_id query param`
- [ ] `No {scope_name} associated with this API key; pass a {scope_name} query param`
- [ ] `Not authorized to view spend for a {scope_name} other than your own`
- [x] `Start date and end date are required`
- [ ] `start_date and end_date must be in YYYY-MM-DD format`
- [ ] `start_date must be on or before end_date`

### JWT key mapping

15 distinct messages, 23 call sites, 1 files.

`litellm/proxy/management_endpoints/jwt_key_mapping_endpoints.py`

- [x] `Database not connected`  (x5)
- [ ] `Mapping not found`  (x4)
- [ ] `The provided key does not match an existing virtual key.`  (x2)
- [ ] `A mapping for claim '{data.jwt_claim_name}' = '{data.jwt_claim_value}' already exists.`
- [ ] `A mapping with those claim values already exists.`
- [ ] `Failed to create JWT key mapping.`
- [ ] `Failed to delete JWT key mapping.`
- [ ] `Failed to get JWT key mapping info.`
- [ ] `Failed to list JWT key mappings.`
- [ ] `Failed to update JWT key mapping.`
- [ ] `Only proxy admins can create JWT key mappings`
- [ ] `Only proxy admins can delete JWT key mappings`
- [ ] `Only proxy admins can get JWT key mapping info`
- [ ] `Only proxy admins can list JWT key mappings`
- [ ] `Only proxy admins can update JWT key mappings`

### Model management

14 distinct messages, 23 call sites, 1 files.

`litellm/proxy/management_endpoints/model_management_endpoints.py`

- [ ] `Authentication Error, `  (x3)
- [x] `Cannot edit config-based model. Store model in DB via /model/new first.`  (x2)
- [ ] `Error updating public model groups: {e}`  (x2)
- [x] `Model updates only supported for DB-stored models`  (x2)
- [x] `Model {model_id} not found on proxy.`  (x2)
- [x] `Only proxy admins can change a model's blocked flag.`  (x2)
- [ ] `tier_labels must be a JSON object of tier name to display name: {e}`  (x2)
- [ ] `{violation} {AUTO_ROUTER_LICENSE_REMEDY}`  (x2)
- [ ] `Error updating model blocked status: {e}`
- [ ] `Error updating model: {e}`
- [ ] `Model {data.model_id} not found on proxy.`
- [ ] `Only a proxy admin can attach a stored credential (litellm_credential_name) to a model. Your role={user_api_key_dict.user_role}.`
- [ ] `Only a proxy admin can set aws_session_tags on a model. Your role={user_api_key_dict.user_role}.`
- [ ] `context_window_size must be non-negative`

### Teams

16 distinct messages, 20 call sites, 2 files.

`litellm/proxy/management_endpoints/team_callback_endpoints.py`

- [ ] `Internal Server Error, `  (x4)
- [ ] `You do not have access to this team`
- [ ] `callback_name = {data.callback_name} already exists in team_callback_settings, for team_id = {team_id} and event = {data.callback_type}`

`litellm/proxy/management_endpoints/team_endpoints.py`

- [ ] `All users are already in team. Existing members={existing_team_row.members_with_roles}`
- [ ] `Allocated RPM limit={allocated_rpm} + Team RPM limit={data.rpm_limit} is greater than {entity_type} RPM limit={entity_rpm_limit}`
- [ ] `Allocated RPM limit={model_specific_rpm_limit.get(model, 0)} + Team RPM limit={rpm_limit} is greater than {entity_type} RPM limit={entity_model_specific_rpm_limit}`
- [ ] `Allocated RPM limit={model_specific_rpm_limit.get(model, 0)} + Team RPM limit={rpm_limit} is greater than {entity_type} RPM limit={entity_rpm_limit}`
- [ ] `Allocated TPM limit={allocated_tpm} + Team TPM limit={data.tpm_limit} is greater than {entity_type} TPM limit={entity_tpm_limit}`
- [ ] `Allocated TPM limit={model_specific_tpm_limit.get(model, 0)} + Team TPM limit={tpm_limit} is greater than {entity_type} TPM limit={entity_model_specific_tpm_limit}`
- [ ] `Allocated TPM limit={model_specific_tpm_limit.get(model, 0)} + Team TPM limit={tpm_limit} is greater than {entity_type} TPM limit={entity_tpm_limit}`
- [ ] `` Assigning team admins is a premium feature. You must be a LiteLLM Enterprise user to use this feature. If you have a license please set `LITELLM_LICENSE` in your env. Get a 7 day trial key here: https://www.litellm.ai/#trial. Pricing: https://www.litellm.ai/#pricing ``
- [ ] `Authentication Error, `
- [ ] `Error searching teams: {e}`
- [ ] `License is over limit. Please contact support@berri.ai to upgrade your license.`
- [ ] `Organization not found for organization_id={data.organization_id}`
- [ ] `User already in team. Member: user_id={data.member.user_id}, user_email={data.member.user_email}. Existing members={existing_team_row.members_with_roles}`
- [ ] `You do not have access to this team`

### Users

9 distinct messages, 10 call sites, 1 files.

`litellm/proxy/management_endpoints/internal_user_endpoints.py`

- [ ] `Only proxy admins can modify user roles.`  (x2)
- [ ] `Authentication Error, `
- [ ] `Error searching users: {e}`
- [ ] `License is over limit. Please contact support@berri.ai to upgrade your license.`
- [ ] `Only proxy admins can create administrative users (proxy_admin, proxy_admin_viewer). Attempted to create user with role: {data.user_role}. Your role: {user_api_key_dict.user_role}`
- [ ] `Only proxy admins can update all users at once.`
- [ ] `User not found: {user_id}`
- [ ] `User {user_id} not found`
- [ ] `user_id is required. Either pass it as a query parameter or authenticate with a user-bound key.`

### Organizations and customers

6 distinct messages, 8 call sites, 2 files.

`litellm/proxy/management_endpoints/customer_endpoints.py`

- [ ] `Customer already exists, passed user_id={data.user_id}. Please pass a new user_id.`
- [ ] `End User Id(s)={} do not exist in db`
- [ ] `End User Id={data.user_id} does not exist in db`
- [ ] `End User Id={end_user_id} does not exist in db`

`litellm/proxy/management_endpoints/organization_endpoints.py`

- [ ] `You do not have access to this organization`  (x3)
- [ ] `Authentication Error, `

## Wave 2 and Wave 3 detail: candidate messages

Every message extracted for the Wave 2 and Wave 3 groups is listed below in the same format as Wave 1, grouped by the file that raises it. Regenerate all of them from `scripts/i18n/inventory_python_messages.py`:

```bash
python3 scripts/i18n/inventory_python_messages.py
```

### Guardrails

42 distinct messages, 66 call sites, 7 files.

`litellm/proxy/guardrails/guardrail_endpoints.py`

- [ ] `Prisma client not initialized`  (x9)
- [ ] `Admin access required to manage guardrails`  (x4)
- [ ] `Guardrail with ID {guardrail_id} not found`  (x4)
- [ ] `Guardrail submission not found`  (x3)
- [ ] `Admin access required`  (x2)
- [ ] `Guardrail is not pending review (status={row.status})`  (x2)
- [ ] `Invalid guardrail configuration, update rejected: {update_error}`  (x2)
- [ ] `You are not a member of team {team_id!r}`  (x2)
- [ ] `Admin access required to test custom code guardrails`
- [ ] `Category file not found: {category_name} (tried .yaml and .json)`
- [ ] `Error reading category file: {e}`
- [ ] `Error reading major_airlines.json: {e}`
- [ ] `Guardrail '{request.guardrail_name}' not found. Please ensure the guardrail is configured in your LiteLLM proxy.`
- [ ] `Guardrail configuration error: {init_error}`
- [ ] `Guardrail litellm_params is missing or invalid`
- [ ] `Guardrail with name {request.guardrail_name!r} already exists`
- [ ] `Invalid category name`
- [ ] `Invalid guardrail configuration, update rejected: {validation_error}`
- [ ] `Max depth of {DEFAULT_MAX_RECURSE_DEPTH} exceeded while processing model fields. Please check the model structure for excessive nesting.`
- [ ] `Only guardrails with litellm_params.guardrail={GENERIC_GUARDRAIL_API!r} are accepted for registration`
- [ ] `You are not a member of the team that owns this submission`
- [ ] `litellm_params.api_base is required for generic_guardrail_api`
- [ ] `litellm_params.api_base must contain a valid hostname`
- [ ] `litellm_params.api_base must use http or https scheme`
- [ ] `litellm_params.mode is required (e.g. pre_call, post_call)`
- [ ] `major_airlines.json not found`
- [ ] `team_id is required. Provide it in the request body or use a team-scoped API key.`

`litellm/proxy/guardrails/guardrail_hooks/akto/akto.py`

- [ ] `Akto guardrail service unreachable`

`litellm/proxy/guardrails/guardrail_hooks/bedrock_guardrails.py`

- [ ] `Bedrock guardrail throttle retries exhausted`

`litellm/proxy/guardrails/guardrail_hooks/model_armor/model_armor.py`

- [ ] `{self.guardrail_name}: streamed response could not be assembled for scanning, blocking it`

`litellm/proxy/guardrails/guardrail_hooks/onyx/onyx.py`

- [ ] `Request blocked by Onyx Guard. Violations: {detection_message}.`

`litellm/proxy/guardrails/guardrail_hooks/prompt_security/prompt_security.py`

- [ ] `Blocked by Prompt Security, Violations: `  (x2)
- [ ] `File sanitization timeout`  (x2)
- [ ] `Document sanitization failed: {e}`
- [ ] `Failed to get jobId from Prompt Security`
- [ ] `File sanitization failed: {e}`
- [ ] `Unexpected sanitization status: {status}`
- [ ] `{resource_name} blocked by Prompt Security. Violations: {', '.join(violations)}`

`litellm/proxy/guardrails/usage_endpoints.py`

- [ ] `start_date and end_date must be in YYYY-MM-DD format`  (x2)
- [ ] `Date range too large; maximum is {_USAGE_MAX_RANGE_DAYS} days`
- [ ] `Guardrail not found`
- [ ] `Prisma client not initialized`
- [ ] `start_date must be on or before end_date`

### Config overrides and router settings

40 distinct messages, 47 call sites, 5 files.

`litellm/proxy/management_endpoints/auto_router_endpoints.py`

- [ ] `No shadow eval job {job_id}`  (x2)
- [ ] `. `
- [ ] `Invalid date format: {value}. Expected: 'YYYY-MM-DD'`
- [ ] `Job {job_id} is already {current.status}`
- [ ] `No auto-routed turns recorded for session {session_id!r} under this key`
- [ ] `Not a configured auto-router: {', '.join(repr(n) for n in unconfigured)}`
- [ ] `Only a proxy admin can {action}`
- [ ] `Only proxy admin roles can {action}`
- [ ] `end_date must not be earlier than start_date`
- [ ] `models not served by this proxy: `
- [ ] `target_type and target_id filter together; pass both or neither`
- [ ] `{field_name} '{model}' is an auto-router; it must be a plain model`

`litellm/proxy/management_endpoints/cache_settings_endpoints.py`

- [ ] `Error fetching cache settings: {e}`
- [ ] `Error updating cache settings: {e}`

`litellm/proxy/management_endpoints/config_override_endpoints.py`

- [ ] `At least one authentication method is required: `  (x2)
- [ ] `Failed to initialize secret manager: {e}`  (x2)
- [ ] `Only admin users can delete config overrides`  (x2)
- [ ] `Only admin users can update config overrides`  (x2)
- [ ] `Only admin users can view config overrides`  (x2)
- [ ] `CyberArk API Base is required`
- [ ] `CyberArk authentication failed: {e}`
- [ ] `CyberArk is not configured. Save a configuration first.`
- [ ] `CyberArk token validation failed: {e}`
- [ ] `Failed to persist CyberArk configuration: {e}`
- [ ] `Hashicorp Vault is not configured. Save a configuration first.`
- [ ] `Only admin users can test CyberArk connection`
- [ ] `Only admin users can test Vault connection`
- [ ] `Vault Address is required`
- [ ] `Vault authentication failed: {e}`
- [ ] `Vault token validation failed: {e}`

`litellm/proxy/ui_crud_endpoints/proxy_setting_endpoints.py`

- [ ] `Database not connected. Please connect a database.`
- [ ] `File size too large. Maximum size is 5MB.`
- [ ] `IP address already exists`
- [ ] `IP address not found`
- [ ] `Invalid file type. Allowed types: {', '.join(allowed_extensions)}`
- [ ] `Only proxy admins can update MCP semantic filter settings.`
- [ ] `Only proxy admins can update MCP tool search settings.`
- [ ] `Only proxy admins can update UI settings.`
- [ ] `Only proxy admins can upload a UI logo.`

`litellm/proxy/ui_crud_endpoints/user_banner_endpoints.py`

- [ ] `Database not connected. Please connect a database.`
- [ ] `Only proxy admins can update the user banner.`

### Tools tags and search

22 distinct messages, 36 call sites, 3 files.

`litellm/proxy/management_endpoints/tag_management_endpoints.py`

- [x] `Database not connected`  (x6)
- [ ] `Invalid date format, expected YYYY-MM-DD: {e}`
- [ ] `Model {deployment.model_info.id} not found in database`
- [ ] `Tag {data.name} not found`
- [ ] `Tag {tag.name} already exists`
- [ ] `Tag {tag.name} not found`
- [ ] `Tags not found: {missing_tags}`
- [ ] `start_date and end_date must be provided together`
- [ ] `start_date must be on or before end_date`

`litellm/proxy/management_endpoints/tool_management_endpoints.py`

- [ ] `Key or team not found for the given identifier`  (x2)
- [ ] `Provide either team_id or key_hash, not both`  (x2)
- [ ] `Tool '{tool_name}' not found`  (x2)
- [ ] `At least one of input_policy or output_policy must be provided`
- [ ] `At least one of team_id or key_hash is required to identify the override`
- [ ] `Failed to update policy for tool '{data.tool_name}'`
- [ ] `Failed to update policy override for tool '{data.tool_name}'`
- [ ] `Invalid date format: {value}. Expected: 'YYYY-MM-DD'`
- [ ] `No override found for tool '{tool_name}' with the given scope`
- [ ] `Only proxy admin roles can view tool spend across the deployment`

`litellm/proxy/search_endpoints/search_tool_management.py`

- [ ] `Prisma client not initialized`  (x5)
- [ ] `Search tool with ID {search_tool_id} not found`  (x3)
- [ ] `search_provider is required in litellm_params`

### Policy engine

14 distinct messages, 32 call sites, 3 files.

`litellm/proxy/management_endpoints/policy_endpoints/endpoints.py`

- [ ] `Parameter '{llm_enrichment['parameter']}' is required`
- [ ] `Policy '{policy_name}' not found`
- [ ] `Policy engine not initialized. No policies loaded.`
- [ ] `Template '{data.template_id}' not found`
- [ ] `Template does not support LLM enrichment`
- [ ] `competitors list exceeds maximum of {MAX_COMPETITOR_NAMES}`

`litellm/proxy/policy_engine/policy_endpoints.py`

- [x] `Database not connected`  (x13)
- [ ] `Policy with ID {policy_id} not found`  (x4)
- [ ] `Attachment with ID {attachment_id} not found`  (x2)
- [ ] ` | `
- [ ] `Invalid pipeline: {e}`
- [ ] `Only draft versions can be updated. Publish or create a new version to change published/production.`
- [ ] `Policy '{request.policy_name}' not found. Create the policy first.`
- [ ] `Policy with name '{request.policy_name}' already exists`

`litellm/proxy/policy_engine/policy_resolve_endpoints.py`

- [x] `Database not connected`  (x2)

### Files and batches

17 distinct messages, 30 call sites, 6 files.

`litellm/proxy/batches_endpoints/common_utils.py`

- [ ] `Invalid 'limit': integer {bound} value. Expected a value {expected}, but got {limit} instead.`

`litellm/proxy/fine_tuning_endpoints/endpoints.py`

- [ ] `Invalid request, No litellm managed file id or custom_llm_provider provided.`  (x3)
- [ ] `LLM Router not initialized. Ensure models added to proxy.`
- [ ] `target_model_names on list fine-tuning jobs must be a list of one model name. Example: ['gpt-4o']`

`litellm/proxy/openai_files_endpoints/batch_file_validation.py`

- [ ] `Batch input file has no request lines. The file was not forwarded to the provider.`

`litellm/proxy/openai_files_endpoints/common_utils.py`

- [ ] `Invalid 'limit': integer {bound} value. Expected a value {expected}, but got {limit} instead.`
- [ ] `Invalid purpose: {purpose}. Must be one of: {valid_purposes}`
- [ ] `Managed resource ownership validation is unavailable.`
- [ ] `The caller does not have access to this managed {resource_kind} id.`

`litellm/proxy/openai_files_endpoints/files_endpoints.py`

- [ ] `Managed files hook is not a BaseFileEndpoints`  (x4)
- [ ] `Managed files hook not found`  (x4)
- [ ] `LLM Router not found`  (x3)
- [ ] `` Either 'provider' or 'target_model_names' must be provided e.g. `?target_model_names=gpt-4o` ``
- [ ] `Invalid purpose: {purpose}. Must be one of: {valid_purposes}`
- [ ] `LLM Router not initialized. Ensure models added to proxy.`
- [ ] `Raw cloud storage file ids can only be deleted by a proxy admin key. Use the LiteLLM managed file id returned when the file was created.`
- [ ] `Raw cloud storage file ids cannot be retrieved directly. Use the LiteLLM managed file id returned when the file was created.`
- [ ] `Storage backend error: {e}`
- [ ] `target_model_names on list files must be a list of one model name. Example: ['gpt-4o']`

`litellm/proxy/openai_files_endpoints/storage_backend_service.py`

- [ ] `Uploading with target_model_names requires a database-connected proxy, and this proxy has no database configured`

### Agents and A2A

16 distinct messages, 24 call sites, 5 files.

`litellm/proxy/a2a/endpoints.py`

- [ ] `Discovery failed: {exc}`

`litellm/proxy/agent_endpoints/a2a_endpoints.py`

- [ ] `Agent '{agent_id}' is not allowed for your key/team. Contact proxy admin for access.`  (x2)
- [ ] `Agent '{agent_id}' has no agent card configured`
- [ ] `Agent '{agent_id}' not found`
- [ ] `Push notification URL must be a string`
- [ ] `Push notification URL must use HTTPS`
- [ ] `params must be an object`
- [ ] `pushNotificationConfig must be an object`

`litellm/proxy/agent_endpoints/a2a_routing.py`

- [ ] `Agent '{agent_name}' is not allowed for your key/team. Contact proxy admin for access.`

`litellm/proxy/agent_endpoints/endpoints.py`

- [ ] `Agent with ID {agent_id} not found`  (x5)
- [ ] `Prisma client not initialized`  (x3)
- [ ] `Agent '{agent_id}' is not allowed for your key/team. Contact proxy admin for access.`
- [ ] `Agent with ID {agent_id} not found in DB.`
- [ ] `Agent with name {agent.agent_name} already in public agent groups`
- [ ] `Agent with name {request.get('agent_name')} already exists`

`litellm/proxy/discovery_endpoints/agent_skills_endpoints.py`

- [ ] `No installable skill archive for: {skill_id}`
- [ ] `Not Found`

### Pass-through endpoints

20 distinct messages, 24 call sites, 3 files.

`litellm/proxy/pass_through_endpoints/llm_passthrough_endpoints.py`

- [ ] `'stream' is not a Comprehend Medical request member`
- [ ] `AWS region not found. Set AWS_REGION_NAME in the proxy environment.`
- [ ] `Collection name is required. Got {request_body}`
- [ ] `Collection {collection_name} is not a litellm managed vector store index. Only litellm managed vector store indexes are supported.`
- [ ] `Cursor API key not found. Add Cursor credentials via the UI (Models + Endpoints → LLM Credentials) or set CURSOR_API_KEY environment variable.`
- [ ] `Expected an X-Amz-Target header of the form {COMPREHEND_MEDICAL_TARGET_PREFIX}.<Operation>`
- [ ] `Provider {custom_llm_provider} api base not found`
- [ ] `Provider {custom_llm_provider} not found`
- [ ] `Request body must be a JSON object`
- [ ] `Unable to find Milvus vector store config.`
- [ ] `Unable to find Milvus vector store index registry or vector store registry.`
- [ ] `Watsonx passthrough config not found`
- [ ] `bedrock-agent-runtime pass-through is disabled on this proxy.`
- [ ] `collectionName must be a string. Got {type(_raw_collection_name).__name__}`

`litellm/proxy/pass_through_endpoints/managed_id_rewriter.py`

- [ ] `Managed resource not found.`  (x5)
- [ ] `Access denied to managed resource.`
- [ ] `Too many resource identifiers in request.`

`litellm/proxy/pass_through_endpoints/pass_through_endpoints.py`

- [ ] `Method {request.method} is not allowed for pass-through endpoint {path}.`
- [ ] `Pass-through endpoint {endpoint} not found. This could have been deleted or not yet added to the proxy.`
- [ ] `Upstream passthrough request failed with status {response.status_code}`

### Prompts

20 distinct messages, 23 call sites, 1 files.

`litellm/proxy/prompts/prompt_endpoints.py`

- [ ] `Cannot update config prompts.`  (x2)
- [ ] `Prompt with ID {base_prompt_id} not found in environment {env}`  (x2)
- [ ] `Prompt {prompt_id} not found`  (x2)
- [ ] `Cannot delete config prompts.`
- [ ] `Error converting prompt file: {e}`
- [ ] `Failed to initialize prompt`
- [ ] `Failed to patch prompt`
- [ ] `Failed to update prompt`
- [ ] `File must have .prompt extension`
- [ ] `Model is required in dotprompt metadata`
- [ ] `No messages found in rendered prompt`
- [ ] `No versions found for prompt ID {base_prompt_id}`
- [ ] `Only proxy admins can create prompts`
- [ ] `Only proxy admins can delete prompts`
- [ ] `Only proxy admins can patch prompts`
- [ ] `Only proxy admins can update prompts`
- [ ] `Only proxy admins can view prompt versions`
- [ ] `Prompt with ID {base_prompt_id} not found`
- [ ] `Prompt with ID {prompt_id} not found`
- [ ] `You are not authorized to access this prompt. Your role - {user_api_key_dict.user_role}, Your key's prompts - {prompts}`

### Vector stores

14 distinct messages, 20 call sites, 3 files.

`litellm/proxy/vector_store_endpoints/endpoints.py`

- [ ] `Index {index_create_request.index_name} already exists`
- [ ] `LLM Router not initialized. Ensure models are added to proxy.`
- [ ] `Managed vector stores not configured. Please ensure the proxy is initialized with database support.`
- [ ] `target_model_names must be a comma-separated string or list of model names`

`litellm/proxy/vector_store_endpoints/management_endpoints.py`

- [x] `Database not connected`  (x4)
- [ ] `Access denied: You do not have permission to access this vector store`  (x2)
- [ ] `Vector store with ID {vector_store_id} not found`  (x2)
- [ ] `Access denied: You do not have permission to delete this vector store`
- [ ] `Vector store with ID {data.vector_store_id} not found`
- [ ] `Vector store with ID {vector_store_id} already exists`
- [ ] `vector_store_id and custom_llm_provider are required`

`litellm/proxy/vector_store_endpoints/utils.py`

- [ ] `Unable to validate vector store access`  (x2)
- [ ] `User does not have permission to call vector store endpoint {index_name}. Ask your administrator to add the necessary permissions to your API key/Team.`
- [ ] `User does not have permission to call vector store file endpoint {vector_store_id}. Ask your administrator to add the necessary permissions to your API key/Team.`

### Access groups and workflows

10 distinct messages, 19 call sites, 2 files.

`litellm/proxy/management_endpoints/access_group_endpoints.py`

- [ ] `Access group '{access_group_id}' not found`  (x4)
- [ ] `Access group '{data.access_group_name}' already exists`  (x2)
- [ ] `Access group '{update_data.get('access_group_name', '')}' already exists`
- [ ] `Failed to delete access group. Please try again.`
- [ ] `Unknown team ids: {', '.join(sorted(missing))}`

`litellm/proxy/management_endpoints/workflow_management_endpoints.py`

- [ ] `Run '{run_id}' not found`  (x5)
- [ ] `Concurrent write conflict — please retry`  (x2)
- [ ] `Failed to append event`
- [ ] `Failed to append message`
- [ ] `No fields to update`

### Memory and caching

14 distinct messages, 19 call sites, 2 files.

`litellm/proxy/caching_routes.py`

- [ ] `Cache not initialized. litellm.cache is None`  (x3)
- [ ] `Service Unhealthy ({e})`  (x2)
- [ ] `Cache Delete Failed({e})`
- [ ] `` Cache type {litellm.cache.type} does not support deleting a key. only `redis` is supported ``
- [ ] `Cache type {litellm.cache.type} does not support flushing`
- [ ] `Cache type {litellm.cache.type} does not support redis info`

`litellm/proxy/memory/memory_endpoints.py`

- [ ] `Memory with key '{key}' not found`  (x3)
- [ ] `Cannot create a new memory via PUT without a 'value'.`
- [ ] `Memory with key '{body.key}' already exists.`
- [ ] `Memory with key '{key}' already exists.`
- [ ] `Only proxy admins may set team_id to a different team.`
- [ ] `Only proxy admins may set user_id to a different user.`
- [ ] `Request body must include at least one of: value, metadata.`
- [ ] `You do not have permission to modify this memory entry.`

### Credentials

6 distinct messages, 10 call sites, 1 files.

`litellm/proxy/credential_endpoints/endpoints.py`

- [ ] `Model not found`  (x4)
- [ ] `Credential not found. Got credential name: `  (x2)
- [ ] `Credential not found in DB.`
- [ ] `Credential values are required. Unable to infer credential values from model ID.`
- [ ] `LLM router not found`
- [ ] `LLM router not found. Please ensure you have a valid router instance.`

### Proxy core

61 distinct messages, 87 call sites, 11 files.

`litellm/proxy/common_request_processing.py`

- [ ] `Invalid request format: {error_msg}`

`litellm/proxy/common_utils/debug_utils.py`

- [ ] `Failed to set GC thresholds: {e}`

`litellm/proxy/common_utils/http_parsing_utils.py`

- [ ] `Invalid JSON payload: {e}`  (x2)
- [ ] `File size is too large. Please check your file size. Passed file size: {file_content_size_in_mb} MB. Max file size: {max_file_size_mb} MB`
- [ ] `Invalid form payload: {e}`
- [ ] `Tried setting max_file_size_mb for /audio/transcriptions. {CommonProxyErrors.not_premium_user.value}`

`litellm/proxy/custom_auth_auto.py`

- [x] `Invalid API key`

`litellm/proxy/health_endpoints/_health_endpoints.py`

- [ ] `Authentication Error, `
- [ ] `Invalid or missing X-Drain-Token`
- [ ] `Not Found`
- [ ] `Service Unhealthy ({e})`

`litellm/proxy/litellm_pre_call_utils.py`

- [ ] `Invalid type for '{field}': expected an object, but got {received_type} instead.`

`litellm/proxy/plugin_routes.py`

- [ ] `LITELLM_SALT_KEY is not configured; plugin iframe auth unavailable.`
- [ ] `Plugin '{plugin_name}' is not registered.`

`litellm/proxy/proxy_server.py`

- [ ] `Access denied. Admin role required. Current role: {user_api_key_dict.user_role}`  (x9)
- [ ] `Database connection not available`  (x6)
- [ ] `Authentication Error, `  (x3)
- [x] `Prisma Client is not initialized`  (x3)
- [ ] `Hours must be greater than 0`  (x2)
- [ ] `Internal server error`  (x2)
- [ ] `` Master Key not set for Proxy. Please set Master Key to use Admin UI. Set `LITELLM_MASTER_KEY` in .env or set general_settings:master_key in config.yaml.  https://docs.litellm.ai/docs/proxy/virtual_keys. If set, use `--detailed_debug` to debug issue. ``  (x2)
- [ ] `Not Found`  (x2)
- [ ] `/v3/login is only available on workers with control_plane_url configured`
- [ ] `/v3/login/exchange is only available on workers with control_plane_url configured`
- [ ] `Database not available`
- [ ] `Default favicon not found`
- [ ] `Error deleting callback: `
- [ ] `Failed to cancel anthropic beta headers reload: {e}`
- [ ] `Failed to cancel model cost map reload: {e}`
- [ ] `Failed to get anthropic beta headers reload status: {e}`
- [ ] `Failed to get model cost map reload status: {e}`
- [ ] `Failed to get model cost map source info: {e}`
- [ ] `Failed to reload anthropic beta headers: {e}`
- [ ] `Failed to reload model cost map: {e}`
- [ ] `Failed to reload model cost map: {reload_result.reason}. Current pricing data was kept.`
- [ ] `Failed to schedule anthropic beta headers reload: {e}`
- [ ] `Failed to schedule model cost map reload: {e}`
- [ ] `Favicon not found`
- [ ] `File name is None. Please check your file name`
- [ ] `Invalid or expired login code`
- [ ] `Invalid scope parameter. Only 'expand' is currently supported. Received: {scope}`
- [ ] `Invalid sortOrder: {sortOrder}. Must be 'asc' or 'desc'`
- [ ] `MCP handler did not respond in time`
- [ ] `MCP server, toolset, or access group '{mcp_server_name}' not found`
- [ ] `Missing 'code' parameter`
- [ ] `Model '{model_id}' not found in router configuration`
- [ ] `Only proxy admins can update config`
- [ ] `Router not initialized`
- [ ] `Token counting is disabled and no provider API result available`
- [ ] `Toolset '{toolset_name}' not found`
- [ ] `prompt or messages or contents must be provided`

`litellm/proxy/public_endpoints/public_endpoints.py`

- [ ] `Internal Server Error ({e})`

`litellm/proxy/response_api_endpoints/endpoints.py`

- [ ] `Polling response {response_id} not found`  (x2)
- [ ] `Redis cache not configured.`  (x2)
- [ ] `Failed to cancel polling response`
- [ ] `Failed to delete polling response`
- [ ] `Polling response {response_id} not found or expired`
- [ ] `Redis cache not configured. Polling requires Redis.`

`litellm/proxy/utils.py`

- [ ] `Authentication Error: invalid user key - token does not exist`
- [ ] `Authentication Error: invalid user key - user key does not exist in db. User Key={token}`
- [ ] `Invalid fallback_type. Must be one of: {valid_fallback_types}`
- [ ] `The following model(s) do not exist or are not accessible: {}`
- [ ] `` The model `{model_id}` does not exist or is not accessible ``

### MCP server

42 distinct messages, 68 call sites, 9 files.

`litellm/proxy/_experimental/mcp_server/auth/user_api_key_auth_mcp.py`

- [ ] `Invalid or expired credential`  (x9)
- [ ] `Server misconfigured: master_key is not set`  (x2)
- [ ] `Server misconfigured: no database connection`  (x2)
- [ ] `Multiple Authorization headers are not allowed`
- [ ] `Server misconfigured: MCP server has no routable name`
- [ ] `Server misconfigured: mcp_session_token_signing is invalid`

`litellm/proxy/_experimental/mcp_server/byok_oauth_endpoints.py`

- [ ] `login_required`  (x2)
- [ ] `Only S256 code_challenge_method is supported`
- [ ] `Too many pending authorization flows`
- [ ] `Unknown proxy root path`
- [ ] `code_challenge is required`
- [ ] `redirect_uri is required`
- [ ] `response_type must be 'code'`

`litellm/proxy/_experimental/mcp_server/discoverable_endpoints.py`

- [ ] `Authorization code was issued for a different MCP server`  (x2)
- [ ] `MCP server not found`  (x2)
- [ ] `MCP upstream registration endpoint returned no usable client_id`  (x2)
- [ ] `Invalid redirect URI`
- [ ] `MCP server '{mcp_server_name}' is {description}`
- [ ] `MCP server authorization url is not set`
- [ ] `Unsupported grant_type`
- [ ] `code is required for authorization_code grant`
- [ ] `code_verifier is required to redeem this authorization code`
- [ ] `redirect_uris is required to register a client with this server`
- [ ] `refresh_token is required for refresh_token grant`

`litellm/proxy/_experimental/mcp_server/mcp_server_manager.py`

- [ ] `MCP stdio command '{resolved_server.command}' is not in the allowlist ({sorted(MCP_STDIO_ALLOWED_COMMANDS)}). `
- [ ] `OAuth metadata discovery changed repeatedly; retry shortly`
- [ ] `OAuth metadata discovery {reason} for MCP server {server_ref!r}`

`litellm/proxy/_experimental/mcp_server/outbound_credentials/adapter.py`

- [ ] `Unauthorized`  (x2)

`litellm/proxy/_experimental/mcp_server/rest_endpoints.py`

- [ ] `Toolset '{toolset_name}' not found`

`litellm/proxy/_experimental/mcp_server/server.py`

- [ ] `Unauthorized`  (x8)
- [ ] `User not allowed to call this tool.`  (x2)
- [ ] `User not allowed to get this prompt.`  (x2)
- [ ] `API key does not have access to toolset '{toolset_id}'.`
- [ ] `API key is scoped to no MCP servers; toolset access is denied.`
- [ ] `Forbidden`
- [ ] `Request arguments are required`
- [ ] `Tool '{name}' not found`
- [ ] `User not allowed to read this resource.`

`litellm/proxy/_experimental/mcp_server/tool_search.py`

- [ ] `Unknown MCP proxy tool: {name}`
- [ ] `User not allowed to call this tool.`

`litellm/proxy/management_endpoints/mcp_management_endpoints.py`

- [ ] `MCP Server with ID {server_id} not found`
- [ ] `MCP registry is not enabled`
- [ ] `Restricted virtual keys cannot query team-scoped MCP servers.`
- [ ] `You do not have permission to view MCP servers for this team.`

### Other endpoints

22 distinct messages, 23 call sites, 9 files.

`litellm/proxy/container_endpoints/handler_factory.py`

- [ ] `Missing required 'file' field`

`litellm/proxy/container_endpoints/ownership.py`

- [ ] `Forbidden`  (x2)
- [ ] `Unable to record container ownership: caller has no identity scope.`
- [ ] `Unable to track container`

`litellm/proxy/example_config_yaml/pipeline_test_guardrails.py`

- [ ] `AlwaysBlockFilter: all content blocked`
- [ ] `StrictFilter: content contains forbidden word 'bad'`

`litellm/proxy/hooks/cache_control_check.py`

- [ ] `Not allowed to set {k} as a cache control. Contact admin to change permissions.`

`litellm/proxy/hooks/responses_id_security.py`

- [ ] `Forbidden. The response id is not associated with the team, who this key belongs to. To disable this security feature, set general_settings::disable_responses_id_security to True in the config.yaml file.`
- [ ] `Forbidden. The response id is not associated with the user, who this key belongs to. To disable this security feature, set general_settings::disable_responses_id_security to True in the config.yaml file.`

`litellm/proxy/image_endpoints/endpoints.py`

- [ ] `'{_field}' must be provided as a multipart file upload, not a string.`
- [ ] `Cannot specify both 'image' and 'image[]'`
- [ ] `Cannot specify both 'mask' and 'mask[]'`
- [ ] `Field required: image`

`litellm/proxy/logging_endpoints/callback_logs_endpoints.py`

- [ ] `/v1/rust_control_plane/logs is admin-only (proxy admin key required).`

`litellm/proxy/management_endpoints/gateway_request_endpoints.py`

- [ ] `Only proxy admin roles can view gateway request counts across the deployment`

`litellm/proxy/management_endpoints/user_agent_analytics_endpoints.py`

- [ ] `Failed to fetch DAU analytics: {e}`
- [ ] `Failed to fetch MAU analytics: {e}`
- [ ] `Failed to fetch WAU analytics: {e}`
- [ ] `Failed to fetch distinct user agent tags: {e}`
- [ ] `Failed to fetch per-user analytics: {e}`
- [ ] `Failed to fetch tag summary analytics: {e}`
- [ ] `Invalid date format. Use YYYY-MM-DD: {e}`
