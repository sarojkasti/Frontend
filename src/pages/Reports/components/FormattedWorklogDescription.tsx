import React from "react";
import { Tooltip } from "antd";
import { stripHtml, hasHtmlTags } from "@/utils/formatUtils";

interface FormattedWorklogDescriptionProps {
  content?: string | null;
  className?: string;
}

export const FormattedWorklogDescription: React.FC<FormattedWorklogDescriptionProps> = ({
  content,
  className = "",
}) => {
  if (!content || content === "-" || !content.trim()) {
    return <span className="text-slate-400">-</span>;
  }

  const plainText = stripHtml(content);
  if (!plainText) {
    return <span className="text-slate-400">-</span>;
  }

  const isHtml = hasHtmlTags(content);

  return (
    <Tooltip
      title={
        <div
          className="max-w-md max-h-60 overflow-y-auto text-xs leading-relaxed [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:list-disc"
          {...(isHtml
            ? { dangerouslySetInnerHTML: { __html: content } }
            : { children: content })}
        />
      }
      placement="topLeft"
    >
      <div
        className={`text-xs text-slate-700 leading-snug hover:text-blue-600 transition-colors cursor-pointer line-clamp-2 max-w-[320px] [&_p]:m-0 [&_p]:inline [&_ul]:inline [&_ol]:inline [&_li]:inline ${className}`}
        {...(isHtml
          ? { dangerouslySetInnerHTML: { __html: content } }
          : { children: plainText })}
      />
    </Tooltip>
  );
};
