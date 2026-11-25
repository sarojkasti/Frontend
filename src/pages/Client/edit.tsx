import ClientForm from "@/components/Client/ClientForm";
import PageTitle from "@/components/PageTitle";
import PortalCredentialsForm from "@/components/Client/portalcredentialsform";
import { useClientById } from "@/hooks/client/useClientById";
import usePermissionChecker from "@/hooks/usePermissionChecker";
import { Button, Card, Tabs } from "antd";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const { TabPane } = Tabs;

const EditClient = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("basic");
  const permissionChecker = usePermissionChecker();
  const canManagePortalCredentials = permissionChecker.isSuperAdmin();

  const { data: client } = useClientById({ id: id });

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <>
      <PageTitle
        title="Edit Client"
        element={
          <Button type="primary" onClick={() => navigate(-1)}>
            Close
          </Button>
        }
      />

      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="Basic Information" key="basic">
          <ClientForm editClientData={client} id={id} />
        </TabPane>
        {canManagePortalCredentials && (
          <TabPane tab="Portal Credentials" key="credentials">
            <Card>
              <PortalCredentialsForm
                clientId={id || ""}
                clientPan={client?.panNo}
                clientName={client?.name}
              />
            </Card>
          </TabPane>
        )}
      </Tabs>
    </>
  );
};

export default EditClient;
