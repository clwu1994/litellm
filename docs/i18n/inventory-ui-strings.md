# Dashboard UI string inventory (Phase 0)

Frozen first-pass list of translatable strings in the `ui/litellm-dashboard` dashboard. Phase 1 consumes this list so the catalog work is planned against a fixed set of route areas instead of being rediscovered page by page.

## How this list was produced

Seed command, run from the repository root:

```bash
cd ui/litellm-dashboard && grep -rEo '>[A-Z][a-z]+ [a-z]+' src --include=*.tsx | sort | uniq -c | sort -rn > ../../docs/i18n/inventory-ui-strings.txt
```

The grep produced 663 `(file, string)` pairs covering 700 matches across 292 files and 61 route areas. The raw text file is a transient intermediate. It was mined into this document and deleted.

Note that a subset of the matches, 19 of them, sits in `*.test.tsx` files. Test input is not user-facing and should be dropped before the strings are extracted for translation. The counts in this document include them, because the seed command includes them.

## Limitations of the seed pattern

The pattern `>[A-Z][a-z]+ [a-z]+` only matches a JSX text node that starts with a capital letter and has at least two words, with no intervening markup. It undercounts the real translation surface in these ways:

- it misses single-word labels, e.g. `>Save<`, `>Delete<`, `>Cancel<`
- it misses sentences of three or more words beyond the first two, and any string broken up by inline tags such as `<b>`, `<code>` or `<Trans>`
- it misses every string passed as a prop, e.g. `placeholder=`, `title=`, `label=`, `aria-label=`, `tooltip=`, `description=`, `helperText=`, and the `message` argument of toast and notification calls
- it misses template literals and any string built by concatenation or interpolation, so error text assembled from parts is invisible here
- it misses strings in `.ts`/`.tsx` modules that are not route components, e.g. enum, constant and config files under `src/lib`, `src/utils` and `src/data`
- it matches on `>` anywhere in the line, so a small number of matches can come from comparison operators rather than JSX text

Treat the counts as a lower bound and a prioritization signal, not as a complete string count. Phase 1 must rerun a broader extraction (AST-based, keyed on JSX text plus user-facing props) before it claims a page is fully covered.

## Proposed consumption order

Ordering is a proposal for Phase 1, from highest to lowest expected user reach. The order is by wave first, then by seed match count inside each wave. Waves are grouped by how often a deployment touches the surface, not by file count:

- **Wave 1** covers the surfaces nearly every deployment uses daily: login, virtual keys, models, teams and users, spend and usage, logs, and the top-level settings pages
- **Wave 2** covers admin and configuration surfaces that an admin opens when changing policy or routing
- **Wave 3** covers specialized and experimental surfaces: MCP, agents, playground, chat, AI Hub, coding-agent plugins. Several of these are behind feature flags or enterprise licenses

## Summary

