import { useEditTask } from "@/hooks/task/useEditTask";
import { useDeleteTask } from "@/hooks/task/useDeleteTask";
import { useBulkUpdateTasks } from "@/hooks/task/useBulkUpdateTasks";
import { useMarkTasksComplete } from "@/hooks/task/useMarkTasksComplete";
import { useFirstVerifyTasks, useSecondVerifyTasks } from "@/hooks/task/useVerifyTasks";
import { useCompleteAllProjectTasks } from "@/hooks/task/useCompleteAllProjectTasks";
import { useProjectTasksWithHierarchy } from "@/hooks/task/useProjectTasksWithHierarchy";
import { useUser } from "@/hooks/user/useUser";
import { UserType } from "@/hooks/user/type";
import { TaskType } from "@/types/task";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  FolderOutlined
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Form,
  Table,
  TableProps,
  Tooltip,
  DatePicker,
  Select,
  Modal,
  message,
  Popconfirm,
  Space,
  Input,
  Card,
  notification,
  Tag,
  Typography,
  Radio,
  Collapse,
  Empty
} from "antd";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { useSession } from "@/context/SessionContext";
import Highlighter from "react-highlight-words";
import { useQueryClient } from "@tanstack/react-query";

interface ExtendedTaskType extends TaskType {
  first?: boolean;
  last?: boolean;
  projectId: string;
  key?: string;
  children?: ExtendedTaskType[];
  isSubTask?: boolean;
  groupProject?: {
    id: string;
    name?: string;
    rank?: number;
    taskSuperId?: string;
    taskSuper?: {
      id: string;
      name: string;
      rank?: number;
    };
  };
}

interface CompleteAllTaskCandidate {
  key: string;
  id: string;
  name: string;
  status: string;
  assigneesLabel: string;
  taskType: string;
  parentTaskName?: string;
}

interface TaskTableProps {
  projectId?: string;
  status?: string;
  users?: any[];
  data?: any[];
  project?: any;
  projectLead?: any;
  showModal: (task?: any) => void;
  onRefresh: (options?: any) => Promise<any>;
  loading?: boolean;
  hideAddTask?: boolean;
}

