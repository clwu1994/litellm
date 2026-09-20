import { parseAsString, useQueryState } from "nuqs";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, Code, Plus } from "lucide-react";
import { getGuardrailsList, deleteGuardrailCall } from "@/components/networking";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";
import AddGuardrailForm from "./add_guardrail_form";
import GuardrailTable from "./guardrail_table";
import { isAdminRole } from "@/utils/roles";
import GuardrailInfoView from "./guardrail_info";
import GuardrailTestPlayground from "./GuardrailTestPlayground";
import { toast } from "@/lib/toast";
import { Guardrail } from "@/components/guardrails/types";
import DeleteResourceModal from "@/components/common_components/DeleteResourceModal";
import { formatGuardrailMode, getGuardrailLogoAndName } from "./guardrail_info_helpers";
import { CustomCodeModal } from "./custom_code";
import GuardrailGarden from "./guardrail_garden";
import { TeamGuardrailsTab } from "./TeamGuardrailsTab";

interface GuardrailsPanelProps {
  accessToken: string | null;
  userRole?: string;
}

interface GuardrailsResponse {
  guardrails: Guardrail[];
}

const GuardrailsPanel: React.FC<GuardrailsPanelProps> = ({ accessToken, userRole }) => {
  const { t } = useTranslation("guardrails");
  const [guardrailsList, setGuardrailsList] = useState<Guardrail[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isCustomCodeModalVisible, setIsCustomCodeModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [guardrailToDelete, setGuardrailToDelete] = useState<Guardrail | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGuardrailId, setSelectedGuardrailId] = useQueryState(
    "guardrail",
    parseAsString.withOptions({ history: "push" }),
  );
  const isAdmin = userRole ? isAdminRole(userRole) : false;

  const fetchGuardrails = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    try {
      const response: GuardrailsResponse = await getGuardrailsList(accessToken);
      setGuardrailsList(response.guardrails);
    } catch (error) {
      console.error("Error fetching guardrails:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardrails();
  }, [accessToken]);

  const closeGuardrailDetail = () => {
    void setSelectedGuardrailId(null, { history: "replace" });
  };

  const handleAddGuardrail = () => {
    if (selectedGuardrailId) {
      closeGuardrailDetail();
    }
    setIsAddModalVisible(true);
  };

  const handleAddCustomCodeGuardrail = () => {
    if (selectedGuardrailId) {
      closeGuardrailDetail();
    }
    setIsCustomCodeModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsAddModalVisible(false);
  };

  const handleCloseCustomCodeModal = () => {
    setIsCustomCodeModalVisible(false);
  };

  const handleSuccess = () => {
    fetchGuardrails();
  };

  const handleDeleteClick = (guardrailId: string, guardrailName: string) => {
    const guardrail = guardrailsList.find((g) => g.guardrail_id === guardrailId) || null;
    setGuardrailToDelete(guardrail);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!guardrailToDelete || !accessToken) return;

    setIsDeleting(true);
    try {
      await deleteGuardrailCall(accessToken, guardrailToDelete.guardrail_id);
      toast.success(t("list.toast.deleted", { name: guardrailToDelete.guardrail_name }));
      await fetchGuardrails();
    } catch (error) {
      console.error("Error deleting guardrail:", error);
      toast.fromError(t("list.toast.deleteFailed"));
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setGuardrailToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setGuardrailToDelete(null);
  };

  const providerDisplayName =
    guardrailToDelete && guardrailToDelete.litellm_params
      ? getGuardrailLogoAndName(guardrailToDelete.litellm_params.guardrail).displayName
      : undefined;

  return (
    <div className="w-full mx-auto flex-auto overflow-y-auto m-8 p-2">
      <Tabs defaultValue="guardrails">
        <TabsList variant="line">
          {isAdmin && (
            <>
              <TabsTrigger value="garden" className="flex-none">
                {t("list.tabs.garden")}
              </TabsTrigger>
              <TabsTrigger value="guardrails" className="flex-none">
                {t("list.tabs.guardrails")}
              </TabsTrigger>
              <TabsTrigger value="playground" className="flex-none" disabled={!accessToken}>
                {t("list.tabs.playground")}
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="submitted" className="flex-none">
            {t("list.tabs.submitted")}
          </TabsTrigger>
        </TabsList>

        {isAdmin && (
          <>
            <TabsContent value="garden" keepMounted>
              <GuardrailGarden accessToken={accessToken} onGuardrailCreated={handleSuccess} />
            </TabsContent>

            <TabsContent value="guardrails" keepMounted>
              <div className="flex justify-between items-center mb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger disabled={!accessToken} className={cn(buttonVariants({ variant: "default" }))}>
                    <Plus />
                    {t("list.addNew")}
                    <ChevronDown />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={handleAddGuardrail}>
                      <Plus />
                      {t("list.addProvider")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleAddCustomCodeGuardrail}>
                      <Code />
                      {t("list.addCustomCode")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {selectedGuardrailId ? (
                <GuardrailInfoView
                  guardrailId={selectedGuardrailId}
                  onClose={closeGuardrailDetail}
                  accessToken={accessToken}
                  isAdmin={isAdmin}
                />
              ) : (
                <GuardrailTable
                  guardrailsList={guardrailsList}
                  isLoading={isLoading}
                  onDeleteClick={handleDeleteClick}
                  onGuardrailClick={(id) => void setSelectedGuardrailId(id)}
                />
              )}

              <AddGuardrailForm
                visible={isAddModalVisible}
                onClose={handleCloseModal}
                accessToken={accessToken}
                onSuccess={handleSuccess}
              />

              <CustomCodeModal
                visible={isCustomCodeModalVisible}
                onClose={handleCloseCustomCodeModal}
                accessToken={accessToken}
                onSuccess={handleSuccess}
              />

              <DeleteResourceModal
                isOpen={isDeleteModalOpen}
                title={t("list.deleteModal.title")}
                message={t("list.deleteModal.message", { name: guardrailToDelete?.guardrail_name })}
                resourceInformationTitle={t("list.deleteModal.resourceInformationTitle")}
                resourceInformation={[
                  { label: t("list.deleteModal.name"), value: guardrailToDelete?.guardrail_name },
                  { label: t("list.deleteModal.id"), value: guardrailToDelete?.guardrail_id, code: true },
                  { label: t("list.deleteModal.provider"), value: providerDisplayName },
                  {
                    label: t("list.deleteModal.mode"),
                    value: formatGuardrailMode(guardrailToDelete?.litellm_params.mode, t),
                  },
                  {
                    label: t("list.deleteModal.defaultOn"),
                    value: guardrailToDelete?.litellm_params.default_on ? t("common.yes") : t("common.no"),
                  },
                ]}
                onCancel={handleDeleteCancel}
                onOk={handleDeleteConfirm}
                confirmLoading={isDeleting}
              />
            </TabsContent>

            <TabsContent value="playground" keepMounted>
              <GuardrailTestPlayground
                guardrailsList={guardrailsList}
                isLoading={isLoading}
                accessToken={accessToken}
                onClose={() => {}}
              />
            </TabsContent>
          </>
        )}

        <TabsContent value="submitted" keepMounted>
          <TeamGuardrailsTab accessToken={accessToken} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GuardrailsPanel;