| Wave | Route area | Seed matches | Files |
| --- | --- | ---: | ---: |
| 1 | `components (root)` | 90 | 24 |
| 1 | `components/add_model` | 57 | 26 |
| 1 | `components/Settings` | 33 | 14 |
| 1 | `components/shared` | 14 | 8 |
| 1 | `components/team` | 12 | 5 |
| 1 | `app/(dashboard)/usage` | 11 | 5 |
| 1 | `app/(dashboard)/users` | 9 | 3 |
| 1 | `components/templates` | 9 | 2 |
| 1 | `app/(dashboard)/models-and-endpoints` | 7 | 6 |
| 1 | `components/view_logs` | 7 | 7 |
| 1 | `components/model_dashboard` | 6 | 3 |
| 1 | `components/organisms` | 5 | 2 |
| 1 | `components/Navbar` | 4 | 3 |
| 1 | `components/DeletedKeysPage` | 3 | 2 |
| 1 | `components/DeletedTeamsPage` | 3 | 2 |
| 1 | `components/model_add` | 3 | 2 |
| 1 | `components/ui` | 3 | 2 |
| 1 | `app/(dashboard)/admin-panel` | 2 | 1 |
| 1 | `app/(dashboard)/budgets` | 2 | 2 |
| 1 | `app/(dashboard)/old-usage` | 2 | 1 |
| 1 | `app/login` | 2 | 1 |
| 1 | `app/onboarding` | 2 | 1 |
| 1 | `components/EntityUsageExport` | 2 | 2 |
| 1 | `components/organization` | 2 | 1 |
| 1 | `components/permissions` | 2 | 2 |
| 1 | `app/(dashboard) (shell)` | 1 | 1 |
| 1 | `app/(dashboard)/organizations` | 1 | 1 |
| 1 | `components/ModelSelect` | 1 | 1 |
| 1 | `components/VirtualKeysPage` | 1 | 1 |
| 1 | `components/molecules` | 1 | 1 |
| 2 | `app/(dashboard)/guardrails` | 56 | 20 |
| 2 | `app/(dashboard)/policies` | 36 | 12 |
| 2 | `app/(dashboard)/vector-stores` | 27 | 10 |
| 2 | `app/(dashboard)/cost-optimization` | 26 | 8 |
| 2 | `app/(dashboard)/prompts` | 20 | 14 |
| 2 | `app/(dashboard)/search-tools` | 16 | 5 |
| 2 | `app/(dashboard)/cost-tracking` | 15 | 5 |
| 2 | `app/(dashboard)/projects` | 8 | 3 |
| 2 | `app/(dashboard)/guardrails-monitor` | 7 | 5 |
| 2 | `components/common_components` | 7 | 5 |
| 2 | `app/(dashboard)/caching` | 6 | 4 |
| 2 | `app/(dashboard)/workflows` | 5 | 1 |
| 2 | `app/(dashboard)/access-groups` | 4 | 2 |
| 2 | `components/PassThroughSettings` | 4 | 2 |
| 2 | `components/routing_groups` | 4 | 4 |
| 2 | `app/(dashboard)/tag-management` | 2 | 1 |
| 2 | `components/CloudZeroCostTracking` | 2 | 1 |
| 2 | `components/router_settings` | 2 | 2 |
| 2 | `app/(dashboard)/router-settings` | 1 | 1 |
| 2 | `app/(dashboard)/transform-request` | 1 | 1 |
| 2 | `components/email_events` | 1 | 1 |
| 3 | `app/(dashboard)/mcp-servers` | 57 | 18 |
| 3 | `app/(dashboard)/playground` | 36 | 11 |
| 3 | `app/(dashboard)/agents` | 15 | 6 |
| 3 | `components/chat` | 14 | 6 |
| 3 | `components/AIHub` | 9 | 3 |
| 3 | `components/claude_code_plugins` | 7 | 2 |
| 3 | `components/mcp_server_management` | 6 | 1 |
| 3 | `app/(dashboard)/skills` | 4 | 3 |
| 3 | `components/mcp_tools` | 3 | 2 |
| 3 | `app/chat` | 2 | 1 |

## Per-area detail

### components (root)

Seed matches: 90. Files: 24.

- `src/components/CreateUserButton.tsx`
- `src/components/GuardrailSettingsView.tsx`
- `src/components/HelpLink.test.tsx`
- `src/components/LicenseExpiryBanner.tsx`
- `src/components/SSOModals.tsx`
- `src/components/SidebarUsageCard.tsx`
- `src/components/TeamSSOSettings.test.tsx`
- `src/components/TeamSSOSettings.tsx`
- `src/components/ToolDetail.tsx`
- `src/components/activity_metrics.tsx`
- `src/components/add_pass_through.tsx`
- `src/components/bulk_create_users_button.tsx`
- `src/components/cloudzero_export_modal.tsx`
- `src/components/email_settings.tsx`
- `src/components/logging_settings_view.tsx`
- `src/components/model_info_view.tsx`
- `src/components/object_permissions_view.tsx`
- `src/components/pass_through_info.tsx`
- `src/components/per_user_usage.tsx`
- `src/components/price_data_reload.tsx`
- `src/components/public_model_hub.tsx`
- `src/components/route_preview.tsx`
- `src/components/settings.tsx`
- `src/components/user_agent_activity.tsx`

### components/add_model

Seed matches: 57. Files: 26.

