import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Input,
  Popover,
  Popconfirm,
  Select,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BankOutlined,
  DeleteOutlined,
  EditOutlined,
  HistoryOutlined,
  LockOutlined,
  PhoneOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { PowerTable, PowerTableColumn, useColumnVisibility } from "@/components/Table";
import { useSession } from "@/context/SessionContext";
import {
  useDeletePhonebookEntry,
  usePhonebookCategories,
  usePhonebookClients,
  usePhonebookEntries,
} from "@/hooks/phonebook/usePhonebook";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PhonebookClientContact, PhonebookEntry } from "@/types/phonebook";
import PhonebookEntryModal from "./components/PhonebookEntryModal";
import PhonebookHistoryModal from "./components/PhonebookHistoryModal";
import PhonebookShareModal from "./components/PhonebookShareModal";

const { Text } = Typography;

const TAB_PREFS_STORAGE_KEY = "phonebook_tab_prefs_v1";

interface TabPrefs {
  order: string[];
  hidden: string[];
}

const loadTabPrefs = (): TabPrefs => {
  try {
    const raw = localStorage.getItem(TAB_PREFS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        order: Array.isArray(parsed.order) ? parsed.order : [],
        hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
      };
    }
  } catch {
    // ignore invalid storage
  }
  return { order: [], hidden: [] };
};

const OTHER_COLUMNS_DEF = [
  { key: "name", label: "Name", required: true },
  { key: "phoneNumber", label: "Phone Number", required: true },
  { key: "category", label: "Category" },
  { key: "sharing", label: "Sharing" },
  { key: "created", label: "Created By / At" },
  { key: "updated", label: "Updated By / At" },
  { key: "actions", label: "Actions", required: true },
];

const CLIENT_COLUMNS_DEF = [
  { key: "name", label: "Client Name", required: true },
  { key: "contactPerson", label: "Contact Person" },
  { key: "contactPersonPhone", label: "Contact Number", required: true },
  { key: "activeProjects", label: "Active Projects (Current FY)" },
];

