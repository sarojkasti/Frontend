import PageTitle from "@/components/PageTitle";
import RoleTable, { ALL_ROLE_COLUMNS } from "@/components/Role/RoleTable";
import { useColumnVisibility } from "@/components/Table";
import { Button, Space } from "antd";
import { useNavigate } from "react-router-dom";

const RolesPage = () => {
  const navigate = useNavigate();
  const { visibleColumnKeys, columnCustomizer } = useColumnVisibility({
    persistenceKey: "role_table",
    columns: ALL_ROLE_COLUMNS,
  });

  return (
    <>
      <PageTitle
        title="Roles"
        element={
          <Space>
            {columnCustomizer}
            <Button
              type="primary"
              onClick={() => {
                navigate("/role/new");
              }}
            >
              Create
            </Button>
          </Space>
        }
      />
      <RoleTable visibleColumnKeys={visibleColumnKeys} />
    </>
  );
};

export default RolesPage;