- `src/components/add_model/AccessGroupTagsCombobox.tsx`
- `src/components/add_model/AdaptiveRoutingConfig.tsx`
- `src/components/add_model/AffinityControls.tsx`
- `src/components/add_model/AutoRouterRoutingTest.tsx`
- `src/components/add_model/ClassificationMethodConfig.tsx`
- `src/components/add_model/ClassifierCircuitBreakerConfig.tsx`
- `src/components/add_model/ClassifierPromptEditor.tsx`
- `src/components/add_model/ClassifierVisionConfig.tsx`
- `src/components/add_model/ComplexityRouterConfig.tsx`
- `src/components/add_model/CompressionControls.tsx`
- `src/components/add_model/ContextWindowEscalationConfig.tsx`
- `src/components/add_model/CustomDimensionRows.tsx`
- `src/components/add_model/HeuristicScoringConfig.tsx`
- `src/components/add_model/KeywordTierRules.tsx`
- `src/components/add_model/ModalityRoutingControls.tsx`
- `src/components/add_model/ModelChoiceCombobox.tsx`
- `src/components/add_model/NonReasoningTierToggle.tsx`
- `src/components/add_model/OpeningPromptEditor.tsx`
- `src/components/add_model/ResponseFormatControls.tsx`
- `src/components/add_model/SemanticKeywordMatching.tsx`
- `src/components/add_model/StallEscalationConfig.tsx`
- `src/components/add_model/TierModelEffortRows.tsx`
- `src/components/add_model/add_auto_router_tab.tsx`
- `src/components/add_model/conditional_public_model_name.tsx`
- `src/components/add_model/model_connection_test.tsx`
- `src/components/add_model/provider_specific_fields.tsx`

### components/Settings

Seed matches: 33. Files: 14.

- `src/components/Settings/AdminSettings/CyberArk/CyberArk.tsx`
- `src/components/Settings/AdminSettings/HashicorpVault/HashicorpVault.tsx`
- `src/components/Settings/AdminSettings/MCPSemanticFilterSettings/MCPSemanticFilterSettings.tsx`
- `src/components/Settings/AdminSettings/MCPSemanticFilterSettings/MCPSemanticFilterTestPanel.tsx`
- `src/components/Settings/AdminSettings/MCPToolSearchSettings/MCPToolSearchSettings.tsx`
- `src/components/Settings/AdminSettings/SSOSettings/RedactableField.tsx`
- `src/components/Settings/AdminSettings/SSOSettings/RoleMappings.tsx`
- `src/components/Settings/AdminSettings/SSOSettings/SSOSettings.tsx`
- `src/components/Settings/AdminSettings/UISettings/UISettings.tsx`
- `src/components/Settings/AdminSettings/UserBannerSettings/UserBannerSettings.tsx`
- `src/components/Settings/LoggingAndAlerts/LoggingCallbacks/LoggingCallbacksTable.tsx`
- `src/components/Settings/RouterSettings/Fallbacks/FallbackGroupConfig.tsx`
- `src/components/Settings/RouterSettings/Fallbacks/FallbackSelectionForm.tsx`
- `src/components/Settings/RouterSettings/Fallbacks/Fallbacks.tsx`

### components/shared

Seed matches: 14. Files: 8.

- `src/components/shared/Alert.test.tsx`
- `src/components/shared/DataTable/DataTable.tsx`
- `src/components/shared/DataTable/DataTablePagination.tsx`
- `src/components/shared/InheritedBudgetHint.tsx`
- `src/components/shared/PageHeader.test.tsx`
- `src/components/shared/advanced_date_picker.tsx`
- `src/components/shared/charts/area_chart.tsx`
- `src/components/shared/charts/bar_chart.tsx`

### components/team

Seed matches: 12. Files: 5.

- `src/components/team/AvailableTeamsTable.tsx`
- `src/components/team/LoggingSettings.tsx`
- `src/components/team/MyUserTab.tsx`
- `src/components/team/TeamInfo.tsx`
- `src/components/team/member_permissions.tsx`

### app/(dashboard)/usage

Seed matches: 11. Files: 5.

- `src/app/(dashboard)/usage/_components/components/EndpointUsage/components/EndpointUsageBarChart.tsx`
- `src/app/(dashboard)/usage/_components/components/EntityUsage/EntityUsage.tsx`
- `src/app/(dashboard)/usage/_components/components/EntityUsage/SpendByProvider.tsx`
- `src/app/(dashboard)/usage/_components/components/UsageAIChatPanel.tsx`
- `src/app/(dashboard)/usage/_components/components/UsagePageView.tsx`

### app/(dashboard)/users

Seed matches: 9. Files: 3.

