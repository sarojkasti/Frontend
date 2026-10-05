import React, { useState } from "react";
import {
  Table,
  Tag,
  Select,
  Space,
  Button,
  Popconfirm,
  Modal,
  Input,
  Alert,
  message,
} from "antd";
import { MessageOutlined } from "@ant-design/icons";
import { PowerTable, PowerTableColumn, useColumnVisibility } from "@/components/Table";
import type { ColumnsType } from "antd/es/table";
import { useQueryClient } from "@tanstack/react-query";
import { useMyLeaves } from "../../../hooks/leave/useMyLeaves";
import { useDeleteLeave } from "../../../hooks/leave/useLeave";
import { respondLeaveClarification } from "../../../service/leave.service";
import { useDateSystem } from "../../../context/DateSystemContext";
import { formatLeaveRange, formatLeaveDate, inclusiveDays } from "../../../utils/leaveDate";
import { leaveColor, statusMeta } from "./leaveMeta";
import type { LeaveType } from "../../../types/leave";

const MY_REQUESTS_COLUMNS = [
  { key: "type", label: "Type", required: true },
  { key: "dates", label: "Dates" },
  { key: "days", label: "Days" },
  { key: "approver", label: "Approver" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Requested" },
  { key: "actions", label: "Actions", required: true },
];

const { TextArea } = Input;

const MyRequestsTable: React.FC = () => {
  const { system } = useDateSystem();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const { data, isLoading } = useMyLeaves(status);
  const del = useDeleteLeave();
  const { visibleColumnKeys, columnCustomizer } = useColumnVisibility({
    persistenceKey: "leave_my_requests_table",
    columns: MY_REQUESTS_COLUMNS,
    size: "middle",
  });

  // Clarification Response Modal State
  const [respondTarget, setRespondTarget] = useState<LeaveType | null>(null);
  const [responseText, setResponseText] = useState<string>("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState<boolean>(false);

  const rows: LeaveType[] = Array.isArray(data) ? data : [];

  const handleRespondClarification = async () => {
    if (!respondTarget || !responseText.trim()) {
      message.error("Please enter your response");
      return;
    }

    try {
      setIsSubmittingResponse(true);
      await respondLeaveClarification(respondTarget.id, responseText.trim());
      message.success("Response submitted to approver");
      setRespondTarget(null);
      setResponseText("");
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] });
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to submit response");
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const columns: PowerTableColumn<LeaveType>[] = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      defaultWidth: 160,
      render: (_, r) => {
        const name = r.leaveType?.name ?? r.type;
        return (
          <Space size={8}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: leaveColor(name),
              }}
            />
            {name}
            {r.isFractional && (
              <Tag color="cyan">
                {r.fractionalType === "first_half"
                  ? "First Half"
                  : "Second Half"}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Dates",
      key: "dates",
      defaultWidth: 200,
      render: (_, r) =>
        r.isCustomDates && r.customDates?.length
          ? `${r.customDates.length} days`
          : formatLeaveRange(r.startDate, r.endDate, system),
    },
    {
      title: "Days",
      key: "days",
      defaultWidth: 100,
      align: "right",
      render: (_, r) => {
        if (r.isFractional) return r.fractionalDuration || 0.5;
        if (r.isCustomDates && r.customDates?.length) return r.customDates.length;
        return inclusiveDays(r.startDate, r.endDate);
      },
    },
    {
      title: "Approver",
      key: "approver",
      defaultWidth: 160,
      render: (_, r) => r.requestedManager?.name ?? "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      defaultWidth: 150,
      render: (s: string) => {
        const m = statusMeta(s);
        return <Tag color={m.color}>{m.text}</Tag>;
      },
    },
    {
      title: "Requested",
      dataIndex: "createdAt",
      key: "createdAt",
      defaultWidth: 140,
      render: (d: string) => formatLeaveDate(d, system, false),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      defaultWidth: 140,
      required: true,
      fixed: "right",
      align: "right",
      render: (_, r) => (
        <Space size={4}>
          {r.status === "clarification_requested" && (
            <Button
              type="primary"
              size="small"
              icon={<MessageOutlined />}
              onClick={() => {
                setRespondTarget(r);
                setResponseText(r.clarificationResponse || "");
              }}
            >
              Respond
            </Button>
          )}

          {["pending", "clarification_requested", "approved_by_manager"].includes(
            r.status
          ) ? (
            <Popconfirm
              title="Cancel this request?"
              okButtonProps={{ danger: true }}
              onConfirm={() =>
                del.mutate(r.id, {
                  onSuccess: () => message.success("Request cancelled"),
                  onError: (e: any) =>
                    message.error(e?.response?.data?.message || "Could not cancel"),
                })
              }
            >
              <Button type="link" danger size="small">
                Cancel
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Select
          value={status}
          style={{ width: 180 }}
          onChange={setStatus}
          options={[
            { value: "all", label: "All statuses" },
            { value: "pending", label: "Pending" },
            { value: "clarification_requested", label: "Clarification Needed" },
            { value: "approved_by_manager", label: "Manager Approved" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
        {columnCustomizer}
      </div>
      <PowerTable<LeaveType>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={rows}
        enableResize
        enableColumnSearch
        showToolbar={false}
        visibleColumnKeys={visibleColumnKeys}
        persistenceKey="leave_my_requests_table"
        pagination={{ pageSize: 8, hideOnSinglePage: true }}
        expandable={{
          expandedRowRender: (r) => (
            <div style={{ padding: "8px 12px", background: "#fcfcfc", borderRadius: 6 }}>
              {r.reason && (
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Reason: </span>
                  <span>{r.reason}</span>
                </div>
              )}
              {r.clarificationNotes && (
                <Alert
                  type="warning"
                  showIcon
                  message={
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        Approver Question ({r.clarificationRequestedBy?.name || "Manager"}):
                      </div>
                      <div>{r.clarificationNotes}</div>
                      {r.clarificationResponse && (
                        <div
                          style={{
                            marginTop: 6,
                            paddingTop: 6,
                            borderTop: "1px dashed #d9d9d9",
                          }}
                        >
                          <span style={{ fontWeight: 600, color: "#1890ff" }}>
                            Your Response:
                          </span>{" "}
                          {r.clarificationResponse}
                        </div>
                      )}
                    </div>
                  }
                />
              )}
            </div>
          ),
          rowExpandable: (r) => !!r.reason || !!r.clarificationNotes,
        }}
      />

      {/* Response Modal */}
      <Modal
        title="Respond to Leave Clarification"
        open={!!respondTarget}
        onCancel={() => {
          setRespondTarget(null);
          setResponseText("");
        }}
        onOk={handleRespondClarification}
        okText="Submit Response"
        confirmLoading={isSubmittingResponse}
        destroyOnClose
      >
        <div style={{ marginBottom: 12 }}>
          <Alert
            type="info"
            message={
              <div>
                <div style={{ fontWeight: 600 }}>Approver Question:</div>
                <div>{respondTarget?.clarificationNotes}</div>
              </div>
            }
          />
        </div>
        <p style={{ fontWeight: 500, marginBottom: 6 }}>Your Explanation / Response:</p>
        <TextArea
          rows={4}
          placeholder="Provide the requested information here..."
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default MyRequestsTable;