const TaskTable = ({
  projectId,
  status,
  showModal,
  users,
  projectLead,
  onRefresh,
  loading: externalLoading,
  hideAddTask
}: TaskTableProps) => {
  const [activeTab, setActiveTab] = useState(status || "open");

  /* Fetch all system users (including inactive, blocked) for full name lookup in tooltips */
  const { data: allUsersResponse } = useUser({ status: "", limit: 1000 });
  const allUsersMap = useMemo(() => {
    const list = Array.isArray(allUsersResponse?.data)
      ? allUsersResponse.data
      : Array.isArray(allUsersResponse)
      ? allUsersResponse
      : [];
    const mergedMap = new Map<string, any>();
    (users || []).forEach((u: any) => {
      if (u?.id) mergedMap.set(String(u.id), u);
    });
    list.forEach((u: any) => {
      if (u?.id) mergedMap.set(String(u.id), u);
    });
    return mergedMap;
  }, [users, allUsersResponse]);

  const getUserDisplayName = useCallback(
    (userOrId: any) => {
      if (!userOrId) return "Unknown";
      if (typeof userOrId === "object" && (userOrId.name || userOrId.username || userOrId.email)) {
        return userOrId.name || userOrId.username || userOrId.email;
      }
      const idStr = typeof userOrId === "object" ? String(userOrId.id || "") : String(userOrId);
      const found = allUsersMap.get(idStr);
      if (found) {
        return found.name || found.username || found.email || idStr;
      }
      return idStr;
    },
    [allUsersMap]
  );

  /* Use the custom hook to fetch project tasks with hierarchy and status filtering */
  const { data: allTasks = [], isLoading } = useProjectTasksWithHierarchy({
    projectId: projectId as string,
    status: activeTab
  });

  /* Fetch complete project task list for Complete All modal (no status filtering) */
  const { data: allProjectTasks = [] } = useProjectTasksWithHierarchy({
    projectId: projectId as string
  });

  const data = allTasks;
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { mutate: editTask, isPending: isUpdating } = useEditTask();
  const { mutate: deleteTask } = useDeleteTask();
  const { mutate: bulkUpdateTasks } = useBulkUpdateTasks();
  const { mutate: markTasksComplete, isPending: isMarkingComplete } = useMarkTasksComplete();
  const { mutate: firstVerifyTasks, isPending: isFirstVerifying } = useFirstVerifyTasks();
  const { mutate: secondVerifyTasks, isPending: isSecondVerifying } = useSecondVerifyTasks();
  const { mutate: completeAllTasksMutation, isPending: isCompletingAllTasks } = useCompleteAllProjectTasks();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [isDueDateModalVisible, setIsDueDateModalVisible] = useState(false);
  const [isAssigneeModalVisible, setIsAssigneeModalVisible] = useState(false);
  const [isCompleteAllModalVisible, setIsCompleteAllModalVisible] = useState(false);
  const [selectedCompleteTaskIds, setSelectedCompleteTaskIds] = useState<React.Key[]>([]);
  const { permissions, profile } = useSession();
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [sortedInfo, setSortedInfo] = useState<any>({
    columnKey: "taskSuper",
    order: "ascend"
  });
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [globalSearchText, setGlobalSearchText] = useState("");
  const searchInput = useRef<any>(null);
  const queryClient = useQueryClient();

  const loading = isLoading || externalLoading;

  const canDeleteTask = useMemo(() => {
    if (permissions && permissions.length > 0) {
      if (typeof permissions[0] === "string") {
        return permissions.includes("Delete task by id");
      } else if (typeof permissions[0] === "object") {
        return permissions.some(
          (perm: any) =>
            (perm.resource === "tasks" && perm.path === "/tasks/:id" && perm.method === "delete") ||
            perm.name === "Delete task by id"
        );
      }
    }
    return false;
  }, [permissions]);

  const permissionsArr = (profile as any)?.role?.permission;
  const hasFirstVerifyPermission =
    Array.isArray(permissionsArr) &&
    permissionsArr.some(
      (perm: any) =>
        perm.resource === "tasks" &&
        perm.path === "/tasks/first-verify" &&
        perm.method?.toLowerCase() === "patch"
    );

  const hasSecondVerifyPermission =
    Array.isArray(permissionsArr) &&
    permissionsArr.some(
      (perm: any) =>
        perm.resource === "tasks" &&
        perm.path === "/tasks/second-verify" &&
        perm.method?.toLowerCase() === "patch"
    );

  const isProjectLead = useMemo(() => {
    return (profile as any)?.id === projectLead?.id;
  }, [(profile as any)?.id, projectLead?.id]);

  const canMarkComplete = useMemo(() => {
    const permissionsArr = (profile as any)?.role?.permission;
    const hasMarkCompletePermission =
      Array.isArray(permissionsArr) &&
      permissionsArr.some(
        (perm: any) =>
          perm.resource === "tasks" &&
          perm.path === "/tasks/mark-complete" &&
          perm.method?.toLowerCase() === "patch"
      );
    return hasMarkCompletePermission || isProjectLead;
  }, [profile, isProjectLead]);

  const hasCompleteAllPermission = useMemo(() => {
    const profilePermissions = (profile as any)?.role?.permission;
    return (
      Array.isArray(profilePermissions) &&
      profilePermissions.some(
        (perm: any) =>
          perm.resource === "tasks" &&
          perm.path === "/tasks/project/:projectId/complete-all" &&
          perm.method?.toLowerCase() === "patch"
      )
    );
  }, [profile]);

  const completeAllTaskCandidates: CompleteAllTaskCandidate[] = useMemo(() => {
    const statusOrder: Record<string, number> = {
      open: 1,
      in_progress: 2,
      done: 3,
      first_verified: 4,
      second_verified: 5
    };
    const candidates: CompleteAllTaskCandidate[] = [];
    const seen = new Set<string>();
    const pushCandidate = (task: any, parentTaskName?: string) => {
      if (!task?.id || seen.has(String(task.id))) return;
      seen.add(String(task.id));
      const assignees = Array.isArray(task.assignees) ? task.assignees : [];
      const assigneesLabel = assignees.length
        ? assignees
            .map((assignee: any) => assignee?.name || assignee?.username || assignee?.email || assignee?.id)
            .join(", ")
        : "Unassigned";
      candidates.push({
        key: String(task.id),
        id: String(task.id),
        name: task.name || "Unnamed Task",
        status: task.status || "open",
        assigneesLabel,
        taskType: task.taskType || "task",
        parentTaskName
      });
    };
    (allProjectTasks || []).forEach((task: any) => {
      pushCandidate(task);
      if (Array.isArray(task.subTasks)) {
        task.subTasks.forEach((subTask: any) => {
          pushCandidate(subTask, task.name);
        });
      }
    });
    return candidates.sort((a, b) => {
      const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return a.name.localeCompare(b.name);
    });
  }, [allProjectTasks]);

  const { processedData, filteredData } = useMemo(() => {
    const expandedData = data
      .filter((task: any) => task.taskType === "story")
      .map((story: any) => {
        const subTasks = story.subTasks || [];
        const children = subTasks
          .sort((a: any, b: any) => {
            const aRank = a.rank || 0;
            const bRank = b.rank || 0;
            if (aRank !== bRank) return aRank - bRank;
            return a.name.localeCompare(b.name);
          })
          .map((subTask: any) => ({
            ...subTask,
            key: `${story.id}-${subTask.id}`,
            isSubTask: true,
            projectId: projectId
          }));

        return {
          ...story,
          key: story.id,
          projectId: projectId,
          children: children.length > 0 ? children : undefined
        };
      });

    const standaloneTasks = data
      .filter((task: any) => task.taskType === "task" && !task.parentTask)
      .map((task: any) => ({
        ...task,
        key: task.id,
        projectId: projectId,
        isStandalone: true
      }));

    const combinedTasks = [...expandedData, ...standaloneTasks];

    const finalTasks = combinedTasks.sort((a: any, b: any) => {
      const aTaskSuperRank = a.groupProject?.taskSuper?.rank || 0;
      const bTaskSuperRank = b.groupProject?.taskSuper?.rank || 0;
      if (aTaskSuperRank !== bTaskSuperRank) return aTaskSuperRank - bTaskSuperRank;

      const aGroupRank = a.groupProject?.rank || 0;
      const bGroupRank = b.groupProject?.rank || 0;
      if (aGroupRank !== bGroupRank) return aGroupRank - bGroupRank;

      const aRank = a.rank || 0;
      const bRank = b.rank || 0;
      if (aRank !== bRank) return aRank - bRank;

      return a.name.localeCompare(b.name);
    });

    const filtered = globalSearchText
      ? finalTasks.filter((record: any) => {
          const searchValue = globalSearchText.toLowerCase();
          const fieldsToSearch = ["name", "description", "tcode"];
          const parentMatches = fieldsToSearch.some(
            (field) => record[field] && record[field].toString().toLowerCase().includes(searchValue)
          );
          const taskTypeDisplay = record?.taskType === "story" ? "Task" : "Subtask";
          const taskTypeMatches = taskTypeDisplay.toLowerCase().includes(searchValue);
          const taskSuperMatches =
            record.groupProject?.taskSuper?.name &&
            record.groupProject.taskSuper.name.toLowerCase().includes(searchValue);
          const taskGroupMatches =
            record.groupProject?.name && record.groupProject.name.toLowerCase().includes(searchValue);
          const superRankMatches =
            record.groupProject?.taskSuper?.rank &&
            record.groupProject.taskSuper.rank.toString().includes(searchValue);
          const groupRankMatches =
            record.groupProject?.rank && record.groupProject.rank.toString().includes(searchValue);
          const statusMatches = record.status && record.status.toLowerCase().includes(searchValue);

          if (
            parentMatches ||
            taskTypeMatches ||
            taskGroupMatches ||
            statusMatches ||
            taskSuperMatches ||
            superRankMatches ||
            groupRankMatches
          ) {
            return true;
          }

          if (record.children && Array.isArray(record.children)) {
            const hasMatchingChild = record.children.some((child: any) => {
              const childMatches = fieldsToSearch.some(
                (field) => child[field] && child[field].toString().toLowerCase().includes(searchValue)
              );
              const childTaskTypeDisplay = child?.taskType === "story" ? "Task" : "Subtask";
              const childTaskTypeMatches = childTaskTypeDisplay.toLowerCase().includes(searchValue);
              const childGroupMatches =
                child.groupProject?.name && child.groupProject.name.toLowerCase().includes(searchValue);
              const childSuperMatches =
                child.groupProject?.taskSuper?.name &&
                child.groupProject.taskSuper.name.toLowerCase().includes(searchValue);
              const childGroupRankMatches =
                child.groupProject?.rank && child.groupProject.rank.toString().includes(searchValue);
              const childSuperRankMatches =
                child.groupProject?.taskSuper?.rank &&
                child.groupProject.taskSuper.rank.toString().includes(searchValue);
              const childStatusMatches = child.status && child.status.toLowerCase().includes(searchValue);
              return (
                childMatches ||
                childTaskTypeMatches ||
                childGroupMatches ||
                childStatusMatches ||
                childSuperMatches ||
                childGroupRankMatches ||
                childSuperRankMatches
              );
            });
            return hasMatchingChild;
          }
          return false;
        })
      : finalTasks;

    return {
      processedData: finalTasks,
      filteredData: filtered
    };
  }, [data, globalSearchText, projectId]);

  const enhancedData: ExtendedTaskType[] = useMemo(() => filteredData, [filteredData]);

  const groupedContainers = useMemo(() => {
    const superMap = new Map<
      string,
      {
        id: string;
        name: string;
        rank: number;
        groupsMap: Map<string, { id: string; name: string; rank: number; tasks: any[] }>;
      }
    >();

    enhancedData.forEach((task: any) => {
      const gObj = task.groupProject || task.group;
      const sObj = gObj?.taskSuper || gObj?.taskSuperProject;

      const sId = sObj?.id?.toString() || "standalone-super";
      const sName = sObj?.name || "General Tasks";
      const sRank = sObj?.rank ?? 999;

      const gId = gObj?.id?.toString() || "standalone-group";
      const gName = gObj?.name || (sId === "standalone-super" ? "General Tasks" : "Uncategorized Group");
      const gRank = gObj?.rank ?? 999;

      if (!superMap.has(sId)) {
        superMap.set(sId, {
          id: sId,
          name: sName,
          rank: sRank,
          groupsMap: new Map()
        });
      }

      const superEntry = superMap.get(sId)!;
      if (!superEntry.groupsMap.has(gId)) {
        superEntry.groupsMap.set(gId, {
          id: gId,
          name: gName,
          rank: gRank,
          tasks: []
        });
      }

      superEntry.groupsMap.get(gId)!.tasks.push(task);
    });

    const superContainers: any[] = [];

    const sortedSupers = Array.from(superMap.values()).sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.name.localeCompare(b.name);
    });

    sortedSupers.forEach((s) => {
      const sortedGroups = Array.from(s.groupsMap.values()).sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return a.name.localeCompare(b.name);
      });

      const totalTasks = sortedGroups.reduce((acc, g) => acc + g.tasks.length, 0);

      superContainers.push({
        id: s.id,
        name: s.name,
        rank: s.rank,
        groups: sortedGroups,
        totalTasks
      });
    });

    return superContainers;
  }, [enhancedData]);

  const selectedTasks = enhancedData.filter((task: ExtendedTaskType) => selectedRowKeys.includes(task.id));
  const hasOpenTasks = selectedTasks.some((task: ExtendedTaskType) => task.status === "open");
  const hasInProgressTasks = selectedTasks.some((task: ExtendedTaskType) => task.status === "in_progress");
  const hasDoneTasks = selectedTasks.some((task: ExtendedTaskType) => task.status === "done");
  const dataHasDoneTasks = enhancedData.some((task: ExtendedTaskType) => task.status === "done");

  const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: string) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
    if (selectedKeys[0] && selectedKeys[0].trim()) {
      setGlobalSearchText("");
    }
    if (selectedKeys[0]) {
      const searchValue = selectedKeys[0].toLowerCase();
      const keysToExpand: string[] = [];
      const currentData = processedData;
      currentData.forEach((record: any) => {
        let shouldExpand = false;
        if (dataIndex.includes(".")) {
          const keys = dataIndex.split(".");
          let val = record;
          for (const key of keys) {
            if (!val) break;
            val = val[key];
          }
          if (val && val.toString().toLowerCase().includes(searchValue)) {
            shouldExpand = true;
          }
        } else if (record[dataIndex] && record[dataIndex].toString().toLowerCase().includes(searchValue)) {
          shouldExpand = true;
        }
        if (record.children && Array.isArray(record.children)) {
          const hasMatchingChild = record.children.some((child: any) => {
            if (dataIndex.includes(".")) {
              const keys = dataIndex.split(".");
              let val = child;
              for (const key of keys) {
                if (!val) return false;
                val = val[key];
              }
              return val ? val.toString().toLowerCase().includes(searchValue) : false;
            }
            return child[dataIndex] ? child[dataIndex].toString().toLowerCase().includes(searchValue) : false;
          });
          if (hasMatchingChild) {
            shouldExpand = true;
          }
        }
        if (shouldExpand && record.children && record.children.length > 0) {
          keysToExpand.push(record.key.toString());
        }
      });
      setExpandedRowKeys(keysToExpand);
    } else {
      setExpandedRowKeys([]);
    }
  };

  const handleGlobalSearch = (value: string) => {
    setGlobalSearchText(value);
    if (value && value.trim()) {
      setSearchText("");
      setSearchedColumn("");
    }
    if (value && value.trim()) {
      const searchValue = value.toLowerCase();
      const keysToExpand: string[] = [];
      const currentData = processedData;
      currentData.forEach((record: any) => {
        let shouldExpand = false;
        const fieldsToSearch = ["name", "description", "tcode"];
        const parentMatches = fieldsToSearch.some(
          (field) => record[field] && record[field].toString().toLowerCase().includes(searchValue)
        );
        const taskTypeDisplay = record?.taskType === "story" ? "Task" : "Subtask";
        const taskTypeMatches = taskTypeDisplay.toLowerCase().includes(searchValue);
        const groupMatches = record.groupProject?.name && record.groupProject.name.toLowerCase().includes(searchValue);
        const statusMatches = record.status && record.status.toLowerCase().includes(searchValue);
        const taskSuperMatches =
          record.groupProject?.taskSuper?.name &&
          record.groupProject.taskSuper.name.toLowerCase().includes(searchValue);
        const taskGroupMatches =
          record.groupProject?.name && record.groupProject.name.toLowerCase().includes(searchValue);

        if (
          parentMatches ||
          taskTypeMatches ||
          groupMatches ||
          statusMatches ||
          taskSuperMatches ||
          taskGroupMatches
        ) {
          shouldExpand = true;
        }
        if (record.children && Array.isArray(record.children)) {
          const hasMatchingChild = record.children.some((child: any) => {
            const childMatches = fieldsToSearch.some(
              (field) => child[field] && child[field].toString().toLowerCase().includes(searchValue)
            );
            const childTaskTypeDisplay = child?.taskType === "story" ? "Task" : "Subtask";
            const childTaskTypeMatches = childTaskTypeDisplay.toLowerCase().includes(searchValue);
            const childGroupMatches =
              child.groupProject?.name && child.groupProject.name.toLowerCase().includes(searchValue);
            const childStatusMatches = child.status && child.status.toLowerCase().includes(searchValue);
            const childTaskSuperMatches =
              (child.groupProject?.taskSuper?.name &&
                child.groupProject.taskSuper.name.toLowerCase().includes(searchValue)) ||
              (child.group?.taskSuper?.name &&
                child.group.taskSuper.name.toLowerCase().includes(searchValue));
            const childTaskGroupMatches =
              (child.groupProject?.name &&
                child.groupProject.name.toLowerCase().includes(searchValue)) ||
              (child.group?.name && child.group.name.toLowerCase().includes(searchValue));
            return (
              childMatches ||
              childTaskTypeMatches ||
              childGroupMatches ||
              childStatusMatches ||
              childTaskSuperMatches ||
              childTaskGroupMatches
            );
          });
          if (hasMatchingChild) {
            shouldExpand = true;
          }
        }
        if (shouldExpand && record.children && record.children.length > 0) {
          keysToExpand.push(record.key.toString());
        }
      });
      setExpandedRowKeys(keysToExpand);
    } else {
      setExpandedRowKeys([]);
    }
  };

  const getColumnSearchProps = (dataIndex: string, title: string): any => {
    const getUniqueValues = () => {
      const getValue = (obj: any, path: string): any => {
        if (path.includes(".")) {
          const keys = path.split(".");
          let val = obj;
          for (const key of keys) {
            if (!val) return null;
            val = val[key];
          }
          return val;
        }
        if (path === "taskType") {
          return obj?.taskType === "story" ? "Task" : "Subtask";
        }
        return obj[path];
      };
      const values = new Set<string>();
      enhancedData?.forEach((record: any) => {
        const value = getValue(record, dataIndex);
        if (value) {
          values.add(value.toString());
        }
        if (record.children && Array.isArray(record.children)) {
          record.children.forEach((child: any) => {
            const childValue = getValue(child, dataIndex);
            if (childValue) {
              values.add(childValue.toString());
            }
          });
        }
      });
      return Array.from(values).sort();
    };
    return {
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => {
        const uniqueValues = getUniqueValues();
        const currentValue = selectedKeys[0] || "";
        const filteredOptions = currentValue
          ? uniqueValues.filter((val) => val.toLowerCase().includes(currentValue.toLowerCase())).slice(0, 10)
          : uniqueValues.slice(0, 10);
        return (
          <div style={{ padding: 8 }}>
            <Input
              ref={searchInput}
              placeholder={`Search ${title}`}
              value={currentValue}
              onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
              style={{ marginBottom: 8, display: "block" }}
            />
            {filteredOptions.length > 0 && (
              <div
                style={{
                  maxHeight: 200,
                  overflowY: "auto",
                  marginBottom: 8,
                  border: "1px solid #d9d9d9",
                  borderRadius: 4
                }}
              >
                {filteredOptions.map((option, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "4px 8px",
                      cursor: "pointer",
                      backgroundColor: "white",
                      borderBottom: idx < filteredOptions.length - 1 ? "1px solid #f0f0f0" : "none"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "white";
                    }}
                    onClick={() => {
                      setSelectedKeys([option]);
                      handleSearch([option], confirm, dataIndex);
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
            <Space>
              <Button
                type="primary"
                onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                icon={<SearchOutlined />}
                size="small"
                style={{ width: 90 }}
              >
                Search
              </Button>
              <Button
                onClick={() => {
                  clearFilters();
                  setSelectedKeys([]);
                  setSearchText("");
                  setSearchedColumn("");
                  setExpandedRowKeys([]);
                  confirm({ closeDropdown: false });
                }}
                size="small"
                style={{ width: 90 }}
              >
                Reset
              </Button>
            </Space>
          </div>
        );
      },
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value: string, record: any) => {
        const searchValue = value.toLowerCase();
        const recordMatches = (rec: any) => {
          if (dataIndex.includes(".")) {
            const keys = dataIndex.split(".");
            let val = rec;
            for (const key of keys) {
              if (!val) return false;
              val = val[key];
            }
            return val ? val.toString().toLowerCase().includes(searchValue) : false;
          }
          if (dataIndex === "taskType") {
            const displayType = rec?.taskType === "story" ? "Task" : "Subtask";
            return displayType.toLowerCase().includes(searchValue);
          }
          if (dataIndex === "groupProject.taskSuper.name") {
            const taskSuper = rec.groupProject?.taskSuper?.name || "";
            const taskSuperRank = rec.groupProject?.taskSuper?.rank?.toString() || "";
            return taskSuper.toLowerCase().includes(searchValue) || taskSuperRank.includes(searchValue);
          }
          return rec[dataIndex] ? rec[dataIndex].toString().toLowerCase().includes(searchValue) : false;
        };
        const parentMatches = recordMatches(record);
        if (parentMatches) return true;

        if (record.children && Array.isArray(record.children)) {
          const hasMatchingChild = record.children.some((child: any) => recordMatches(child));
          if (hasMatchingChild) return true;
        }
        if (record.isSubTask) return recordMatches(record);
        return false;
      },
      onFilterDropdownVisibleChange: (visible: boolean) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
      render: (text: string) => {
        const searchWords = [];
        if (searchedColumn === dataIndex && searchText) {
          searchWords.push(searchText);
        }
        if (
          globalSearchText &&
          (dataIndex === "name" ||
            dataIndex === "description" ||
            dataIndex === "tcode" ||
            dataIndex === "groupProject" ||
            dataIndex === "groupProject.taskSuper.name")
        ) {
          searchWords.push(globalSearchText);
        }
        return searchWords.length > 0 ? (
          <Highlighter
            highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
            searchWords={searchWords}
            autoEscape
            textToHighlight={text ? text.toString() : ""}
          />
        ) : (
          text
        );
      }
    };
  };

  const isEditing = (record: ExtendedTaskType) => String(record.id) === editingKey;

  const handleEditClick = (task: ExtendedTaskType) => {
    form.setFieldsValue({
      ...task,
      assineeId: (task.assignees as any[])?.map((user) => user.id),
      dueDate: task.dueDate ? moment(task.dueDate) : null
    });
    showModal(task);
  };

  const startEditing = (record: ExtendedTaskType) => {
    setEditingKey(String(record.id));
    form.setFieldsValue({
      dueDate: record.dueDate ? moment(record.dueDate) : null,
      assineeId: (record.assignees as any[])?.map((user) => user.id),
      first: record.first,
      last: record.last
    });
  };

  const saveEdit = async (key: string) => {
    try {
      const values = await form.validateFields();
      const taskData = {
        dueDate: values.dueDate?.toISOString(),
        assineeId: values.assineeId,
        first: values.first,
        last: values.last,
        projectId: projectId,
        name: enhancedData.find((item) => String(item.id) === key)?.name,
        description: enhancedData.find((item) => String(item.id) === key)?.description,
        groupId: enhancedData.find((item) => String(item.id) === key)?.groupProject?.id,
        status: enhancedData.find((item) => String(item.id) === key)?.status
      };
      editTask(
        { id: key, payload: taskData },
        {
          onSuccess: () => {
            message.success("Task updated successfully");
            setEditingKey(null);
            if (onRefresh) onRefresh();
          },
          onError: (error: any) => {
            message.error(error.response?.data?.message || "Failed to update task");
          }
        }
      );
    } catch (err) {}
  };

  const handleSetDueDate = () => {
    if (selectedRowKeys.length > 0) {
      setIsDueDateModalVisible(true);
    }
  };

  const handleAssign = () => {
    if (selectedRowKeys.length > 0) {
      setIsAssigneeModalVisible(true);
    }
  };

  const openCompleteAllTasksModal = () => {
    if (!projectId) {
      message.error("Project ID is required to complete all tasks");
      return;
    }
    if (!hasCompleteAllPermission) {
      message.error("You don't have permission to complete all tasks");
      return;
    }
    if (!completeAllTaskCandidates.length) {
      message.warning("No tasks found for this project");
      return;
    }
    setSelectedCompleteTaskIds(completeAllTaskCandidates.map((task) => task.id));
    setIsCompleteAllModalVisible(true);
  };

  const handleCompleteAllTasks = () => {
    if (!projectId) {
      message.error("Project ID is required to complete all tasks");
      return;
    }
    if (!hasCompleteAllPermission) {
      message.error("You don't have permission to complete all tasks");
      return;
    }
    if (!selectedCompleteTaskIds.length) {
      message.warning("Please select at least one task");
      return;
    }
    const selectedIds = selectedCompleteTaskIds.map((id) => String(id));
    completeAllTasksMutation(
      { projectId, taskIds: selectedIds },
      {
        onSuccess: (data: any) => {
          const updated = data?.summary?.updated ?? 0;
          message.success(data?.message || `${updated} task(s) updated by automated system`);
          setIsCompleteAllModalVisible(false);
          setSelectedCompleteTaskIds([]);
          queryClient.invalidateQueries({ queryKey: ["project-tasks-hierarchy", projectId] });
          if (onRefresh) onRefresh();
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Failed to complete selected tasks";
          message.error(errorMessage);
        }
      }
    );
  };

  const handleDueDateOk = async () => {
    try {
      const values = await bulkForm.validateFields();
      bulkUpdateTasks(
        {
          taskIds: selectedRowKeys.map(String),
          dueDate: values.dueDate?.toISOString()
        },
        {
          onSuccess: () => {
            message.success("Tasks updated successfully");
            queryClient.invalidateQueries({ queryKey: ["project-tasks-hierarchy", projectId] });
            if (onRefresh) onRefresh();
          },
          onError: (error: any) => {
            message.error(error.response?.data?.message || "Failed to update tasks");
          }
        }
      );
      setIsDueDateModalVisible(false);
      bulkForm.resetFields();
    } catch (err) {}
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(
      { id: taskId },
      {
        onSuccess: () => {
          message.success("Task deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["project-tasks-hierarchy", projectId] });
          if (onRefresh) onRefresh();
        },
        onError: (error: any) => {
          message.error(error.response?.data?.message || "Failed to delete task");
        }
      }
    );
  };

  const handleAssigneeOk = async () => {
    try {
      const values = await bulkForm.validateFields();
      bulkUpdateTasks(
        {
          taskIds: selectedRowKeys.map(String),
          assigneeIds: values.assigneeIds
        },
        {
          onSuccess: () => {
            message.success("Tasks assigned successfully");
            queryClient.invalidateQueries({ queryKey: ["project-tasks-hierarchy", projectId] });
            if (onRefresh) onRefresh();
          },
          onError: (error: any) => {
            message.error(error.response?.data?.message || "Failed to assign tasks");
          }
        }
      );
      setIsAssigneeModalVisible(false);
      bulkForm.resetFields();
    } catch (err) {}
  };

  const handleMarkComplete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select at least one task to mark as complete");
      return;
    }
    const userId = (profile as any)?.id;
    if (!userId) {
      message.error("Unable to identify current user");
      return;
    }
    if (!canMarkComplete) {
      message.error("You don't have permission to mark tasks as complete");
      return;
    }
    const selectedTasks = enhancedData.filter((task) => selectedRowKeys.includes(task.id));
    const eligibleTasks = selectedTasks.filter((task) => task.status === "in_progress");

    if (eligibleTasks.length === 0) {
      message.warning("No eligible tasks selected. Tasks must be in progress status to be marked complete.");
      return;
    }

    Modal.confirm({
      title: `Mark ${eligibleTasks.length} task(s) as complete?`,
      content: "Are you sure you want to mark the selected tasks as complete?",
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        markTasksComplete(
          {
            taskIds: eligibleTasks.map((task) => task.id),
            completedBy: userId
          },
          {
            onSuccess: (data) => {
              if (data?.success && data.success.length > 0) {
                message.success(`${data.success.length} task(s) marked as complete`);
              }
              if (data?.errors && data.errors.length > 0) {
                if (data.errors.length > 1) {
                  notification.error({
                    message: `${data.errors.length} Task(s) Failed to Complete`,
                    description: (
                      <div>
                        {data.errors.map((error: any, index: number) => (
                          <div key={index} style={{ marginBottom: "4px" }}>
                            <strong>{error.taskName}:</strong> {error.error}
                          </div>
                        ))}
                      </div>
                    ),
                    duration: 8,
                    placement: "topRight"
                  });
                } else {
                  const error = data.errors[0];
                  message.error(`${error.taskName}: ${error.error}`, 6);
                }
              }
              setSelectedRowKeys([]);
              queryClient.invalidateQueries({ queryKey: ["project-tasks-hierarchy", projectId] });
              if (onRefresh) onRefresh();
            },
            onError: (error: any) => {
              const errorMessage = error.response?.data?.message || "Failed to mark tasks as complete";
              message.error(errorMessage);
            }
          }
        );
      }
    });
  };

  const handleSingleMarkComplete = (task: ExtendedTaskType) => {
    const userId = (profile as any)?.id;
    if (!userId) {
      message.error("Unable to identify current user");
      return;
    }
    if (task.status !== "in_progress") {
      message.warning("Only tasks that are in progress can be marked as complete");
      return;
    }
    if (!canMarkComplete) {
      message.error("You don't have permission to mark tasks as complete");
      return;
    }
    Modal.confirm({
      title: `Mark task "${task.name}" as complete?`,
      content: "Are you sure you want to mark this task as complete?",
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        markTasksComplete(
          {
            taskIds: [task.id],
            completedBy: userId
          },
          {
            onSuccess: (data) => {
              if (data?.success && data.success.length > 0) {
                message.success(`Task "${task.name}" marked as complete`);
              }
              if (data?.errors && data.errors.length > 0) {
                const error = data.errors[0];
                notification.error({
                  message: "Task Completion Failed",
                  description: `${error.taskName}: ${error.error}`,
                  duration: 6,
                  placement: "topRight"
                });
              }
              queryClient.invalidateQueries({ queryKey: ["project-tasks-hierarchy", projectId] });
              if (onRefresh) onRefresh();
            },
            onError: (error: any) => {
              const errorMessage = error.response?.data?.message || "Failed to mark task as complete";
              message.error(errorMessage);
            }
          }
        );
      }
    });
  };

  const handleFirstVerify = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select at least one task to verify");
      return;
    }
    const userId = (profile as any)?.id;
    if (!userId) return;

    const selectedTasks = enhancedData.filter((task) => selectedRowKeys.includes(task.id));
    const eligibleTasks = selectedTasks.filter((task) => task.status === "done" && !task.firstVerifiedBy);

    if (eligibleTasks.length === 0) {
      message.warning("No eligible tasks selected. Tasks must be completed and not already verified.");
      return;
    }

    firstVerifyTasks(
      {
        taskIds: eligibleTasks.map((task) => task.id),
        firstVerifiedBy: userId
      },
      {
        onSuccess: (data) => {
          if (data?.success && data.success.length > 0) {
            message.success(`${data.success.length} task(s) first verified`);
          }
          setSelectedRowKeys([]);
          if (onRefresh) onRefresh();
        },
        onError: (error: any) => {
          message.error(error.response?.data?.message || "Failed to verify tasks");
        }
      }
    );
  };

  const handleSecondVerify = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select at least one task for second verification");
      return;
    }
    const userId = (profile as any)?.id;
    if (!userId) return;

    const selectedTasks = enhancedData.filter((task) => selectedRowKeys.includes(task.id));
    const eligibleTasks = selectedTasks.filter((task) => task.firstVerifiedBy && !task.secondVerifiedBy);

    if (eligibleTasks.length === 0) {
      message.warning("No eligible tasks selected.");
      return;
    }

    secondVerifyTasks(
      {
        taskIds: eligibleTasks.map((task) => task.id),
        secondVerifiedBy: userId
      },
      {
        onSuccess: (data) => {
          if (data?.success && data.success.length > 0) {
            message.success(`${data.success.length} task(s) second verified`);
          }
          setSelectedRowKeys([]);
          if (onRefresh) onRefresh();
        },
        onError: (error: any) => {
          message.error(error.response?.data?.message || "Failed to verify tasks");
        }
      }
    );
  };

  const handleSingleFirstVerify = (task: ExtendedTaskType) => {
    const userId = (profile as any)?.id;
    if (!task.id || !userId) return;

    firstVerifyTasks(
      {
        taskIds: [task.id],
        firstVerifiedBy: userId
      },
      {
        onSuccess: (data: any) => {
          if (data && data.success && data.success.length > 0) {
            message.success("Task first verified successfully");
          }
        },
        onError: (error: any) => {
          message.error(error.response?.data?.message || "Failed to first verify task");
        }
      }
    );
  };

  const handleSingleSecondVerify = (task: ExtendedTaskType) => {
    const userId = (profile as any)?.id;
    if (!task.id || !userId) return;

    secondVerifyTasks(
      {
        taskIds: [task.id],
        secondVerifiedBy: userId
      },
      {
        onSuccess: (data: any) => {
          if (data && data.success && data.success.length > 0) {
            message.success("Task second verified successfully");
          }
        },
        onError: (error: any) => {
          message.error(error.response?.data?.message || "Failed to second verify task");
        }
      }
    );
  };

  const columns = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        sorter: (a: ExtendedTaskType, b: ExtendedTaskType) => a.name.localeCompare(b.name),
        sortOrder: sortedInfo.columnKey === "name" && sortedInfo.order,
        ...getColumnSearchProps("name", "Name"),
        render: (name: string, record: ExtendedTaskType) => {
          const searchWords = [];
          if (searchedColumn === "name" && searchText) searchWords.push(searchText);
          if (globalSearchText) searchWords.push(globalSearchText);

          const content =
            searchWords.length > 0 ? (
              <Highlighter
                highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
                searchWords={searchWords}
                autoEscape
                textToHighlight={name ? name.toString() : ""}
              />
            ) : (
              name
            );

          const isSubTask = record.taskType === "task" && !!record.parentTask;
          const hasChildren = record.children && record.children.length > 0;
          const hasTaskGroup = !!record.groupProject?.name;
          const hasTaskSuper = !!record.groupProject?.taskSuper?.name;

          let prefix = "";
          let tooltip = "";
          if (isSubTask) {
            prefix = "↳ ";
            tooltip = "Subtask";
          } else if (hasChildren) {
            prefix = "📋 ";
            tooltip = "Parent Task with subtasks";
          } else if (record.taskType === "story") {
            prefix = "📝 ";
            tooltip = "Task";
            if (hasTaskGroup && hasTaskSuper) {
              tooltip += ` in ${record.groupProject?.name} group under ${record.groupProject?.taskSuper?.name}`;
            } else if (hasTaskGroup) {
              tooltip += ` in ${record.groupProject?.name} group`;
            }
          }

          return (
            <div className="flex items-center justify-between gap-2">
              <span
                style={{
                  fontWeight: isSubTask ? "normal" : "500",
                  fontSize: isSubTask ? "0.9em" : "1em",
                  color: isSubTask ? "#666" : "#000",
                  paddingLeft: isSubTask ? "16px" : "0"
                }}
              >
                <Tooltip title={tooltip} placement="topLeft">
                  <span style={{ marginRight: "4px" }}>{prefix}</span>
                </Tooltip>
                <Link to={`/projects/${record.projectId}/tasks/${record.id}`} className="text-blue-600">
                  {content}
                </Link>
              </span>
            </div>
          );
        }
      },
      {
        title: "Task Type",
        dataIndex: "taskType",
        key: "taskType",
        width: 100,
        sorter: (a: any, b: any) => (a.taskType || "").localeCompare(b.taskType || ""),
        sortOrder: sortedInfo.columnKey === "taskType" && sortedInfo.order,
        ...getColumnSearchProps("taskType", "Task Type"),
        render: (_: any, record: any) => {
          const displayType = record?.taskType === "story" ? "Task" : "Subtask";
          const badgeColor = record?.taskType === "story" ? "blue" : "green";
          return (
            <Tag color={badgeColor} style={{ cursor: "default" }}>
              {displayType}
            </Tag>
          );
        }
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 100,
        sorter: (a: ExtendedTaskType, b: ExtendedTaskType) => (a.status || "").localeCompare(b.status || ""),
        sortOrder: sortedInfo.columnKey === "status" && sortedInfo.order,
        ...getColumnSearchProps("status", "Status"),
        render: (status: string) => <Badge count={status} color="#52c41a" style={{ cursor: "pointer" }} />
      },
      {
        title: "Assignee",
        dataIndex: "assignees",
        key: "assignees",
        editable: true,
        render: (assignees: UserType[], record: ExtendedTaskType) => {
          const editable = isEditing(record);
          return editable ? (
            <Form.Item name="assineeId" style={{ margin: 0 }} rules={[{ required: false }]}>
              <Select
                mode="multiple"
                style={{ width: "100%" }}
                placeholder="Select assignees"
                options={(users || []).map((user: any) => ({
                  label: user.username,
                  value: user.id
                }))}
                optionFilterProp="label"
                showSearch
              />
            </Form.Item>
          ) : (
            <Avatar.Group
              max={{
                count: 2,
                style: { color: "#f56a00", backgroundColor: "#fde3cf", cursor: "pointer" },
                popover: { trigger: "click" }
              }}
            >
              {assignees?.map((user) => (
                <Tooltip key={user.id} title={user.username} placement="top">
                  <Avatar style={{ backgroundColor: "#87d068" }}>
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
          );
        }
      },
      {
        title: "Due date",
        dataIndex: "dueDate",
        key: "dueDate",
        editable: true,
        sorter: (a: ExtendedTaskType, b: ExtendedTaskType) => {
          if (!a.dueDate) return -1;
          if (!b.dueDate) return 1;
          return moment(a.dueDate).unix() - moment(b.dueDate).unix();
        },
        sortOrder: sortedInfo.columnKey === "dueDate" && sortedInfo.order,
        render: (dueDate: string | null, record: ExtendedTaskType) => {
          const editable = isEditing(record);
          return editable ? (
            <Form.Item name="dueDate" style={{ margin: 0 }} rules={[{ required: false }]}>
              <DatePicker />
            </Form.Item>
          ) : dueDate ? (
            new Date(dueDate).toLocaleDateString()
          ) : (
            "---"
          );
        }
      },
      ...(dataHasDoneTasks
        ? [
            {
              title: "1st Verify",
              key: "firstVerify",
              render: (_: any, record: ExtendedTaskType) => {
                if (record.status === "open" || record.status === "in_progress") return null;
                const canFirstVerify = record.status === "done" && !record.firstVerifiedBy;
                const isFirstVerified = record.firstVerifiedBy;
                const isSecondVerified = record.secondVerifiedBy;

                if (isSecondVerified) {
                  const firstUser = getUserDisplayName(record.firstVerifiedBy);
                  const secondUser = getUserDisplayName(record.secondVerifiedBy);
                  return (
                    <Tooltip
                      title={`First verified by ${firstUser} at ${
                        record.firstVerifiedAt ? new Date(record.firstVerifiedAt).toLocaleString() : "Unknown time"
                      }, Second verified by ${secondUser} at ${
                        record.secondVerifiedAt ? new Date(record.secondVerifiedAt).toLocaleString() : "Unknown time"
                      }`}
                    >
                      <Tag color="blue" style={{ fontSize: "11px" }}>
                        ✓✓ 2nd Done
                      </Tag>
                    </Tooltip>
                  );
                }
                if (isFirstVerified) {
                  const firstUser = getUserDisplayName(record.firstVerifiedBy);
                  return (
                    <Tooltip
                      title={`First verified by ${firstUser} at ${
                        record.firstVerifiedAt ? new Date(record.firstVerifiedAt).toLocaleString() : "Unknown time"
                      }`}
                    >
                      <Tag color="blue" style={{ fontSize: "11px" }}>
                        ✓ 1st Done
                      </Tag>
                    </Tooltip>
                  );
                }
                if (!canFirstVerify) {
                  return (
                    <Tag color="default" style={{ fontSize: "11px" }}>
                      Not Ready
                    </Tag>
                  );
                }
                if (!hasFirstVerifyPermission) {
                  return (
                    <Tag color="orange" style={{ fontSize: "11px" }}>
                      No Permission
                    </Tag>
                  );
                }
                return (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handleSingleFirstVerify(record)}
                    disabled={isFirstVerifying}
                    style={{ color: "#1890ff", padding: "0 4px", fontSize: "12px", height: "auto" }}
                  >
                    ✓ 1st Verify
                  </Button>
                );
              }
            },
            {
              title: "2nd Verify",
              key: "secondVerify",
              render: (_: any, record: ExtendedTaskType) => {
                if (record.status === "open" || record.status === "in_progress") return null;
                const canSecondVerify = record.firstVerifiedBy && !record.secondVerifiedBy;
                const isSecondVerified = record.secondVerifiedBy;

                if (isSecondVerified) {
                  const secondUser = getUserDisplayName(record.secondVerifiedBy);
                  return (
                    <Tooltip
                      title={`Second verified by ${secondUser} at ${
                        record.secondVerifiedAt ? new Date(record.secondVerifiedAt).toLocaleString() : "Unknown time"
                      }`}
                    >
                      <Tag color="green" style={{ fontSize: "11px" }}>
                        ✓ 2nd Done
                      </Tag>
                    </Tooltip>
                  );
                }
                if (!canSecondVerify) {
                  return (
                    <Tag color="default" style={{ fontSize: "11px" }}>
                      Not Ready
                    </Tag>
                  );
                }
                if (!hasSecondVerifyPermission) {
                  return (
                    <Tag color="orange" style={{ fontSize: "11px" }}>
                      No Permission
                    </Tag>
                  );
                }
                return (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handleSingleSecondVerify(record)}
                    disabled={isSecondVerifying}
                    style={{ color: "#722ed1", padding: "0 4px", fontSize: "12px", height: "auto" }}
                  >
                    ✓ 2nd Verify
                  </Button>
                );
              }
            }
          ]
        : []),
      {
        title: "",
        key: "action",
        width: 120,
        render: (_: unknown, record: ExtendedTaskType) => {
          const editable = isEditing(record);
          return editable ? (
            <span>
              <Button
                type="primary"
                onClick={() => saveEdit(String(record.id))}
                style={{ marginRight: 8 }}
                loading={isUpdating}
                disabled={isUpdating}
              >
                Save
              </Button>
              <Button onClick={() => setEditingKey(null)} disabled={isUpdating}>
                Cancel
              </Button>
            </span>
          ) : (
            <Space>
              <Button type="primary" onClick={() => handleEditClick(record)} icon={<EditOutlined />} />
              {record.status === "in_progress" && canMarkComplete && (
                <Popconfirm
                  title="Mark Task Complete"
                  description="Are you sure you want to mark this task as complete?"
                  onConfirm={() => handleSingleMarkComplete(record)}
                  okText="Yes"
                  cancelText="No"
                  okButtonProps={{ style: { backgroundColor: "#52c41a", borderColor: "#52c41a" } }}
                >
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                    loading={isMarkingComplete}
                  />
                </Popconfirm>
              )}
              {canDeleteTask && (
                <Popconfirm
                  title="Delete Task"
                  description="Are you sure you want to delete this task?"
                  onConfirm={() => handleDeleteTask(String(record.id))}
                  okText="Yes"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                >
                  <Button type="primary" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              )}
            </Space>
          );
        }
      }
    ],
    [
      editingKey,
      users,
      projectId,
      isUpdating,
      canDeleteTask,
      sortedInfo,
      searchText,
      searchedColumn,
      isFirstVerifying,
      isSecondVerifying,
      isMarkingComplete,
      globalSearchText,
      dataHasDoneTasks,
      hasFirstVerifyPermission,
      hasSecondVerifyPermission,
      canMarkComplete,
      getUserDisplayName
    ]
  );

  const mergedColumns = columns.map((col) => {
    if (!col.editable) return col;
    return {
      ...col,
      onCell: (record: ExtendedTaskType) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        onDoubleClick: () => !editingKey && startEditing(record)
      })
    };
  });

  const rowSelection: TableProps<ExtendedTaskType>["rowSelection"] = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: ExtendedTaskType) => ({
      name: record.name
    })
  };

  const statusLabelMap: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    done: "Done",
    first_verified: "First Verified",
    second_verified: "Second Verified"
  };

  const statusColorMap: Record<string, string> = {
    open: "default",
    in_progress: "processing",
    done: "success",
    first_verified: "blue",
    second_verified: "purple"
  };

  const completeAllRowSelection: TableProps<CompleteAllTaskCandidate>["rowSelection"] = {
    selectedRowKeys: selectedCompleteTaskIds,
    onChange: (keys: React.Key[]) => setSelectedCompleteTaskIds(keys),
    getCheckboxProps: (record: CompleteAllTaskCandidate) => ({
      name: record.name
    })
  };

  return (
    <>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "16px", marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", flex: 1 }}>
            <Radio.Group
              value={activeTab}
              onChange={(e) => {
                setActiveTab(e.target.value);
                setSelectedRowKeys([]);
              }}
              buttonStyle="solid"
            >
              <Radio.Button value="open">To Do</Radio.Button>
              <Radio.Button value="in_progress">Doing</Radio.Button>
              <Radio.Button value="done">Completed</Radio.Button>
            </Radio.Group>

            <Button type="primary" onClick={handleSetDueDate} disabled={selectedRowKeys.length === 0}>
              Set Due Date
            </Button>
            <Button type="primary" onClick={handleAssign} disabled={selectedRowKeys.length === 0}>
              Assign
            </Button>

            {hasCompleteAllPermission && (
              <Button
                type="primary"
                onClick={openCompleteAllTasksModal}
                loading={isCompletingAllTasks}
                style={{ backgroundColor: "#fa8c16", borderColor: "#fa8c16" }}
              >
                Complete All Task
              </Button>
            )}

            {hasInProgressTasks && !hasOpenTasks && canMarkComplete && (
              <Button
                type="primary"
                onClick={handleMarkComplete}
                disabled={selectedRowKeys.length === 0}
                loading={isMarkingComplete}
                icon={<CheckOutlined />}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                Mark Complete
              </Button>
            )}

            {hasDoneTasks && !hasOpenTasks && (
              <>
                <Button
                  onClick={handleFirstVerify}
                  disabled={selectedRowKeys.length === 0}
                  loading={isFirstVerifying}
                  icon={<CheckCircleOutlined />}
                  style={{ backgroundColor: "#1890ff", borderColor: "#1890ff", color: "white" }}
                >
                  First Verify
                </Button>
                <Button
                  onClick={handleSecondVerify}
                  disabled={selectedRowKeys.length === 0}
                  loading={isSecondVerifying}
                  icon={<CheckCircleOutlined />}
                  style={{ backgroundColor: "#722ed1", borderColor: "#722ed1", color: "white" }}
                >
                  Second Verify
                </Button>
              </>
            )}

            <Input.Search
              placeholder="🔍 Search all fields (name, type, tasksuper, group, status)..."
              allowClear
              value={globalSearchText}
              onChange={(e) => handleGlobalSearch(e.target.value)}
              onSearch={(value) => handleGlobalSearch(value)}
              style={{ width: 300 }}
            />
          </div>

          <div>
            {!hideAddTask && (
              <Button type="primary" onClick={() => showModal()}>
                Add Task
              </Button>
            )}
          </div>
        </div>

        {(searchText || globalSearchText) && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: 16 }}>
            <span style={{ color: "#1890ff", fontSize: "14px" }}>
              🔍 {globalSearchText ? "Global search" : "Column search"}: "{searchText || globalSearchText}"
            </span>
            <Button
              size="small"
              onClick={() => {
                setSearchText("");
                setSearchedColumn("");
                setGlobalSearchText("");
                setExpandedRowKeys([]);
              }}
            >
              Clear Search
            </Button>
          </div>
        )}

        <Form form={form} component={false}>
          {groupedContainers.length === 0 ? (
            <Empty description="No tasks found matching criteria" style={{ margin: "30px 0" }} />
          ) : (
            <Collapse
              defaultActiveKey={groupedContainers.map((s) => s.id)}
              style={{ background: "transparent", border: "none" }}
            >
              {groupedContainers.map((superItem) => (
                <Collapse.Panel
                  key={superItem.id}
                  header={
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingRight: 12 }}>
                      <Tooltip title="Super Project" placement="top">
                        <Space align="center" style={{ cursor: "pointer" }}>
                          <AppstoreOutlined style={{ color: "#3b82f6", fontSize: 16 }} />
                          <Typography.Text style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>
                            {superItem.name}
                          </Typography.Text>
                        </Space>
                      </Tooltip>
                      <Tag style={{ borderRadius: 12, fontWeight: 500, color: "#2563eb", backgroundColor: "#eff6ff", borderColor: "#dbeafe" }}>
                        {superItem.totalTasks} tasks
                      </Tag>
                    </div>
                  }
                  style={{
                    marginBottom: 12,
                    background: "#f8fafc",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                    overflow: "hidden"
                  }}
                >
                  <Collapse
                    defaultActiveKey={superItem.groups.map((g: any) => g.id)}
                    style={{ background: "transparent", border: "none" }}
                  >
                    {superItem.groups.map((groupItem: any) => (
                      <Collapse.Panel
                        key={groupItem.id}
                        header={
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingRight: 12 }}>
                            <Tooltip title="Task Group" placement="top">
                              <Space align="center" style={{ cursor: "pointer" }}>
                                <FolderOutlined style={{ color: "#64748b", fontSize: 15 }} />
                                <Typography.Text style={{ fontSize: 14, fontWeight: 500, color: "#334155" }}>
                                  {groupItem.name}
                                </Typography.Text>
                              </Space>
                            </Tooltip>
                            <Tag style={{ borderRadius: 12, fontWeight: 500, color: "#64748b", backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
                              {groupItem.tasks.length} tasks
                            </Tag>
                          </div>
                        }
                        style={{
                          marginBottom: 8,
                          background: "#ffffff",
                          borderRadius: 6,
                          border: "1px solid #f1f5f9",
                          overflow: "hidden"
                        }}
                      >
                        <Table
                          loading={loading}
                          components={{ body: { cell: EditableCell } }}
                          columns={mergedColumns}
                          dataSource={groupItem.tasks}
                          rowSelection={rowSelection}
                          rowKey="id"
                          size="small"
                          bordered={false}
                          pagination={false}
                          expandable={{
                            defaultExpandAllRows: true,
                            expandRowByClick: false,
                            indentSize: 20,
                            rowExpandable: (record: any) => Array.isArray(record.children) && record.children.length > 0
                          }}
                        />
                      </Collapse.Panel>
                    ))}
                  </Collapse>
                </Collapse.Panel>
              ))}
            </Collapse>
          )}
        </Form>
      </Card>

      <Modal
        title="Select Tasks To Complete"
        open={isCompleteAllModalVisible}
        onOk={handleCompleteAllTasks}
        onCancel={() => setIsCompleteAllModalVisible(false)}
        okText="Complete Selected"
        confirmLoading={isCompletingAllTasks}
        width={920}
      >
        <div style={{ marginBottom: 12 }}>
          Tasks are sorted by status. Check or uncheck tasks to control which tasks will be completed.
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>Selected:</strong> {selectedCompleteTaskIds.length} / {completeAllTaskCandidates.length}
        </div>
        <Table
          rowSelection={completeAllRowSelection}
          dataSource={completeAllTaskCandidates}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          columns={[
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              width: 130,
              render: (taskStatus: string) => (
                <Tag color={statusColorMap[taskStatus] || "default"}>
                  {statusLabelMap[taskStatus] || taskStatus}
                </Tag>
              )
            },
            {
              title: "Task Name",
              dataIndex: "name",
              key: "name",
              render: (taskName: string, record: CompleteAllTaskCandidate) => (
                <div>
                  <div>{taskName}</div>
                  {record.parentTaskName && (
                    <div style={{ color: "#8c8c8c", fontSize: 12 }}>
                      Parent: {record.parentTaskName}
                    </div>
                  )}
                </div>
              )
            },
            {
              title: "Assigned To",
              dataIndex: "assigneesLabel",
              key: "assigneesLabel"
            }
          ]}
        />
      </Modal>

      <Modal
        title="Set Due Date for Selected Tasks"
        open={isDueDateModalVisible}
        onOk={handleDueDateOk}
        onCancel={() => setIsDueDateModalVisible(false)}
      >
        <Form form={bulkForm} layout="vertical">
          <Form.Item name="dueDate" label="Due Date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Assign Users to Selected Tasks"
        open={isAssigneeModalVisible}
        onOk={handleAssigneeOk}
        onCancel={() => setIsAssigneeModalVisible(false)}
      >
        <Form form={bulkForm} layout="vertical">
          <Form.Item name="assigneeIds" label="Assignees">
            <Select
              mode="multiple"
              placeholder="Select assignees"
              options={(users || []).map((user: any) => ({
                label: user.username,
                value: user.id
              }))}
              optionFilterProp="label"
              showSearch
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const EditableCell: React.FC<any> = ({
  editing,
  dataIndex,
  title,
  record,
  children,
  onDoubleClick,
  ...restProps
}) => {
  return (
    <td {...restProps} onDoubleClick={onDoubleClick}>
      {editing ? (
        <Form.Item name={dataIndex} style={{ margin: 0 }}>
          {children}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

export default TaskTable;