- `src/app/(dashboard)/users/_components/default-user-settings/DefaultUserSettingsForm.tsx`
- `src/app/(dashboard)/users/_components/view_users/UsersTable.tsx`
- `src/app/(dashboard)/users/_components/view_users/user_info_view.tsx`

### components/templates

Seed matches: 9. Files: 2.

- `src/components/templates/KeySavingsTab.tsx`
- `src/components/templates/key_info_view.tsx`

### app/(dashboard)/models-and-endpoints

Seed matches: 7. Files: 6.

- `src/app/(dashboard)/models-and-endpoints/components/AllModelsTable.tsx`
- `src/app/(dashboard)/models-and-endpoints/components/AutoRouters/AutoRoutersPanel.tsx`
- `src/app/(dashboard)/models-and-endpoints/components/AutoRouters/AutoRoutersTable.tsx`
- `src/app/(dashboard)/models-and-endpoints/components/ModelsTableColumns.tsx`
- `src/app/(dashboard)/models-and-endpoints/page.tsx`
- `src/app/(dashboard)/models-and-endpoints/panels/AccessGroupBudgetsPanel.tsx`

### components/view_logs

Seed matches: 7. Files: 7.

- `src/components/view_logs/AuditLogDrawer/AuditLogDrawer.tsx`
- `src/components/view_logs/GuardrailViewer/CompliancePanel.tsx`
- `src/components/view_logs/GuardrailViewer/ContentFilterDetails.tsx`
- `src/components/view_logs/LogDetailsDrawer/ClassifierAuditView.tsx`
- `src/components/view_logs/LogDetailsDrawer/JsonViewer.tsx`
- `src/components/view_logs/LogDetailsDrawer/OutputCard.tsx`
- `src/components/view_logs/RequestLogsFilters.tsx`

### components/model_dashboard

Seed matches: 6. Files: 3.

- `src/components/model_dashboard/HealthCheckComponent.tsx`
- `src/components/model_dashboard/HealthChecksTable.tsx`
- `src/components/model_dashboard/HealthChecksTableColumns.tsx`

### components/organisms

Seed matches: 5. Files: 2.

- `src/components/organisms/RegenerateKeyModal.tsx`
- `src/components/organisms/create_key_button.tsx`

### components/Navbar

Seed matches: 4. Files: 3.

- `src/components/Navbar/BlogDropdown/BlogDropdown.tsx`
- `src/components/Navbar/UserDropdown/UserDropdown.tsx`
- `src/components/Navbar/WorkerDropdown/WorkerDropdown.tsx`

### components/DeletedKeysPage

Seed matches: 3. Files: 2.

- `src/components/DeletedKeysPage/DeletedKeysPage.tsx`
- `src/components/DeletedKeysPage/DeletedKeysTable/DeletedKeysTable.tsx`

### components/DeletedTeamsPage

Seed matches: 3. Files: 2.

- `src/components/DeletedTeamsPage/DeletedTeamsPage.tsx`
- `src/components/DeletedTeamsPage/DeletedTeamsTable/DeletedTeamsTable.tsx`

### components/model_add

Seed matches: 3. Files: 2.

- `src/components/model_add/CredentialsTable.tsx`
- `src/components/model_add/reuse_credentials.tsx`

### components/ui

Seed matches: 3. Files: 2.

- `src/components/ui/alert-dialog.test.tsx`
- `src/components/ui/tooltip.test.tsx`

### app/(dashboard)/admin-panel

Seed matches: 2. Files: 1.

- `src/app/(dashboard)/admin-panel/_components/AdminPanel.tsx`

### app/(dashboard)/budgets

Seed matches: 2. Files: 2.

- `src/app/(dashboard)/budgets/_components/BudgetTableColumns.tsx`
- `src/app/(dashboard)/budgets/_components/budget_panel.tsx`

### app/(dashboard)/old-usage

Seed matches: 2. Files: 1.

- `src/app/(dashboard)/old-usage/_components/usage.tsx`

### app/login

Seed matches: 2. Files: 1.

- `src/app/login/LoginPage.tsx`

### app/onboarding

Seed matches: 2. Files: 1.

- `src/app/onboarding/OnboardingErrorView.tsx`

### components/EntityUsageExport

Seed matches: 2. Files: 2.

- `src/components/EntityUsageExport/ExportTypeSelector.tsx`
- `src/components/EntityUsageExport/UsageExportHeader.tsx`

