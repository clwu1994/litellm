import type { TFunction } from "i18next";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { testSearchToolConnection } from "@/components/networking";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";

interface SearchConnectionTestProps {
  litellmParams: Record<string, any>;
  accessToken: string;
  onTestComplete?: () => void;
}

const SearchConnectionTest: React.FC<SearchConnectionTestProps> = ({ litellmParams, accessToken, onTestComplete }) => {
  const { t } = useTranslation("searchTools");
  const [isLoading, setIsLoading] = useState(true);
  const [testResult, setTestResult] = useState<{
    status: "success" | "error";
    message: string;
    test_query?: string;
    results_count?: number;
    error_type?: string;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const runTest = async () => {
      setIsLoading(true);
      try {
        const result = await testSearchToolConnection(accessToken, litellmParams);
        setTestResult(result);
        if (result.status === "success") {
          toast.success(t("connection.toast.success"));
        }
      } catch (error) {
        setTestResult({
          status: "error",
          message: error instanceof Error ? error.message : t("connection.unknownError"),
          error_type: "NetworkError",
        });
      } finally {
        setIsLoading(false);
        if (onTestComplete) {
          onTestComplete();
        }
      }
    };

    runTest();
  }, [accessToken, litellmParams, onTestComplete, t]);

  const getCleanErrorMessage = (t: TFunction<"searchTools">, errorMsg: string) => {
    if (!errorMsg) return t("connection.unknownErrorShort");

    const mainError = errorMsg.split("stack trace:")[0].trim();

    const cleanedError = mainError.replace(/^litellm\.(.*?)Error:\s*/, "");

    const finalError = cleanedError.replace(/^AuthenticationError:\s*/, "");

    if (finalError.includes("<html>") || finalError.includes("<!DOCTYPE")) {
      const titleMatch = finalError.match(/<title>(.*?)<\/title>/);
      if (titleMatch) {
        return titleMatch[1];
      }
      if (finalError.includes("401") || finalError.includes("Authorization Required")) {
        return t("connection.authFailedInvalidKey");
      }
      return t("connection.authError");
    }

    if (finalError.length > 200) {
      return finalError.substring(0, 200) + "...";
    }

    return finalError;
  };

  const errorMessage = testResult?.message
    ? getCleanErrorMessage(t, testResult.message)
    : t("connection.unknownErrorShort");

  if (isLoading) {
    return (
      <div className="rounded-lg bg-card p-6">
        <div className="flex flex-col items-center justify-center px-5 py-8">
          <UiLoadingSpinner className="mb-4 size-8 text-primary" />
          <p className="text-base text-foreground">
            {t("connection.testing", {
              provider: litellmParams.search_provider || t("connection.providerFallback"),
            })}
          </p>
        </div>
      </div>
    );
  }

  if (!testResult) {
    return null;
  }

  return (
    <div className="rounded-lg bg-card p-6">
      {testResult.status === "success" ? (
        <div className="flex items-center justify-center px-5 py-8">
          <CheckCircle2 className="size-6 text-success" />
          <div className="ml-3">
            <p className="text-lg font-medium text-success">
              {t("connection.success", { provider: litellmParams.search_provider })}
            </p>
            {testResult.test_query && (
              <p className="mt-2 text-sm text-muted-foreground">
                {t("connection.testQuery")}{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">{testResult.test_query}</code>
              </p>
            )}
            {testResult.results_count !== undefined && (
              <p className="text-sm text-muted-foreground">
                {t("connection.resultsRetrieved", { resultsCount: testResult.results_count })}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-5 flex items-center">
            <AlertTriangle className="mr-3 size-6 text-destructive" />
            <p className="text-lg font-medium text-destructive">
              {t("connection.failed", {
                provider: litellmParams.search_provider || t("connection.providerFallback"),
              })}
            </p>
          </div>

          <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <p className="mb-2 font-semibold text-foreground">{t("connection.errorLabel")} </p>
            <p className="text-sm leading-relaxed text-destructive">{errorMessage}</p>

            {testResult.error_type && (
              <div className="mt-2">
                <p className="text-[13px] text-muted-foreground">
                  {t("connection.errorType")}{" "}
                  <code className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive">
                    {testResult.error_type}
                  </code>
                </p>
              </div>
            )}

            {testResult.message && (
              <div className="mt-3">
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setShowDetails(!showDetails)}>
                  {showDetails ? t("connection.hideDetails") : t("connection.showDetails")}
                </Button>
              </div>
            )}
          </div>

          {showDetails && (
            <div className="mb-5">
              <p className="mb-2 text-[15px] font-semibold text-foreground">{t("connection.fullErrorDetails")}</p>
              <pre className="max-h-52 overflow-auto rounded-lg border border-border bg-muted p-4 text-[13px] leading-relaxed break-words whitespace-pre-wrap">
                {testResult.message}
              </pre>
            </div>
          )}

          <div className="rounded-lg border border-warning/20 border-l-4 border-l-amber-500 bg-warning/10 p-4">
            <p className="mb-2 font-semibold text-warning">{t("connection.troubleshooting")}</p>
            <ul className="my-2 list-disc pl-5 text-warning">
              <li className="mb-1.5">{t("connection.tip1")}</li>
              <li className="mb-1.5">{t("connection.tip2")}</li>
              <li className="mb-1.5">{t("connection.tip3")}</li>
              <li className="mb-1.5">{t("connection.tip4")}</li>
            </ul>
          </div>
        </div>
      )}
      <Separator className="mt-6 mb-4" />
      <div className="flex items-center justify-between">
        <a
          href="https://docs.litellm.ai/docs/search"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Info className="size-4" />
          {t("connection.docsLink")}
        </a>
      </div>
    </div>
  );
};

export default SearchConnectionTest;
