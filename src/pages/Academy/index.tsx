import React, { useState, useMemo } from "react";
import {
  Typography,
  Input,
  Button,
  Tabs,
  Card,
  Tag,
  Progress,
  Row,
  Col,
  Space,
  Select,
  Empty,
  Spin,
  Collapse,
  Popconfirm,
  Badge,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  PlayCircleOutlined,
  BookOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  RocketOutlined,
  FilterOutlined,
  CompassOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { useSession } from "@/context/SessionContext";
import {
  useAcademyCategories,
  useAcademyGuides,
  useOnboardingChecklist,
  useAcademyFaqs,
  useDeleteGuide,
} from "@/hooks/academy/useAcademy";
import { AcademyGuide, AcademyCategory } from "@/types/academy";
import { GuideViewerModal } from "@/components/Academy/GuideViewerModal";
import { CreateGuideModal } from "@/components/Academy/CreateGuideModal";
import { ContextualHelpDrawer } from "@/components/Academy/ContextualHelpDrawer";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const AcademyPage: React.FC = () => {
  const { profile } = useSession();
  const isAdminOrManager =
    profile?.role === "admin" ||
    profile?.role === "superadmin" ||
    profile?.role === "manager" ||
    profile?.role === "partner";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");

  const [selectedGuide, setSelectedGuide] = useState<AcademyGuide | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<AcademyGuide | null>(null);
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);

  // Queries
  const { data: categories = [], isLoading: isLoadingCategories } = useAcademyCategories();
  const { data: guides = [], isLoading: isLoadingGuides } = useAcademyGuides();
  const { data: onboarding, isLoading: isLoadingOnboarding } = useOnboardingChecklist();
  const { data: faqs = [], isLoading: isLoadingFaqs } = useAcademyFaqs();
  const { mutate: deleteGuide } = useDeleteGuide();

  // Filtered guides
  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      // Category filter
      if (selectedCategoryId !== "all" && guide.category?.id !== selectedCategoryId) {
        return false;
      }
      // Difficulty filter
      if (difficultyFilter !== "all" && guide.difficulty !== difficultyFilter) {
        return false;
      }
      // Format filter
      if (formatFilter === "video" && !guide.videoUrl) return false;
      if (formatFilter === "read" && guide.videoUrl) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = guide.title.toLowerCase().includes(query);
        const matchSummary = guide.summary?.toLowerCase().includes(query);
        const matchContent = guide.content.toLowerCase().includes(query);
        return matchTitle || matchSummary || matchContent;
      }

      return true;
    });
  }, [guides, selectedCategoryId, difficultyFilter, formatFilter, searchQuery]);

  const handleOpenGuide = (guide: AcademyGuide) => {
    setSelectedGuide(guide);
  };

  const handleEditGuide = (e: React.MouseEvent, guide: AcademyGuide) => {
    e.stopPropagation();
    setEditingGuide(guide);
    setIsCreateModalOpen(true);
  };

  const handleDeleteGuide = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteGuide(id);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white p-6 sm:p-10 shadow-lg">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold mb-3">
            <CompassOutlined /> Artha Software Academy & Documentation
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight m-0 text-white">
            Learn Artha with Guides & Video Tutorials
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 font-normal leading-relaxed">
            Master multi-tier audit projects, dual Bikram Sambat & English dates, daily worklogs,
            leave policies, and billing with step-by-step instructions.
          </p>

          {/* Search bar inside Hero */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                size="large"
                placeholder="Search articles, guides, topics or videos (e.g. Nepali date, timesheets)..."
                prefix={<SearchOutlined className="text-gray-400 mr-1" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
                className="rounded-xl shadow-sm border-0 text-gray-900"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="large"
                icon={<QuestionCircleOutlined />}
                onClick={() => setIsContextDrawerOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-xl"
              >
                Page Help
              </Button>
              {isAdminOrManager && (
                <Button
                  size="large"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingGuide(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 border-none rounded-xl font-medium"
                >
                  Create Guide
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Checklist for logged-in user */}
      {onboarding && onboarding.total > 0 && (
        <Card className="rounded-xl border border-blue-100 shadow-sm bg-gradient-to-br from-white to-blue-50/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <RocketOutlined className="text-blue-600 text-lg" />
                <h3 className="text-base font-bold text-gray-900 m-0">
                  New User Onboarding Checklist
                </h3>
                <Tag color={onboarding.progressPercent === 100 ? "success" : "processing"}>
                  {onboarding.completed} / {onboarding.total} Completed ({onboarding.progressPercent}%)
                </Tag>
              </div>
              <p className="text-xs text-gray-500 mt-1 m-0">
                Complete these essential guides to quickly get familiar with Artha's core workflows.
              </p>
            </div>
            <div className="w-full md:w-64">
              <Progress
                percent={onboarding.progressPercent}
                status={onboarding.progressPercent === 100 ? "success" : "active"}
                strokeColor={{ "0%": "#108ee9", "100%": "#52c41a" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {onboarding.items.map((item) => {
              const matchedGuide = guides.find((g) => g.id === item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => matchedGuide && handleOpenGuide(matchedGuide)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    item.isCompleted
                      ? "bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50"
                      : "bg-white border-gray-200 hover:border-blue-400 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.isCompleted ? (
                      <CheckCircleFilled className="text-emerald-500 text-lg flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-semibold line-clamp-1 ${
                          item.isCompleted ? "text-emerald-900 line-through opacity-80" : "text-gray-800"
                        }`}
                      >
                        {item.title}
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                        <span>{item.estimatedReadTimeMinutes} min read</span>
                        {item.hasVideo && (
                          <span className="text-purple-600 font-medium">Video</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Categories & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-3 rounded-xl border border-gray-200">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
          <Button
            size="small"
            type={selectedCategoryId === "all" ? "primary" : "default"}
            onClick={() => setSelectedCategoryId("all")}
            className="rounded-full px-3"
          >
            All Topics ({guides.length})
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              size="small"
              type={selectedCategoryId === cat.id ? "primary" : "default"}
              onClick={() => setSelectedCategoryId(cat.id)}
              className="rounded-full px-3 whitespace-nowrap"
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            size="small"
            value={difficultyFilter}
            onChange={setDifficultyFilter}
            style={{ width: 130 }}
            prefix={<FilterOutlined className="text-gray-400 mr-1" />}
          >
            <Option value="all">All Levels</Option>
            <Option value="beginner">Beginner</Option>
            <Option value="intermediate">Intermediate</Option>
            <Option value="advanced">Advanced</Option>
          </Select>

          <Select
            size="small"
            value={formatFilter}
            onChange={setFormatFilter}
            style={{ width: 130 }}
          >
            <Option value="all">All Formats</Option>
            <Option value="video">Has Video</Option>
            <Option value="read">Text Only</Option>
          </Select>
        </div>
      </div>

      {/* Guides Grid */}
      {isLoadingGuides ? (
        <div className="py-20 text-center">
          <Spin size="large" />
          <p className="text-gray-500 text-sm mt-3">Loading Software Academy guides...</p>
        </div>
      ) : filteredGuides.length === 0 ? (
        <Card className="rounded-xl text-center py-12">
          <Empty
            description={
              <div>
                <p className="text-gray-700 font-medium">No guides match your criteria</p>
                <p className="text-xs text-gray-400">
                  Try adjusting your search terms or filters above.
                </p>
              </div>
            }
          />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {filteredGuides.map((guide) => (
            <Col xs={24} sm={12} lg={8} key={guide.id}>
              <Card
                hoverable
                className="h-full rounded-xl border border-gray-200 overflow-hidden flex flex-col justify-between transition-all hover:border-blue-400 hover:shadow-md cursor-pointer group"
                onClick={() => handleOpenGuide(guide)}
                styles={{ body: { padding: "16px", flex: 1, display: "flex", flexDirection: "column" } }}
              >
                <div>
                  {/* Category & Status badges */}
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {guide.category && (
                        <Tag color="blue" className="rounded text-xs m-0">
                          {guide.category.name}
                        </Tag>
                      )}
                      <Tag
                        color={
                          guide.difficulty === "advanced"
                            ? "red"
                            : guide.difficulty === "intermediate"
                            ? "orange"
                            : "green"
                        }
                        className="rounded text-xs m-0 capitalize"
                      >
                        {guide.difficulty}
                      </Tag>
                    </div>

                    <div className="flex items-center gap-1">
                      {guide.userProgress?.isCompleted && (
                        <Tooltip title="You completed this guide">
                          <CheckCircleFilled className="text-emerald-500 text-base" />
                        </Tooltip>
                      )}
                      {isAdminOrManager && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined className="text-gray-500 hover:text-blue-600" />}
                            onClick={(e) => handleEditGuide(e, guide)}
                          />
                          <Popconfirm
                            title="Delete this guide?"
                            onConfirm={(e) => handleDeleteGuide(e as any, guide.id)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined className="text-gray-500 hover:text-red-600" />}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Popconfirm>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 m-0">
                    {guide.title}
                  </h3>

                  {/* Summary */}
                  {guide.summary && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                      {guide.summary}
                    </p>
                  )}
                </div>

                {/* Footer metadata */}
                <div className="pt-4 mt-auto border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <ClockCircleOutlined />
                    {guide.estimatedReadTimeMinutes} min read
                  </span>
                  {guide.videoUrl && (
                    <span className="flex items-center gap-1 text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded">
                      <PlayCircleOutlined />
                      {guide.videoDurationSeconds ? formatSeconds(guide.videoDurationSeconds) : "Video"}
                    </span>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Frequently Asked Questions Section */}
      <Card className="rounded-xl border border-gray-200 mt-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <QuestionCircleOutlined className="text-blue-600 text-lg" />
          <h3 className="text-lg font-bold text-gray-900 m-0">Frequently Asked Questions</h3>
        </div>

        {isLoadingFaqs ? (
          <Spin />
        ) : faqs.length === 0 ? (
          <Empty description="No FAQs available" />
        ) : (
          <Collapse
            size="middle"
            className="bg-transparent border border-gray-200 rounded-lg overflow-hidden"
            items={faqs.map((faq) => ({
              key: faq.id,
              label: (
                <div className="flex items-center justify-between pr-2">
                  <span className="text-sm font-semibold text-gray-800">{faq.question}</span>
                  {faq.category && (
                    <Tag color="cyan" className="text-xs rounded">
                      {faq.category.name}
                    </Tag>
                  )}
                </div>
              ),
              children: <p className="text-xs text-gray-600 leading-relaxed m-0">{faq.answer}</p>,
            }))}
          />
        )}
      </Card>

      {/* Modals & Drawers */}
      <GuideViewerModal
        open={!!selectedGuide}
        guide={selectedGuide}
        onClose={() => setSelectedGuide(null)}
      />

      <CreateGuideModal
        open={isCreateModalOpen}
        categories={categories}
        initialValues={editingGuide}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingGuide(null);
        }}
      />

      <ContextualHelpDrawer
        open={isContextDrawerOpen}
        onClose={() => setIsContextDrawerOpen(false)}
      />
    </div>
  );
};

export default AcademyPage;
