import { Role } from "@/pages/Role/type";
import { Col, Row, Form, DatePicker } from "antd";
import Paragraph from "antd/es/typography/Paragraph";
import { useRole } from "../../hooks/role/useRole";
import FormInputWrapper from "../FormInputWrapper";
import FormSelectWrapper from "../FormSelectWrapper";
import { UserType } from "@/types/user";
import { UserStatus } from "@/types/userStatus";
import FormNumberWrapper from "../FormNumberWrapper";
import { useSession } from "@/context/SessionContext";

const UserAuthDetail = ({ initialValues }: { initialValues?: UserType }) => {
  const { profile } = useSession();
  const roleName = profile?.role?.name?.toLowerCase() || "";
  const canEditJoinedDate =
    roleName === "admin" ||
    roleName === "superuser" ||
    roleName === "super admin" ||
    roleName === "super_user" ||
    roleName === "administrator" ||
    roleName.includes("admin") ||
    roleName.includes("super");
  const { data: roles } = useRole({ page: 1, limit: 100 });

  return (
    <>
      <div>
        <Paragraph>
          These fields are used for authentication and all the fields are required.
          {initialValues?.id && (
            <><br/><strong>Note:</strong> Email and username cannot be changed after user creation.</>
          )}
        </Paragraph>
      </div>
      <Row gutter={10}>
        <Col xs={24} sm={12}>
          <FormInputWrapper
            id="name"
            name="name"
            label="Name"
            required
            rules={[{ required: true, message: "Please input the name!" }]}
          />
        </Col>
        <Col xs={24} sm={12}>
          <FormInputWrapper
            disabled={!!initialValues?.id}
            id="username"
            name="username"
            label="Username"
            required
            rules={[{ required: true, message: "Please input the username!" }]}
          />
        </Col>
        <Col xs={24} sm={12}>
          <FormInputWrapper
            disabled={!!initialValues?.email}
            id="email"
            name="email"
            label="Email"
            required
            rules={[
              { required: true, message: "Please input the email!" },
              { type: "email", message: "Please input a valid email!" },
            ]}
          />
        </Col>
        <Col xs={24} sm={12}>
          <FormSelectWrapper
            id="status"
            name="status"
            label="Status"
            required
            rules={[{ required: true, message: "Please select the status!" }]}
            options={[
              { value: UserStatus.ACTIVE, label: "Active" },
              { value: UserStatus.INACTIVE, label: "Inactive" },
              { value: UserStatus.BLOCKED, label: "Blocked" },
            ]}
          />
        </Col>

        <Col xs={24} sm={12}>
          <FormSelectWrapper
            id="role"
            name="roleId"
            label="Role"
            required
            
            rules={[{ required: true, message: "Please select the role!" }]}
            options={
              roles?.results?.map((role: Role) => ({
                value: String(role.id), // Ensure value is always a string
                label: role.name,
              })) || []
            }
          />
        </Col>
        
        <Col xs={24} sm={12}>
          <FormNumberWrapper
            id="hourlyRate"
            name="hourlyRate"
            label="Hourly Rate (NPR)"
            min={0}
            placeholder="e.g. 500"
            defaultValue={initialValues?.hourlyRate || 500}
            addonAfter="NPR/hr"
          />
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            id="joinedDate"
            name="joinedDate"
            label="Joined Date"
            tooltip={!canEditJoinedDate ? "Only administrators and super admins can edit the joined date." : "Official date when user joined the company"}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="YYYY-MM-DD"
              placeholder={canEditJoinedDate ? "Select joined date" : "Joined date"}
              disabled={!canEditJoinedDate}
              allowClear={canEditJoinedDate}
            />
          </Form.Item>
        </Col>
      </Row>
      <Paragraph>Note: An email will be sent to the user to verify their account.</Paragraph>

    </>
  );
};

export default UserAuthDetail;

