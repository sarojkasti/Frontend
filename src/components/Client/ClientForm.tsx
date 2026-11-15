import { useCreateClient } from "@/hooks/client/useCreateClient";
import { useEditClient } from "@/hooks/client/useEditClient";
import { useBusinessOptions } from "@/hooks/useBusinessOptions";
import { useClientGroups } from "@/hooks/clientGroup/useClientGroups";
import { useClientSimilarity } from "@/hooks/client/useClientSimilarity";
import { listActiveUsers } from "@/service/user.service";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Tag, Space, Divider } from "antd";
import { PlusOutlined, BankOutlined, UserOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import moment from "moment";
import { useEffect, useState, useMemo } from "react";
import FormInputWrapper from "../FormInputWrapper";
import FormSelectWrapper from "../FormSelectWrapper";
import CreateClientGroupModal from "./CreateClientGroupModal";
import ClientSimilarityAlert from "./ClientSimilarityAlert";
import { 
  countries, 
  getStateOptions, 
  getDistrictOptions, 
  getLocalJurisdictionOptions 
} from "@/utils/locationData";

interface ClientFormProps {
  editClientData?: any;
  id?: string;
}

const ClientForm = ({ editClientData, id }: ClientFormProps) => {
  const [form] = Form.useForm();
  const { mutate } = useCreateClient();
  const { mutate: mutateEdit } = useEditClient();
  const [selectedCountry, setSelectedCountry] = useState<string | null>("nepal");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  // Group modal state
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [newGroupInitialName, setNewGroupInitialName] = useState("");

  // Business options
  const { 
    businessSizeOptions, 
    businessNatureOptions,
    legalStatusOptions,
    businessSizeEnumOptions,
    businessNatureEnumOptions,
    legalStatusEnumOptions,
    loading: businessOptionsLoading 
  } = useBusinessOptions();

  // Client Groups & Active Staff
  const { data: clientGroups = [] } = useClientGroups();
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
      label: `${g.name}${g.code ? ` (${g.code})` : ""} - ${g.memberCount || 0} members`,
      value: g.id,
    }));
  }, [clientGroups]);

  // Watch name and PAN for real-time fuzzy duplicate detection & short name suggestions
  const watchedName = Form.useWatch("name", form) || "";
  const watchedPan = Form.useWatch("panNo", form) || "";

  // Debounced values
  const [debouncedName, setDebouncedName] = useState("");
  const [debouncedPan, setDebouncedPan] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(watchedName.trim());
      setDebouncedPan(watchedPan.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [watchedName, watchedPan]);

  const { data: similarityData } = useClientSimilarity(debouncedName, debouncedPan, id);

  const suggestedShortNames: string[] = Array.isArray(similarityData?.suggestedShortNames)
    ? similarityData.suggestedShortNames
    : [];

  useEffect(() => {
    if (id) {
      if (editClientData) {
        const registeredDate = editClientData.registeredDate
          ? moment(editClientData.registeredDate)
          : null;

        const formData = {
          ...editClientData,
          registeredDate,
          businessSizeId: editClientData.businessSize?.id || null,
          businessSizeEnum: !editClientData.businessSize?.id ? editClientData.businessSizeEnum : null,
          industryNatureId: editClientData.industryNature?.id || null,
          industryNatureEnum: !editClientData.industryNature?.id ? editClientData.industryNatureEnum : null,
          legalStatusId: editClientData.legalStatus?.id || null,
          legalStatusEnum: !editClientData.legalStatus?.id ? editClientData.legalStatusEnum : null,
          clientGroupId: editClientData.clientGroupId || editClientData.clientGroup?.id || null,
          partnerInChargeId: editClientData.partnerInChargeId || editClientData.partnerInCharge?.id || null,
        };
        
        form.setFieldsValue(formData);
        
        setSelectedCountry(editClientData.country || "nepal");
        setSelectedState(editClientData.state || null);
        setSelectedDistrict(editClientData.district || null);
      }
    } else {
      form.resetFields();
      form.setFieldsValue({ status: "active", country: "nepal" });
      setSelectedCountry("nepal");
      setSelectedState(null);
      setSelectedDistrict(null);
    }
  }, [editClientData, form, id]);

  const handleFinish = (values: any) => {
    // Sanitize PAN: strip all non-digits
    const cleanPan = values.panNo ? String(values.panNo).replace(/\D/g, "") : "";
    const cleanName = values.name ? String(values.name).trim().replace(/\s+/g, " ") : "";
    const cleanShortName = values.shortName ? String(values.shortName).trim() : undefined;

    const payload = {
      ...values,
      name: cleanName,
      panNo: cleanPan,
      shortName: cleanShortName,
      businessSizeId: values.businessSizeId || null,
      businessSizeEnum: !values.businessSizeId ? values.businessSizeEnum : null,
      industryNatureId: values.industryNatureId || null,
      industryNatureEnum: !values.industryNatureId ? values.industryNatureEnum : null,
      legalStatusId: values.legalStatusId || null,
      legalStatusEnum: !values.legalStatusId ? values.legalStatusEnum : null,
      clientGroupId: values.clientGroupId || null,
      partnerInChargeId: values.partnerInChargeId || null,
    };
    
    if (id) {
      mutateEdit({ id, payload });
    } else {
      mutate(payload);
    }
  };

  return (
    <>
      <Card className="shadow-xs border-slate-200">
        {/* Real-time Fuzzy Duplicate & PAN Collision Warning Alert */}
        <ClientSimilarityAlert
          panMatch={similarityData?.panMatch}
          similarClients={similarityData?.similarClients}
          onSelectGroup={(groupId) => form.setFieldsValue({ clientGroupId: groupId })}
          onCreateGroupWithBrand={(brandName) => {
            setNewGroupInitialName(brandName);
            setCreateGroupModalOpen(true);
          }}
        />

        <Form
          form={form}
          onFinish={handleFinish}
          layout="vertical"
          initialValues={{ status: "active", country: "nepal" }}
        >
          <Row gutter={24}>
            {/* Name Field */}
            <Col span={8}>
              <Form.Item
                name="name"
                label={
                  <span className="font-semibold text-slate-700">
                    Client Legal Name <span className="text-red-500">*</span>
                  </span>
                }
                rules={[
                  { required: true, message: "Please input the client legal name" },
                  { min: 2, message: "Client name must be at least 2 characters" },
                  { max: 100, message: "Name cannot exceed 100 characters" },
                ]}
              >
                <Input
                  placeholder="e.g. Hanuman-DS Joint Venture, Artha Consulting"
                  className="h-[46px] bg-[#eee] w-full"
                  onBlur={(e) => {
                    const val = e.target.value.trim().replace(/\s+/g, " ");
                    form.setFieldsValue({ name: val });
                  }}
                />
              </Form.Item>
            </Col>

            {/* Short Name Field with Smart Suggestions */}
            <Col span={8}>
              <Form.Item
                name="shortName"
                label={
                  <span className="font-semibold text-slate-700">
                    Short Name / Acronym <span className="text-red-500">*</span>
                  </span>
                }
                rules={[
                  { required: true, message: "Please input or select a short name" },
                  { max: 20, message: "Short name cannot exceed 20 characters" },
                ]}
                className="mb-1"
              >
                <Input
                  placeholder="e.g. ACPL, HDS, SMCL"
                  className="h-[46px] bg-[#eee] w-full uppercase"
                />
              </Form.Item>

              {/* Suggestion Chips */}
              {suggestedShortNames.length > 0 && (
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  <span className="text-[11px] text-slate-500 font-medium">Suggested:</span>
                  {suggestedShortNames.map((sn) => (
                    <Tag
                      key={sn}
                      color="blue"
                      className="cursor-pointer hover:bg-blue-600 hover:text-white transition-colors text-[11px] font-mono m-0"
                      onClick={() => form.setFieldsValue({ shortName: sn })}
                      title="Click to apply"
                    >
                      {sn}
                    </Tag>
                  ))}
                </div>
              )}
            </Col>

            {/* PAN No Field with Nepal 9-Digit Validation & Sanitizer */}
            <Col span={8}>
              <Form.Item
                name="panNo"
                label={
                  <span className="font-semibold text-slate-700">
                    PAN / Tax ID <span className="text-red-500">*</span>
                  </span>
                }
                rules={[
                  { required: true, message: "Please input the PAN No" },
                  {
                    validator: async (_, value) => {
                      if (!value) return Promise.resolve();
                      const cleaned = String(value).replace(/\D/g, "");
                      if (cleaned.length !== 9) {
                        return Promise.reject(new Error("Nepal PAN must be exactly 9 numeric digits"));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder="e.g. 601234567 (9 digits)"
                  className="h-[46px] bg-[#eee] w-full font-mono"
                  maxLength={15}
                  onBlur={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "");
                    form.setFieldsValue({ panNo: cleaned });
                  }}
                />
              </Form.Item>
            </Col>

            {/* Client Group Selector with Quick-Add Modal */}
            <Col span={8}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Client Group</label>
                <Button
                  type="link"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    const currentName = form.getFieldValue("name") || "";
                    const brandGuess = currentName.split(/[- ]/)[0] || "";
                    setNewGroupInitialName(brandGuess ? `${brandGuess} Group` : "");
                    setCreateGroupModalOpen(true);
                  }}
                  className="p-0 text-xs h-auto text-blue-600 font-medium"
                >
                  + New Group
                </Button>
              </div>
              <Form.Item name="clientGroupId" className="mb-4">
                <Select
                  placeholder="Select or assign to a Group (e.g. Hanuman Group)"
                  options={groupOptions}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  className="h-[46px] w-full"
                />
              </Form.Item>
            </Col>

            {/* Partner in Charge (Internal Staff Account Lead) */}
            <Col span={8}>
              <Form.Item
                name="partnerInChargeId"
                label={<span className="font-semibold text-slate-700">Partner in Charge / Engagement Lead</span>}
              >
                <Select
                  placeholder="Assign internal partner/director"
                  options={partnerOptions}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  className="h-[46px] w-full"
                />
              </Form.Item>
            </Col>

            {/* Registered Date Field */}
            <Col span={8}>
              <Form.Item
                name="registeredDate"
                label={<span className="font-semibold text-slate-700">Registered Date</span>}
              >
                <DatePicker className="h-[46px] bg-[#eee] w-full border-none" style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            {/* Status Field */}
            <Col span={8}>
              <FormSelectWrapper
                id="status"
                name="status"
                label="Status"
                rules={[{ required: true, message: "Please select the status" }]}
                options={[
                  { value: "active", label: "Active" },
                  { value: "suspended", label: "Suspended" },
                  { value: "archive", label: "Archive" },
                ]}
                classname="h-[46px] bg-[#eee] w-full"
              />
            </Col>

            {/* Country Field */}
            <Col span={8}>
              <FormSelectWrapper
                id="country"
                name="country"
                label="Country"
                rules={[{ required: true, message: "Please select the country" }]}
                placeholder="Select country"
                options={countries}
                changeHandler={(value: string) => {
                  setSelectedCountry(value);
                  form.setFieldsValue({ state: undefined, district: undefined, localJurisdiction: undefined });
                  setSelectedState(null);
                  setSelectedDistrict(null);
                }}
              />
            </Col>

            {/* State Field */}
            <Col span={8}>
              <FormSelectWrapper
                id="state"
                name="state"
                label="State / Province"
                rules={[{ required: true, message: "Please select the state/province" }]}
                placeholder="Select state/province"
                options={selectedCountry ? getStateOptions(selectedCountry) : []}
                disabled={!selectedCountry}
                changeHandler={(value: string) => {
                  setSelectedState(value);
                  form.setFieldsValue({ district: undefined, localJurisdiction: undefined });
                  setSelectedDistrict(null);
                }}
              />
            </Col>

            {/* District Field */}
            <Col span={8}>
              <FormSelectWrapper
                id="district"
                name="district"
                label="District"
                rules={[{ required: true, message: "Please select the district" }]}
                placeholder="Select district"
                options={selectedState ? getDistrictOptions(selectedState) : []}
                disabled={!selectedState}
                changeHandler={(value: string) => {
                  setSelectedDistrict(value);
                  form.setFieldsValue({ localJurisdiction: undefined });
                }}
              />
            </Col>

            {/* Local Jurisdiction Field */}
            <Col span={8}>
              <FormSelectWrapper
                id="localJurisdiction"
                name="localJurisdiction"
                label="Local Jurisdiction"
                rules={[{ required: true, message: "Please select the local jurisdiction" }]}
                placeholder="Select local jurisdiction"
                options={selectedDistrict ? getLocalJurisdictionOptions(selectedDistrict) : []}
                disabled={!selectedDistrict}
              />
            </Col>

            {/* Ward No Field (Optional) */}
            <Col span={8}>
              <FormInputWrapper
                id="wardNo"
                name="wardNo"
                label="Ward No"
                rules={[{ max: 10, message: "Ward No cannot exceed 10 characters" }]}
                classname="h-[46px] bg-[#eee] w-full"
              />
            </Col>

            {/* Locality Field */}
            <Col span={8}>
              <FormInputWrapper
                id="locality"
                name="locality"
                label="Locality / Tole"
                rules={[
                  { required: true, message: "Please input the locality" },
                  { max: 100, message: "Locality cannot exceed 100 characters" },
                ]}
                classname="h-[46px] bg-[#eee] w-full"
              />
            </Col>

            {/* Legal Status Field */}
            <Col span={8}>
              <FormSelectWrapper
                id="legalStatusId"
                name="legalStatusId"
                label="Legal Status"
                rules={[{ required: true, message: "Please select the legal status" }]}
                placeholder="Select legal status"
                loading={businessOptionsLoading.legalStatuses}
                options={legalStatusOptions.length > 0 ? legalStatusOptions : legalStatusEnumOptions}
                optionFilterProp="label"
                showSearch
              />
              <Form.Item name="legalStatusEnum" hidden>
                <Select options={legalStatusEnumOptions} />
              </Form.Item>
            </Col>

            {/* Business Size Field */}
            <Col span={8}>
              <FormSelectWrapper
                id="businessSizeId"
                name="businessSizeId"
                label="Business Size (Industrial Enterprise Act)"
                rules={[{ required: true, message: "Please select the business size" }]}
                placeholder="Select business size"
                loading={businessOptionsLoading.businessSizes}
                options={businessSizeOptions.length > 0 ? businessSizeOptions : businessSizeEnumOptions}
                optionFilterProp="label"
                showSearch
              />
              <Form.Item name="businessSizeEnum" hidden>
                <Select options={businessSizeEnumOptions} />
              </Form.Item>
            </Col>

            {/* Industry Nature Field */}
            <Col span={8}>
              <FormSelectWrapper
                id="industryNatureId"
                name="industryNatureId"
                label="Industry Nature"
                rules={[{ required: true, message: "Please select the industry nature" }]}
                placeholder="Select industry nature"
                loading={businessOptionsLoading.businessNatures}
                options={businessNatureOptions.length > 0 ? businessNatureOptions : businessNatureEnumOptions}
                optionFilterProp="label"
                showSearch
              />
              <Form.Item name="industryNatureEnum" hidden>
                <Select options={businessNatureEnumOptions} />
              </Form.Item>
            </Col>

            {/* Mobile No Field with Nepal Mobile Validation */}
            <Col span={8}>
              <Form.Item
                name="mobileNo"
                label={<span className="font-semibold text-slate-700">Mobile No. (Nepal 10-digit)</span>}
                rules={[
                  {
                    pattern: /^9[78]\d{8}$/,
                    message: "Please enter a valid 10-digit mobile number starting with 98 or 97",
                  },
                ]}
              >
                <Input
                  placeholder="e.g. 9851000000"
                  className="h-[46px] bg-[#eee] w-full"
                  maxLength={15}
                  onBlur={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "");
                    form.setFieldsValue({ mobileNo: cleaned });
                  }}
                />
              </Form.Item>
            </Col>

            {/* Telephone No Field */}
            <Col span={8}>
              <Form.Item
                name="telephoneNo"
                label={<span className="font-semibold text-slate-700">Telephone / Landline</span>}
                rules={[
                  { max: 15, message: "Telephone cannot exceed 15 characters" },
                ]}
              >
                <Input
                  placeholder="e.g. 014400000"
                  className="h-[46px] bg-[#eee] w-full"
                />
              </Form.Item>
            </Col>

            {/* Email Field */}
            <Col span={8}>
              <FormInputWrapper
                id="email"
                name="email"
                label="Official Email"
                rules={[{ type: "email", message: "Please input a valid email address" }]}
                classname="h-[46px] bg-[#eee] w-full"
              />
            </Col>

            {/* Website Field */}
            <Col span={8}>
              <FormInputWrapper
                id="website"
                name="website"
                label="Website URL"
                classname="h-[46px] bg-[#eee] w-full"
              />
            </Col>
          </Row>

          <Divider orientation="left" className="text-xs text-slate-500 font-semibold uppercase tracking-wider my-4">
            <Space>
              <BankOutlined /> Banking & Audit Details
            </Space>
          </Divider>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item name="bankName" label="Bank Name">
                <Input placeholder="e.g. Nabil Bank, Global IME" className="h-[46px] bg-[#eee] w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="bankAccountNumber" label="Account Number">
                <Input placeholder="e.g. 01201017500001" className="h-[46px] bg-[#eee] w-full font-mono" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="bankBranch" label="Bank Branch">
                <Input placeholder="e.g. New Road Branch" className="h-[46px] bg-[#eee] w-full" />
              </Form.Item>
            </Col>

            {/* If Edit Mode: Audit Note */}
            {id && (
              <Col span={24}>
                <Form.Item
                  name="lastEditReason"
                  label={
                    <span className="font-semibold text-amber-700">
                      Reason for Update / Change Log Note (Audit Trail)
                    </span>
                  }
                  rules={[{ max: 500, message: "Reason cannot exceed 500 characters" }]}
                >
                  <Input.TextArea
                    rows={2}
                    placeholder="Document the justification for this update (e.g. Changed address per new tax clearance, updated contact person)"
                    className="bg-[#fefce8] border-amber-300"
                  />
                </Form.Item>
              </Col>
            )}

            {/* Submit Button */}
            <Col span={24} className="mt-2">
              <Form.Item>
                <Space size={12}>
                  <Button type="primary" htmlType="submit" size="large" className="px-8 font-semibold">
                    {id ? "Save Changes" : "Create Client"}
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Modal for creating a new Client Group inline */}
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

export default ClientForm;
