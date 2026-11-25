import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Tag,
  Space,
  Divider,
} from "antd";
import { PlusOutlined, FormOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCreateClient } from "@/hooks/client/useCreateClient";
import { useClientGroups } from "@/hooks/clientGroup/useClientGroups";
import { useClientSimilarity } from "@/hooks/client/useClientSimilarity";
import { useBusinessOptions } from "@/hooks/useBusinessOptions";
import { listActiveUsers } from "@/service/user.service";
import ClientSimilarityAlert from "./ClientSimilarityAlert";
import CreateClientGroupModal from "./CreateClientGroupModal";

interface QuickCreateClientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (newClient: any) => void;
  initialValues?: Record<string, any>;
}

const QuickCreateClientModal: React.FC<QuickCreateClientModalProps> = ({
  open,
  onClose,
  onSuccess,
  initialValues,
}) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { mutate: createClient, isPending } = useCreateClient({ skipNavigate: true });

  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [newGroupInitialName, setNewGroupInitialName] = useState("");

  const { data: clientGroups = [] } = useClientGroups();
  const {
    legalStatusOptions,
    legalStatusEnumOptions,
    loading: businessOptionsLoading,
  } = useBusinessOptions();

  const { data: usersData } = useQuery({
    queryKey: ["active-users-dropdown"],
    queryFn: listActiveUsers,
    staleTime: 60 * 1000,
  });

  const partnerOptions = useMemo(() => {
    const rawList = Array.isArray(usersData)
      ? usersData
      : Array.isArray((usersData as any)?.results)
      ? (usersData as any).results
      : Array.isArray((usersData as any)?.users)
      ? (usersData as any).users
      : [];

    return rawList.map((u: any) => ({
      label: `${u.name || u.username || "User"} (${u.email || "no email"})`,
      value: u.id,
    }));
  }, [usersData]);

  const groupOptions = useMemo(() => {
    if (!Array.isArray(clientGroups)) return [];
    return clientGroups.map((g) => ({
      label: `${g.name}${g.code ? ` (${g.code})` : ""}`,
      value: g.id,
    }));
  }, [clientGroups]);

  const watchedName = Form.useWatch("name", form) || "";
  const watchedPan = Form.useWatch("panNo", form) || "";
  const watchedShortName = Form.useWatch("shortName", form) || "";

  const [debouncedName, setDebouncedName] = useState("");
  const [debouncedPan, setDebouncedPan] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(watchedName.trim());
      setDebouncedPan(watchedPan.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [watchedName, watchedPan]);

  const { data: similarityData } = useClientSimilarity(
    open ? debouncedName : "",
    open ? debouncedPan : ""
  );

  const suggestedShortNames: string[] = Array.isArray(
    similarityData?.suggestedShortNames
  )
    ? similarityData.suggestedShortNames
    : [];

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        status: "active",
        ...(initialValues || {}),
      });
    }
  }, [open, initialValues, form]);

  const buildPayload = (values: any) => {
    const cleanPan = values.panNo ? String(values.panNo).replace(/\D/g, "") : "";
    const cleanName = values.name
      ? String(values.name).trim().replace(/\s+/g, " ")
      : "";
    const cleanShortName = values.shortName
      ? String(values.shortName).trim().toUpperCase()
      : undefined;

    const payload: Record<string, any> = {
      name: cleanName,
      panNo: cleanPan,
      status: values.status || "active",
    };

    if (cleanShortName) payload.shortName = cleanShortName;
    if (values.clientGroupId) payload.clientGroupId = values.clientGroupId;
    if (values.partnerInChargeId) payload.partnerInChargeId = values.partnerInChargeId;
    if (values.contactPerson?.trim()) payload.contactPerson = values.contactPerson.trim();
    if (values.mobileNo?.trim()) payload.mobileNo = values.mobileNo.trim();
    if (values.email?.trim()) payload.email = values.email.trim();

    if (legalStatusOptions.length > 0 && values.legalStatusId) {
      payload.legalStatusId = values.legalStatusId;
    } else if (values.legalStatusId) {
      payload.legalStatusEnum = values.legalStatusId;
    }

    return payload;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = buildPayload(values);
      createClient(payload, {
        onSuccess: (created) => {
          form.resetFields();
          onClose();
          if (onSuccess) onSuccess(created);
        },
      });
    } catch {
      // Validation errors displayed inline by Form
    }
  };

  const handleSwitchToFullForm = () => {
    const currentValues = form.getFieldsValue();
    onClose();
    navigate("/client/new", { state: { prefill: currentValues } });
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        width={620}
        destroyOnClose
        title="New Client"
        footer={
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
            <Button
              type="link"
              icon={<FormOutlined />}
              onClick={handleSwitchToFullForm}
              className="px-0"
            >
              Open Full Form
            </Button>
            <Space>
              <Button onClick={onClose}>Cancel</Button>
              <Button
                type="primary"
                loading={isPending}
                onClick={handleSubmit}
                icon={<PlusOutlined />}
              >
                Create Client
              </Button>
            </Space>
          </div>
        }
      >
        <div className="pt-2 px-1.5 overflow-x-hidden">
          <ClientSimilarityAlert
            panMatch={similarityData?.panMatch}
            similarClients={similarityData?.similarClients}
            onSelectGroup={(groupId) =>
              form.setFieldsValue({ clientGroupId: groupId })
            }
            onCreateGroupWithBrand={(brandName) => {
              setNewGroupInitialName(brandName);
              setCreateGroupModalOpen(true);
            }}
          />

          <Form
            form={form}
            layout="vertical"
            initialValues={{ status: "active" }}
          >
            <Row gutter={12}>
              <Col xs={24} sm={14}>
                <Form.Item
                  name="name"
                  label="Client Legal Name"
                  rules={[
                    { required: true, message: "Please enter client legal name" },
                    { min: 2, message: "At least 2 characters required" },
                    { max: 100, message: "Cannot exceed 100 characters" },
                  ]}
                >
                  <Input
                    placeholder="e.g. Subha Kastha Furniture Udhyog"
                    onBlur={(e) => {
                      const val = e.target.value.trim().replace(/\s+/g, " ");
                      form.setFieldsValue({ name: val });
                    }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={10}>
                <Form.Item
                  name="panNo"
                  label="PAN / Tax ID"
                  rules={[
                    { required: true, message: "Please enter 9-digit PAN" },
                    {
                      validator: async (_, value) => {
                        if (!value) return Promise.resolve();
                        const cleaned = String(value).replace(/\D/g, "");
                        if (cleaned.length !== 9) {
                          return Promise.reject(
                            new Error("PAN must be 9 numeric digits")
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    placeholder="e.g. 601234567"
                    maxLength={15}
                    onBlur={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, "");
                      form.setFieldsValue({ panNo: cleaned });
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="shortName"
                  label="Short Name"
                  normalize={(val) =>
                    typeof val === "string" ? val.toUpperCase() : val
                  }
                  rules={[{ max: 20, message: "Cannot exceed 20 characters" }]}
                  className={
                    !watchedShortName.trim() && suggestedShortNames.length > 0
                      ? "mb-1.5"
                      : undefined
                  }
                >
                  <Input placeholder="Auto-generated if left blank" />
                </Form.Item>
                {!watchedShortName.trim() && suggestedShortNames.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    <span className="text-xs text-gray-500">Suggested:</span>
                    {suggestedShortNames.map((sn) => (
                      <Tag
                        key={sn}
                        color="blue"
                        className="cursor-pointer font-mono text-xs m-0"
                        onClick={() => form.setFieldsValue({ shortName: sn })}
                      >
                        {sn}
                      </Tag>
                    ))}
                  </div>
                )}
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item name="legalStatusId" label="Legal Status">
                  <Select
                    placeholder="Select legal status"
                    loading={businessOptionsLoading.legalStatuses}
                    options={
                      legalStatusOptions.length > 0
                        ? legalStatusOptions
                        : legalStatusEnumOptions
                    }
                    allowClear
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item name="clientGroupId" label="Client Group">
                  <Select
                    placeholder="Assign to group"
                    options={groupOptions}
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        <Divider style={{ margin: "6px 0" }} />
                        <Button
                          type="text"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            const currentName = form.getFieldValue("name") || "";
                            const brandGuess = currentName.split(/[- ]/)[0] || "";
                            setNewGroupInitialName(
                              brandGuess ? `${brandGuess} Group` : ""
                            );
                            setCreateGroupModalOpen(true);
                          }}
                          className="w-full text-left text-blue-600"
                        >
                          Create New Group
                        </Button>
                      </>
                    )}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item name="partnerInChargeId" label="Partner in Charge">
                  <Select
                    placeholder="Assign partner/lead"
                    options={partnerOptions}
                    allowClear
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col xs={24} sm={8}>
                <Form.Item name="contactPerson" label="Contact Person">
                  <Input placeholder="Full name" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={8}>
                <Form.Item
                  name="mobileNo"
                  label="Mobile No."
                  rules={[
                    {
                      pattern: /^9[78]\d{8}$/,
                      message: "Enter valid 10-digit mobile",
                    },
                  ]}
                >
                  <Input
                    placeholder="98XXXXXXXX"
                    maxLength={15}
                    onBlur={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, "");
                      form.setFieldsValue({ mobileNo: cleaned });
                    }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={8}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ type: "email", message: "Invalid email" }]}
                >
                  <Input placeholder="info@company.com" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>

      <CreateClientGroupModal
        open={createGroupModalOpen}
        initialName={newGroupInitialName}
        onClose={() => setCreateGroupModalOpen(false)}
        onSuccess={(newGroup) => {
          if (newGroup?.id) {
            form.setFieldsValue({ clientGroupId: newGroup.id });
          }
        }}
      />
    </>
  );
};

export default QuickCreateClientModal;
