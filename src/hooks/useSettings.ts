"use client";

import { useCallback, useEffect, useState } from "react";
import { AppSettings, createDefaultSettings } from "@/types/settings";
import { loadSettings, saveSettings } from "@/lib/storage";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(createDefaultSettings());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSettings(loadSettings());
    setIsLoading(false);
  }, []);

  const updateSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  return { settings, updateSettings, isLoading };
}
