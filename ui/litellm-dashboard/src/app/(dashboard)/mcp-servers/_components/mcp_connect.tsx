/* eslint-disable react/no-unescaped-entities */

import React, { useId, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CopyIcon,
  Code,
  Terminal,
  Globe,
  CheckIcon,
  ExternalLinkIcon,
  Info,
  KeyIcon,
  ServerIcon,
  Zap,
} from "lucide-react";
import { getProxyBaseUrl } from "@/components/networking";
import { copyToClipboard as utilCopyToClipboard } from "@/utils/dataUtils";

interface CodeBlockProps {
  code: string;
  title?: string;
  copyKey: string;
  className?: string;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  serverName?: string;
  accessGroups?: string[];
  showServerHeaderToggle?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  children,
  serverName,
  accessGroups = ["dev-group"],
  showServerHeaderToggle = false,
}) => {
  const { t } = useTranslation("mcpServers");
  const [useServerHeader, setUseServerHeader] = useState(false);
  const serverHeaderToggleId = useId();

  const getHeadersConfig = () => {
    const headers: Record<string, any> = {
      "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
    };
    if (useServerHeader && serverName) {
      const formattedServerName = serverName.replace(/\s+/g, "_");
      // Include both server name and access groups in the same header (comma-separated string)
      const serverAndGroups = [formattedServerName, ...accessGroups].join(",");
      headers["x-mcp-servers"] = serverAndGroups;
    }
    return headers;
  };

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-3 mb-3">
          <span className="p-2 rounded-lg bg-muted">{icon}</span>
          <div>
            <h5 className="mb-0 text-base font-semibold text-foreground">{title}</h5>
            <span className="text-muted-foreground">{description}</span>
          </div>
        </div>
        {serverName && showServerHeaderToggle && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Switch
                id={serverHeaderToggleId}
                size="sm"
                checked={useServerHeader}
                onCheckedChange={setUseServerHeader}
              />
              <Label htmlFor={serverHeaderToggleId} className="font-normal leading-normal">
                <Trans ns="mcpServers" i18nKey="connect.limitTools" components={{ code: <code /> }}>
                  Limit tools to specific MCP servers or MCP groups by passing the <code>x-mcp-servers</code> header
                </Trans>
              </Label>
            </div>
            {useServerHeader && (
              <Alert className="mt-2" variant="info">
                <Info />
                <AlertTitle>{t("connect.twoOptions.title")}</AlertTitle>
                <AlertDescription>
                  <div>
                    <p>
                      <strong>{t("connect.twoOptions.option1Label")}</strong> {t("connect.twoOptions.option1Text")}{" "}
                      <code>"{serverName.replace(/\s+/g, "_")}"</code>
                    </p>
                    <p>
                      <strong>{t("connect.twoOptions.option2Label")}</strong> {t("connect.twoOptions.option2Text")}{" "}
                      <code>"dev-group"</code>
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("connect.twoOptions.mix")} <code>"Server1,dev-group"</code>
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        {React.Children.map(children, (child) => {
          if (
            React.isValidElement<CodeBlockProps>(child) &&
            child.props.hasOwnProperty("code") &&
            child.props.hasOwnProperty("copyKey")
          ) {
            const code = child.props.code;
            if (code && code.includes('"headers":')) {
              return React.cloneElement(child, {
                code: code.replace(/"headers":\s*{[^}]*}/, `"headers": ${JSON.stringify(getHeadersConfig(), null, 8)}`),
              });
            }
          }
          return child;
        })}
      </CardContent>
    </Card>
  );
};

interface MCPConnectProps {
  currentServerAccessGroups?: string[];
}