### components/organization

Seed matches: 2. Files: 1.

- `src/components/organization/organization_view.tsx`

### components/permissions

Seed matches: 2. Files: 2.

- `src/components/permissions/AgentPermissions.tsx`
- `src/components/permissions/VectorStorePermissions.tsx`

### app/(dashboard) (shell)

Seed matches: 1. Files: 1.

- `src/app/(dashboard)/layout.tsx`

### app/(dashboard)/organizations

Seed matches: 1. Files: 1.

- `src/app/(dashboard)/organizations/_components/OrganizationsPanel.tsx`

### components/ModelSelect

Seed matches: 1. Files: 1.

- `src/components/ModelSelect/ModelSelect.tsx`

### components/VirtualKeysPage

Seed matches: 1. Files: 1.

- `src/components/VirtualKeysPage/VirtualKeysTable.tsx`

### components/molecules

Seed matches: 1. Files: 1.

- `src/components/molecules/cost_optimization_feedback_banner.tsx`

### app/(dashboard)/guardrails

Seed matches: 56. Files: 20.

- `src/app/(dashboard)/guardrails/_components/TeamGuardrailsTab.tsx`
- `src/app/(dashboard)/guardrails/_components/add_guardrail_form.tsx`
- `src/app/(dashboard)/guardrails/_components/content_filter/CategoryTable.tsx`
- `src/app/(dashboard)/guardrails/_components/content_filter/CompetitorIntentConfiguration.tsx`
- `src/app/(dashboard)/guardrails/_components/content_filter/ContentCategoryConfiguration.tsx`
- `src/app/(dashboard)/guardrails/_components/content_filter/CustomPatternModal.tsx`
- `src/app/(dashboard)/guardrails/_components/content_filter/KeywordModal.tsx`
- `src/app/(dashboard)/guardrails/_components/content_filter/KeywordTable.tsx`
- `src/app/(dashboard)/guardrails/_components/content_filter/PatternModal.tsx`
- `src/app/(dashboard)/guardrails/_components/content_filter/PatternTable.tsx`
- `src/app/(dashboard)/guardrails/_components/custom_code/CustomCodeModal.tsx`
- `src/app/(dashboard)/guardrails/_components/guardrail_garden.test.tsx`
- `src/app/(dashboard)/guardrails/_components/guardrail_garden.tsx`
- `src/app/(dashboard)/guardrails/_components/guardrail_garden_detail.tsx`
- `src/app/(dashboard)/guardrails/_components/guardrail_optional_params.tsx`
- `src/app/(dashboard)/guardrails/_components/guardrail_provider_fields.tsx`
- `src/app/(dashboard)/guardrails/_components/guardrail_table.tsx`
- `src/app/(dashboard)/guardrails/_components/llm_judge/LLMJudgeFields.tsx`
- `src/app/(dashboard)/guardrails/_components/pii_components.tsx`
- `src/app/(dashboard)/guardrails/_components/tool_permission/ToolPermissionRulesEditor.tsx`

### app/(dashboard)/policies

Seed matches: 36. Files: 12.

- `src/app/(dashboard)/policies/_components/AttachmentTable.tsx`
- `src/app/(dashboard)/policies/_components/PolicyTable.tsx`
- `src/app/(dashboard)/policies/_components/add_policy_form.tsx`
- `src/app/(dashboard)/policies/_components/ai_suggestion_modal.tsx`
- `src/app/(dashboard)/policies/_components/guardrail_selection_modal.tsx`
- `src/app/(dashboard)/policies/_components/impact_popover.tsx`
- `src/app/(dashboard)/policies/_components/index.tsx`
- `src/app/(dashboard)/policies/_components/pipeline_flow_builder.tsx`
- `src/app/(dashboard)/policies/_components/policy_info.tsx`
- `src/app/(dashboard)/policies/_components/policy_templates.tsx`
- `src/app/(dashboard)/policies/_components/policy_test_panel.tsx`
- `src/app/(dashboard)/policies/_components/template_parameter_modal.tsx`

### app/(dashboard)/vector-stores

Seed matches: 27. Files: 10.

