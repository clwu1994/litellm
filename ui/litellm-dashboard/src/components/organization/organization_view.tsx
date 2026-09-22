import { useTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import { organizationKeys, useOrganization } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { useQueryClient } from "@tanstack/react-query";
import { useVisitedTabs } from "@/hooks/useVisitedTabs";
import { MoneyCell } from "@/components/shared/table_cells";
import CopyButton from "@/components/shared/CopyButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import { teamDetailHref } from "@/utils/entityLinks";
import { createTeamAliasMap } from "@/utils/teamUtils";
import { BadgeLink } from "@/components/shared/BadgeLink";
import { ArrowLeft } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import MemberTable, { type MemberTableColumn } from "../common_components/MemberTable";
import UserSearchModal from "../common_components/user_search_modal";
import { toast } from "@/lib/toast";
import {
  Member,
  organizationMemberAddCall,
  organizationMemberDeleteCall,
  organizationMemberUpdateCall,
} from "../networking";
import ObjectPermissionsView from "../object_permissions_view";
import MemberModal from "../team/EditMembership";
import { OrgSettingsForm } from "./org-settings/OrgSettingsForm";

interface OrganizationInfoProps {
  organizationId: string;
  onClose: () => void;
  accessToken: string | null;
  is_org_admin: boolean;
  is_proxy_admin: boolean;
  userModels: string[];
  editOrg: boolean;
}

const OrganizationInfoView: React.FC<OrganizationInfoProps> = ({
  organizationId,
  onClose,
  accessToken,
  is_org_admin,
  is_proxy_admin,
  userModels,
  editOrg,
}) => {
  const { t } = useTranslation("organizations");
  const queryClient = useQueryClient();
  const { data: orgData, isLoading: loading } = useOrganization(organizationId);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [isEditMemberModalVisible, setIsEditMemberModalVisible] = useState(false);
  const [selectedEditMember, setSelectedEditMember] = useState<Member | null>(null);
  const canEditOrg = is_org_admin || is_proxy_admin;
  const { data: teams } = useTeams();
  const { onTabChange, hasVisited } = useVisitedTabs(editOrg ? "settings" : "overview");

  const teamAliasMap = useMemo(() => createTeamAliasMap(teams), [teams]);

  const handleMemberAdd = async (values: any) => {
    try {
      if (accessToken == null) {
        return;
      }

      const member: Member = {
        user_email: values.user_email,
        user_id: values.user_id,
        role: values.role,
      };
      await organizationMemberAddCall(accessToken, organizationId, member);

      toast.success(t("toast.memberAdded"));
      setIsAddMemberModalVisible(false);
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      toast.fromError(t("toast.memberAddFailed"));
      console.error("Error adding organization member:", error);
    }
  };

  const handleMemberUpdate = async (values: any) => {
    try {
      if (!accessToken) return;

      const member: Member = {
        user_email: values.user_email,
        user_id: values.user_id,
        role: values.role,
      };

      await organizationMemberUpdateCall(accessToken, organizationId, member);
      toast.success(t("toast.memberUpdated"));
      setIsEditMemberModalVisible(false);
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      toast.fromError(t("toast.memberUpdateFailed"));
      console.error("Error updating organization member:", error);
    }
  };

  const handleMemberDelete = async (values: any) => {
    try {
      if (!accessToken) return;

      await organizationMemberDeleteCall(accessToken, organizationId, values.user_id);
      toast.success(t("toast.memberDeleted"));
      setIsEditMemberModalVisible(false);
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      toast.fromError(t("toast.memberDeleteFailed"));
      console.error("Error deleting organization member:", error);
    }
  };

  if (loading) {
    return <div className="p-4">{t("view.loading")}</div>;
  }

  if (!orgData) {
    return <div className="p-4">{t("view.notFound")}</div>;
  }

  const orgMemberById = new Map((orgData.members || []).map((m) => [m.user_id, m]));
  const orgMemberFor = (record: Member) => (record.user_id != null ? orgMemberById.get(record.user_id) : undefined);

  const orgExtraColumns: MemberTableColumn[] = [
    {
      title: t("table.header.spend"),
      key: "spend",
      sortValue: (record: Member) => orgMemberFor(record)?.spend ?? null,
      render: (record: Member) => <MoneyCell value={orgMemberFor(record)?.spend} decimals={4} />,
    },
    {
      title: t("field.createdAt"),
      key: "created_at",
      sortValue: (record: Member) => orgMemberFor(record)?.created_at ?? null,
      render: (record: Member) => {
        const createdAt = orgMemberFor(record)?.created_at;
        return <span>{createdAt ? new Date(createdAt).toLocaleString() : "-"}</span>;
      },
    },
  ];

  return (
    <div className="h-screen w-full bg-background p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={onClose} className="mb-4">
            <ArrowLeft className="size-4" />
            {t("view.backToOrganizations")}
          </Button>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{orgData.organization_alias}</h1>
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm text-muted-foreground">{orgData.organization_id}</span>
            <CopyButton value={orgData.organization_id} label={t("view.copyOrganizationId")} iconClassName="size-3" />
          </div>
        </div>
      </div>

      <Tabs defaultValue={editOrg ? "settings" : "overview"} onValueChange={onTabChange} className="mb-4">
        <TabsList variant="line" className="h-auto w-full justify-start rounded-none border-b p-0">
          <TabsTrigger value="overview" className="flex-none rounded-none px-4 py-2">
            {t("tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-none rounded-none px-4 py-2">
            {t("table.header.members")}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-none rounded-none px-4 py-2">
            {t("tabs.settings")}
          </TabsTrigger>
        </TabsList>

        <TabsContent keepMounted={hasVisited("overview")} value="overview" className="pt-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t("view.details")}</p>
                <div className="mt-2 text-sm text-foreground">
                  <p>{t("view.created", { date: new Date(orgData.created_at).toLocaleDateString() })}</p>
                  <p>{t("view.updated", { date: new Date(orgData.updated_at).toLocaleDateString() })}</p>
                  <p>{t("view.createdBy", { name: orgData.created_by })}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t("view.budgetStatus")}</p>
                <div className="mt-2 text-sm text-foreground">
                  <p className="text-xl font-semibold">${formatNumberWithCommas(orgData.spend, 4)}</p>
                  <p>
                    {t("view.ofAmount", {
                      amount:
                        orgData.litellm_budget_table.max_budget === null
                          ? t("table.value.unlimited")
                          : `$${formatNumberWithCommas(orgData.litellm_budget_table.max_budget, 4)}`,
                    })}
                  </p>
                  {orgData.litellm_budget_table.budget_duration && (
                    <p className="text-muted-foreground">
                      {t("view.reset", { value: orgData.litellm_budget_table.budget_duration })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t("view.rateLimits")}</p>
                <div className="mt-2 text-sm text-foreground">
                  <p>
                    {t("table.summary.tpm", {
                      value: orgData.litellm_budget_table.tpm_limit ?? t("table.value.unlimited"),
                    })}
                  </p>
                  <p>
                    {t("table.summary.rpm", {
                      value: orgData.litellm_budget_table.rpm_limit ?? t("table.value.unlimited"),
                    })}
                  </p>
                  {orgData.litellm_budget_table.max_parallel_requests && (
                    <p>
                      {t("view.maxParallelRequests", { value: orgData.litellm_budget_table.max_parallel_requests })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t("table.header.models")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {orgData.models.length === 0 ? (
                    <BadgeLink>{t("view.allProxyModels")}</BadgeLink>
                  ) : (
                    orgData.models.map((model, index) => <BadgeLink key={index}>{model}</BadgeLink>)
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t("view.teams")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {orgData.teams?.map((team, index) => (
                    <BadgeLink key={index} href={teamDetailHref(team.team_id)}>
                      {teamAliasMap[team.team_id] || team.team_id}
                    </BadgeLink>
                  ))}
                </div>
              </CardContent>
            </Card>

            <ObjectPermissionsView
              objectPermission={orgData.object_permission}
              variant="card"
              accessToken={accessToken}
            />
          </div>
        </TabsContent>

        <TabsContent keepMounted={hasVisited("members")} value="members" className="pt-4">
          <div className="space-y-4">
            <MemberTable
              key={orgData.organization_id}
              members={(orgData.members || []).map((m) => ({
                role: m.user_role || "",
                user_id: m.user_id,
                user_email: m.user_email,
                user_alias: m.user?.user_alias ?? null,
              }))}
              canEdit={canEditOrg}
              onEdit={(member) => {
                setSelectedEditMember(member);
                setIsEditMemberModalVisible(true);
              }}
              onDelete={(member) => handleMemberDelete(member)}
              onAddMember={() => setIsAddMemberModalVisible(true)}
              roleColumnTitle={t("members.roleColumnTitle")}
              extraColumns={orgExtraColumns}
              emptyText={t("members.emptyText")}
            />
          </div>
        </TabsContent>

        <TabsContent keepMounted={hasVisited("settings")} value="settings" className="pt-4">
          <Card className="max-h-[65vh] overflow-y-auto">
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{t("view.settingsTitle")}</h2>
                {canEditOrg && !isEditing && (
                  <Button onClick={() => setIsEditing(true)}>{t("view.editSettings")}</Button>
                )}
              </div>

              {isEditing ? (
                <OrgSettingsForm
                  organizationId={organizationId}
                  org={orgData}
                  accessToken={accessToken || ""}
                  onCancel={() => setIsEditing(false)}
                  onSaved={() => setIsEditing(false)}
                />
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{t("table.header.organizationName")}</p>
                    <div>{orgData.organization_alias}</div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t("table.header.organizationId")}</p>
                    <div className="font-mono">{orgData.organization_id}</div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t("field.createdAt")}</p>
                    <div>{new Date(orgData.created_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t("table.header.models")}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {orgData.models.map((model, index) => (
                        <BadgeLink key={index}>{model}</BadgeLink>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t("view.rateLimits")}</p>
                    <div>
                      {t("table.summary.tpm", {
                        value: orgData.litellm_budget_table.tpm_limit ?? t("table.value.unlimited"),
                      })}
                    </div>
                    <div>
                      {t("table.summary.rpm", {
                        value: orgData.litellm_budget_table.rpm_limit ?? t("table.value.unlimited"),
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t("view.budget")}</p>
                    <div>
                      {t("view.max", {
                        value:
                          orgData.litellm_budget_table.max_budget !== null
                            ? `$${formatNumberWithCommas(orgData.litellm_budget_table.max_budget, 4)}`
                            : t("view.noLimit"),
                      })}
                    </div>
                    <div>
                      {t("view.reset", {
                        value: orgData.litellm_budget_table.budget_duration || t("view.never"),
                      })}
                    </div>
                  </div>

                  <ObjectPermissionsView
                    objectPermission={orgData.object_permission}
                    variant="inline"
                    className="border-t pt-4"
                    accessToken={accessToken}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UserSearchModal
        isVisible={isAddMemberModalVisible}
        onCancel={() => setIsAddMemberModalVisible(false)}
        onSubmit={handleMemberAdd}
        accessToken={accessToken}
        title={t("addMember.title")}
        roles={[
          {
            label: t("addMember.roleOrgAdmin"),
            value: "org_admin",
            description: t("addMember.descriptionOrgAdmin"),
          },
          {
            label: t("addMember.roleInternalUser"),
            value: "internal_user",
            description: t("addMember.descriptionInternalUser"),
          },
          {
            label: t("addMember.roleInternalUserViewer"),
            value: "internal_user_viewer",
            description: t("addMember.descriptionInternalUserViewer"),
          },
        ]}
        defaultRole="internal_user"
      />
      <MemberModal
        visible={isEditMemberModalVisible}
        onCancel={() => setIsEditMemberModalVisible(false)}
        onSubmit={handleMemberUpdate}
        initialData={selectedEditMember}
        mode="edit"
        config={{
          title: t("members.editTitle"),
          showEmail: true,
          showUserId: true,
          roleOptions: [
            { label: t("roles.orgAdmin"), value: "org_admin" },
            { label: t("roles.internalUser"), value: "internal_user" },
            { label: t("roles.internalUserViewer"), value: "internal_user_viewer" },
          ],
        }}
      />
    </div>
  );
};

export default OrganizationInfoView;
