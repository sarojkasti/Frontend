import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useWorkingYears, useCurrentWorkingYear } from "@/hooks/workingYear/useWorkingYear";
import { WorkingYearType } from "@/types/workingYear";

interface WorkingYearContextType {
  workingYears: WorkingYearType[];
  currentWorkingYear: WorkingYearType | null;
  selectedWorkingYear: WorkingYearType | null;
  selectedWorkingYearId: string | undefined;
  isCurrentSelected: boolean;
  isLoading: boolean;
  setSelectedWorkingYear: (wy: WorkingYearType | null) => void;
  setSelectedWorkingYearById: (id: string | null) => void;
  refetchWorkingYears: () => void;
}

const WorkingYearContext = createContext<WorkingYearContextType | undefined>(undefined);

const STORAGE_KEY = "artha_selected_working_year_id";
const CACHED_LIST_KEY = "artha_cached_working_years";
const CACHED_CURRENT_KEY = "artha_cached_current_working_year";

export const WorkingYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronous cache read for instantaneous frame-0 rendering
  const [cachedList] = useState<WorkingYearType[]>(() => {
    try {
      const saved = localStorage.getItem(CACHED_LIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cachedCurrent] = useState<WorkingYearType | null>(() => {
    try {
      const saved = localStorage.getItem(CACHED_CURRENT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const { data: serverWorkingYears = [], isLoading: isLoadingList, refetch } = useWorkingYears();
  const { data: serverCurrentWorkingYear = null, isLoading: isLoadingCurrent } = useCurrentWorkingYear();

  // Combine server data with instant local cache
  const workingYears = useMemo(() => {
    if (serverWorkingYears && serverWorkingYears.length > 0) return serverWorkingYears;
    return cachedList;
  }, [serverWorkingYears, cachedList]);

  const currentWorkingYear = useMemo(() => {
    if (serverCurrentWorkingYear) return serverCurrentWorkingYear;
    return cachedCurrent || workingYears.find((w) => w.isCurrent) || null;
  }, [serverCurrentWorkingYear, cachedCurrent, workingYears]);

  // Persist working years cache
  useEffect(() => {
    if (serverWorkingYears && serverWorkingYears.length > 0) {
      try {
        localStorage.setItem(CACHED_LIST_KEY, JSON.stringify(serverWorkingYears));
      } catch (e) {}
    }
  }, [serverWorkingYears]);

  useEffect(() => {
    if (serverCurrentWorkingYear) {
      try {
        localStorage.setItem(CACHED_CURRENT_KEY, JSON.stringify(serverCurrentWorkingYear));
      } catch (e) {}
    }
  }, [serverCurrentWorkingYear]);

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  // Determine selected working year object
  const selectedWorkingYear = useMemo(() => {
    if (selectedId === "all") return null;

    if (selectedId && workingYears.length > 0) {
      const match = workingYears.find((wy) => wy.id === selectedId);
      if (match) return match;
    }

    if (currentWorkingYear) return currentWorkingYear;

    const defaultCurrent = workingYears.find((wy) => wy.isCurrent) || workingYears[0];
    return defaultCurrent || null;
  }, [workingYears, currentWorkingYear, selectedId]);

  // Synchronous and immediate ID availability (prevents undefined race conditions)
  const selectedWorkingYearId = useMemo(() => {
    if (selectedId === "all") return undefined;
    if (selectedWorkingYear?.id) return selectedWorkingYear.id;
    if (selectedId) return selectedId;
    return currentWorkingYear?.id || workingYears.find((w) => w.isCurrent)?.id;
  }, [selectedId, selectedWorkingYear, currentWorkingYear, workingYears]);

  // Keep localStorage in sync
  useEffect(() => {
    if (selectedId === "all") {
      localStorage.setItem(STORAGE_KEY, "all");
    } else if (selectedWorkingYear?.id) {
      localStorage.setItem(STORAGE_KEY, selectedWorkingYear.id);
    }
  }, [selectedId, selectedWorkingYear]);

  const setSelectedWorkingYear = (wy: WorkingYearType | null) => {
    if (!wy) {
      setSelectedId("all");
    } else {
      setSelectedId(wy.id);
    }
  };

  const setSelectedWorkingYearById = (id: string | null) => {
    setSelectedId(id || "all");
  };

  const isCurrentSelected = useMemo(() => {
    if (!selectedWorkingYear || !currentWorkingYear) return false;
    return selectedWorkingYear.id === currentWorkingYear.id;
  }, [selectedWorkingYear, currentWorkingYear]);

  return (
    <WorkingYearContext.Provider
      value={{
        workingYears,
        currentWorkingYear,
        selectedWorkingYear,
        selectedWorkingYearId,
        isCurrentSelected,
        isLoading: (isLoadingList || isLoadingCurrent) && workingYears.length === 0,
        setSelectedWorkingYear,
        setSelectedWorkingYearById,
        refetchWorkingYears: refetch,
      }}
    >
      {children}
    </WorkingYearContext.Provider>
  );
};

export const useWorkingYearContext = (): WorkingYearContextType => {
  const context = useContext(WorkingYearContext);
  if (!context) {
    throw new Error("useWorkingYearContext must be used within a WorkingYearProvider");
  }
  return context;
};

export default WorkingYearContext;
