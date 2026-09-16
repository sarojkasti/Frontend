import PageTitle from "@/components/PageTitle";
import RoleTable from "@/components/Role/RoleTable";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";

const RolesPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageTitle
        title="Roles"
        element={
          <Button
            type="primary"
            onClick={() => {
              navigate("/role/new");
            }}
          >
            Create
          </Button>
        }
      />
      <RoleTable />
    </>
  );
};

export default RolesPage;