const MCPConnect: React.FC<MCPConnectProps> = ({ currentServerAccessGroups = [] }) => {
  const { t } = useTranslation("mcpServers");
  const proxyBaseUrl = getProxyBaseUrl();
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [currentServer] = useState("Zapier_MCP"); // This should match the current server being viewed

  const copyToClipboard = async (text: string, key: string) => {
    const success = await utilCopyToClipboard(text);
    if (success) {
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    }
  };

  const CodeBlock: React.FC<{
    code: string;
    copyKey: string;
    title?: string;
    className?: string;
  }> = ({ code, copyKey, title, className = "" }) => (
    <div className="relative group">
      {title && (
        <div className="flex items-center gap-2 mb-2">
          <Code size={16} className="text-info" />
          <strong className="font-semibold text-foreground">{title}</strong>
        </div>
      )}
      <Card className={`relative bg-muted ${className}`}>
        <CardContent>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => copyToClipboard(code, copyKey)}
            className={`absolute top-2 right-2 z-raised transition-all duration-200 ${
              copiedStates[copyKey]
                ? "text-success bg-success/10 border-success/20"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {copiedStates[copyKey] ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          </Button>
          <pre className="text-sm overflow-x-auto pr-10 text-foreground font-mono leading-relaxed">{code}</pre>
        </CardContent>
      </Card>
    </div>
  );

  const StepCard: React.FC<{
    step: number;
    title: string;
    children: React.ReactNode;
  }> = ({ step, title, children }) => (
    <div className="flex gap-4">
      <div className="shrink-0">
        <div className="w-8 h-8 bg-info text-info-foreground rounded-full flex items-center justify-center text-sm font-semibold">
          {step}
        </div>
      </div>
      <div className="flex-1">
        <strong className="mb-2 block font-semibold text-foreground">{title}</strong>
        {children}
      </div>
    </div>
  );

  const LiteLLMProxyTab = () => (
    <div className="flex w-full flex-col gap-6">
      <div className="bg-linear-to-r from-success/15 to-success/5 p-6 rounded-lg border border-success/15">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="text-success" size={24} />
          <h4 className="mb-0 text-xl font-semibold text-success">{t("connect.litellm.title")}</h4>
        </div>
        <span className="text-success">{t("connect.litellm.description")}</span>
      </div>

      <div className="flex w-full flex-col gap-6">
        <FeatureCard
          icon={<KeyIcon className="text-success" size={16} />}
          title={t("connect.litellm.virtualKeySetup")}
          description={t("connect.litellm.virtualKeySetupDescription")}
        >
          <div className="flex w-full flex-col gap-4">
            <div>
              <span>{t("connect.litellm.getVirtualKey")}</span>
            </div>
            <CodeBlock
              title={t("connect.common.environmentVariable")}
              code='export LITELLM_API_KEY="sk-..."'
              copyKey="litellm-env"
            />
          </div>
        </FeatureCard>

        <FeatureCard
          icon={<ServerIcon className="text-success" size={16} />}
          title={t("connect.common.mcpServerInformation")}
          description={t("connect.common.mcpServerInformationDescription")}
        >
          <CodeBlock title={t("connect.common.serverUrl")} code={`${proxyBaseUrl}/mcp`} copyKey="litellm-server-url" />
        </FeatureCard>

        <FeatureCard
          icon={<Code className="text-success" size={16} />}
          title={t("connect.common.implementationExample")}
          description={t("connect.litellm.curlDescription")}
          serverName={currentServer}
          accessGroups={["dev-group"]}
          showServerHeaderToggle
        >
          <CodeBlock
            code={`curl --location '${proxyBaseUrl}/v1/responses' \\
--header 'Content-Type: application/json' \\
--header "Authorization: Bearer $LITELLM_VIRTUAL_KEY" \\
--data '{
    "model": "gpt-4",
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "litellm_proxy",
            "require_approval": "never",
            "headers": {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_VIRTUAL_KEY",
                "x-mcp-servers": "Zapier_MCP,dev-group"
            }
        }
    ],
    "input": "Run available tools",
    "tool_choice": "required"
}'`}
            copyKey="litellm-curl"
            className="text-xs"
          />
        </FeatureCard>
      </div>
    </div>
  );

  const OpenAITab = () => (
    <div className="flex w-full flex-col gap-6">
      <div className="bg-linear-to-r from-info/15 to-info/5 p-6 rounded-lg border border-info/15">
        <div className="flex items-center gap-3 mb-3">
          <Code className="text-info" size={24} />
          <h4 className="mb-0 text-xl font-semibold text-info">{t("connect.openai.title")}</h4>
        </div>
        <span className="text-info">{t("connect.openai.description")}</span>
      </div>

      <div className="flex w-full flex-col gap-6">
        <FeatureCard
          icon={<KeyIcon className="text-info" size={16} />}
          title={t("connect.openai.apiKeySetup")}
          description={t("connect.openai.apiKeySetupDescription")}
        >
          <div className="flex w-full flex-col gap-4">
            <div>
              <span>
                {t("connect.openai.getKeyPrefix")}{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-info hover:text-info/80 inline-flex items-center gap-1"
                >
                  {t("connect.openai.platformLink")} <ExternalLinkIcon size={12} />
                </a>
              </span>
            </div>
            <CodeBlock
              title={t("connect.common.environmentVariable")}
              code='export OPENAI_API_KEY="sk-..."'
              copyKey="openai-env"
            />
          </div>
        </FeatureCard>

        <FeatureCard
          icon={<ServerIcon className="text-info" size={16} />}
          title={t("connect.common.mcpServerInformation")}
          description={t("connect.common.mcpServerInformationDescription")}
        >
          <CodeBlock title={t("connect.common.serverUrl")} code={`${proxyBaseUrl}/mcp`} copyKey="openai-server-url" />
        </FeatureCard>

        <FeatureCard
          icon={<Code className="text-info" size={16} />}
          title={t("connect.common.implementationExample")}
          description={t("connect.openai.curlDescription")}
          serverName="Zapier Gmail"
          accessGroups={["dev-group"]}
          showServerHeaderToggle
        >
          <CodeBlock
            code={`curl --location 'https://api.openai.com/v1/responses' \\
--header 'Content-Type: application/json' \\
--header "Authorization: Bearer $OPENAI_API_KEY" \\
--data '{
    "model": "gpt-4.1",
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "${proxyBaseUrl}/mcp",
            "require_approval": "never",
            "headers": {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
                "x-mcp-servers": "Zapier_MCP,dev-group"
            }
        }
    ],
    "input": "Run available tools",
    "tool_choice": "required"
}'`}
            copyKey="openai-curl"
            className="text-xs"
          />
        </FeatureCard>
      </div>
    </div>
  );

  const CursorTab = () => (
    <div className="flex w-full flex-col gap-6">
      <div className="bg-linear-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-100 dark:from-purple-950 dark:to-blue-950 dark:border-purple-900">
        <div className="flex items-center gap-3 mb-3">
          <Terminal className="text-purple-600 dark:text-purple-400" size={24} />
          <h4 className="mb-0 text-xl font-semibold text-purple-900 dark:text-purple-100">
            {t("connect.cursor.title")}
          </h4>
        </div>
        <span className="text-purple-700 dark:text-purple-300">{t("connect.cursor.description")}</span>
      </div>

      <Card>
        <CardContent>
          <h5 className="mb-4 text-base font-semibold text-foreground">{t("connect.cursor.setupInstructions")}</h5>
          <div className="flex w-full flex-col gap-6">
            <StepCard step={1} title={t("connect.cursor.step1Title")}>
              <span className="text-muted-foreground">
                <Trans
                  ns="mcpServers"
                  i18nKey="connect.cursor.shortcut"
                  components={{ code: <code className="bg-muted px-2 py-1 rounded-sm" /> }}
                >
                  Use the keyboard shortcut <code>⇧+⌘+J</code> (Mac) or <code>Ctrl+Shift+J</code> (Windows/Linux)
                </Trans>
              </span>
            </StepCard>

            <StepCard step={2} title={t("connect.cursor.step2Title")}>
              <span className="text-muted-foreground">{t("connect.cursor.step2Text")}</span>
            </StepCard>

            <StepCard step={3} title={t("connect.cursor.step3Title")}>
              <span className="mb-3 text-muted-foreground">
                <Trans
                  ns="mcpServers"
                  i18nKey="connect.cursor.save"
                  components={{ code: <code className="bg-muted px-2 py-1 rounded-sm" /> }}
                >
                  Copy the JSON configuration below and paste it into Cursor, then save with <code>Cmd+S</code> or{" "}
                  <code>Ctrl+S</code>
                </Trans>
              </span>
              <FeatureCard
                icon={<Code className="text-purple-600 dark:text-purple-400" size={16} />}
                title={t("connect.cursor.configuration")}
                description={t("connect.cursor.configurationDescription")}
                serverName="Zapier Gmail"
                accessGroups={["dev-group"]}
                showServerHeaderToggle
              >
                <CodeBlock
                  code={`{
    "mcpServers": {
      "Zapier_MCP": {
        "url": "${proxyBaseUrl}/mcp",
        "headers": {
          "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
          "x-mcp-servers": "Zapier_MCP,dev-group"
        }
      }
    }
  }`}
                  copyKey="cursor-config"
                  className="text-xs"
                />
              </FeatureCard>
            </StepCard>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const StreamableHTTPTab = () => (
    <div className="flex w-full flex-col gap-6">
      <div className="bg-linear-to-r from-success/15 to-success/5 p-6 rounded-lg border border-success/15">
        <div className="flex items-center gap-3 mb-3">
          <Globe className="text-success" size={24} />
          <h4 className="mb-0 text-xl font-semibold text-success">{t("connect.http.title")}</h4>
        </div>
        <span className="text-success">{t("connect.http.description")}</span>
      </div>

      <FeatureCard
        icon={<Globe className="text-success" size={16} />}
        title={t("connect.http.universalTitle")}
        description={t("connect.http.universalDescription")}
      >
        <div className="flex w-full flex-col gap-4">
          <div>
            <span>{t("connect.http.clientTransports")}</span>
          </div>
          <CodeBlock title={t("connect.common.serverUrl")} code={`${proxyBaseUrl}/mcp`} copyKey="http-server-url" />
          <CodeBlock
            title={t("connect.http.headersConfiguration")}
            code={JSON.stringify(
              {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
              },
              null,
              2,
            )}
            copyKey="http-headers"
          />
          <div className="mt-4">
            <Button
              variant="link"
              className="p-0 h-auto text-info hover:text-info/80"
              nativeButton={false}
              render={
                <a
                  href="https://modelcontextprotocol.io/docs/concepts/transports"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <ExternalLinkIcon size={14} />
              {t("connect.http.learnMore")}
            </Button>
          </div>
        </div>
      </FeatureCard>
    </div>
  );

  return (
    <div>
      <div className="flex w-full flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-3">{t("connect.heading")}</h2>
          <p className="text-lg text-muted-foreground">{t("connect.subheading")}</p>
        </div>

        <Tabs defaultValue="openai" className="w-full">
          <TabsList variant="line" className="mt-8 mb-6 h-auto w-full justify-start rounded-none border-b p-0">
            <div className="flex rounded-lg bg-muted p-1">
              <TabsTrigger value="openai" className="flex-none px-6 py-3">
                <span className="flex items-center gap-2 font-medium">
                  <Code size={18} />
                  {t("connect.tabs.openai")}
                </span>
              </TabsTrigger>
              <TabsTrigger value="litellm" className="flex-none px-6 py-3">
                <span className="flex items-center gap-2 font-medium">
                  <Zap size={18} />
                  {t("connect.tabs.litellm")}
                </span>
              </TabsTrigger>
              <TabsTrigger value="cursor" className="flex-none px-6 py-3">
                <span className="flex items-center gap-2 font-medium">
                  <Terminal size={18} />
                  {t("connect.tabs.cursor")}
                </span>
              </TabsTrigger>
              <TabsTrigger value="http" className="flex-none px-6 py-3">
                <span className="flex items-center gap-2 font-medium">
                  <Globe size={18} />
                  {t("connect.tabs.http")}
                </span>
              </TabsTrigger>
            </div>
          </TabsList>
          <TabsContent value="openai" keepMounted className="mt-6">
            <OpenAITab />
          </TabsContent>
          <TabsContent value="litellm" keepMounted className="mt-6">
            <LiteLLMProxyTab />
          </TabsContent>
          <TabsContent value="cursor" keepMounted className="mt-6">
            <CursorTab />
          </TabsContent>
          <TabsContent value="http" keepMounted className="mt-6">
            <StreamableHTTPTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MCPConnect;