- `src/app/(dashboard)/vector-stores/_components/CreateVectorStore.tsx`
- `src/app/(dashboard)/vector-stores/_components/DocumentsTable.tsx`
- `src/app/(dashboard)/vector-stores/_components/IndexesTable.tsx`
- `src/app/(dashboard)/vector-stores/_components/S3VectorsConfig.tsx`
- `src/app/(dashboard)/vector-stores/_components/TestVectorStoreTab.tsx`
- `src/app/(dashboard)/vector-stores/_components/VectorStoreForm.tsx`
- `src/app/(dashboard)/vector-stores/_components/VectorStoreTable.tsx`
- `src/app/(dashboard)/vector-stores/_components/VectorStoreTester.tsx`
- `src/app/(dashboard)/vector-stores/_components/vector_store_info.test.tsx`
- `src/app/(dashboard)/vector-stores/_components/vector_store_info.tsx`

### app/(dashboard)/cost-optimization

Seed matches: 26. Files: 8.

- `src/app/(dashboard)/cost-optimization/_components/AutoRouterBenchmarksTab.tsx`
- `src/app/(dashboard)/cost-optimization/_components/CacheLeakageCard.tsx`
- `src/app/(dashboard)/cost-optimization/_components/CostOptimizationView.tsx`
- `src/app/(dashboard)/cost-optimization/_components/PromptCompressionTab.tsx`
- `src/app/(dashboard)/cost-optimization/_components/ShadowEvalSection.tsx`
- `src/app/(dashboard)/cost-optimization/_components/ShadowEvalStartForm.tsx`
- `src/app/(dashboard)/cost-optimization/_components/TierTurnsChart.tsx`
- `src/app/(dashboard)/cost-optimization/_components/UsageTab.tsx`

### app/(dashboard)/prompts

Seed matches: 20. Files: 14.

- `src/app/(dashboard)/prompts/_components/PromptTable.tsx`
- `src/app/(dashboard)/prompts/_components/add_prompt_form.tsx`
- `src/app/(dashboard)/prompts/_components/prompt_editor_view/DeveloperMessageCard.tsx`
- `src/app/(dashboard)/prompts/_components/prompt_editor_view/DotpromptViewTab.tsx`
- `src/app/(dashboard)/prompts/_components/prompt_editor_view/PromptEditorHeader.tsx`
- `src/app/(dashboard)/prompts/_components/prompt_editor_view/PromptMessagesCard.tsx`
- `src/app/(dashboard)/prompts/_components/prompt_editor_view/PublishModal.tsx`
- `src/app/(dashboard)/prompts/_components/prompt_editor_view/ToolsCard.tsx`
- `src/app/(dashboard)/prompts/_components/prompt_editor_view/VersionHistorySidePanel.test.tsx`
- `src/app/(dashboard)/prompts/_components/prompt_editor_view/VersionHistorySidePanel.tsx`
- `src/app/(dashboard)/prompts/_components/prompt_editor_view/conversation_panel/VariableInput.tsx`
- `src/app/(dashboard)/prompts/_components/prompt_editor_view/conversation_panel/VariableWarning.tsx`
- `src/app/(dashboard)/prompts/_components/prompt_info.tsx`
- `src/app/(dashboard)/prompts/_components/variable_textarea.tsx`

### app/(dashboard)/search-tools

Seed matches: 16. Files: 5.

- `src/app/(dashboard)/search-tools/_components/CreateSearchTools.tsx`
- `src/app/(dashboard)/search-tools/_components/SearchConnectionTest.tsx`
- `src/app/(dashboard)/search-tools/_components/SearchToolTable.tsx`
- `src/app/(dashboard)/search-tools/_components/SearchToolTester.tsx`
- `src/app/(dashboard)/search-tools/_components/SearchTools.tsx`

### app/(dashboard)/cost-tracking

Seed matches: 15. Files: 5.

- `src/app/(dashboard)/cost-tracking/_components/add_margin_form.tsx`
- `src/app/(dashboard)/cost-tracking/_components/add_provider_form.tsx`
- `src/app/(dashboard)/cost-tracking/_components/cost_tracking_settings.tsx`
- `src/app/(dashboard)/cost-tracking/_components/how_it_works.tsx`
- `src/app/(dashboard)/cost-tracking/_components/pricing_calculator/multi_cost_results.tsx`

### app/(dashboard)/projects

Seed matches: 8. Files: 3.

