import React from "react";
import Title from "antd/es/typography/Title";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export interface PageTitleProps {
  title?: string | JSX.Element;
  element?: JSX.Element;
  extra?: JSX.Element;
  description?: string;
  backUrl?: string;
  onBack?: () => void;
  backText?: string;
}

const PageTitle: React.FC<PageTitleProps> = ({
  title,
  element,
  extra,
  description,
  backUrl,
  onBack,
  backText = "Back to Settings",
}) => {
  const navigate = useNavigate();
  const handleBack = onBack || (backUrl ? () => navigate(backUrl) : undefined);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
      <div className="min-w-0 flex items-center gap-3">
        {handleBack && (
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            className="flex-shrink-0"
          >
            {backText}
          </Button>
        )}
        <div>
          {typeof title === "string" ? (
            <Title level={4} className="!text-lg sm:!text-xl !mb-0">
              {title}
            </Title>
          ) : (
            title
          )}
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
      {(extra || element) && (
        <div className="flex-shrink-0">
          {extra || element}
        </div>
      )}
    </div>
  );
};

export default PageTitle;
