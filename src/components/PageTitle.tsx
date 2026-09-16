import Title from "antd/es/typography/Title";

const PageTitle = ({
  title,
  element,
  extra,
  description
}: {
  title?: string | JSX.Element;
  element?: JSX.Element;
  extra?: JSX.Element;
  description?: string
}) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
    <div className="min-w-0">
      {typeof title === 'string' ? <Title level={4} className="!text-lg sm:!text-xl !mb-0">{title}</Title> : title}
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
    </div>
    {(extra || element) && (
      <div className="flex-shrink-0">
        {extra || element}
      </div>
    )}
  </div>
);

export default PageTitle;