- `src/app/(dashboard)/projects/_components/ProjectDetailsPage.tsx`
- `src/app/(dashboard)/projects/_components/ProjectKeysTable.tsx`
- `src/app/(dashboard)/projects/_components/ProjectsPage.test.tsx`

### app/(dashboard)/guardrails-monitor

Seed matches: 7. Files: 5.

- `src/app/(dashboard)/guardrails-monitor/_components/GuardrailConfig.tsx`
- `src/app/(dashboard)/guardrails-monitor/_components/GuardrailDetail.tsx`
- `src/app/(dashboard)/guardrails-monitor/_components/GuardrailUsageBreakdown.tsx`
- `src/app/(dashboard)/guardrails-monitor/_components/GuardrailsOverview.test.tsx`
- `src/app/(dashboard)/guardrails-monitor/_components/GuardrailsOverview.tsx`

### components/common_components

Seed matches: 7. Files: 5.

- `src/components/common_components/AutoRotationView.tsx`
- `src/components/common_components/ModelAliasManager.test.tsx`
- `src/components/common_components/PassThroughGuardrailsSection.tsx`
- `src/components/common_components/RouterSettingsSummary.tsx`
- `src/components/common_components/budget_duration_dropdown.tsx`

### app/(dashboard)/caching

Seed matches: 6. Files: 4.

- `src/app/(dashboard)/caching/_components/ErrorDrilldown.tsx`
- `src/app/(dashboard)/caching/_components/cache_dashboard.tsx`
- `src/app/(dashboard)/caching/_components/cache_settings/CacheFormField.tsx`
- `src/app/(dashboard)/caching/_components/coordination_redis_settings/index.tsx`

### app/(dashboard)/workflows

Seed matches: 5. Files: 1.

- `src/app/(dashboard)/workflows/WorkflowRuns.tsx`

### app/(dashboard)/access-groups

Seed matches: 4. Files: 2.

- `src/app/(dashboard)/access-groups/_components/AccessGroupsDetailsPage.tsx`
- `src/app/(dashboard)/access-groups/_components/AccessGroupsPage.test.tsx`

### components/PassThroughSettings

Seed matches: 4. Files: 2.

- `src/components/PassThroughSettings/PassThroughEndpointsTable.tsx`
- `src/components/PassThroughSettings/PassThroughSettings.tsx`

### components/routing_groups

Seed matches: 4. Files: 4.

- `src/components/routing_groups/RoutingGroupModal.tsx`
- `src/components/routing_groups/RoutingGroupUsagePanel.tsx`
- `src/components/routing_groups/RoutingGroupsTable.tsx`
- `src/components/routing_groups/index.tsx`

### app/(dashboard)/tag-management

Seed matches: 2. Files: 1.

- `src/app/(dashboard)/tag-management/_components/TagTable.tsx`

### components/CloudZeroCostTracking

Seed matches: 2. Files: 1.

- `src/components/CloudZeroCostTracking/CloudZeroIntegrationSettings.tsx`

### components/router_settings

Seed matches: 2. Files: 2.

- `src/components/router_settings/ReliabilityRetriesSection.tsx`
- `src/components/router_settings/RouterSettingsForm.tsx`

### app/(dashboard)/router-settings

Seed matches: 1. Files: 1.

- `src/app/(dashboard)/router-settings/_components/general_settings.tsx`

### app/(dashboard)/transform-request

Seed matches: 1. Files: 1.

- `src/app/(dashboard)/transform-request/TransformRequestPanel.tsx`

### components/email_events

Seed matches: 1. Files: 1.

- `src/components/email_events/email_event_settings.tsx`

### app/(dashboard)/mcp-servers

Seed matches: 57. Files: 18.

