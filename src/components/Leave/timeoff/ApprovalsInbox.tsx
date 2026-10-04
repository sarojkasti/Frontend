import React, { useState } from "react";
import {
  Card,
  Avatar,
  Button,
  Space,
  Tag,
  Empty,
  Skeleton,
  Popconfirm,
  Modal,
  Input,
  Alert,
  message,
} from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { usePendingApprovals } from "../../../hooks/leave/usePendingApprovals";
import { useApproveLeave } from "../../../hooks/leave/useMyLeaves";
import { useRejectLeave } from "../../../hooks/leave/useLeave";
import { requestLeaveClarification } from "../../../service/leave.service";
import { useDateSystem } from "../../../context/DateSystemContext";
import { formatLeaveRange, inclusiveDays } from "../../../utils/leaveDate";
import { leaveColor, statusMeta } from "./leaveMeta";
import type { LeaveType } from "../../../types/leave";

const { TextArea } = Input;

const initials = (name?: string) =>
  (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const Fact: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    <span
      style={{
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: ".03em",
        color: "#8c9aa8",
      }}
    >
      {k}
    </span>
    <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{children}</span>
  </div>
);

const ApprovalsInbox: React.FC = () => {
  const { system } = useDateSystem();
  const queryClient = useQueryClient();
  const { data, isLoading } = usePendingApprovals();
  const approve = useApproveLeave();
  const reject = useRejectLeave();

  // Clarification Modal State
  const [clarificationTarget, setClarificationTarget] = useState<LeaveType | null>(null);
  const [clarificationNotes, setClarificationNotes] = useState<string>("");
  const [isSubmittingClarification, setIsSubmittingClarification] = useState<boolean>(false);

  const rows: LeaveType[] = Array.isArray(data) ? data : [];
  // Include requests that are pending, clarification, or approved_by_manager
  const actionable = rows.filter((r) =>
    ["pending", "clarification_requested", "approved_by_manager"].includes(r.status)
  );

  const handleRequestClarification = async () => {
    if (!clarificationTarget || !clarificationNotes.trim()) {
      message.error("Please provide the question or details you require");
      return;
    }

    try {
      setIsSubmittingClarification(true);
      await requestLeaveClarification(clarificationTarget.id, clarificationNotes.trim());
      message.success("Clarification requested from applicant");
      setClarificationTarget(null);
      setClarificationNotes("");
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to request clarification");
    } finally {
      setIsSubmittingClarification(false);
    }
  };

  if (isLoading) return <Skeleton active paragraph={{ rows: 4 }} />;
  if (!actionable.length)
    return <Empty description="Nothing waiting for your approval" style={{ padding: 32 }} />;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {actionable.map((r) => {
        const name = r.leaveType?.name ?? r.type;
        const days = r.isFractional
          ? r.fractionalDuration || 0.5
          : r.isCustomDates && r.customDates?.length
          ? r.customDates.length
          : inclusiveDays(r.startDate, r.endDate);
        const m = statusMeta(r.status);
        return (
          <Card key={r.id} size="small" styles={{ body: { padding: 16 } }}>
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <Space size={14} align="center" wrap>
                <Avatar style={{ background: leaveColor(name), flex: "0 0 auto" }}>
                  {initials(r.user?.name)}
                </Avatar>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontWeight: 600 }}>
                    {r.user?.name}{" "}
                    <span style={{ color: "#8c9aa8", fontWeight: 400 }}>
                      · {r.user?.role?.name}
                    </span>
                  </span>
                  <Space size={6}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: leaveColor(name),
                      }}
                    />
                    {name} · {formatLeaveRange(r.startDate, r.endDate, system)}
                    {r.isFractional && (
                      <Tag color="cyan">
                        {r.fractionalType === "first_half"
                          ? "First Half (Morning)"
                          : "Second Half (Afternoon)"}
                      </Tag>
                    )}
                  </Space>
                </div>
                <Fact k="Duration">
                  {days} day{days === 1 ? "" : "s"}
                </Fact>
                <Tag color={m.color}>{m.text}</Tag>
              </Space>

              <Space>
                <Button
                  icon={<QuestionCircleOutlined />}
                  onClick={() => {
                    setClarificationTarget(r);
                    setClarificationNotes(r.clarificationNotes || "");
                  }}
                >
                  Clarify
                </Button>
                <Popconfirm
                  title="Refuse this request?"
                  okButtonProps={{ danger: true }}
                  onConfirm={() =>
                    reject.mutate(
                      { id: r.id, userId: "" },
                      {
                        onSuccess: () => message.success("Request refused"),
                        onError: (e: any) =>
                          message.error(e?.response?.data?.message || "Could not refuse"),
                      }
                    )
                  }
                >
                  <Button danger>Refuse</Button>
                </Popconfirm>
                <Button
                  type="primary"
                  loading={approve.isPending}
                  onClick={() =>
                    approve.mutate(
                      { id: r.id },
                      {
                        onSuccess: () => message.success("Request approved"),
                        onError: (e: any) =>
                          message.error(e?.response?.data?.message || "Could not approve"),
                      }
                    )
                  }
                >
                  Approve
                </Button>
              </Space>
            </div>

            {/* Clarification notes / response thread */}
            {r.clarificationNotes && (
              <div style={{ marginTop: 12 }}>
                <Alert
                  type="warning"
                  showIcon
                  message={
                    <div>
                      <div style={{ fontWeight: 600 }}>Clarification Question:</div>
                      <div>{r.clarificationNotes}</div>
                      {r.clarificationResponse ? (
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px dashed #d9d9d9" }}>
                          <span style={{ fontWeight: 600, color: "#1890ff" }}>
                            Applicant Response:
                          </span>{" "}
                          {r.clarificationResponse}
                        </div>
                      ) : (
                        <div style={{ marginTop: 4, fontStyle: "italic", color: "#8c8c8c" }}>
                          Awaiting response from applicant...
                        </div>
                      )}
                    </div>
                  }
                />
              </div>
            )}
          </Card>
        );
      })}

      {/* Clarification Modal */}
      <Modal
        title={`Request Clarification — ${clarificationTarget?.user?.name}`}
        open={!!clarificationTarget}
        onCancel={() => {
          setClarificationTarget(null);
          setClarificationNotes("");
        }}
        onOk={handleRequestClarification}
        okText="Send Request"
        confirmLoading={isSubmittingClarification}
        destroyOnClose
      >
        <p style={{ color: "#666", marginBottom: 12 }}>
          Ask the applicant for additional details or explanations without rejecting their request.
        </p>
        <TextArea
          rows={4}
          placeholder="e.g. Please specify if you will have access to emails or who is covering your urgent deliverables..."
          value={clarificationNotes}
          onChange={(e) => setClarificationNotes(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default ApprovalsInbox;
