import React, { useState, useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, FileWarning, Trash2, TriangleAlert, Upload } from "lucide-react";
import { userCreateCall, invitationCreateCall, getProxyUISettings } from "./networking";
import Papa from "papaparse";
import { CheckCircleIcon, XCircleIcon, ExclamationIcon } from "@heroicons/react/outline";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "@/lib/toast";

interface BulkCreateUsersProps {
  accessToken: string;
  teams: any[] | null;
  possibleUIRoles: null | Record<string, Record<string, string>>;
  onUsersCreated?: () => void;
}

interface UserData {
  user_email: string;
  user_role: string;
  teams?: string | string[];
  metadata?: string;
  max_budget?: string | number;
  budget_duration?: string;
  models?: string | string[];
  status?: string;
  error?: string;
  rowNumber?: number;
  isValid?: boolean;
  key?: string;
  invitation_link?: string;
}

const PREVIEW_PAGE_SIZE = 5;

// Define an interface for the UI settings
interface UISettings {
  PROXY_BASE_URL: string | null;
  PROXY_LOGOUT_URL: string | null;
  DEFAULT_TEAM_DISABLED: boolean;
  SSO_ENABLED: boolean;
}

const BulkCreateUsersButton: React.FC<BulkCreateUsersProps> = ({
  accessToken,
  teams,
  possibleUIRoles,
  onUsersCreated,
}) => {
  const { t } = useTranslation("templates");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [parsedData, setParsedData] = useState<UserData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [csvStructureError, setCsvStructureError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uiSettings, setUISettings] = useState<UISettings | null>(null);
  const [baseUrl, setBaseUrl] = useState("http://localhost:4000");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const csvInputId = React.useId();

  useEffect(() => {
    // Get UI settings
    const fetchUISettings = async () => {
      try {
        const uiSettingsResponse = await getProxyUISettings(accessToken);
        setUISettings(uiSettingsResponse);
      } catch (error) {
        console.error("Error fetching UI settings:", error);
      }
    };

    fetchUISettings();

    // Set base URL
    const base = new URL("/", window.location.href);
    setBaseUrl(base.toString());
  }, [accessToken]);

  const handleFileUpload = (file: File) => {
    // Reset all error states
    setParseError(null);
    setCsvStructureError(null);
    setFileError(null);

    // Set the selected file - always show the file even if it's invalid
    setSelectedFile(file);

    // Check file type
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setFileError(t("bulkUsers.invalidFileType", { fileName: file.name }));
      toast.fromError(t("bulkUsers.invalidFileTypeToast"));
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError(t("bulkUsers.fileTooLarge", { size: (file.size / (1024 * 1024)).toFixed(1) }));
      return;
    }

    Papa.parse(file, {
      complete: (results) => {
        // Check if file is empty
        if (!results.data || results.data.length === 0) {
          setCsvStructureError(t("bulkUsers.csvEmpty"));
          setParsedData([]);
          return;
        }

        // Check if there's only header row
        if (results.data.length === 1) {
          setCsvStructureError(t("bulkUsers.csvHeadersOnly"));
          setParsedData([]);
          return;
        }

        const headers = results.data[0] as string[];

        // Check if headers exist
        if (headers.length === 0 || (headers.length === 1 && headers[0] === "")) {
          setCsvStructureError(t("bulkUsers.csvNoHeaders"));
          setParsedData([]);
          return;
        }

        const requiredColumns = ["user_email", "user_role"];

        // Check if all required columns are present
        const missingColumns = requiredColumns.filter((col) => !headers.includes(col));
        if (missingColumns.length > 0) {
          setCsvStructureError(t("bulkUsers.csvMissingColumns", { columns: missingColumns.join(", ") }));
          setParsedData([]);
          return;
        }

        try {
          const userData = results.data
            .slice(1)
            .map((row: any, index: number) => {
              // Skip empty rows
              if (row.length === 0 || (row.length === 1 && row[0] === "")) {
                return null;
              }

              // Check if row has enough columns
              if (row.length < headers.length) {
                return {
                  rowNumber: index + 2,
                  isValid: false,
                  error: t("bulkUsers.rowFewerColumns", { row: index + 2 }),
                  user_email: "",
                  user_role: "",
                } as UserData;
              }

              const user: UserData = {
                user_email: row[headers.indexOf("user_email")]?.trim() || "",
                user_role: row[headers.indexOf("user_role")]?.trim() || "",
                teams: row[headers.indexOf("teams")]?.trim(),
                max_budget: row[headers.indexOf("max_budget")]?.trim(),
                budget_duration: row[headers.indexOf("budget_duration")]?.trim(),
                models: row[headers.indexOf("models")]?.trim(),
                rowNumber: index + 2,
                isValid: true,
                error: "",
              };

              // Validate the row
              const errors: string[] = [];

              // Email validation
              if (!user.user_email) {
                errors.push(t("bulkUsers.emailRequired"));
              } else if (!user.user_email.includes("@") || !user.user_email.includes(".")) {
                errors.push(t("bulkUsers.invalidEmail"));
              }

              // Role validation
              if (!user.user_role) {
                errors.push(t("bulkUsers.roleRequired"));
              } else {
                // Validate user role
                const validRoles = ["proxy_admin", "proxy_admin_viewer", "internal_user", "internal_user_viewer"];
                if (!validRoles.includes(user.user_role)) {
                  errors.push(t("bulkUsers.invalidRole", { role: user.user_role, roles: validRoles.join(", ") }));
                }
              }

              // Budget validation
              if (user.max_budget && user.max_budget.toString().trim() !== "") {
                if (isNaN(parseFloat(user.max_budget.toString()))) {
                  errors.push(t("bulkUsers.maxBudgetNumber", { budget: user.max_budget }));
                } else if (parseFloat(user.max_budget.toString()) <= 0) {
                  errors.push(t("bulkUsers.maxBudgetPositive"));
                }
              }

              // Budget duration validation
              if (user.budget_duration && !user.budget_duration.match(/^\d+[dhmwy]$|^\d+mo$/)) {
                errors.push(t("bulkUsers.invalidBudgetDuration", { duration: user.budget_duration }));
              }

              // Teams validation
              if (user.teams && typeof user.teams === "string") {
                // Check if teams exist (if teams data is available)
                if (teams && teams.length > 0) {
                  const teamIds = teams.map((t) => t.team_id);
                  const userTeams = user.teams.split(",").map((t) => t.trim());
                  const invalidTeams = userTeams.filter((t) => !teamIds.includes(t));
                  if (invalidTeams.length > 0) {
                    errors.push(t("bulkUsers.unknownTeams", { teams: invalidTeams.join(", ") }));
                  }
                }
              }

              if (errors.length > 0) {
                user.isValid = false;
                user.error = errors.join(", ");
              }

              return user;
            })
            .filter(Boolean) as UserData[]; // Filter out null values (empty rows)

          const validData = userData.filter((user) => user.isValid);
          setParsedData(userData);

          if (userData.length === 0) {
            setCsvStructureError(t("bulkUsers.noValidDataRows"));
          } else if (validData.length === 0) {
            setParseError(t("bulkUsers.noValidUsers"));
          } else if (validData.length < userData.length) {
            setParseError(
              t("bulkUsers.rowsWithErrors", {
                errorCount: userData.length - validData.length,
                total: userData.length,
              }),
            );
          } else {
            toast.success(t("bulkUsers.parsedUsers", { count: validData.length }));
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          setParseError(`Error parsing CSV: ${errorMessage}`);
          setParsedData([]);
        }
      },
      error: (error) => {
        setParseError(`Failed to parse CSV file: ${error.message}`);
        setParsedData([]);
      },
      header: false,
    });
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setParsedData([]);
    setParseError(null);
    setCsvStructureError(null);
    setFileError(null);
  };

  const resetParsedData = () => {
    setParsedData([]);
    setParseError(null);
    setPageIndex(0);
  };

  const handleBulkCreate = async () => {
    setIsProcessing(true);
    const updatedData = parsedData.map((user) => ({ ...user, status: "pending" }));
    setParsedData(updatedData);

    let anySuccessful = false;

    for (let index = 0; index < updatedData.length; index++) {
      const user = updatedData[index];
      try {
        // Create a clean user object with only non-empty values
        const cleanUser: Partial<UserData> = {
          user_email: user.user_email,
          user_role: user.user_role,
        };

        // Only add optional fields if they have values
        if (user.teams && typeof user.teams === "string" && user.teams.trim() !== "") {
          cleanUser.teams = user.teams
            .split(",")
            .map((team) => team.trim())
            .filter(Boolean);
          // Only include teams if there's at least one valid team
          if (cleanUser.teams.length === 0) {
            delete cleanUser.teams;
          }
        }

        // Only add models if provided and non-empty
        if (user.models && typeof user.models === "string" && user.models.trim() !== "") {
          cleanUser.models = user.models
            .split(",")
            .map((model) => model.trim())
            .filter(Boolean);
          // Only include models if there's at least one valid model
          if (cleanUser.models.length === 0) {
            delete cleanUser.models;
          }
        }

        // Only add max_budget if it's a valid number
        if (user.max_budget && user.max_budget.toString().trim() !== "") {
          const budgetValue = parseFloat(user.max_budget.toString());
          if (!isNaN(budgetValue) && budgetValue > 0) {
            cleanUser.max_budget = budgetValue;
          }
        }

        // Only add budget_duration if provided and non-empty
        if (user.budget_duration && user.budget_duration.trim() !== "") {
          cleanUser.budget_duration = user.budget_duration.trim();
        }

        // Only add metadata if provided and non-empty
        if (user.metadata && typeof user.metadata === "string" && user.metadata.trim() !== "") {
          cleanUser.metadata = user.metadata.trim();
        }

        const response = await userCreateCall(accessToken, null, cleanUser);

        // Check if response has key or user_id, indicating success
        if (response && (response.key || response.user_id)) {
          anySuccessful = true;
          const user_id = response.data?.user_id || response.user_id;

          // Create invitation link for the user
          try {
            if (!uiSettings?.SSO_ENABLED) {
              // Regular invitation flow
              const invitationData = await invitationCreateCall(accessToken, user_id);
              const invitationUrl = new URL(`/ui/onboarding?invitation_id=${invitationData.id}`, baseUrl).toString();

              setParsedData((current) =>
                current.map((u, i) =>
                  i === index
                    ? {
                        ...u,
                        status: "success",
                        key: response.key || response.user_id,
                        invitation_link: invitationUrl,
                      }
                    : u,
                ),
              );
            } else {
              // SSO flow - just use the base URL
              const invitationUrl = new URL("/ui", baseUrl).toString();

              setParsedData((current) =>
                current.map((u, i) =>
                  i === index
                    ? {
                        ...u,
                        status: "success",
                        key: response.key || response.user_id,
                        invitation_link: invitationUrl,
                      }
                    : u,
                ),
              );
            }
          } catch (inviteError) {
            console.error("Error creating invitation:", inviteError);
            setParsedData((current) =>
              current.map((u, i) =>
                i === index
                  ? {
                      ...u,
                      status: "success",
                      key: response.key || response.user_id,
                      error: t("bulkUsers.userCreatedInviteFailed"),
                    }
                  : u,
              ),
            );
          }
        } else {
          const errorMessage = response?.error || t("bulkUsers.failedToCreateUser");
          setParsedData((current) =>
            current.map((u, i) => (i === index ? { ...u, status: "failed", error: errorMessage } : u)),
          );
        }
      } catch (error) {
        console.error("Caught error:", error);
        const errorMessage = (error as any)?.response?.data?.error || (error as Error)?.message || String(error);
        setParsedData((current) =>
          current.map((u, i) => (i === index ? { ...u, status: "failed", error: errorMessage } : u)),
        );
      }
    }

    setIsProcessing(false);

    // Call the callback if any users were successfully created
    if (anySuccessful && onUsersCreated) {
      onUsersCreated();
    }
  };

  const downloadResults = () => {
    const results = parsedData.map((user) => ({
      user_email: user.user_email,
      user_role: user.user_role,
      status: user.status,
      key: user.key || "",
      invitation_link: user.invitation_link || "",
      error: user.error || "",
    }));

    const csv = Papa.unparse(results);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_users_results.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const renderStatusCell = (record: UserData) => {
    if (!record.isValid) {
      return (
        <div>
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-destructive mr-2" />
            <span className="text-destructive">{t("bulkUsers.invalid")}</span>
          </div>
          {record.error && <span className="text-sm text-destructive ml-7">{record.error}</span>}
        </div>
      );
    }
    if (!record.status || record.status === "pending") {
      return <span className="text-muted-foreground">{t("bulkUsers.pending")}</span>;
    }
    if (record.status === "success") {
      return (
        <div>
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-success mr-2" />
            <span className="text-success">{t("bulkUsers.success")}</span>
          </div>
          {record.invitation_link && (
            <div className="mt-1">
              <div className="flex items-center">
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">{record.invitation_link}</span>
                <CopyToClipboard
                  text={record.invitation_link}
                  onCopy={() => toast.success(t("bulkUsers.invitationCopied"))}
                >
                  <button className="ml-1 text-info text-xs hover:text-info/80">{t("bulkUsers.copy")}</button>
                </CopyToClipboard>
              </div>
            </div>
          )}
        </div>
      );
    }
    return (
      <div>
        <div className="flex items-center">
          <XCircleIcon className="h-5 w-5 text-destructive mr-2" />
          <span className="text-destructive">{t("bulkUsers.failed")}</span>
        </div>
        {record.error && <span className="text-sm text-destructive ml-7">{JSON.stringify(record.error)}</span>}
      </div>
    );
  };

  const pageCount = Math.max(1, Math.ceil(parsedData.length / PREVIEW_PAGE_SIZE));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const visibleRows = parsedData.slice(currentPage * PREVIEW_PAGE_SIZE, (currentPage + 1) * PREVIEW_PAGE_SIZE);

  return (
    <>
      <Button className="mb-0" onClick={() => setIsModalVisible(true)}>
        {t("bulkUsers.button")}
      </Button>

      <Dialog open={isModalVisible} onOpenChange={(open) => !open && setIsModalVisible(false)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{t("bulkUsers.title")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col">
            {/* Step indicator */}
            {parsedData.length === 0 ? (
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-info text-info-foreground flex items-center justify-center mr-3">
                    1
                  </div>
                  <h3 className="text-lg font-medium">{t("bulkUsers.step1Title")}</h3>
                </div>

                <div className="ml-11 mb-6">
                  <p className="mb-4">{t("bulkUsers.intro")}</p>
                  <ol className="list-decimal list-inside space-y-2 ml-2 mb-4">
                    <li>{t("bulkUsers.stepDownload")}</li>
                    <li>{t("bulkUsers.stepFill")}</li>
                    <li>{t("bulkUsers.stepSave")}</li>
                    <li>{t("bulkUsers.stepResults")}</li>
                  </ol>

                  <div className="bg-muted p-4 rounded-md border border-border mb-4">
                    <h4 className="font-medium mb-2">{t("bulkUsers.templateColumns")}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start">
                        <div className="w-3 h-3 rounded-full bg-destructive mt-1.5 mr-2 shrink-0"></div>
                        <div>
                          <p className="font-medium">user_email</p>
                          <p className="text-sm text-muted-foreground">{t("bulkUsers.colUserEmail")}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-3 h-3 rounded-full bg-destructive mt-1.5 mr-2 shrink-0"></div>
                        <div>
                          <p className="font-medium">user_role</p>
                          <p className="text-sm text-muted-foreground">{t("bulkUsers.colUserRole")}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-3 h-3 rounded-full bg-border mt-1.5 mr-2 shrink-0"></div>
                        <div>
                          <p className="font-medium">teams</p>
                          <p className="text-sm text-muted-foreground">{t("bulkUsers.colTeams")}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-3 h-3 rounded-full bg-border mt-1.5 mr-2 shrink-0"></div>
                        <div>
                          <p className="font-medium">max_budget</p>
                          <p className="text-sm text-muted-foreground">{t("bulkUsers.colMaxBudget")}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-3 h-3 rounded-full bg-border mt-1.5 mr-2 shrink-0"></div>
                        <div>
                          <p className="font-medium">budget_duration</p>
                          <p className="text-sm text-muted-foreground">{t("bulkUsers.colBudgetDuration")}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-3 h-3 rounded-full bg-border mt-1.5 mr-2 shrink-0"></div>
                        <div>
                          <p className="font-medium">models</p>
                          <p className="text-sm text-muted-foreground">{t("bulkUsers.colModels")}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button size="lg" className="w-full md:w-auto">
                    <Download className="size-4" />
                    {t("bulkUsers.downloadTemplate")}
                  </Button>
                </div>

                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-info text-info-foreground flex items-center justify-center mr-3">
                    2
                  </div>
                  <h3 className="text-lg font-medium">{t("bulkUsers.step2Title")}</h3>
                </div>

                <div className="ml-11">
                  {selectedFile ? (
                    <div
                      className={`mb-4 p-4 rounded-md border ${fileError ? "bg-destructive/10 border-destructive/20" : "bg-info/10 border-info/20"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0">
                          {fileError ? (
                            <FileWarning className="size-5 shrink-0 text-destructive mr-3" />
                          ) : (
                            <FileText className="size-5 shrink-0 text-info mr-3" />
                          )}
                          <div className="min-w-0">
                            <strong className={`break-words ${fileError ? "text-destructive" : "text-info"}`}>
                              {selectedFile.name}
                            </strong>
                            <span className={`block text-xs ${fileError ? "text-destructive" : "text-info"}`}>
                              {(selectedFile.size / 1024).toFixed(1)} KB • {new Date().toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={removeSelectedFile} className="flex items-center">
                          <Trash2 className="size-4" />
                          {t("bulkUsers.remove")}
                        </Button>
                      </div>

                      {fileError ? (
                        <div className="mt-3 text-destructive text-sm flex items-start">
                          <TriangleAlert className="size-3.5 shrink-0 mr-2 mt-0.5" />
                          <span className="min-w-0 break-words">{fileError}</span>
                        </div>
                      ) : (
                        !csvStructureError && (
                          <div className="mt-3 flex items-center">
                            <div className="w-full bg-border rounded-full h-1.5">
                              <div className="bg-info h-1.5 rounded-full w-full animate-pulse"></div>
                            </div>
                            <span className="ml-2 text-xs text-info">{t("bulkUsers.processing")}</span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <label
                      htmlFor={csvInputId}
                      className="block"
                      onDragOver={handleDragOver}
                      onDragLeave={() => setIsDraggingOver(false)}
                      onDrop={handleDrop}
                    >
                      <div
                        className={`border-2 border-dashed ${isDraggingOver ? "border-info" : "border-border"} rounded-lg p-8 text-center hover:border-info focus-within:border-info transition-colors cursor-pointer`}
                      >
                        <input
                          id={csvInputId}
                          type="file"
                          accept=".csv"
                          className="sr-only"
                          onChange={handleFileInputChange}
                        />
                        <Upload className="size-[30px] text-muted-foreground mb-2" />
                        <p className="mb-1">{t("bulkUsers.dragDrop")}</p>
                        <p className="text-sm text-muted-foreground mb-3">{t("bulkUsers.or")}</p>
                        <span className={buttonVariants({ variant: "outline", size: "sm" })}>
                          {t("bulkUsers.browseFiles")}
                        </span>
                        <p className="text-xs text-muted-foreground mt-4">{t("bulkUsers.onlyCsv")}</p>
                      </div>
                    </label>
                  )}

                  {csvStructureError && (
                    <div className="mb-4 p-4 bg-warning/10 border border-warning/20 rounded-md">
                      <div className="flex items-start">
                        <ExclamationIcon className="h-5 w-5 shrink-0 text-warning mr-2 mt-0.5" />
                        <div className="min-w-0">
                          <strong className="text-warning">{t("bulkUsers.csvStructureError")}</strong>
                          <p className="text-warning mt-1 mb-0 break-words">{csvStructureError}</p>
                          <p className="text-warning mt-2 mb-0">{t("bulkUsers.downloadTemplateNote")}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-info text-info-foreground flex items-center justify-center mr-3">
                    3
                  </div>
                  <h3 className="text-lg font-medium">
                    {parsedData.some((user) => user.status === "success" || user.status === "failed")
                      ? t("bulkUsers.resultsTitle")
                      : t("bulkUsers.reviewTitle")}
                  </h3>
                </div>

                {parseError && (
                  <div className="ml-11 mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div className="flex items-start">
                      <TriangleAlert className="size-4 shrink-0 text-destructive mr-2 mt-1" />
                      <div className="min-w-0">
                        <p className="text-destructive font-medium break-words">{parseError}</p>
                        {parsedData.some((user) => !user.isValid) && (
                          <ul className="mt-2 list-disc list-inside text-destructive text-sm">
                            <li>{t("bulkUsers.checkTable")}</li>
                            <li>{t("bulkUsers.commonIssues")}</li>
                            <li>{t("bulkUsers.fixIssues")}</li>
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="ml-11">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      {parsedData.some((user) => user.status === "success" || user.status === "failed") ? (
                        <div className="flex items-center">
                          <p className="text-lg font-medium mr-3">{t("bulkUsers.creationSummary")}</p>
                          <p className="text-sm bg-success/15 text-success px-2 py-1 rounded-sm mr-2">
                            {t("bulkUsers.successfulCount", {
                              count: parsedData.filter((d) => d.status === "success").length,
                            })}
                          </p>
                          {parsedData.some((d) => d.status === "failed") && (
                            <p className="text-sm bg-destructive/15 text-destructive px-2 py-1 rounded-sm">
                              {t("bulkUsers.failedCount", {
                                count: parsedData.filter((d) => d.status === "failed").length,
                              })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <p className="text-lg font-medium mr-3">{t("bulkUsers.userPreview")}</p>
                          <p className="text-sm bg-info/15 text-info px-2 py-1 rounded-sm">
                            {t("bulkUsers.validCount", {
                              valid: parsedData.filter((d) => d.isValid).length,
                              total: parsedData.length,
                            })}
                          </p>
                        </div>
                      )}
                    </div>

                    {!parsedData.some((user) => user.status === "success" || user.status === "failed") && (
                      <div className="flex space-x-3">
                        <Button variant="outline" onClick={resetParsedData}>
                          {t("bulkUsers.back")}
                        </Button>
                        <Button
                          onClick={handleBulkCreate}
                          disabled={parsedData.filter((d) => d.isValid).length === 0 || isProcessing}
                        >
                          {isProcessing
                            ? t("bulkUsers.creating")
                            : t("bulkUsers.createUsers", { count: parsedData.filter((d) => d.isValid).length })}
                        </Button>
                      </div>
                    )}
                  </div>

                  {parsedData.some((user) => user.status === "success") && (
                    <div className="mb-4 p-4 bg-info/10 border border-info/20 rounded-md">
                      <div className="flex items-start">
                        <div className="mr-3 mt-1">
                          <CheckCircleIcon className="h-5 w-5 text-info" />
                        </div>
                        <div>
                          <p className="font-medium text-info">{t("bulkUsers.creationComplete")}</p>
                          <p className="block text-sm text-info mt-1">
                            <Trans
                              ns="templates"
                              i18nKey="bulkUsers.nextStep"
                              components={{ bold: <span className="font-medium" /> }}
                            />
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">{t("bulkUsers.tableRow")}</TableHead>
                          <TableHead>{t("bulkUsers.tableEmail")}</TableHead>
                          <TableHead>{t("bulkUsers.tableRole")}</TableHead>
                          <TableHead>{t("bulkUsers.tableTeams")}</TableHead>
                          <TableHead>{t("bulkUsers.tableBudget")}</TableHead>
                          <TableHead>{t("bulkUsers.tableStatus")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleRows.map((record) => (
                          <TableRow key={record.rowNumber} className={!record.isValid ? "bg-destructive/10" : ""}>
                            <TableCell>{record.rowNumber}</TableCell>
                            <TableCell className="whitespace-normal break-words">{record.user_email}</TableCell>
                            <TableCell className="whitespace-normal break-words">{record.user_role}</TableCell>
                            <TableCell className="whitespace-normal break-words">{record.teams}</TableCell>
                            <TableCell>{record.max_budget}</TableCell>
                            <TableCell className="whitespace-normal break-words">{renderStatusCell(record)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {pageCount > 1 && (
                    <div className="flex items-center justify-end gap-3 mt-2">
                      <span className="text-sm text-muted-foreground">
                        {t("bulkUsers.pageOf", { page: currentPage + 1, pageCount })}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageIndex(currentPage - 1)}
                        disabled={currentPage === 0}
                      >
                        {t("bulkUsers.previous")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageIndex(currentPage + 1)}
                        disabled={currentPage >= pageCount - 1}
                      >
                        {t("bulkUsers.next")}
                      </Button>
                    </div>
                  )}

                  {!parsedData.some((user) => user.status === "success" || user.status === "failed") && (
                    <div className="flex justify-end mt-4">
                      <Button variant="outline" onClick={resetParsedData} className="mr-3">
                        {t("bulkUsers.back")}
                      </Button>
                      <Button
                        onClick={handleBulkCreate}
                        disabled={parsedData.filter((d) => d.isValid).length === 0 || isProcessing}
                      >
                        {isProcessing
                          ? t("bulkUsers.creating")
                          : t("bulkUsers.createUsers", { count: parsedData.filter((d) => d.isValid).length })}
                      </Button>
                    </div>
                  )}

                  {parsedData.some((user) => user.status === "success" || user.status === "failed") && (
                    <div className="flex justify-end mt-4">
                      <Button variant="outline" onClick={resetParsedData} className="mr-3">
                        {t("bulkUsers.startNewImport")}
                      </Button>
                      <Button onClick={downloadResults}>
                        <Download className="size-4" />
                        {t("bulkUsers.downloadCredentials")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkCreateUsersButton;