- `src/app/(dashboard)/mcp-servers/_components/CreateMCPServer.tsx`
- `src/app/(dashboard)/mcp-servers/_components/MCPNetworkSettings.tsx`
- `src/app/(dashboard)/mcp-servers/_components/MCPPermissionManagement.tsx`
- `src/app/(dashboard)/mcp-servers/_components/MCPServerCard.tsx`
- `src/app/(dashboard)/mcp-servers/_components/MCPSubmissionsTab.tsx`
- `src/app/(dashboard)/mcp-servers/_components/MCPToolsetsTab.tsx`
- `src/app/(dashboard)/mcp-servers/_components/ToolArgumentsForm.tsx`
- `src/app/(dashboard)/mcp-servers/_components/ToolTestPanel.tsx`
- `src/app/(dashboard)/mcp-servers/_components/UserEnvVarsModal.tsx`
- `src/app/(dashboard)/mcp-servers/_components/mcp_connect.tsx`
- `src/app/(dashboard)/mcp-servers/_components/mcp_connection_status.tsx`
- `src/app/(dashboard)/mcp-servers/_components/mcp_discovery.tsx`
- `src/app/(dashboard)/mcp-servers/_components/mcp_server_cost_config.tsx`
- `src/app/(dashboard)/mcp-servers/_components/mcp_server_edit.tsx`
- `src/app/(dashboard)/mcp-servers/_components/mcp_server_view.tsx`
- `src/app/(dashboard)/mcp-servers/_components/mcp_servers.tsx`
- `src/app/(dashboard)/mcp-servers/_components/mcp_tool_configuration.tsx`
- `src/app/(dashboard)/mcp-servers/_components/mcp_tools.tsx`

### app/(dashboard)/playground

Seed matches: 36. Files: 11.

- `src/app/(dashboard)/playground/components/chat_ui/A2AMetrics.tsx`
- `src/app/(dashboard)/playground/components/chat_ui/AgentBuilderView.tsx`
- `src/app/(dashboard)/playground/components/chat_ui/ChatImageUpload.tsx`
- `src/app/(dashboard)/playground/components/chat_ui/ChatUI.tsx`
- `src/app/(dashboard)/playground/components/chat_ui/CodeInterpreterOutput.tsx`
- `src/app/(dashboard)/playground/components/chat_ui/ResponsesImageUpload.tsx`
- `src/app/(dashboard)/playground/components/chat_ui/SessionManagement.tsx`
- `src/app/(dashboard)/playground/components/compareUI/CompareUI.tsx`
- `src/app/(dashboard)/playground/components/compareUI/components/ComparisonPanel.test.tsx`
- `src/app/(dashboard)/playground/components/compareUI/components/MessageDisplay.tsx`
- `src/app/(dashboard)/playground/components/complianceUI/ComplianceUI.tsx`

### app/(dashboard)/agents

Seed matches: 15. Files: 6.

- `src/app/(dashboard)/agents/_components/AgentsPanel.tsx`
- `src/app/(dashboard)/agents/_components/AgentsTable.tsx`
- `src/app/(dashboard)/agents/_components/add_agent_form.tsx`
- `src/app/(dashboard)/agents/_components/agent_card_discovery.tsx`
- `src/app/(dashboard)/agents/_components/agent_info.tsx`
- `src/app/(dashboard)/agents/_components/agent_virtual_keys.tsx`

### components/chat

Seed matches: 14. Files: 6.

- `src/components/chat/ChatMessages.tsx`
- `src/components/chat/ConversationList.tsx`
- `src/components/chat/LogsPanel.tsx`
- `src/components/chat/MCPAppsPanel.tsx`
- `src/components/chat/MCPCredentialsTab.tsx`
- `src/components/chat/UsagePanel.tsx`

### components/AIHub

Seed matches: 9. Files: 3.

- `src/components/AIHub/ModelHubTable.tsx`
- `src/components/AIHub/forms/MakeAgentPublicForm.tsx`
- `src/components/AIHub/forms/MakeModelPublicForm.tsx`

### components/claude_code_plugins

Seed matches: 7. Files: 2.

- `src/components/claude_code_plugins/MakeSkillPublicForm.tsx`
- `src/components/claude_code_plugins/skill_detail.tsx`

### components/mcp_server_management

Seed matches: 6. Files: 1.

- `src/components/mcp_server_management/MCPToolPermissions.tsx`

### app/(dashboard)/skills

Seed matches: 4. Files: 3.

- `src/app/(dashboard)/skills/_components/ClaudeCodePluginsPanel.tsx`
- `src/app/(dashboard)/skills/_components/PluginTable.tsx`
- `src/app/(dashboard)/skills/_components/add_plugin_form.tsx`

### components/mcp_tools

Seed matches: 3. Files: 2.

- `src/components/mcp_tools/ByokCredentialModal.tsx`
- `src/components/mcp_tools/MCPToolArgumentsForm.tsx`

### app/chat

Seed matches: 2. Files: 1.

- `src/app/chat/page.tsx`

