import React, { useState, useEffect } from "react";
import { Modal, Table, Radio, Input, Button, Space, Tag } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { useMarkAttendance } from "@/hooks/training/useTraining";
import { fetchSessionAttendance } from "@/service/training.service";
import { TrainingBatch, TrainingSession } from "@/types/training";

interface AttendanceModalProps {
  batch: TrainingBatch | null;
  session: TrainingSession | null;
  open: boolean;
  onCancel: () => void;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ batch, session, open, onCancel }) => {
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, { status: "present" | "absent" | "excused" | "late"; remarks?: string }>
  >({});
  const [loading, setLoading] = useState(false);

  const { mutate: markAttendance, isPending } = useMarkAttendance();

  useEffect(() => {
    if (session?.id && open) {
      setLoading(true);
      fetchSessionAttendance(session.id)
        .then((existing) => {
          const map: Record<string, any> = {};
          // Initialize from existing
          existing.forEach((att) => {
            if (att.user?.id) {
              map[att.user.id] = { status: att.status, remarks: att.remarks };
            }
          });
          // For any enrolled without record, default to present
          batch?.enrollments?.forEach((e) => {
            if (e.user?.id && !map[e.user.id]) {
              map[e.user.id] = { status: "present", remarks: "" };
            }
          });
          setAttendanceRecords(map);
        })
        .finally(() => setLoading(false));
    }
  }, [session, batch, open]);

  const handleStatusChange = (userId: string, status: any) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], status },
    }));
  };

  const handleRemarksChange = (userId: string, remarks: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], remarks },
    }));
  };

  const handleMarkAllPresent = () => {
    const next: Record<string, any> = {};
    batch?.enrollments?.forEach((e) => {
      if (e.user?.id) {
        next[e.user.id] = { ...attendanceRecords[e.user.id], status: "present" };
      }
    });
    setAttendanceRecords(next);
  };

  const handleSave = () => {
    if (!session?.id) return;
    const records = Object.entries(attendanceRecords).map(([userId, data]) => ({
      userId,
      status: data.status,
      remarks: data.remarks,
    }));

    markAttendance(
      { sessionId: session.id, records },
      {
        onSuccess: () => onCancel(),
      }
    );
  };

  const columns = [
    {
      title: "Participant",
      key: "user",
      render: (_: any, record: any) => (
        <div>
          <div className="font-medium text-gray-800">{record.user?.name || record.user?.username}</div>
          <div className="text-xs text-gray-500">{record.user?.email}</div>
        </div>
      ),
    },
    {
      title: "Role",
      key: "role",
      render: (_: any, record: any) => (
        <Tag color="blue">{record.user?.role?.displayName || record.user?.role?.name || "Staff"}</Tag>
      ),
    },
    {
      title: "Attendance Status",
      key: "status",
      render: (_: any, record: any) => {
        const userId = record.user?.id;
        const current = attendanceRecords[userId]?.status || "present";
        return (
          <Radio.Group
            value={current}
            onChange={(e) => handleStatusChange(userId, e.target.value)}
            size="small"
          >
            <Radio.Button value="present" className="text-green-600">Present</Radio.Button>
            <Radio.Button value="absent" className="text-red-600">Absent</Radio.Button>
            <Radio.Button value="late" className="text-yellow-600">Late</Radio.Button>
            <Radio.Button value="excused" className="text-gray-500">Excused</Radio.Button>
          </Radio.Group>
        );
      },
    },
    {
      title: "Remarks",
      key: "remarks",
      render: (_: any, record: any) => {
        const userId = record.user?.id;
        const current = attendanceRecords[userId]?.remarks || "";
        return (
          <Input
            size="small"
            placeholder="Notes..."
            value={current}
            onChange={(e) => handleRemarksChange(userId, e.target.value)}
          />
        );
      },
    },
  ];

  return (
    <Modal
      title={
        <div className="flex justify-between items-center pr-6">
          <span>
            Mark Attendance: {session?.title} ({session?.date})
          </span>
          <Button size="small" type="primary" ghost icon={<CheckOutlined />} onClick={handleMarkAllPresent}>
            Mark All Present
          </Button>
        </div>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleSave}
      confirmLoading={isPending}
      width={780}
      centered
      styles={{
        body: {
          overflowX: "hidden",
          overflowY: "auto",
          maxHeight: "calc(85vh - 100px)",
        },
      }}
      destroyOnClose
    >
      <Table
        dataSource={batch?.enrollments || []}
        columns={columns}
        rowKey={(e) => e.user?.id || e.id}
        loading={loading}
        pagination={false}
        size="small"
      />
    </Modal>
  );
};

export default AttendanceModal;
