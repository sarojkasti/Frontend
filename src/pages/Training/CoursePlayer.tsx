import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Divider,
  Empty,
  Input,
  List,
  Progress,
  Radio,
  Result,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  LockOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/context/SessionContext";
import {
  useCoursePlayer,
  useLessonComments,
} from "@/hooks/training/useTraining";
import {
  createLessonComment,
  getLessonStreamUrl,
  submitQuizAttempt,
  updateLessonProgress,
} from "@/service/training.service";
import { TrainingLesson } from "@/types/training";

const { Title, Text } = Typography;

const CoursePlayerPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useSession();

  const { data, isLoading, error } = useCoursePlayer(courseId);

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[]>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedTimeRef = useRef<number>(0);

  const allLessons = useMemo(() => {
    return (data?.modules || []).flatMap((m) => m.lessons || []);
  }, [data?.modules]);

  useEffect(() => {
    if (!data || selectedLessonId) return;
    const preferredId = data.enrollment?.lastLessonId;
    const found = allLessons.find((l) => l.id === preferredId && !l.isLocked);
    const firstUnlocked = allLessons.find((l) => !l.isLocked);
    setSelectedLessonId(found?.id || firstUnlocked?.id || allLessons[0]?.id || null);
  }, [data, allLessons, selectedLessonId]);

  const activeLesson: TrainingLesson | undefined = useMemo(
    () => allLessons.find((l) => l.id === selectedLessonId),
    [allLessons, selectedLessonId]
  );

  const { data: comments = [], refetch: refetchComments } = useLessonComments(
    activeLesson && !activeLesson.isLocked ? activeLesson.id : null
  );

  // Block Ctrl+S / Ctrl+P when strictSystemOnly is enabled
  useEffect(() => {
    if (!data?.course?.strictSystemOnly) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["s", "p"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        message.warning("Downloading or printing is disabled for this course.");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data?.course?.strictSystemOnly]);

  const refreshPlayer = () => {
    queryClient.invalidateQueries({ queryKey: ["training-player", courseId] });
    queryClient.invalidateQueries({ queryKey: ["my-course-enrollments"] });
  };

  const handleMarkComplete = async (lessonId: string) => {
    setMarkingComplete(true);
    try {
      await updateLessonProgress(lessonId, {
        status: "completed",
        completionPercent: 100,
      });
      message.success("Lesson marked as completed");
      refreshPlayer();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to update progress");
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleVideoTimeUpdate = async () => {
    const vid = videoRef.current;
    if (!vid || !activeLesson || !vid.duration) return;
    const current = Math.floor(vid.currentTime);
    if (Math.abs(current - lastSavedTimeRef.current) < 15) return;

    lastSavedTimeRef.current = current;
    const pct = Math.min(100, Math.round((vid.currentTime / vid.duration) * 100));
    try {
      await updateLessonProgress(activeLesson.id, {
        status: pct >= 90 ? "completed" : "in_progress",
        lastPositionSeconds: current,
        watchedSeconds: current,
        completionPercent: pct,
      });
      if (pct >= 90) {
        refreshPlayer();
      }
    } catch {
      // silent heartbeat failure
    }
  };

  const handleVideoEnded = async () => {
    if (!activeLesson) return;
    try {
      await updateLessonProgress(activeLesson.id, {
        status: "completed",
        completionPercent: 100,
      });
      refreshPlayer();
    } catch {
      // ignore
    }
  };

  const handleQuizSubmit = async () => {
    if (!activeLesson) return;
    setSubmittingQuiz(true);
    try {
      const res = await submitQuizAttempt(activeLesson.id, quizAnswers);
      setQuizResult(res);
      if (res.passed) {
        message.success(`Passed with ${res.scorePercent}%!`);
        refreshPlayer();
      } else {
        message.warning(
          `Scored ${res.scorePercent}%. Passing score is ${res.passingScore}%. Try again!`
        );
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to submit quiz");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handlePostComment = async () => {
    if (!activeLesson || !commentText.trim()) return;
    setPostingComment(true);
    try {
      await createLessonComment(activeLesson.id, commentText.trim());
      setCommentText("");
      refetchComments();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spin size="large" tip="Loading course player..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Result
        status="403"
        title="Unable to Access Course"
        subTitle={(error as any)?.response?.data?.message || "You may not be enrolled in this course."}
        extra={
          <Button type="primary" onClick={() => navigate("/training")}>
            Back to Training
          </Button>
        }
      />
    );
  }

  const { course, enrollment, accessStatus, modules } = data;
  const watermarkText = `${profile?.name || "User"} • ${profile?.email || ""} • ${dayjs().format("YYYY-MM-DD HH:mm")}`;

  return (
    <div
      className={`p-2 sm:p-4 space-y-3 ${course.strictSystemOnly ? "select-none" : ""}`}
      onContextMenu={(e) => {
        if (course.strictSystemOnly) e.preventDefault();
      }}
    >
      {/* Top Bar */}
      <Card styles={{ body: { padding: "12px 16px" } }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/training")}
            >
              Back
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Tag color="cyan">{course.code}</Tag>
                <Title level={5} style={{ margin: 0 }}>
                  {course.title}
                </Title>
              </div>
              <Text type="secondary" className="text-xs">
                {course.category} • {course.cpdHours} CPD Hours
                {course.strictSystemOnly && " • System-Only Protected"}
              </Text>
            </div>
          </Space>

          {enrollment && (
            <div className="flex items-center gap-3 min-w-[220px]">
              <div className="flex-1">
                <div className="text-xs text-slate-500 mb-0.5">
                  Course Progress: {Math.round(enrollment.progressPercent || 0)}%
                </div>
                <Progress
                  percent={Math.round(enrollment.progressPercent || 0)}
                  size="small"
                  className="m-0"
                />
              </div>
              {enrollment.certificateNumber && (
                <Tag icon={<SafetyCertificateOutlined />} color="green">
                  {enrollment.certificateNumber}
                </Tag>
              )}
            </div>
          )}
        </div>
      </Card>

      {!accessStatus.allowed ? (
        <Card>
          <Result
            icon={<ClockCircleOutlined style={{ color: "#faad14" }} />}
            title="Course Access Outside Allowed Schedule"
            subTitle={accessStatus.reason || "Content is currently unavailable per the course timing policy."}
            extra={
              <Button onClick={() => navigate("/training")}>Return to Training</Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Curriculum Sidebar */}
          <Card
            title="Course Curriculum"
            className="lg:col-span-4 h-fit"
            styles={{ body: { padding: "8px 12px" } }}
          >
            {modules.length === 0 ? (
              <Empty description="No lessons published yet" />
            ) : (
              <div className="space-y-3">
                {modules.map((mod, mIdx) => (
                  <div key={mod.id} className="space-y-1">
                    <div className="font-semibold text-xs uppercase text-slate-500 px-2 pt-1">
                      {mIdx + 1}. {mod.title}
                    </div>
                    {(mod.lessons || []).map((lesson) => {
                      const isSelected = lesson.id === activeLesson?.id;
                      const isDone = lesson.progress?.status === "completed";
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          disabled={lesson.isLocked}
                          onClick={() => {
                            setQuizResult(null);
                            setQuizAnswers({});
                            setSelectedLessonId(lesson.id);
                          }}
                          className={`w-full text-left px-3 py-2 rounded border transition flex items-center justify-between gap-2 ${
                            isSelected
                              ? "bg-blue-50 border-blue-400 text-blue-800"
                              : lesson.isLocked
                              ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {lesson.isLocked ? (
                              <LockOutlined />
                            ) : lesson.contentType === "video" ? (
                              <VideoCameraOutlined />
                            ) : lesson.contentType === "pdf" ||
                              lesson.contentType === "document" ? (
                              <FilePdfOutlined />
                            ) : lesson.contentType === "quiz" ? (
                              <QuestionCircleOutlined />
                            ) : (
                              <FileTextOutlined />
                            )}
                            <span className="truncate text-sm font-medium">
                              {lesson.title}
                            </span>
                          </div>
                          {isDone && (
                            <CheckCircleOutlined className="text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Main Content Player */}
          <div className="lg:col-span-8 space-y-4">
            <Card>
              {!activeLesson ? (
                <Empty description="Select a lesson to begin" />
              ) : activeLesson.isLocked ? (
                <Result
                  icon={<LockOutlined />}
                  title="Lesson Locked"
                  subTitle="Complete the previous required lessons to unlock this lesson."
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Title level={5} style={{ margin: 0 }}>
                        {activeLesson.title}
                      </Title>
                      <Text type="secondary" className="text-xs">
                        {activeLesson.contentType.toUpperCase()} •{" "}
                        {activeLesson.durationMinutes} min
                      </Text>
                    </div>
                    {activeLesson.contentType !== "quiz" && (
                      <Button
                        type={
                          activeLesson.progress?.status === "completed"
                            ? "default"
                            : "primary"
                        }
                        icon={<CheckCircleOutlined />}
                        loading={markingComplete}
                        disabled={activeLesson.progress?.status === "completed"}
                        onClick={() => handleMarkComplete(activeLesson.id)}
                      >
                        {activeLesson.progress?.status === "completed"
                          ? "Completed"
                          : "Mark as Complete"}
                      </Button>
                    )}
                  </div>

                  {/* Protected Content Area with Watermark */}
                  <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-slate-950/5">
                    {course.strictSystemOnly && (
                      <div
                        className="pointer-events-none absolute bottom-3 right-3 z-20 px-2 py-0.5 rounded bg-black/40 text-white/75 text-[10px] font-mono"
                        aria-hidden="true"
                      >
                        {watermarkText}
                      </div>
                    )}

                    {activeLesson.contentType === "video" && (
                      activeLesson.hasFile ? (
                        <video
                          ref={videoRef}
                          key={activeLesson.id}
                          controls
                          controlsList="nodownload noplaybackrate"
                          disablePictureInPicture
                          onContextMenu={(e) => e.preventDefault()}
                          onLoadedMetadata={() => {
                            const pos = activeLesson.progress?.lastPositionSeconds || 0;
                            if (videoRef.current && pos > 0) {
                              videoRef.current.currentTime = pos;
                            }
                          }}
                          onTimeUpdate={handleVideoTimeUpdate}
                          onEnded={handleVideoEnded}
                          className="w-full max-h-[480px] bg-black"
                          src={getLessonStreamUrl(activeLesson.id)}
                        />
                      ) : (
                        <Empty description="Video file not uploaded yet" className="py-12" />
                      )
                    )}

                    {(activeLesson.contentType === "pdf" ||
                      activeLesson.contentType === "document") && (
                      activeLesson.hasFile ? (
                        <iframe
                          title={activeLesson.title}
                          src={`${getLessonStreamUrl(activeLesson.id)}#toolbar=0&navpanes=0`}
                          className="w-full h-[540px] border-0 bg-white"
                        />
                      ) : (
                        <Empty description="Document not uploaded yet" className="py-12" />
                      )
                    )}

                    {activeLesson.contentType === "rich_text" && (
                      <div className="p-5 bg-white prose max-w-none whitespace-pre-wrap text-slate-800">
                        {activeLesson.richTextContent || "No content available."}
                      </div>
                    )}

                    {activeLesson.contentType === "quiz" && (
                      <div className="p-5 bg-white space-y-4">
                        {quizResult && (
                          <Alert
                            type={quizResult.passed ? "success" : "warning"}
                            showIcon
                            message={`Score: ${quizResult.scorePercent}% (${quizResult.earnedPoints}/${quizResult.totalPoints} pts) — ${
                              quizResult.passed ? "Passed!" : `Required: ${quizResult.passingScore}%`
                            }`}
                          />
                        )}
                        {(activeLesson.quizQuestions || []).length === 0 ? (
                          <Empty description="No questions added to this quiz yet" />
                        ) : (
                          <>
                            {(activeLesson.quizQuestions || []).map((q, idx) => (
                              <div key={q.id} className="p-3 border rounded space-y-2">
                                <div className="font-medium text-sm">
                                  {idx + 1}. {q.questionText}{" "}
                                  <span className="text-xs text-slate-400">
                                    ({q.points} pt)
                                  </span>
                                </div>
                                <Radio.Group
                                  value={(quizAnswers[q.id] || [])[0]}
                                  onChange={(e) =>
                                    setQuizAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: [e.target.value],
                                    }))
                                  }
                                  className="flex flex-col gap-1.5"
                                >
                                  {(q.options || []).map((opt) => (
                                    <Radio key={opt.id} value={opt.id}>
                                      {opt.text}
                                    </Radio>
                                  ))}
                                </Radio.Group>
                              </div>
                            ))}
                            <Button
                              type="primary"
                              icon={<PlayCircleOutlined />}
                              loading={submittingQuiz}
                              onClick={handleQuizSubmit}
                            >
                              Submit Quiz
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Lesson Q&A / Discussion */}
            {activeLesson && !activeLesson.isLocked && (
              <Card
                title={
                  <span>
                    <CommentOutlined className="mr-1.5" />
                    Lesson Discussion & Q&A ({comments.length})
                  </span>
                }
                size="small"
              >
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask a question or share a note about this lesson..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onPressEnter={handlePostComment}
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      loading={postingComment}
                      onClick={handlePostComment}
                    >
                      Post
                    </Button>
                  </div>
                  <Divider className="my-2" />
                  {comments.length === 0 ? (
                    <Text type="secondary" className="text-xs">
                      No questions yet. Be the first to ask!
                    </Text>
                  ) : (
                    <List
                      size="small"
                      dataSource={comments}
                      renderItem={(item) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<Avatar size="small">{item.user?.name?.[0] || "U"}</Avatar>}
                            title={
                              <span className="text-xs font-semibold">
                                {item.user?.name}{" "}
                                <span className="text-slate-400 font-normal ml-1">
                                  {dayjs(item.createdAt).format("YYYY-MM-DD HH:mm")}
                                </span>
                              </span>
                            }
                            description={<span className="text-sm text-slate-700">{item.content}</span>}
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlayerPage;
