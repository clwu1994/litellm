import type { ParseKeys } from "i18next";

import googleLogo from "../../../../../public/assets/logos/google.svg";
import microsoftAzureLogo from "../../../../../public/assets/logos/microsoft_azure.svg";

// SSO Provider logos
export const ssoProviderLogoMap: Record<string, string> = {
  google: googleLogo.src,
  microsoft: microsoftAzureLogo.src,
  okta: "https://www.okta.com/sites/default/files/Okta_Logo_BrightBlue_Medium.png",
  generic: "",
  saml: "",
};

// SSO Provider display names (consistent between select dropdown and table)
export const ssoProviderDisplayNameKeys: Record<string, ParseKeys<"settings">> = {
  google: "sso.providers.google",
  microsoft: "sso.providers.microsoft",
  okta: "sso.providers.okta",
  generic: "sso.providers.generic",
  saml: "sso.providers.saml",
};

// The provider id the API stores, shown as-is in English so existing output is unchanged.
export const ssoProviderIdValueKeys: Record<string, ParseKeys<"settings">> = {
  google: "sso.providerIds.google",
  microsoft: "sso.providerIds.microsoft",
  okta: "sso.providerIds.okta",
  generic: "sso.providerIds.generic",
  saml: "sso.providerIds.saml",
};

export const defaultRoleDisplayNameKeys: Record<string, ParseKeys<"settings">> = {
  internal_user_viewer: "sso.roles.internalUserViewer",
  internal_user: "sso.roles.internalUser",
  proxy_admin_viewer: "sso.roles.proxyAdminViewer",
  proxy_admin: "sso.roles.proxyAdmin",
};
