import PageTitle from "@/components/PageTitle";
import WorklogTable from "@/components/Worklog/WorklogTable";
import { useWorklogById } from "@/hooks/worklog/useWorklogById";
import { Card } from "antd";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";

const Worklog: React.FC = () => {
  const { id } = useParams();
  // Removed unused navigate
  const { data, refetch } = useWorklogById({ id });

  // Listen for refreshWorklogTable event and refetch worklog data
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener("refreshWorklogTable", handler);
    return () => window.removeEventListener("refreshWorklogTable", handler);
  }, [refetch]);

  return (
    <>
      <PageTitle title="Worklog" />
      <Card>
        <WorklogTable data={data} />
      </Card>
    </>
  );
};

export default Worklog;
