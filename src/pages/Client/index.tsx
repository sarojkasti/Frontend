import ClientTable from "@/components/Client/ClientTable";
import ClientExportPage from "@/components/Client/ClientExportPage";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, Button, Space, Tooltip, Popover, Checkbox, Divider } from "antd";
import { PlusOutlined, DownloadOutlined, SettingOutlined } from "@ant-design/icons";
import { useClient } from "@/hooks/client/useClient";
import { useSession } from "@/context/SessionContext";
import {
  ALL_CLIENT_COLUMNS,
  getSavedClientVisibleColumns,
  saveClientVisibleColumns
} from "@/components/Client/clientColumnsConfig";
import { SortableColumnCustomizer } from "@/components/Table/SortableColumnCustomizer";

const ClientPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, permissions } = useSession();
  const [activeKey, setActiveKey] = useState("active");
  const [selectedClients, setSelectedClients] = useState<any[]>([]);
  const [isExportViewOpen, setIsExportViewOpen] = useState(false);

  // Dynamic permission check for client export based on backend permission config
  const canExportClient = useMemo(() => {
    if (!profile) return false;

    const rawPerms =
      (profile as any)?.role?.permission ||
      permissions ||
      (profile as any)?.permissions ||
      [];

    if (!Array.isArray(rawPerms) || rawPerms.length === 0) {
      return false;
    }

    return rawPerms.some((perm: any) => {
      if (typeof perm === "string") {
        const lower = perm.toLowerCase();
        return (
          lower === "all" ||
          lower.includes("export clients") ||
          lower.includes("export client") ||
          lower.includes("/clients/export")
        );
      }
      if (typeof perm === "object" && perm !== null) {
        const path = String(perm.path || perm.route || "").toLowerCase();
        const description = String(perm.description || perm.name || "").toLowerCase();
        return (
          path.includes("/clients/export") ||
          description.includes("export client") ||
          description.includes("export clients")
        );
      }
      return false;
    });
  }, [profile, permissions]);

  // Column Visibility State
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(
    getSavedClientVisibleColumns()
  );

  useEffect(() => {
    saveClientVisibleColumns(visibleColumnKeys);
  }, [visibleColumnKeys]);

  const { data: allClients } = useClient("all");

  const handleTabChange = (key: string) => {
    setActiveKey(key);
  };

  const handleCreate = () => {
    navigate("/client/new");
  };

  const columnPopoverContent = (
    <SortableColumnCustomizer
      allColumns={ALL_CLIENT_COLUMNS}
      visibleColumnKeys={visibleColumnKeys}
      setVisibleColumnKeys={setVisibleColumnKeys}
      onReset={() =>
        setVisibleColumnKeys(
          ALL_CLIENT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key)
        )
      }
    />
  );

  if (isExportViewOpen && canExportClient) {
    return (
      <ClientExportPage
        onBack={() => setIsExportViewOpen(false)}
        selectedClients={selectedClients}
        allClients={allClients || []}
        activeTabKey={activeKey}
      />
    );
  }

  return (
    <>
      <Tabs 
        activeKey={activeKey} 
        onChange={handleTabChange}
        tabBarExtraContent={
          <div className="flex flex-wrap gap-2">
            <Popover
              content={columnPopoverContent}
              trigger="click"
              placement="bottomRight"
            >
              <Button icon={<SettingOutlined />}>Customize Columns</Button>
            </Popover>
            {canExportClient && (
              <Tooltip title="Download / Export Clients Helper">
                <Button icon={<DownloadOutlined />} onClick={() => setIsExportViewOpen(true)} />
              </Tooltip>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Create Client
            </Button>
          </div>
        }
        items={[
          {
            key: "active",
            label: "Active",
            children: (
              <ClientTable
                status="active"
                selectedClients={selectedClients}
                setSelectedClients={setSelectedClients}
                visibleColumnKeys={visibleColumnKeys}
              />
            ),
          },
          {
            key: "suspended",
            label: "Suspended",
            children: (
              <ClientTable
                status="suspended"
                selectedClients={selectedClients}
                setSelectedClients={setSelectedClients}
                visibleColumnKeys={visibleColumnKeys}
              />
            ),
          },
          {
            key: "archive",
            label: "Archived",
            children: (
              <ClientTable
                status="archive"
                selectedClients={selectedClients}
                setSelectedClients={setSelectedClients}
                visibleColumnKeys={visibleColumnKeys}
              />
            ),
          },
        ]}
      />
    </>
  );
};

export default ClientPage;