const PhonebookPage: React.FC = () => {
  const { profile, permissionChecker } = useSession();
  const { isMobile } = useIsMobile();

  const isSuperUser = permissionChecker.isSuperAdmin();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sharingFilter, setSharingFilter] = useState<"all" | "shared" | "private">("all");
  const [tabPrefs, setTabPrefs] = useState<TabPrefs>(loadTabPrefs);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PhonebookEntry | null>(null);
  const [historyEntry, setHistoryEntry] = useState<PhonebookEntry | null>(null);
  const [shareEntry, setShareEntry] = useState<PhonebookEntry | null>(null);

  const { data: entries = [], isLoading: entriesLoading } = usePhonebookEntries();
  const { data: clientsData, isLoading: clientsLoading } = usePhonebookClients();
  const { data: categories = [] } = usePhonebookCategories();
  const { mutateAsync: deleteEntry } = useDeletePhonebookEntry();

  const { visibleColumnKeys: otherVisibleKeys } = useColumnVisibility({
    persistenceKey: "phonebook_other_table",
    columns: OTHER_COLUMNS_DEF,
  });

  const { visibleColumnKeys: clientVisibleKeys } = useColumnVisibility({
    persistenceKey: "phonebook_client_table",
    columns: CLIENT_COLUMNS_DEF,
  });

  const canViewClients = Boolean(clientsData?.canViewClients);

  useEffect(() => {
    try {
      localStorage.setItem(TAB_PREFS_STORAGE_KEY, JSON.stringify(tabPrefs));
    } catch {
      // ignore storage errors
    }
  }, [tabPrefs]);

  // Build available tabs: "all", "clients" (if allowed), each category ("cat:<id>"), "uncategorized"
  const allAvailableTabs = useMemo(() => {
    const base: Array<{ key: string; label: string; kind: "all" | "clients" | "category" | "uncategorized"; categoryId?: string }> = [
      { key: "all", label: "All Other", kind: "all" },
    ];
    if (canViewClients) {
      base.push({ key: "clients", label: "Clients", kind: "clients" });
    }
    categories.forEach((cat) => {
      base.push({
        key: `cat:${cat.id}`,
        label: cat.name,
        kind: "category",
        categoryId: cat.id,
      });
    });
    base.push({ key: "uncategorized", label: "Uncategorized", kind: "uncategorized" });
    return base;
  }, [canViewClients, categories]);

  // Apply user's custom ordering
  const orderedTabs = useMemo(() => {
    const orderMap = new Map<string, number>();
    tabPrefs.order.forEach((key, idx) => orderMap.set(key, idx));
    return [...allAvailableTabs].sort((a, b) => {
      const idxA = orderMap.has(a.key) ? orderMap.get(a.key)! : 9999;
      const idxB = orderMap.has(b.key) ? orderMap.get(b.key)! : 9999;
      if (idxA !== idxB) return idxA - idxB;
      return 0;
    });
  }, [allAvailableTabs, tabPrefs.order]);

  const visibleTabs = useMemo(() => {
    const hiddenSet = new Set(tabPrefs.hidden);
    const filtered = orderedTabs.filter((t) => !hiddenSet.has(t.key));
    return filtered.length > 0 ? filtered : orderedTabs.slice(0, 1);
  }, [orderedTabs, tabPrefs.hidden]);

  useEffect(() => {
    if (!visibleTabs.some((t) => t.key === activeTab) && visibleTabs.length > 0) {
      setActiveTab(visibleTabs[0].key);
    }
  }, [visibleTabs, activeTab]);

  const toggleTabVisibility = (key: string) => {
    setTabPrefs((prev) => {
      const isHidden = prev.hidden.includes(key);
      if (!isHidden && visibleTabs.length <= 1 && visibleTabs[0]?.key === key) {
        message.warning("At least one tab must remain visible");
        return prev;
      }
      const nextHidden = isHidden
        ? prev.hidden.filter((k) => k !== key)
        : [...prev.hidden, key];
      return { ...prev, hidden: nextHidden };
    });
  };

  const moveTabOrder = (key: string, direction: "up" | "down") => {
    const currentKeys = orderedTabs.map((t) => t.key);
    const idx = currentKeys.indexOf(key);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= currentKeys.length) return;
    const nextOrder = [...currentKeys];
    [nextOrder[idx], nextOrder[swapIdx]] = [nextOrder[swapIdx], nextOrder[idx]];
    setTabPrefs((prev) => ({ ...prev, order: nextOrder }));
  };

  const resetTabPrefs = () => {
    setTabPrefs({ order: [], hidden: [] });
  };

  const baseFilteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((item) => {
      if (sharingFilter === "shared" && !item.isShared) return false;
      if (sharingFilter === "private" && item.isShared) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.phoneNumber.toLowerCase().includes(q) ||
        (item.secondaryPhone || "").toLowerCase().includes(q) ||
        (item.category?.name || "").toLowerCase().includes(q) ||
        (item.notes || "").toLowerCase().includes(q) ||
        (item.creator?.name || "").toLowerCase().includes(q)
      );
    });
  }, [entries, searchQuery, sharingFilter]);

  const getEntriesForTab = (tabKey: string) => {
    if (tabKey === "all") return baseFilteredEntries;
    if (tabKey === "uncategorized") {
      return baseFilteredEntries.filter((e) => !e.category?.id && !e.categoryId);
    }
    if (tabKey.startsWith("cat:")) {
      const catId = tabKey.slice(4);
      return baseFilteredEntries.filter(
        (e) => (e.category?.id || e.categoryId) === catId
      );
    }
    return baseFilteredEntries;
  };

  const filteredClients = useMemo(() => {
    const items = clientsData?.items || [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.shortName || "").toLowerCase().includes(q) ||
        (c.contactPerson || "").toLowerCase().includes(q) ||
        (c.contactPersonPhone || "").toLowerCase().includes(q) ||
        c.activeProjects.some((p) => p.toLowerCase().includes(q))
    );
  }, [clientsData?.items, searchQuery]);

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id);
      message.success("Phonebook entry deleted");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to delete entry");
    }
  };

  const openCreateModal = () => {
    setEditingEntry(null);
    setModalOpen(true);
  };

  const openEditModal = (entry: PhonebookEntry) => {
    setEditingEntry(entry);
    setModalOpen(true);
  };

  const otherColumns: PowerTableColumn<PhonebookEntry>[] = [
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
      searchable: true,
      defaultWidth: 175,
      render: (_val, record) => (
        <div>
          <div className="font-medium text-slate-900">{record.name}</div>
          {record.notes && (
            <div
              className="text-xs text-slate-500 truncate max-w-[170px]"
              title={record.notes}
            >
              {record.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "phoneNumber",
      title: "Phone Number",
      dataIndex: "phoneNumber",
      searchable: true,
      defaultWidth: 145,
      render: (_val, record) => (
        <div className="space-y-0.5">
          <div>
            <a
              href={`tel:${record.phoneNumber}`}
              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              <PhoneOutlined className="text-xs" />
              {record.phoneNumber}
            </a>
          </div>
          {record.secondaryPhone && (
            <div className="text-xs text-slate-500">
              Alt:{" "}
              <a href={`tel:${record.secondaryPhone}`} className="hover:underline">
                {record.secondaryPhone}
              </a>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "category",
      title: "Category",
      dataIndex: ["category", "name"],
      defaultWidth: 115,
      render: (_val, record) =>
        record.category ? (
          <Tag color="blue">{record.category.name}</Tag>
        ) : (
          <Text type="secondary" className="text-xs">
            Uncategorized
          </Text>
        ),
    },
    {
      key: "sharing",
      title: "Sharing",
      defaultWidth: 165,
      render: (_val, record) => {
        if (!record.isShared) {
          return (
            <Tag icon={<LockOutlined />} color="default">
              Private
            </Tag>
          );
        }
        const userCount = record.sharedWithUsers?.length || 0;
        const roleCount = record.sharedWithRoles?.length || 0;
        if (userCount === 0 && roleCount === 0) {
          return (
            <Tag icon={<ShareAltOutlined />} color="green">
              Everyone
            </Tag>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            {(record.sharedWithRoles || []).map((r) => (
              <Tag key={`role-${r.id}`} color="purple" className="text-xs m-0">
                {r.displayName || r.name}
              </Tag>
            ))}
            {(record.sharedWithUsers || []).map((u) => (
              <Tag key={`user-${u.id}`} color="cyan" className="text-xs m-0">
                {u.name}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      key: "created",
      title: "Created By / At",
      defaultWidth: 145,
      render: (_val, record) => (
        <div className="text-xs">
          <div className="font-medium text-slate-700">
            {record.creator?.name || "System"}
          </div>
          <div className="text-slate-400">
            {dayjs(record.createdAt).format("YYYY-MM-DD HH:mm")}
          </div>
        </div>
      ),
    },
    {
      key: "updated",
      title: "Updated By / At",
      defaultWidth: 145,
      render: (_val, record) => (
        <div className="text-xs">
          <div className="font-medium text-slate-700">
            {record.updater?.name || record.creator?.name || "System"}
          </div>
          <div className="text-slate-400">
            {dayjs(record.updatedAt).format("YYYY-MM-DD HH:mm")}
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      required: true,
      defaultWidth: 135,
      render: (_val, record) => {
        const canEdit = record.createdBy === profile?.id || isSuperUser;
        return (
          <Space size="small">
            {canEdit && (
              <Tooltip title="Share">
                <Button
                  size="small"
                  icon={<ShareAltOutlined />}
                  onClick={() => setShareEntry(record)}
                />
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip title="Edit">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEditModal(record)}
                />
              </Tooltip>
            )}
            {isSuperUser && (
              <Tooltip title="View Change History">
                <Button
                  size="small"
                  icon={<HistoryOutlined />}
                  onClick={() => setHistoryEntry(record)}
                />
              </Tooltip>
            )}
            {isSuperUser && (
              <Popconfirm
                title="Delete this number?"
                description="This action cannot be undone."
                onConfirm={() => handleDelete(record.id)}
                okText="Delete"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Delete (Super User only)">
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const clientColumns: PowerTableColumn<PhonebookClientContact>[] = [
    {
      key: "name",
      title: "Client Name",
      dataIndex: "name",
      searchable: true,
      defaultWidth: 240,
      render: (_val, record) => (
        <div>
          <div className="font-medium text-slate-900">{record.name}</div>
          {record.shortName && (
            <div className="text-xs text-slate-500">{record.shortName}</div>
          )}
        </div>
      ),
    },
    {
      key: "contactPerson",
      title: "Contact Person",
      dataIndex: "contactPerson",
      searchable: true,
      defaultWidth: 200,
      render: (_val, record) => (
        <div>
          <div className="font-medium text-slate-800">
            {record.contactPerson || "—"}
          </div>
          {record.contactPersonDesignation && (
            <div className="text-xs text-slate-500">
              {record.contactPersonDesignation}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "contactPersonPhone",
      title: "Contact Number",
      dataIndex: "contactPersonPhone",
      searchable: true,
      defaultWidth: 180,
      render: (_val, record) =>
        record.contactPersonPhone ? (
          <a
            href={`tel:${record.contactPersonPhone}`}
            className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
          >
            <PhoneOutlined className="text-xs" />
            {record.contactPersonPhone}
          </a>
        ) : (
          <Text type="secondary" className="text-xs">
            Not available
          </Text>
        ),
    },
    {
      key: "activeProjects",
      title: "Active Projects (Current FY)",
      defaultWidth: 260,
      render: (_val, record) =>
        record.activeProjects && record.activeProjects.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {record.activeProjects.map((proj, idx) => (
              <Tag key={`${record.id}-proj-${idx}`} color="geekblue" className="m-0">
                {proj}
              </Tag>
            ))}
          </div>
        ) : (
          <Text type="secondary" className="text-xs">
            —
          </Text>
        ),
    },
  ];

  const renderOtherMobileCard = (record: PhonebookEntry) => {
    const canEdit = record.createdBy === profile?.id || isSuperUser;
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold text-slate-900">{record.name}</div>
            <a
              href={`tel:${record.phoneNumber}`}
              className="text-blue-600 text-sm font-medium inline-flex items-center gap-1"
            >
              <PhoneOutlined /> {record.phoneNumber}
            </a>
          </div>
          {record.category && <Tag color="blue">{record.category.name}</Tag>}
        </div>
        {record.notes && (
          <div className="text-xs text-slate-500">{record.notes}</div>
        )}
        <div className="text-xs text-slate-400 flex flex-wrap justify-between gap-1">
          <span>Created: {record.creator?.name || "System"}</span>
          <span>Updated: {dayjs(record.updatedAt).format("YYYY-MM-DD")}</span>
        </div>
        <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
          {canEdit && (
            <Button
              size="small"
              icon={<ShareAltOutlined />}
              onClick={() => setShareEntry(record)}
            >
              Share
            </Button>
          )}
          {canEdit && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            >
              Edit
            </Button>
          )}
          {isSuperUser && (
            <Button
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => setHistoryEntry(record)}
            >
              History
            </Button>
          )}
          {isSuperUser && (
            <Popconfirm
              title="Delete this number?"
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>
    );
  };

  const renderClientMobileCard = (record: PhonebookClientContact) => (
    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
      <div className="font-semibold text-slate-900">{record.name}</div>
      <div className="text-sm text-slate-700">
        {record.contactPerson || "No contact person"}
        {record.contactPersonDesignation
          ? ` (${record.contactPersonDesignation})`
          : ""}
      </div>
      {record.contactPersonPhone ? (
        <a
          href={`tel:${record.contactPersonPhone}`}
          className="text-blue-600 text-sm font-medium inline-flex items-center gap-1"
        >
          <PhoneOutlined /> {record.contactPersonPhone}
        </a>
      ) : (
        <Text type="secondary" className="text-xs">
          No phone number
        </Text>
      )}
      {record.activeProjects?.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {record.activeProjects.map((p, i) => (
            <Tag key={i} color="geekblue" className="m-0 text-xs">
              {p}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );

  const tabItems = visibleTabs.map((tab) => {
    if (tab.kind === "clients") {
      return {
        key: tab.key,
        label: (
          <span className="inline-flex items-center gap-1.5">
            <BankOutlined />
            {tab.label} ({filteredClients.length})
          </span>
        ),
        children: (
          <PowerTable<PhonebookClientContact>
            dataSource={filteredClients}
            columns={clientColumns}
            rowKey="id"
            loading={clientsLoading}
            enableResize
            enableColumnSearch
            visibleColumnKeys={clientVisibleKeys}
            showToolbar={false}
            persistenceKey="phonebook_clients"
            pagination={isMobile ? false : { pageSize: 15 }}
            renderMobileCard={renderClientMobileCard}
            emptyTitle="No client contacts available"
            emptyDescription="No active client projects found for you in this fiscal year."
          />
        ),
      };
    }

    const tabEntries = getEntriesForTab(tab.key);
    return {
      key: tab.key,
      label: (
        <span className="inline-flex items-center gap-1.5">
          <PhoneOutlined />
          {tab.label} ({tabEntries.length})
        </span>
      ),
      children: (
        <PowerTable<PhonebookEntry>
          dataSource={tabEntries}
          columns={otherColumns}
          rowKey="id"
          loading={entriesLoading}
          enableResize
          enableColumnSearch
          visibleColumnKeys={otherVisibleKeys}
          showToolbar={false}
          persistenceKey={`phonebook_${tab.key}`}
          pagination={isMobile ? false : { pageSize: 15 }}
          renderMobileCard={renderOtherMobileCard}
          emptyTitle="No phonebook numbers found"
          emptyDescription="Add a new number or adjust your filters."
        />
      ),
    };
  });

  const tabCustomizerContent = (
    <div className="w-72 space-y-2">
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <Text strong className="text-xs uppercase text-slate-500">
          Display & Order Tabs
        </Text>
        <Button type="link" size="small" onClick={resetTabPrefs} className="p-0 h-auto">
          Reset
        </Button>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {orderedTabs.map((tab, idx) => {
          const isVisible = !tabPrefs.hidden.includes(tab.key);
          return (
            <div
              key={tab.key}
              className="flex items-center justify-between gap-2 px-1 py-1 rounded hover:bg-slate-50"
            >
              <Checkbox
                checked={isVisible}
                onChange={() => toggleTabVisibility(tab.key)}
              >
                <span className="text-sm">{tab.label}</span>
              </Checkbox>
              <Space size={2}>
                <Button
                  size="small"
                  type="text"
                  icon={<ArrowUpOutlined className="text-xs" />}
                  disabled={idx === 0}
                  onClick={() => moveTabOrder(tab.key, "up")}
                />
                <Button
                  size="small"
                  type="text"
                  icon={<ArrowDownOutlined className="text-xs" />}
                  disabled={idx === orderedTabs.length - 1}
                  onClick={() => moveTabOrder(tab.key, "down")}
                />
              </Space>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <Card styles={{ body: { padding: isMobile ? "10px" : "14px 16px" } }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <Input
              placeholder="Search by name, phone number, category..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              className="sm:max-w-xs"
            />
            {activeTab !== "clients" && (
              <Select
                value={sharingFilter}
                onChange={(val) => setSharingFilter(val)}
                className="sm:w-40"
                options={[
                  { label: "All Visibility", value: "all" },
                  { label: "Shared Only", value: "shared" },
                  { label: "Private Only", value: "private" },
                ]}
              />
            )}
          </div>

          <Space>
            <Popover
              content={tabCustomizerContent}
              trigger="click"
              placement="bottomRight"
            >
              <Button icon={<SettingOutlined />}>Tabs</Button>
            </Popover>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Add Number
            </Button>
          </Space>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      <PhonebookEntryModal
        open={modalOpen}
        editingEntry={editingEntry}
        onClose={() => {
          setModalOpen(false);
          setEditingEntry(null);
        }}
      />

      <PhonebookShareModal
        open={Boolean(shareEntry)}
        entry={shareEntry}
        onClose={() => setShareEntry(null)}
      />

      {isSuperUser && (
        <PhonebookHistoryModal
          open={Boolean(historyEntry)}
          entry={historyEntry}
          onClose={() => setHistoryEntry(null)}
        />
      )}
    </div>
  );
};

export default PhonebookPage;
