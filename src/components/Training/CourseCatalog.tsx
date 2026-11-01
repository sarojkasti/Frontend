import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Tag,
  Button,
  Badge,
  Spin,
  Empty,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useTrainingCourses, useEnrollSelf } from "@/hooks/training/useTraining";
import { useSession } from "@/context/SessionContext";
import { TrainingCourse } from "@/types/training";
import CreateCourseModal from "./CreateCourseModal";
import CreateBatchModal from "./CreateBatchModal";

const { Search } = Input;

const CourseCatalog: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isScheduleBatchOpen, setIsScheduleBatchOpen] = useState(false);
  const [selectedCourseForBatch, setSelectedCourseForBatch] = useState<string | undefined>(undefined);

  const { profile } = useSession();
  const isAdmin =
    profile?.role?.name?.toLowerCase() === "superuser" ||
    profile?.role?.name?.toLowerCase() === "administrator" ||
    profile?.role?.name?.toLowerCase() === "projectmanager";

  const { data: courses, isLoading } = useTrainingCourses({
    category: categoryFilter,
    search: searchQuery,
  });

  const { mutate: enrollSelf, isPending: isEnrolling } = useEnrollSelf();

  const handleOpenSchedule = (courseId: string) => {
    setSelectedCourseForBatch(courseId);
    setIsScheduleBatchOpen(true);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "green";
      case "intermediate":
        return "blue";
      case "advanced":
        return "purple";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-3">
          <Search
            placeholder="Search by title, code or topic..."
            allowClear
            onSearch={(val) => setSearchQuery(val)}
            onChange={(e) => !e.target.value && setSearchQuery("")}
            style={{ width: 280 }}
            prefix={<SearchOutlined className="text-gray-400" />}
          />
          <Select
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v)}
            style={{ width: 200 }}
            options={[
              { value: "all", label: "All Categories" },
              { value: "Audit", label: "Audit & Assurance" },
              { value: "Taxation", label: "Taxation & VAT" },
              { value: "NFRS/NAS", label: "NFRS / NAS Standards" },
              { value: "Compliance", label: "Compliance & Ethics" },
              { value: "Tools/Excel", label: "Tools & Excel" },
              { value: "Soft Skills", label: "Soft Skills" },
            ]}
          />
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateCourseOpen(true)}
            >
              Add New Course
            </Button>
            <Button
              icon={<CalendarOutlined />}
              onClick={() => {
                setSelectedCourseForBatch(undefined);
                setIsScheduleBatchOpen(true);
              }}
            >
              Schedule Batch
            </Button>
          </div>
        )}
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="text-center py-16">
          <Spin size="large" tip="Loading training catalog..." />
        </div>
      ) : !courses || courses.length === 0 ? (
        <div className="bg-white p-12 rounded-lg text-center border">
          <Empty description="No training courses found matching criteria" />
          {isAdmin && (
            <Button
              type="primary"
              className="mt-4"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateCourseOpen(true)}
            >
              Create First Course
            </Button>
          )}
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {courses.map((course: TrainingCourse) => {
            const activeBatches = (course.batches || []).filter(
              (b) => b.status === "scheduled" || b.status === "in_progress"
            );

            return (
              <Col xs={24} sm={12} lg={8} key={course.id}>
                <Card
                  hoverable
                  className="h-full flex flex-col justify-between border-t-4 border-t-blue-600 rounded-lg shadow-sm"
                  bodyStyle={{ display: "flex", flexDirection: "column", height: "100%", padding: 16 }}
                >
                  <div>
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <Tag color="cyan" className="font-semibold">
                        {course.code}
                      </Tag>
                      <div className="flex items-center gap-1">
                        {course.isMandatory && <Tag color="volcano">Mandatory</Tag>}
                        <Tag color={getLevelColor(course.level)} className="capitalize">
                          {course.level}
                        </Tag>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-base text-gray-800 line-clamp-2 mb-1" title={course.title}>
                      {course.title}
                    </h3>

                    {/* Category */}
                    <div className="text-xs text-blue-600 font-medium mb-3">
                      📂 {course.category}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-600 line-clamp-3 mb-4 min-h-[48px]">
                      {course.description || "No description provided."}
                    </p>

                    {/* Meta info */}
                    <div className="flex items-center justify-between text-xs text-gray-500 py-2 border-t border-b border-gray-100 mb-3">
                      <span className="flex items-center gap-1">
                        <ClockCircleOutlined /> {course.durationMinutes} mins
                      </span>
                      <span className="font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                        🏆 {course.cpdHours} CPD Hours
                      </span>
                    </div>

                    {/* Available Batches */}
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                        <span>Upcoming Batches:</span>
                        <Badge count={activeBatches.length} style={{ backgroundColor: "#108ee9" }} />
                      </div>
                      {activeBatches.length === 0 ? (
                        <div className="text-xs text-gray-400 italic bg-gray-50 p-2 rounded">
                          No active batches currently scheduled.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {activeBatches.map((b) => (
                            <div
                              key={b.id}
                              className="text-xs bg-blue-50/50 p-2 rounded border border-blue-100 flex items-center justify-between"
                            >
                              <div>
                                <div className="font-medium text-gray-800">{b.batchName}</div>
                                <div className="text-gray-500 text-[11px]">
                                  📅 {b.startDateNepali || b.startDate} • {b.deliveryMode}
                                </div>
                              </div>
                              <Button
                                size="small"
                                type="primary"
                                ghost
                                loading={isEnrolling}
                                onClick={() => enrollSelf(b.id)}
                              >
                                Enroll
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  {isAdmin && (
                    <div className="pt-2 border-t flex justify-end">
                      <Button
                        size="small"
                        icon={<CalendarOutlined />}
                        onClick={() => handleOpenSchedule(course.id)}
                      >
                        Schedule Batch
                      </Button>
                    </div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Modals */}
      <CreateCourseModal
        open={isCreateCourseOpen}
        onCancel={() => setIsCreateCourseOpen(false)}
      />

      <CreateBatchModal
        open={isScheduleBatchOpen}
        onCancel={() => {
          setIsScheduleBatchOpen(false);
          setSelectedCourseForBatch(undefined);
        }}
        defaultCourseId={selectedCourseForBatch}
      />
    </div>
  );
};

export default CourseCatalog;
