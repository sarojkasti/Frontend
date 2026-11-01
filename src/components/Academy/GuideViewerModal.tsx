import React, { useState } from "react";
import { Modal, Tag, Button, Typography, Space, Divider, Alert, Tooltip } from "antd";
import {
  CheckCircleFilled,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  BookOutlined,
  ShareAltOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { AcademyGuide, VideoChapter } from "@/types/academy";
import { useRecordGuideProgress } from "@/hooks/academy/useAcademy";

const { Title, Text, Paragraph } = Typography;

interface GuideViewerModalProps {
  open: boolean;
  guide: AcademyGuide | null;
  onClose: () => void;
}

export const GuideViewerModal: React.FC<GuideViewerModalProps> = ({
  open,
  guide,
  onClose,
}) => {
  const { mutate: recordProgress, isPending: isUpdatingProgress } = useRecordGuideProgress();
  const [activeChapterIndex, setActiveChapterIndex] = useState<number | null>(null);

  if (!guide) return null;

  const isCompleted = !!guide.userProgress?.isCompleted;

  const handleToggleComplete = () => {
    recordProgress({
      guideId: guide.id,
      payload: { isCompleted: !isCompleted },
    });
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Convert simple markdown to React nodes
  const renderMarkdown = (content: string) => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: string[] = [];

    const flushList = (key: string) => {
      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={key} className="list-disc pl-5 my-2 space-y-1 text-gray-700 text-sm">
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    const parseInline = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, "<code class='bg-gray-100 text-blue-700 px-1 py-0.5 rounded text-xs'>$1</code>");
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        inList = true;
        listItems.push(trimmed.slice(2));
        return;
      } else if (/^\d+\.\s/.test(trimmed)) {
        inList = true;
        listItems.push(trimmed.replace(/^\d+\.\s/, ""));
        return;
      } else {
        flushList(`list-${index}`);
      }

      if (trimmed.startsWith("### ")) {
        elements.push(
          <h3 key={index} className="text-lg font-bold text-gray-900 mt-4 mb-2">
            {trimmed.slice(4)}
          </h3>
        );
      } else if (trimmed.startsWith("#### ")) {
        elements.push(
          <h4 key={index} className="text-base font-semibold text-gray-800 mt-3 mb-1">
            {trimmed.slice(5)}
          </h4>
        );
      } else if (trimmed.startsWith("> ")) {
        elements.push(
          <Alert
            key={index}
            message={
              <span
                dangerouslySetInnerHTML={{
                  __html: parseInline(trimmed.slice(2)),
                }}
              />
            }
            type="info"
            showIcon
            className="my-3 border-l-4 border-l-blue-500 rounded"
          />
        );
      } else if (trimmed.length > 0) {
        elements.push(
          <p
            key={index}
            className="text-gray-700 text-sm leading-relaxed my-2"
            dangerouslySetInnerHTML={{ __html: parseInline(trimmed) }}
          />
        );
      }
    });

    flushList("final-list");
    return elements;
  };

  const getEmbedUrl = (url?: string, timestamp?: number) => {
    if (!url) return null;
    let base = url;
    if (url.includes("watch?v=")) {
      base = url.replace("watch?v=", "embed/");
    }
    if (timestamp !== undefined && timestamp > 0) {
      const separator = base.includes("?") ? "&" : "?";
      return `${base}${separator}start=${timestamp}&autoplay=1`;
    }
    return base;
  };

  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(
    guide.videoUrl ? getEmbedUrl(guide.videoUrl) : null
  );

  const handleChapterClick = (chapter: VideoChapter, index: number) => {
    setActiveChapterIndex(index);
    if (guide.videoUrl) {
      setCurrentVideoUrl(getEmbedUrl(guide.videoUrl, chapter.timestamp));
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      centered={true}
      width={880}
      style={{ top: 20 }}
      styles={{
        body: {
          maxHeight: "82vh",
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: "8px",
        },
      }}
      title={
        <div className="flex items-center justify-between pr-6">
          <div className="flex items-center gap-2">
            <BookOutlined className="text-blue-600 text-lg" />
            <span className="text-base font-semibold text-gray-800 line-clamp-1">
              {guide.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip title="Print Guide">
              <Button
                type="text"
                size="small"
                icon={<PrinterOutlined />}
                onClick={() => window.print()}
              />
            </Tooltip>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full pt-2">
          <Button
            type={isCompleted ? "default" : "primary"}
            icon={isCompleted ? <CheckCircleFilled className="text-emerald-500" /> : <CheckCircleOutlined />}
            onClick={handleToggleComplete}
            loading={isUpdatingProgress}
            className={isCompleted ? "border-emerald-500 text-emerald-700 bg-emerald-50" : "bg-blue-600"}
          >
            {isCompleted ? "Completed (Click to Reopen)" : "Mark as Completed"}
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-2 border-b border-gray-100">
          {guide.category && (
            <Tag color="blue" className="rounded-full px-2.5">
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
            className="capitalize rounded-full px-2.5"
          >
            {guide.difficulty}
          </Tag>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <ClockCircleOutlined />
            {guide.estimatedReadTimeMinutes} min read
          </span>
          {guide.videoDurationSeconds ? (
            <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
              <PlayCircleOutlined />
              {formatSeconds(guide.videoDurationSeconds)} video
            </span>
          ) : null}
          {isCompleted && (
            <Tag color="success" className="rounded-full ml-auto">
              ✓ Completed
            </Tag>
          )}
        </div>

        {/* Summary */}
        {guide.summary && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <Text className="text-gray-700 text-sm italic">{guide.summary}</Text>
          </div>
        )}

        {/* Video Tutorial if available */}
        {guide.videoUrl && (
          <div className="bg-black/5 p-3 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <PlayCircleOutlined className="text-purple-600 text-base" /> Video Walkthrough
              </span>
              {guide.videoDurationSeconds ? (
                <span className="text-xs text-gray-500">
                  Total runtime: {formatSeconds(guide.videoDurationSeconds)}
                </span>
              ) : null}
            </div>

            <div className="relative aspect-video rounded-lg overflow-hidden bg-black shadow-inner">
              <iframe
                src={currentVideoUrl || guide.videoUrl}
                title={guide.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Video Chapters */}
            {guide.videoChapters && guide.videoChapters.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1.5">Video Chapters:</div>
                <div className="flex flex-wrap gap-1.5">
                  {guide.videoChapters.map((ch, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChapterClick(ch, idx)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-all flex items-center gap-1 border ${
                        activeChapterIndex === idx
                          ? "bg-purple-600 text-white border-purple-600 font-medium shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                      }`}
                    >
                      <span className="font-mono opacity-80">{formatSeconds(ch.timestamp)}</span>
                      <span>{ch.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Guide Content */}
        <div className="prose max-w-none pt-2">{renderMarkdown(guide.content)}</div>
      </div>
    </Modal>
  );
};
