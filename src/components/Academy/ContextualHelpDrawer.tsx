import React, { useState } from "react";
import {
  Drawer,
  Input,
  Tabs,
  Card,
  Tag,
  Typography,
  Collapse,
  Button,
  Empty,
  Spin,
  Space,
  Badge,
} from "antd";
import {
  QuestionCircleOutlined,
  PlayCircleOutlined,
  BookOutlined,
  SearchOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseOutlined,
  CompassOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useContextualHelp, useAcademyGuides } from "@/hooks/academy/useAcademy";
import { AcademyGuide, AcademyFaq } from "@/types/academy";
import { GuideViewerModal } from "./GuideViewerModal";

const { Text, Title, Paragraph } = Typography;

interface ContextualHelpDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const ContextualHelpDrawer: React.FC<ContextualHelpDrawerProps> = ({
  open,
  onClose,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<AcademyGuide | null>(null);

  // Fetch contextual guides and faqs for current route
  const { data: contextData, isLoading: isLoadingContext } = useContextualHelp(location.pathname);

  // Search guides if user enters query
  const { data: searchResults, isLoading: isSearching } = useAcademyGuides(
    searchQuery.trim().length > 1 ? { search: searchQuery.trim() } : undefined
  );

  const guidesToDisplay =
    searchQuery.trim().length > 1 ? searchResults || [] : contextData?.guides || [];
  const faqsToDisplay = contextData?.faqs || [];

  const handleOpenGuide = (guide: AcademyGuide) => {
    setSelectedGuide(guide);
  };

  const handleGoToAcademy = () => {
    onClose();
    navigate("/academy");
  };

  const getCleanRouteLabel = (path: string) => {
    if (path === "/" || path === "/dashboard") return "Dashboard";
    if (path.startsWith("/projects")) return "Projects & Tasks";
    if (path.startsWith("/worklogs")) return "Worklogs & Timesheets";
    if (path.startsWith("/leave")) return "Leave & HRMS";
    if (path.startsWith("/attendance")) return "Attendance";
    if (path.startsWith("/clients")) return "Clients";
    if (path.startsWith("/billing")) return "Billing";
    if (path.startsWith("/training")) return "Training & CPD";
    return path.replace("/", "").replace(/-/g, " ");
  };

  return (
    <>
      <Drawer
        title={
          <div className="flex items-center justify-between w-full pr-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <QuestionCircleOutlined className="text-base" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 m-0">Artha Help & Guides</h4>
                <div className="text-xs text-gray-500 font-normal">
                  Context: <span className="font-medium text-blue-600 capitalize">{getCleanRouteLabel(location.pathname)}</span>
                </div>
              </div>
            </div>
            <Button
              type="text"
              icon={<CloseOutlined className="text-base text-gray-600 hover:text-gray-900" />}
              onClick={onClose}
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100"
            />
          </div>
        }
        closable={false}
        placement="right"
        width={420}
        open={open}
        onClose={onClose}
        footer={
          <div className="p-1">
            <Button
              type="primary"
              ghost
              block
              icon={<CompassOutlined />}
              onClick={handleGoToAcademy}
              className="flex items-center justify-center gap-1.5 h-10 font-medium"
            >
              Open Full Software Academy <ArrowRightOutlined />
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Quick Search Box */}
          <div>
            <Input
              placeholder="Search help articles, guides or videos..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              className="rounded-lg py-2"
            />
          </div>

          {searchQuery.trim().length > 1 && (
            <div className="text-xs text-gray-500 font-medium">
              Search results for "{searchQuery}": ({guidesToDisplay.length})
            </div>
          )}

          {/* Guides Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {searchQuery ? "Matching Guides" : "Guides For This Screen"}
              </span>
              <span className="text-xs text-blue-600 font-medium cursor-pointer" onClick={handleGoToAcademy}>
                Browse all
              </span>
            </div>

            {isLoadingContext || isSearching ? (
              <div className="py-8 text-center">
                <Spin size="small" />
              </div>
            ) : guidesToDisplay.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                <BookOutlined className="text-gray-400 text-2xl mb-1" />
                <p className="text-xs text-gray-500 m-0">No specific guides for this query.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {guidesToDisplay.map((guide) => (
                  <Card
                    key={guide.id}
                    hoverable
                    size="small"
                    className="border border-gray-200 rounded-lg transition-all hover:border-blue-400 hover:shadow-sm cursor-pointer"
                    onClick={() => handleOpenGuide(guide)}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-blue-50 flex-shrink-0 flex items-center justify-center text-blue-600 mt-0.5">
                        {guide.videoUrl ? <PlayCircleOutlined className="text-purple-600" /> : <BookOutlined />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-xs font-semibold text-gray-800 line-clamp-1 m-0">
                            {guide.title}
                          </h5>
                          {guide.userProgress?.isCompleted && (
                            <CheckCircleFilled className="text-emerald-500 text-xs flex-shrink-0" />
                          )}
                        </div>
                        {guide.summary && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1 mb-1.5">
                            {guide.summary}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <ClockCircleOutlined /> {guide.estimatedReadTimeMinutes}m read
                          </span>
                          {guide.videoUrl && (
                            <span className="text-purple-600 font-medium flex items-center gap-1">
                              <PlayCircleOutlined /> Video
                            </span>
                          )}
                          <Tag className="text-[10px] py-0 px-1.5 rounded m-0 capitalize">
                            {guide.difficulty}
                          </Tag>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* FAQs Section (Only if not actively searching) */}
          {!searchQuery && faqsToDisplay.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">
                Frequently Asked Questions
              </span>
              <Collapse
                size="small"
                className="bg-transparent border border-gray-200 rounded-lg overflow-hidden"
                items={faqsToDisplay.map((faq, index) => ({
                  key: faq.id || String(index),
                  label: <span className="text-xs font-medium text-gray-800">{faq.question}</span>,
                  children: <p className="text-xs text-gray-600 leading-relaxed m-0">{faq.answer}</p>,
                }))}
              />
            </div>
          )}

          {/* Need help banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3">
            <h5 className="text-xs font-semibold text-blue-900 m-0">Still need help?</h5>
            <p className="text-xs text-blue-700 m-0 mt-0.5">
              Contact our firm system administrator or check the full academy video tutorials.
            </p>
          </div>
        </div>
      </Drawer>

      {/* Guide Viewer Modal */}
      <GuideViewerModal
        open={!!selectedGuide}
        guide={selectedGuide}
        onClose={() => setSelectedGuide(null)}
      />
    </>
  );
};
