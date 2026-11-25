import { useState } from "react";
import ClientForm from "@/components/Client/ClientForm";
import QuickCreateClientModal from "@/components/Client/QuickCreateClientModal";
import PageTitle from "@/components/PageTitle";
import { Button, Space } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

const CreateClient = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as any)?.prefill;
  const [quickModalOpen, setQuickModalOpen] = useState(false);

  return (
    <>
      <PageTitle
        title="Create New Client"
        element={
          <Space>
            <Button onClick={() => setQuickModalOpen(true)}>
              Quick Create
            </Button>
            <Button type="primary" onClick={() => navigate(-1)}>
              Close
            </Button>
          </Space>
        }
      />
      <ClientForm prefillData={prefill} />

      <QuickCreateClientModal
        open={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        initialValues={prefill}
        onSuccess={() => {
          navigate("/client");
        }}
      />
    </>
  );
};

export default CreateClient;
