import React, { useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Progress,
  Tooltip,
  Modal,
  Drawer,
  Badge,
} from "antd";
import {
  UserAddOutlined,
  CheckSquareOutlined,
  EyeOutlined,
  VideoCameraOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useTrainingBatches, useEnrollSelf, useCompleteEnrollment } from "@/hooks/training/useTraining";
import { useSession } from "@/context/SessionContext";
import { TrainingBatch, TrainingSession } from "@/types/training";
import NominateModal from "./NominateModal";
import AttendanceModal from "./AttendanceModal";

const BatchSchedule: React.FC = () => {
  const { data: batches, isLoading } = useTrainingBatches();
  const { profile } = useSession();
  const { mutate: enrollSelf, isPending: isEnrolling } = useEnrollSelf();
  const { mutate: completeEnrollment, isPending: isCompleting } = useCompleteEnrollment();

  const [nominateBatch, setNominateBatch] = useState<TrainingBatch | null>(null);
  const [selectedBatchForDetails, setSelectedBatchForDetails] = useState<TrainingBatch | null>(null);
  const [attendanceSession, setAttendanceSession] = useState<{ batch: TrainingBatch; session: TrainingSession } | null>(null);

  const currentUserId = profile?.id;
  const isManagerOrAdmin =
    profile?.role?.name?.toLowerCase() === "superuser" ||
    profile?.role?.name?.toLowerCase() === "administrator" ||
    profile?.role?.name?.toLowerCase() === "projectmanager";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "blue";
      case "in_progress":
        return "orange";
      case "completed":
        return "green";
      case "cancelled":
        return "red";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Batch Name & Course",
      key: "name",
      render: (_: any, record: TrainingBatch) => (
        <div>
          <div className="font-semibold text-gray-800">{record.batchName}</div>
          <div className="text-xs text-blue-600 font-medium">
            {record.course?.code} - {record.course?.title}
          </div>
        </div>
      ),
    },
    {
      title: "Dates (BS / AD)",
      key: "dates",
      render: (_: any, record: TrainingBatch) => (
        <div className="text-xs">
          <div className="font-medium text-gray-800">
            🇳🇵 {record.startDateNepali || record.startDate} to {record.endDateNepali || record.endDate}
          </div>
          <div className="text-gray-400">
            AD: {record.startDate} ~ {record.endDate}
          </div>
        </div>
      ),
    },
    {
      title: "Mode & Venue",
      key: "mode",
      render: (_: any, record: TrainingBatch) => (
        <div className="text-xs">
          <Tag color={record.deliveryMode === "virtual" ? "purple" : "cyan"} className="capitalize">
            {record.deliveryMode === "virtual" ? <VideoCameraOutlined /> : <EnvironmentOutlined />}{" "}
            {record.deliveryMode.replace("_", " ")}
          </Tag>
          {record.venueOrLink && (
            <div className="text-gray-500 mt-1 max-w-xs truncate" title={record.venueOrLink}>
              {record.venueOrLink}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Trainer",
      key: "trainer",
      render: (_: any, record: TrainingBatch) => {
        if (record.internalTrainer) {
          return (
            <div className="text-xs">
              <span className="font-medium text-gray-800">{record.internalTrainer.name}</span>
              <span className="text-gray-400 block">Internal Trainer</span>
            </div>
          );
        }
        if (record.externalTrainerName) {
          return (
            <div className="text-xs">
              <span className="font-medium text-gray-800">{record.externalTrainerName}</span>
              <span className="text-gray-400 block">{record.externalTrainerOrg || "External Expert"}</span>
            </div>
          );
        }
        return <span className="text-xs text-gray-400">TBD</span>;
      },
    },
    {
      title: "Enrolled / Capacity",
      key: "capacity",
      render: (_: any, record: TrainingBatch) => {
        const count = record.enrollments?.length || 0;
        const max = record.maxCapacity || 30;
        const percent = Math.min(100, Math.round((count / max) * 100));
        return (
          <div style={{ width: 120 }}>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{count} enrolled</span>
              <span>{max} max</span>
            </div>
            <Progress percent={percent} size="small" showInfo={false} strokeColor={percent >= 100 ? "#ff4d4f" : "#1890ff"} />
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="capitalize font-medium">
          {status.replace("_", " ")}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: TrainingBatch) => {
        const isEnrolled = record.enrollments?.some((e) => e.user?.id === currentUserId);
        return (
          <Space orientation="horizontal" size="small">
            <Tooltip title="View Batch Details & Sessions">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setSelectedBatchForDetails(record)}
              />
            </Tooltip>

            {isManagerOrAdmin && (
              <Tooltip title="Nominate Team Members">
                <Button
                  size="small"
                  icon={<UserAddOutlined />}
                  onClick={() => setNominateBatch(record)}
                >
                  Nominate
                </Button>
              </Tooltip>
            )}

            {!isEnrolled && record.status === "scheduled" && (
              <Button
                size="small"
                type="primary"
                ghost
                loading={isEnrolling}
                onClick={() => enrollSelf(record.id)}
              >
                Enroll
              </Button>
            )}

            {isEnrolled && (
              <Tag color="success" className="m-0">
                Enrolled
              </Tag>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <Table
          dataSource={batches || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      {/* Nominate Staff Modal */}
      <NominateModal
        batch={nominateBatch}
        open={!!nominateBatch}
        onCancel={() => setNominateBatch(null)}
      />

      {/* Mark Attendance Modal */}
      <AttendanceModal
        batch={attendanceSession?.batch || null}
        session={attendanceSession?.session || null}
        open={!!attendanceSession}
        onCancel={() => setAttendanceSession(null)}
      />

      {/* Batch Details Drawer */}
      <Drawer
        title={selectedBatchForDetails?.batchName}
        open={!!selectedBatchForDetails}
        onClose={() => setSelectedBatchForDetails(null)}
        width={600}
      >
        {selectedBatchForDetails && (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-800 text-sm mb-2">Course Overview</h4>
              <div className="bg-gray-50 p-3 rounded border text-xs space-y-1">
                <div><span className="text-gray-500">Course:</span> <strong>{selectedBatchForDetails.course?.title}</strong></div>
                <div><span className="text-gray-500">Category:</span> {selectedBatchForDetails.course?.category}</div>
                <div><span className="text-gray-500">CPD Hours:</span> {selectedBatchForDetails.course?.cpdHours} Hours</div>
              </div>
            </div>

            {/* Sessions & Attendance */}
            <div>
              <h4 className="font-semibold text-gray-800 text-sm mb-2">Scheduled Sessions</h4>
              <div className="space-y-2">
                {(selectedBatchForDetails.sessions || []).map((session) => (
                  <div
                    key={session.id}
                    className="p-3 border rounded bg-white flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-bold text-gray-800">
                        Session {session.sessionNumber}: {session.title}
                      </div>
                      <div className="text-gray-500">
                        📅 {session.dateNepali || session.date} • ⏰ {session.startTime} - {session.endTime}
                      </div>
                    </div>
                    {isManagerOrAdmin && (
                      <Button
                        size="small"
                        icon={<CheckSquareOutlined />}
                        onClick={() =>
                          setAttendanceSession({
                            batch: selectedBatchForDetails,
                            session,
                          })
                        }
                      >
                        Attendance
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Enrolled Participants */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-800 text-sm">
                  Enrolled Participants ({selectedBatchForDetails.enrollments?.length || 0})
                </h4>
                {isManagerOrAdmin && (
                  <Button size="small" type="primary" ghost icon={<UserAddOutlined />} onClick={() => setNominateBatch(selectedBatchForDetails)}>
                    Add
                  </Button>
                )}
              </div>
              <div className="divide-y border rounded bg-white text-xs max-h-56 overflow-y-auto">
                {(selectedBatchForDetails.enrollments || []).map((enr) => (
                  <div key={enr.id} className="p-2 flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-800">{enr.user?.name || enr.user?.email}</span>
                      <span className="text-gray-400 block text-[11px]">{enr.user?.role?.displayName || enr.user?.role?.name} • {enr.enrollmentType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag color={enr.status === "completed" ? "green" : enr.status === "waitlisted" ? "orange" : "blue"}>
                        {enr.status}
                      </Tag>
                      {isManagerOrAdmin && enr.status !== "completed" && (
                        <Button
                          size="small"
                          type="link"
                          icon={<TrophyOutlined />}
                          loading={isCompleting}
                          onClick={() => completeEnrollment(enr.id)}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default BatchSchedule;
