import { useCreateUser } from "@/hooks/user/userCreateuser";
import { useUpdateUser } from "@/hooks/user/useUpdateUser";
import { Button, Form, message } from "antd";
import UserAuthDetail from "./UserAuthDetail";
import { UserType } from "@/types/user";
import { useEffect } from "react";
import dayjs from "dayjs";
import { useSession } from "@/context/SessionContext";

const UserForm = ({ initialValues, handleCancel }: { initialValues?: UserType, handleCancel?: any }) => {
  const [form] = Form.useForm();
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
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const isEditing = !!initialValues?.id;
  const isPending = isCreating || isUpdating;
  useEffect(() => {
    if (isEditing && initialValues) {
      const initialJoined = initialValues.joinedDate || initialValues.createdAt;
      form.setFieldsValue({
        name: initialValues.name,
        username: initialValues.username,
        email: initialValues.email,
        status: initialValues.status,
        roleId: initialValues.role?.id,
        hourlyRate: initialValues.hourlyRate || 500,
        joinedDate: initialJoined ? dayjs(initialJoined) : null,
      });
    } else {
      // Reset form when not editing
      form.resetFields();
    }
  }, [initialValues, form, isEditing]);
  const handleFinish = (values: any) => {
    const mutation = isEditing ? updateUser : createUser;
    const successMessage = isEditing ? "User updated successfully" : "User created successfully";
    const formattedJoinedDate = values.joinedDate
      ? (dayjs.isDayjs(values.joinedDate) ? values.joinedDate.format("YYYY-MM-DD") : values.joinedDate)
      : null;

    let payload = values;
    if (isEditing) {
      // For updates, send all relevant fields including hourlyRate
      // Only include joinedDate if current session user is admin
      payload = {
        name: values.name,
        status: values.status,
        role: String(values.roleId), // Ensure role is string for update
        hourlyRate: values.hourlyRate,
        ...(canEditJoinedDate && formattedJoinedDate ? { joinedDate: formattedJoinedDate } : {}),
      };
    } else {
      // For creation, send all relevant fields including hourlyRate
      payload = {
        ...values,
        role: String(values.roleId),
        roleId: String(values.roleId), // Ensure roleId is string
        hourlyRate: values.hourlyRate,
        ...(formattedJoinedDate ? { joinedDate: formattedJoinedDate } : {}),
      };
    }
    mutation(
      isEditing ? { id: initialValues.id, payload } : payload,
      {
        onSuccess: () => {
          message.success(successMessage);
          handleCancel(); // Close modal and refresh parent component
        },
        onError: (error: any) => {
          if (error.response?.data?.message) {
            const errorMsg = error.response.data.message;
            if (errorMsg.includes("should not exist")) {
              message.error("Some fields cannot be updated. Please check the field requirements.");
            } else {
              message.error(errorMsg);
            }
          } else {
            const errorMessage = `Failed to ${isEditing ? "update" : "create"} user. Please try again.`;
            message.error(errorMessage);
          }
        },
      } as any
    );
  };
  // Pass form to UserAuthDetail for access to form methods
  const userDetailProps = {
    ...initialValues,
    form
  };
  return (
    <div>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <UserAuthDetail initialValues={userDetailProps} />
        <Button type="primary" htmlType="submit" loading={isPending} disabled={isPending}>
          {isEditing ? "Update" : "Save"}
        </Button>
      </Form>
    </div>
  );
};
export default UserForm;


