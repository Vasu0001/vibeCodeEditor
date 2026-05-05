"use client";

import React, { useEffect, useRef, useState } from "react";
import type { WebContainer } from "@webcontainer/api";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { TemplateFolder } from "@/features/playground/libs/path-to-json";
import { transformToWebContainerFormat } from "../hooks/transformer";
import TerminalComponent from "./terminal";

interface WebContainerPreviewProps {
  templateData: TemplateFolder;
  serverUrl: string;
  isLoading: boolean;
  error: string | null;
  instance: WebContainer | null;
  writeFileSync: (path: string, content: string) => Promise<void>;
  forceResetup?: boolean;
}

const initialLoadingState = {
  transforming: false,
  mounting: false,
  installing: false,
  starting: false,
  ready: false,
};

const WebContainerPreview: React.FC<WebContainerPreviewProps> = ({
  templateData,
  error,
  instance,
  isLoading,
  forceResetup = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState("");
  const [loadingState, setLoadingState] = useState(initialLoadingState);
  const [currentStep, setCurrentStep] = useState(0);
  const [setupError, setSetupError] = useState<string | null>(null);

  const totalSteps = 4;
  const terminalRef = useRef<any>(null);
  const setupStartedRef = useRef(false);
  const installProcessRef = useRef<any>(null);
  const startProcessRef = useRef<any>(null);
  const activeInstanceRef = useRef<WebContainer | null>(null);
  const serverReadyUnsubscribeRef = useRef<(() => void) | null>(null);

  const writeTerminal = React.useCallback((message: string) => {
    terminalRef.current?.writeToTerminal?.(message);
  }, []);

  const stopProcess = React.useCallback((processRef: React.MutableRefObject<any>) => {
    if (!processRef.current) return;

    try {
      processRef.current.kill();
    } catch {
      // The process may already have exited.
    } finally {
      processRef.current = null;
    }
  }, []);

  const resetSetupState = React.useCallback(() => {
    stopProcess(installProcessRef);
    stopProcess(startProcessRef);
    serverReadyUnsubscribeRef.current?.();
    serverReadyUnsubscribeRef.current = null;
    setupStartedRef.current = false;
    setPreviewUrl("");
    setCurrentStep(0);
    setSetupError(null);
    setLoadingState(initialLoadingState);
  }, [stopProcess]);

  useEffect(() => {
    if (!instance) {
      activeInstanceRef.current = null;
      resetSetupState();
      return;
    }

    if (activeInstanceRef.current !== instance || forceResetup) {
      activeInstanceRef.current = instance;
      resetSetupState();
    }
  }, [forceResetup, instance, resetSetupState]);

  useEffect(() => {
    let cancelled = false;

    const streamOutput = (process: any) => {
      process.output
        .pipeTo(
          new WritableStream({
            write(data) {
              if (!cancelled) {
                writeTerminal(data);
              }
            },
          }),
        )
        .catch(() => {
          // Streams close when processes exit or are killed.
        });
    };

    async function setupContainer() {
      if (!instance || setupStartedRef.current) return;

      try {
        setupStartedRef.current = true;
        setSetupError(null);
        setLoadingState((prev) => ({ ...prev, transforming: true }));
        setCurrentStep(1);
        writeTerminal("Transforming template data...\r\n");

        const files = transformToWebContainerFormat(templateData);
        if (cancelled) return;

        setLoadingState((prev) => ({
          ...prev,
          transforming: false,
          mounting: true,
        }));
        setCurrentStep(2);
        writeTerminal("Mounting files to WebContainer...\r\n");

        await instance.mount(files);
        if (cancelled) return;

        writeTerminal("Files mounted successfully\r\n");
        setLoadingState((prev) => ({
          ...prev,
          mounting: false,
          installing: true,
        }));
        setCurrentStep(3);
        writeTerminal("Installing dependencies...\r\n");

        const installProcess = await instance.spawn("npm", ["install"]);
        installProcessRef.current = installProcess;
        streamOutput(installProcess);

        const installExitCode = await installProcess.exit;
        installProcessRef.current = null;
        if (cancelled) return;

        if (installExitCode !== 0) {
          throw new Error(
            `Failed to install dependencies. Exit code: ${installExitCode}`,
          );
        }

        writeTerminal("Dependencies installed successfully\r\n");
        setLoadingState((prev) => ({
          ...prev,
          installing: false,
          starting: true,
        }));
        setCurrentStep(4);
        writeTerminal("Starting development server...\r\n");

        if (!serverReadyUnsubscribeRef.current) {
          const unsubscribe = instance.on("server-ready", (port, url) => {
            if (cancelled) return;

            writeTerminal(`Server ready on WebContainer port ${port}\r\n`);
            writeTerminal(`Open the app in the preview panel: ${url}\r\n`);
            writeTerminal("Do not open host localhost:3000; that is the VibeCode app.\r\n");
            setPreviewUrl(url);
            setLoadingState((prev) => ({
              ...prev,
              starting: false,
              ready: true,
            }));
          });

          if (typeof unsubscribe === "function") {
            serverReadyUnsubscribeRef.current = unsubscribe;
          }
        }

        const startProcess = await instance.spawn("npm", ["run", "start"]);
        startProcessRef.current = startProcess;
        streamOutput(startProcess);
      } catch (err) {
        console.error("Error setting up container:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);

        setupStartedRef.current = false;
        writeTerminal(`Error: ${errorMessage}\r\n`);
        setSetupError(errorMessage);
        setLoadingState(initialLoadingState);
      }
    }

    setupContainer();

    return () => {
      cancelled = true;
    };
  }, [instance, writeTerminal]);

  useEffect(() => resetSetupState, [resetSetupState]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6 rounded-lg bg-gray-50 dark:bg-gray-900">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <h3 className="text-lg font-medium">Initializing WebContainer</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Setting up the environment for your project...
          </p>
        </div>
      </div>
    );
  }

  if (error || setupError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg max-w-md">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-5 w-5" />
            <h3 className="font-semibold">Error</h3>
          </div>
          <p className="text-sm">{error || setupError}</p>
        </div>
      </div>
    );
  }

  const getStepIcon = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }

    if (stepIndex === currentStep) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }

    return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
  };

  const getStepText = (stepIndex: number, label: string) => {
    const isActive = stepIndex === currentStep;
    const isComplete = stepIndex < currentStep;

    return (
      <span
        className={`text-sm font-medium ${
          isComplete
            ? "text-green-600"
            : isActive
              ? "text-blue-600"
              : "text-gray-500"
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="h-full w-full flex flex-col">
      {!previewUrl ? (
        <div className="h-full flex flex-col">
          <div className="w-full max-w-md p-6 m-5 rounded-lg bg-white dark:bg-zinc-800 shadow-sm mx-auto">
            <Progress
              value={(currentStep / totalSteps) * 100}
              className="h-2 mb-6"
            />

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                {getStepIcon(1)}
                {getStepText(1, "Transforming template data")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(2)}
                {getStepText(2, "Mounting files")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(3)}
                {getStepText(3, "Installing dependencies")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(4)}
                {getStepText(4, "Starting development server")}
              </div>
            </div>
          </div>

          <div className="flex-1 p-4">
            <TerminalComponent
              ref={terminalRef}
              webContainerInstance={instance}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="flex-1">
            <iframe
              src={previewUrl}
              className="w-full h-full border-none"
              title="WebContainer Preview"
            />
          </div>

          <div className="h-64 border-t">
            <TerminalComponent
              ref={terminalRef}
              webContainerInstance={instance}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WebContainerPreview;
