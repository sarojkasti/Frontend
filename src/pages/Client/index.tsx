import ClientTable from "@/components/Client/ClientTable";
import ClientExportPage from "@/components/Client/ClientExportPage";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, Button, Popover, Tooltip, Input } from "antd";
import { PlusOutlined, DownloadOutlined, SettingOutlined, SearchOutlined } from "@ant-design/icons";
import { useClient } from "@/hooks/client/useClient";
import { useSession } from "@/context/SessionContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  ALL_CLIENT_COLUMNS,
  getSavedClientVisibleColumns,
  saveClientVisibleColumns
} from "@/components/Client/clientColumnsConfig";
import { SortableColumnCustomizer } from "@/components/Table/SortableColumnCustomizer";

const ClientPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, permissions } = useSession();
  const { isMobile } = useIsMobile();
  const [activeKey, setActiveKey] = useState("active");
  const [selectedClients, setSelectedClients] = useState<any[]>([]);
  const [isExportViewOpen, setIsExportViewOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
    <div className="pb-16 sm:pb-0 px-2 sm:px-0">
      {/* Mobile Live Search Bar */}
      {isMobile && mobileSearchOpen && (
        <div className="mb-3 px-2 sm:px-0">
          <div className="bg-white p-2 rounded-xl shadow-md border border-blue-200 flex items-center gap-2">
            <Input
              prefix={<SearchOutlined style={{ color: "#0c66e4", fontSize: 16 }} />}
              placeholder="Search clients by name, PAN, contact, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              autoFocus
              className="text-sm border-0 focus:shadow-none"
              style={{ backgroundColor: "transparent" }}
            />
            <Button
              type="text"
              size="small"
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery("");
              }}
              style={{ color: "#64748b", fontWeight: 500 }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <Tabs 
        activeKey={activeKey} 
        onChange={handleTabChange}
        tabBarExtraContent={
          !isMobile ? (
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
          ) : null
        }
        renderTabBar={(props, DefaultTabBar) => (
          <div className="overflow-x-auto whitespace-nowrap px-4 sm:px-0">
            <DefaultTabBar {...props} style={{ marginBottom: 0 }} />
          </div>
        )}
        tabBarStyle={
          isMobile
            ? {
                overflowX: "auto",
                whiteSpace: "nowrap",
                marginBottom: 12,
                paddingLeft: "16px",
                paddingRight: "16px",
              }
            : undefined
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
                searchQuery={searchQuery}
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
                searchQuery={searchQuery}
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
                searchQuery={searchQuery}
              />
            ),
          },
        ]}
      />

      {/* Floating Search Button for Mobile View */}
      {isMobile && (
        <div className="fixed bottom-20 right-5 z-40">
          <Button
            shape="circle"
            size="large"
            icon={<SearchOutlined style={{ fontSize: "18px" }} />}
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            className="shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
            style={{
              width: "46px",
              height: "46px",
              backgroundColor: mobileSearchOpen ? "#0c66e4" : "#ffffff",
              color: mobileSearchOpen ? "#ffffff" : "#334155",
              borderColor: mobileSearchOpen ? "#0c66e4" : "#e2e8f0",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
            }}
          />
        </div>
      )}

      {/* Floating Create Client Button for Mobile View */}
      {isMobile && (
        <div className="fixed bottom-6 right-5 z-40">
          <Button
            type="primary"
            shape="round"
            size="large"
            icon={<PlusOutlined style={{ fontSize: "16px" }} />}
            onClick={handleCreate}
            className="shadow-2xl flex items-center gap-1.5 font-medium hover:scale-105 active:scale-95 transition-all duration-200"
            style={{
              height: "46px",
              paddingLeft: "16px",
              paddingRight: "18px",
              fontSize: "14px",
              backgroundColor: "#0c66e4",
              boxShadow: "0 6px 20px rgba(12, 102, 228, 0.4)",
            }}
          >
            Create Client
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClientPage;
