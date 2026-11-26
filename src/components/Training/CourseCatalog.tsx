import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Tag,
  Button,
  Spin,
  Empty,
  Progress,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  TeamOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  useTrainingCourses,
  useTrainingCategories,
  useMyCourseEnrollments,
  useSelfEnrollCourse,
} from "@/hooks/training/useTraining";
import { useSession } from "@/context/SessionContext";
import { TrainingCourse } from "@/types/training";
import CreateCourseModal from "./CreateCourseModal";
import CourseBuilderModal from "./CourseBuilderModal";
import CourseEnrollModal from "./CourseEnrollModal";

interface CourseCatalogProps {
  mode?: "studio" | "student";
}

const CourseCatalog: React.FC<CourseCatalogProps> = ({ mode = "studio" }) => {
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [builderCourse, setBuilderCourse] = useState<TrainingCourse | null>(null);
  const [enrollCourse, setEnrollCourse] = useState<TrainingCourse | null>(null);

  const { profile } = useSession();
  const roleName = (profile?.role?.name || "").toLowerCase().trim();
  const isAdmin = ["superuser", "superadmin", "administrator", "admin"].includes(roleName);
  const isTeacher = isAdmin || ["manager", "projectmanager"].includes(roleName);

  const { data: courses = [], isLoading } = useTrainingCourses({
    category: categoryFilter,
    search: searchQuery,
  });
  const { data: categories = [] } = useTrainingCategories();
  const { data: myCourseEnrollments = [] } = useMyCourseEnrollments();
  const { mutate: selfEnrollCourse, isPending: isSelfEnrollingCourse } =
    useSelfEnrollCourse();

  const enrollmentByCourseId = new Map(
    myCourseEnrollments
      .filter((e: any) => e.courseId || e.course?.id)
      .map((e: any) => [e.courseId || e.course?.id, e])
  );

  // In student mode, show enrolled courses + open self-enrollment courses
  const visibleCourses =
    mode === "student"
      ? courses.filter(
          (c) => enrollmentByCourseId.has(c.id) || c.allowSelfEnrollment
        )
      : courses;

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
    <div className="space-y-3">
      {/* Compact Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <Input
            placeholder="Search by title, code or description..."
            prefix={<SearchOutlined className="text-slate-400" />}
            allowClear
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v)}
            className="sm:w-52"
            options={[
              { value: "all", label: "All Categories" },
              ...categories.map((c) => ({ value: c.name, label: c.name })),
            ]}
          />
        </div>

        {mode === "studio" && isTeacher && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateCourseOpen(true)}
          >
            Create Course
          </Button>
        )}
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <Spin size="large" tip="Loading courses..." />
        </div>
      ) : visibleCourses.length === 0 ? (
        <Empty
          description={
            mode === "student"
              ? "No enrolled or open courses available yet."
              : "No courses found. Create your first self-paced course!"
          }
          className="py-10"
        >
          {mode === "studio" && isTeacher && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateCourseOpen(true)}
            >
              Create First Course
            </Button>
          )}
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {visibleCourses.map((course: TrainingCourse) => {
            const myEnrollment = enrollmentByCourseId.get(course.id);
            const moduleCount = course.modules?.length || 0;

            return (
              <Col xs={24} sm={12} lg={8} key={course.id}>
                <Card
                  hoverable
                  className="h-full flex flex-col justify-between border-t-4 border-t-blue-600 rounded-lg"
                  styles={{
                    body: {
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      padding: 16,
                    },
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <Tag color="cyan" className="font-semibold m-0">
                        {course.code}
                      </Tag>
                      <div className="flex items-center gap-1">
                        {course.strictSystemOnly && (
                          <Tag icon={<LockOutlined />} color="default" className="m-0 text-[11px]">
                            System Only
                          </Tag>
                        )}
                        <Tag color={getLevelColor(course.level)} className="capitalize m-0">
                          {course.level}
                        </Tag>
                      </div>
                    </div>

                    <h3
                      className="font-semibold text-base text-slate-900 line-clamp-2 mb-1"
                      title={course.title}
                    >
                      {course.title}
                    </h3>

                    <div className="text-xs text-blue-600 font-medium mb-2">
                      {course.category}
                      {course.instructor?.name ? ` • ${course.instructor.name}` : ""}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 mb-3 min-h-[44px]">
                      {course.description || "No description provided."}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 py-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <ClockCircleOutlined /> {course.durationMinutes} mins
                      </span>
                      <span>{moduleCount} module(s)</span>
                      {course.accessPolicy && course.accessPolicy.mode !== "always" && (
                        <Tag color="orange" className="m-0 text-[11px]">
                          Timed Access
                        </Tag>
                      )}
                    </div>

                    {myEnrollment && (
                      <div className="mt-2 mb-2">
                        <Progress
                          percent={Math.round(Number(myEnrollment.progressPercent || 0))}
                          size="small"
                        />
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {(myEnrollment || (mode === "studio" && isTeacher)) && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={() => navigate(`/training/learn/${course.id}`)}
                        >
                          {myEnrollment
                            ? myEnrollment.status === "completed"
                              ? "Review"
                              : "Continue"
                            : "Preview"}
                        </Button>
                      )}
                      {!myEnrollment && course.allowSelfEnrollment && (
                        <Button
                          size="small"
                          type="primary"
                          ghost
                          loading={isSelfEnrollingCourse}
                          onClick={() => selfEnrollCourse(course.id)}
                        >
                          Enroll Now
                        </Button>
                      )}
                    </div>

                    {mode === "studio" && (
                      <div className="flex flex-wrap gap-1.5">
                        {isTeacher && (
                          <Button
                            size="small"
                            icon={<SettingOutlined />}
                            onClick={() => setBuilderCourse(course)}
                          >
                            Content & Timing
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            size="small"
                            icon={<TeamOutlined />}
                            onClick={() => setEnrollCourse(course)}
                          >
                            Enroll
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <CreateCourseModal
        open={isCreateCourseOpen}
        onCancel={() => setIsCreateCourseOpen(false)}
      />

      <CourseBuilderModal
        open={Boolean(builderCourse)}
        course={builderCourse}
        onClose={() => setBuilderCourse(null)}
      />

      <CourseEnrollModal
        open={Boolean(enrollCourse)}
        course={enrollCourse}
        onClose={() => setEnrollCourse(null)}
      />
    </div>
  );
};

export default CourseCatalog;
