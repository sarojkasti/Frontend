import { useCreateNoticeBoard } from "@/hooks/notice-board/useCreateNoticeBoard";import { useUpdateNoticeBoard } from "@/hooks/notice-board/useUpdateNoticeBoard";import { useNoticeBoard } from "@/hooks/notice-board/useNoticeBoard";import { useUser } from "@/hooks/user/useUser";import { useRole } from "@/hooks/role/useRole";import { Form, Input, Button, Upload, Switch, Select, Card, message, Space, Divider } from "antd";import { UploadOutlined, UserOutlined, TeamOutlined, SendOutlined, MailOutlined } from "@ant-design/icons";import { useState, useEffect } from "react";import type { UploadFile } from "antd/es/upload/interface";import { useNavigate } from "react-router-dom";import { uploadFile } from "@/utils/fileUpload";const { Option } = Select;
const { TextArea } = Input;
interface NoticeBoardFormProps {
  id?: string;
  onSuccess?: () => void;
}
const getEmailFailureMessage = (response: any) => {
  if (response?.message) {
    return response.message;
  }
  const failedRecipients = response?.emailDelivery?.failedRecipients || response?.emailFailedRecipients || [];
  if (!failedRecipients.length) {
    return null;
  }
  const failedUsers = failedRecipients
    .map((user: any) => `${user.name || user.email} (${user.email})`)
    .join(", ");
  return `Notice was saved, but email failed for: ${failedUsers}`;
};
const NoticeBoardForm = ({ id, onSuccess }: NoticeBoardFormProps) => {  const [form] = Form.useForm();  const navigate = useNavigate();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isEditMode] = useState<boolean>(!!id);
  const [sendToAll, setSendToAll] = useState<boolean>(false);
  const [roles, setRoles] = useState<any[]>([]);
  const sendEmail = Form.useWatch("sendEmail", form);
  const { mutateAsync: createNoticeBoard, isPending: isCreating } = useCreateNoticeBoard();  const { mutateAsync: updateNoticeBoard, isPending: isUpdating } = useUpdateNoticeBoard();  const { data: noticeBoard, isLoading: isLoadingNotice } = useNoticeBoard(id || '', !!id);  // Fetch users for assigning to notice  const { data: usersData } = useUser({    status: "active",    limit: 100,    page: 1,    keywords: ""  });  // Fetch roles for assigning to notice  const { data: rolesData } = useRole({    page: 1,    limit: 100  });  useEffect(() => {    if (rolesData?.data) {      setRoles(rolesData.data);    }  }, [rolesData]);  useEffect(() => {    if (noticeBoard && isEditMode) {      // Pre-fill the form with notice data      form.setFieldsValue({        title: noticeBoard.title,        description: noticeBoard.description,        sendToAll: noticeBoard.sendToAll,        userIds: noticeBoard.users?.map((user: any) => user.id) || [],        roleIds: noticeBoard.roles?.map((role: any) => role.id) || [],        sendEmail: false, // No need to send email again by default when editing      });      setSendToAll(noticeBoard.sendToAll);      // Handle image if exists      if (noticeBoard.imagePath) {        setFileList([          {            uid: '-1',            name: 'Current image',            status: 'done',            url: `${import.meta.env.VITE_BACKEND_URI}${noticeBoard.imagePath}`,          },        ]);      }    }  }, [noticeBoard, isEditMode, form]);  const handleSubmit = async (values: any) => {    try {      // Prepare image data if uploaded      let imagePath = noticeBoard?.imagePath || '';      if (fileList.length > 0 && fileList[0].originFileObj) {        try {          // Upload the file and get the path          imagePath = await uploadFile(fileList[0].originFileObj, 'notice-board');        } catch (error) {          message.error("Failed to upload image");          return;        }      }      // Force boolean values to true boolean type      const sendEmail = Boolean(values.sendEmail);      const sendToAll = Boolean(values.sendToAll);      // Prepare payload with explicit boolean conversion      const payload = {        ...values,        imagePath,        sendEmail,        sendToAll,      };      if (isEditMode && id) {
        const response = await updateNoticeBoard({ id, payload });
        const emailFailureMessage = getEmailFailureMessage(response);
        if (emailFailureMessage) {
          message.warning(emailFailureMessage, 8);
        } else {
          message.success("Notice updated successfully");
        }
      } else {
        const response = await createNoticeBoard(payload);
        const emailFailureMessage = getEmailFailureMessage(response);
        if (emailFailureMessage) {
          message.warning(emailFailureMessage, 8);
        } else {
          message.success("Notice created successfully");
        }
      }
      if (onSuccess) {        onSuccess();      } else {        navigate("/notice-board");      }    } catch (error) {      message.error("Failed to save notice");    }  };  const handleSendToAllChange = (checked: boolean) => {    setSendToAll(checked);    form.setFieldsValue({ sendToAll: checked });    // Clear selections if sending to all    if (checked) {      form.setFieldsValue({         userIds: [],        roleIds: []      });    }  };  if (isLoadingNotice && isEditMode) {    return <div>Loading notice data...</div>;  }  return (    <Card title={isEditMode ? "Edit Notice" : "Create New Notice"}>      <Form        form={form}        layout="vertical"        onFinish={handleSubmit}        initialValues={{          title: "",          description: "",          sendToAll: false,          userIds: [],          roleIds: [],          sendEmail: false,        }}      >        <Form.Item          name="title"          label="Title"          rules={[{ required: true, message: "Please enter the notice title" }]}        >          <Input placeholder="Enter notice title" />        </Form.Item>        <Form.Item          name="description"          label="Description"          rules={[{ required: true, message: "Please enter the notice description" }]}        >          <TextArea rows={6} placeholder="Enter notice description" />        </Form.Item>        <Form.Item label="Image (Optional)">          <Upload            fileList={fileList}            onChange={({ fileList }) => setFileList(fileList)}            beforeUpload={() => false}            maxCount={1}            listType="picture"          >            <Button icon={<UploadOutlined />}>Select Image</Button>          </Upload>        </Form.Item>        <Divider orientation="left">Notice Distribution</Divider>        <Space>
          <Form.Item name="sendToAll" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch checked={sendToAll} onChange={handleSendToAllChange} />
          </Form.Item>
          <span>Send to all users</span>
        </Space>
        {!sendToAll && (          <>            <Form.Item              name="userIds"              label={<Space><UserOutlined /> Select specific users</Space>}            >              <Select                mode="multiple"                placeholder="Select users"                style={{ width: '100%' }}                optionFilterProp="children"              >                {usersData?.results?.map((user: any) => (                  <Option key={user.id} value={user.id}>                    {user.name} ({user.email})                  </Option>                ))}              </Select>            </Form.Item>            <Form.Item              name="roleIds"              label={<Space><TeamOutlined /> Select roles</Space>}            >              <Select                mode="multiple"                placeholder="Select roles"                style={{ width: '100%' }}              >                {roles.map((role: any) => (                  <Option key={role.id} value={role.id}>                    {role.displayName || role.name}                  </Option>                ))}              </Select>            </Form.Item>          </>        )}        <Divider orientation="left">Notification Options</Divider>        <Space>
          <Form.Item name="sendEmail" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch 
              checked={!!sendEmail}
              onChange={(checked) => {
                form.setFieldsValue({ sendEmail: checked });
              }}
            />
          </Form.Item>
          <span>
            Send email notification to {sendToAll ? "all users" : "selected users"}
          </span>
          <MailOutlined />
        </Space>
        <Form.Item>          <Space>            <Button               type="primary"               htmlType="submit"               loading={isCreating || isUpdating}              icon={<SendOutlined />}            >              {isEditMode ? "Update Notice" : "Post Notice"}            </Button>            <Button onClick={() => navigate("/notice-board")}>              Cancel            </Button>          </Space>        </Form.Item>      </Form>    </Card>  );};export default NoticeBoardForm;
