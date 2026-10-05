import PageTitle from "@/components/PageTitle";
import WorklogTable, { ALL_WORKLOG_COLUMNS } from "@/components/Worklog/WorklogTable";
import { useColumnVisibility } from "@/components/Table";
import { useWorklogById } from "@/hooks/worklog/useWorklogById";
import { Card } from "antd";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";

const Worklog: React.FC = () => {
  const { id } = useParams();
  const { data, refetch } = useWorklogById({ id });
  const { visibleColumnKeys, columnCustomizer } = useColumnVisibility({
    persistenceKey: "worklog_table",
    columns: ALL_WORKLOG_COLUMNS,
  });

  // Listen for refreshWorklogTable event and refetch worklog data
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener("refreshWorklogTable", handler);
    return () => window.removeEventListener("refreshWorklogTable", handler);
  }, [refetch]);

  return (
    <>
      <PageTitle title="Worklog" element={columnCustomizer} />
      <Card>
        <WorklogTable data={data} visibleColumnKeys={visibleColumnKeys} />
      </Card>
    </>
  );
};

export default Worklog;
