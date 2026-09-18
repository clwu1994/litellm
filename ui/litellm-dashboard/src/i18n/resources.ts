import enAuth from "./locales/en/auth.json";
import enCommon from "./locales/en/common.json";
import enKeys from "./locales/en/keys.json";
import enNav from "./locales/en/nav.json";
import enTeams from "./locales/en/teams.json";
import enUsers from "./locales/en/users.json";
import zhAuth from "./locales/zh/auth.json";
import zhCommon from "./locales/zh/common.json";
import zhKeys from "./locales/zh/keys.json";
import zhNav from "./locales/zh/nav.json";
import zhTeams from "./locales/zh/teams.json";
import zhUsers from "./locales/zh/users.json";

export const resources = {
  en: { common: enCommon, nav: enNav, auth: enAuth, keys: enKeys, teams: enTeams, users: enUsers },
  zh: { common: zhCommon, nav: zhNav, auth: zhAuth, keys: zhKeys, teams: zhTeams, users: zhUsers },
};
