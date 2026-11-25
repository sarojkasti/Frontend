import { useCreateClient } from "@/hooks/client/useCreateClient";
import { useEditClient } from "@/hooks/client/useEditClient";
import { useBusinessOptions } from "@/hooks/useBusinessOptions";
import { useClientGroups } from "@/hooks/clientGroup/useClientGroups";
import { useClientSimilarity } from "@/hooks/client/useClientSimilarity";
import usePermissionChecker from "@/hooks/usePermissionChecker";
import { listActiveUsers } from "@/service/user.service";
import { useQuery } from "@tanstack/react-query";
import {
  AutoComplete,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Switch,
  Tag,
  Space,
  Divider,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CreateClientGroupModal from "./CreateClientGroupModal";
import ClientSimilarityAlert from "./ClientSimilarityAlert";
import {
  countries,
  getStateOptions,
  getDistrictOptions,
  getLocalJurisdictionOptions,
} from "@/utils/locationData";

interface ClientFormProps {
  editClientData?: any;
  id?: string;
  prefillData?: Record<string, any>;
}

const PORTAL_PRESETS = [
  {
    name: "IRD Portal (Inland Revenue PAN)",
    website: "https://taxpayerportal.ird.gov.np",
  },
  {
    name: "OCR Portal (Office of Company Registrar)",
    website: "https://ocr.gov.np",
  },
  {
    name: "SSF Portal (Social Security Fund)",
    website: "https://ssf.gov.np",
  },
  {
    name: "Customs Portal (Department of Customs)",
    website: "https://customs.gov.np",
  },
];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cleanString = (val: any): string | undefined => {
  if (val === undefined || val === null) return undefined;
  const trimmed = String(val).trim();
  return trimmed === "" ? undefined : trimmed;
};

const ClientForm = ({ editClientData, id, prefillData }: ClientFormProps) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const permissionChecker = usePermissionChecker();
  const canManagePortalCredentials = permissionChecker.isSuperAdmin();
  const { mutate, isPending: isCreating } = useCreateClient();
  const { mutate: mutateEdit, isPending: isEditing } = useEditClient();

  const [selectedCountry, setSelectedCountry] = useState<string | null>("nepal");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const [contactPersonMode, setContactPersonMode] = useState<"board" | "custom">("custom");
  const [selectedBoardIndex, setSelectedBoardIndex] = useState<number | undefined>(undefined);

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
    loading: businessOptionsLoading,
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
      label: `${g.name}${g.code ? ` (${g.code})` : ""}`,
      value: g.id,
    }));
  }, [clientGroups]);

  // Watch fields
  const watchedName = Form.useWatch("name", form) || "";
  const watchedPan = Form.useWatch("panNo", form) || "";
  const watchedShortName = Form.useWatch("shortName", form) || "";
  const watchedBoardMembers = Form.useWatch("boardMembers", form) || [];

  const [debouncedName, setDebouncedName] = useState("");
  const [debouncedPan, setDebouncedPan] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(watchedName.trim());
      setDebouncedPan(watchedPan.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [watchedName, watchedPan]);

  // In edit mode, only check similarity when user actually modifies name or PAN
  const isIdentityModified = useMemo(() => {
    if (!id) return true;
    if (!editClientData) return false;
    const origName = (editClientData.name || "").trim();
    const origPan = String(editClientData.panNo || "").replace(/\D/g, "");
    return (
      debouncedName !== origName ||
      debouncedPan.replace(/\D/g, "") !== origPan
    );
  }, [id, editClientData, debouncedName, debouncedPan]);

  const shouldFetchSimilarity =
    !id || isIdentityModified || !watchedShortName.trim();

  const { data: similarityData } = useClientSimilarity(
    shouldFetchSimilarity ? debouncedName : "",
    shouldFetchSimilarity ? debouncedPan : "",
    id
  );

  const suggestedShortNames: string[] = Array.isArray(
    similarityData?.suggestedShortNames
  )
    ? similarityData.suggestedShortNames
    : [];

  useEffect(() => {
    if (id) {
      if (editClientData) {
        const registeredDate = editClientData.registeredDate
          ? moment(editClientData.registeredDate)
          : null;

        const mappedBoard = Array.isArray(editClientData.boardMembers)
          ? editClientData.boardMembers.map((m: any) => ({
              id: m.id,
              name: m.name,
              designation: m.designation,
              mobileNo: m.mobileNo,
              telephoneNo: m.telephoneNo,
              email: m.email,
              appointedDate: m.appointedDate ? moment(m.appointedDate) : null,
              isActive: m.isActive !== undefined ? m.isActive : true,
              isContactPerson: Boolean(m.isContactPerson),
            }))
          : [];

        const boardIdx = mappedBoard.findIndex(
          (m: any) =>
            m.isContactPerson ||
            (editClientData.contactPersonBoardMemberId &&
              m.id === editClientData.contactPersonBoardMemberId)
        );

        if (boardIdx >= 0) {
          setContactPersonMode("board");
          setSelectedBoardIndex(boardIdx);
        } else {
          setContactPersonMode("custom");
          setSelectedBoardIndex(undefined);
        }

        const formData = {
          ...editClientData,
          registeredDate,
          boardMembers: mappedBoard,
          businessSizeId:
            editClientData.businessSize?.id ||
            editClientData.businessSizeEnum ||
            null,
          industryNatureId:
            editClientData.industryNature?.id ||
            editClientData.industryNatureEnum ||
            null,
          legalStatusId:
            editClientData.legalStatus?.id ||
            editClientData.legalStatusEnum ||
            null,
          clientGroupId:
            editClientData.clientGroupId ||
            editClientData.clientGroup?.id ||
            null,
          partnerInChargeId:
            editClientData.partnerInChargeId ||
            editClientData.partnerInCharge?.id ||
            null,
          effectiveDate: null,
        };

        form.setFieldsValue(formData);

        setSelectedCountry(editClientData.country || "nepal");
        setSelectedState(editClientData.state || null);
        setSelectedDistrict(editClientData.district || null);
      }
    } else {
      form.resetFields();
      const initialCountry = prefillData?.country || "nepal";
      form.setFieldsValue({
        status: "active",
        country: initialCountry,
        ...(prefillData || {}),
      });
      setSelectedCountry(initialCountry);
      setSelectedState(prefillData?.state || null);
      setSelectedDistrict(prefillData?.district || null);
      setContactPersonMode("custom");
      setSelectedBoardIndex(undefined);
    }
  }, [editClientData, form, id, prefillData]);

  // Options derived dynamically from Board Members in the form
  const boardMemberOptions = useMemo(() => {
    if (!Array.isArray(watchedBoardMembers)) return [];
    return watchedBoardMembers
      .map((m: any, idx: number) => ({
        index: idx,
        name: m?.name?.trim(),
        designation: m?.designation?.trim(),
      }))
      .filter((item) => Boolean(item.name))
      .map((item) => ({
        value: item.index,
        label: item.designation
          ? `${item.name} (${item.designation})`
          : item.name,
      }));
  }, [watchedBoardMembers]);

  // Sync selected board member into contactPerson fields when mode is 'board'
  const handleSelectBoardContact = (idx: number) => {
    setSelectedBoardIndex(idx);
    const list = form.getFieldValue("boardMembers") || [];
    const chosen = list[idx];
    if (chosen) {
      form.setFieldsValue({
        contactPerson: chosen.name || "",
        contactPersonDesignation: chosen.designation || "",
        contactPersonPhone: chosen.mobileNo || chosen.telephoneNo || "",
        contactPersonEmail: chosen.email || "",
      });
    }
  };

  const handleFinish = (values: any) => {
    const cleanPan = values.panNo ? String(values.panNo).replace(/\D/g, "") : "";
    const cleanName = values.name
      ? String(values.name).trim().replace(/\s+/g, " ")
      : "";
    const cleanShortName = cleanString(values.shortName)?.toUpperCase();

    const rawBizSize = cleanString(values.businessSizeId);
    const rawIndNature = cleanString(values.industryNatureId);
    const rawLegalStatus = cleanString(values.legalStatusId);

    // Prepare board members array
    const rawBoard = Array.isArray(values.boardMembers) ? values.boardMembers : [];
    const formattedBoardMembers = rawBoard
      .filter((m: any) => m?.name?.trim() && m?.designation?.trim())
      .map((m: any, idx: number) => {
        const isSelectedContact =
          contactPersonMode === "board" && selectedBoardIndex === idx;
        return {
          ...(m.id ? { id: m.id } : {}),
          name: m.name.trim(),
          designation: m.designation.trim(),
          mobileNo: cleanString(m.mobileNo),
          telephoneNo: cleanString(m.telephoneNo),
          email: cleanString(m.email),
          appointedDate: m.appointedDate
            ? moment(m.appointedDate).format("YYYY-MM-DD")
            : undefined,
          isActive: m.isActive !== undefined ? m.isActive : true,
          isContactPerson: isSelectedContact,
        };
      });

    // Resolve Contact Person info
    let contactPerson = cleanString(values.contactPerson);
    let contactPersonDesignation = cleanString(values.contactPersonDesignation);
    let contactPersonPhone = cleanString(values.contactPersonPhone);
    let contactPersonEmail = cleanString(values.contactPersonEmail);
    let contactPersonBoardMemberId: string | null = null;

    if (contactPersonMode === "board" && selectedBoardIndex !== undefined) {
      const chosen = formattedBoardMembers[selectedBoardIndex];
      if (chosen) {
        contactPerson = chosen.name;
        contactPersonDesignation = chosen.designation;
        contactPersonPhone = chosen.mobileNo || chosen.telephoneNo;
        contactPersonEmail = chosen.email;
        contactPersonBoardMemberId = chosen.id || null;
      }
    }

    const payload: Record<string, any> = {
      name: cleanName,
      panNo: cleanPan,
      shortName: cleanShortName,
      status: values.status || "active",
      about: cleanString(values.about),
      registeredDate: values.registeredDate
        ? moment(values.registeredDate).format("YYYY-MM-DD")
        : undefined,
      effectiveDate: values.effectiveDate
        ? moment(values.effectiveDate).toISOString()
        : undefined,
      country: cleanString(values.country),
      state: cleanString(values.state),
      district: cleanString(values.district),
      localJurisdiction: cleanString(values.localJurisdiction),
      wardNo: cleanString(values.wardNo),
      locality: cleanString(values.locality),
      mobileNo: cleanString(values.mobileNo),
      telephoneNo: cleanString(values.telephoneNo),
      email: cleanString(values.email),
      website: cleanString(values.website),
      bankName: cleanString(values.bankName),
      bankAccountNumber: cleanString(values.bankAccountNumber),
      bankBranch: cleanString(values.bankBranch),
      contactPerson,
      contactPersonDesignation,
      contactPersonPhone,
      contactPersonEmail,
      contactPersonBoardMemberId,
      isVatRegistered: Boolean(values.isVatRegistered),
      taxOffice: cleanString(values.taxOffice),
      ocrRegNo: cleanString(values.ocrRegNo),
      boardMembers: formattedBoardMembers,
      clientGroupId: cleanString(values.clientGroupId) || null,
      partnerInChargeId: cleanString(values.partnerInChargeId) || null,
      businessSizeId: rawBizSize && UUID_REGEX.test(rawBizSize) ? rawBizSize : null,
      businessSizeEnum:
        rawBizSize && !UUID_REGEX.test(rawBizSize) ? rawBizSize : null,
      industryNatureId:
        rawIndNature && UUID_REGEX.test(rawIndNature) ? rawIndNature : null,
      industryNatureEnum:
        rawIndNature && !UUID_REGEX.test(rawIndNature) ? rawIndNature : null,
      legalStatusId:
        rawLegalStatus && UUID_REGEX.test(rawLegalStatus)
          ? rawLegalStatus
          : null,
      legalStatusEnum:
        rawLegalStatus && !UUID_REGEX.test(rawLegalStatus)
          ? rawLegalStatus
          : null,
    };

    if (id && values.lastEditReason) {
      payload.lastEditReason = cleanString(values.lastEditReason);
    }

    if (!id && Array.isArray(values.portalCredentials)) {
      const validCreds = values.portalCredentials.filter(
        (c: any) => c?.portalName?.trim() && c?.loginUser?.trim() && c?.password
      );
      if (validCreds.length > 0) {
        payload.portalCredentials = validCreds.map((c: any) => ({
          portalName: c.portalName.trim(),
          loginUser: c.loginUser.trim(),
          password: c.password,
          website: cleanString(c.website),
          description: cleanString(c.description),
          status: "active",
        }));
      }
    }

    if (id) {
      mutateEdit({ id, payload });
    } else {
      mutate(payload);
    }
  };

  return (
    <>
      <Card>
        <ClientSimilarityAlert
          panMatch={isIdentityModified ? similarityData?.panMatch : null}
          similarClients={
            isIdentityModified ? similarityData?.similarClients : []
          }
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
          onFinish={handleFinish}
          layout="vertical"
          initialValues={{ status: "active", country: "nepal" }}
        >
          {/* 1. Basic Information & About */}
          <Divider orientation="left" style={{ marginTop: 0 }}>
            Basic Information
          </Divider>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="name"
                label="Client Legal Name"
                rules={[
                  { required: true, message: "Please enter client legal name" },
                  { min: 2, message: "Must be at least 2 characters" },
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

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="shortName"
                label="Short Name"
                normalize={(val) =>
                  typeof val === "string" ? val.toUpperCase() : val
                }
                rules={[{ max: 20, message: "Cannot exceed 20 characters" }]}
                className={
                  !watchedShortName.trim() && suggestedShortNames.length > 0
                    ? "mb-1"
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

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="panNo"
                label="PAN / Tax ID"
                rules={[
                  { required: true, message: "Please input the 9-digit PAN" },
                  {
                    validator: async (_, value) => {
                      if (!value) return Promise.resolve();
                      const cleaned = String(value).replace(/\D/g, "");
                      if (cleaned.length !== 9) {
                        return Promise.reject(
                          new Error("PAN must be exactly 9 numeric digits")
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

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="clientGroupId" label="Client Group">
                <Select
                  placeholder="Assign to a group"
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

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="partnerInChargeId" label="Partner in Charge">
                <Select
                  placeholder="Assign internal partner/director"
                  options={partnerOptions}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Form.Item name="registeredDate" label="Registered Date">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: "Please select status" }]}
              >
                <Select
                  options={[
                    { value: "active", label: "Active" },
                    { value: "suspended", label: "Suspended" },
                    { value: "archive", label: "Archived" },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="about" label="About Client">
                <Input.TextArea
                  rows={2}
                  placeholder="Brief overview of the client's business operations, background, or engagement scope"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 2. Board Members & Designated Contact Person */}
          <Divider orientation="left">Board Members & Contact Person</Divider>

          <Form.List name="boardMembers">
            {(fields, { add, remove }) => (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Board of Directors / Partners
                  </span>
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => add({ isActive: true })}
                  >
                    Add Board Member
                  </Button>
                </div>

                {fields.map(({ key, name, ...restField }, index) => (
                  <div
                    key={key}
                    className="p-3 mb-2 border border-gray-200 rounded-md bg-gray-50/40"
                  >
                    <Row gutter={12} align="middle">
                      <Col xs={24} sm={12} md={5}>
                        <Form.Item
                          {...restField}
                          name={[name, "name"]}
                          label="Member Name"
                          rules={[{ required: true, message: "Enter name" }]}
                          className="mb-2"
                        >
                          <Input placeholder="Full name" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "designation"]}
                          label="Designation"
                          rules={[{ required: true, message: "Enter role" }]}
                          className="mb-2"
                        >
                          <Input placeholder="e.g. Director, Chairman" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "mobileNo"]}
                          label="Mobile No."
                          className="mb-2"
                        >
                          <Input placeholder="98XXXXXXXX" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "email"]}
                          label="Email"
                          rules={[{ type: "email", message: "Invalid email" }]}
                          className="mb-2"
                        >
                          <Input placeholder="email@domain.com" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} md={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "appointedDate"]}
                          label="Appointed Date"
                          className="mb-2"
                        >
                          <DatePicker style={{ width: "100%" }} placeholder="Effective date" />
                        </Form.Item>
                      </Col>

                      <Col xs={12} sm={6} md={2}>
                        <Form.Item
                          {...restField}
                          name={[name, "isActive"]}
                          label="Active"
                          valuePropName="checked"
                          initialValue={true}
                          className="mb-2"
                        >
                          <Switch size="small" />
                        </Form.Item>
                      </Col>

                      <Col xs={12} sm={6} md={1} className="text-right">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            if (selectedBoardIndex === index) {
                              setSelectedBoardIndex(undefined);
                            } else if (
                              selectedBoardIndex !== undefined &&
                              selectedBoardIndex > index
                            ) {
                              setSelectedBoardIndex(selectedBoardIndex - 1);
                            }
                            remove(name);
                          }}
                          title="Remove board member"
                        />
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            )}
          </Form.List>

          {/* Primary / Designated Contact Person Selection */}
          <div className="p-3 border border-gray-200 rounded-md mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                <UserSwitchOutlined />
                Primary Contact Person
              </span>
              <Radio.Group
                value={contactPersonMode}
                onChange={(e) => {
                  const mode = e.target.value;
                  setContactPersonMode(mode);
                  if (mode === "custom") {
                    setSelectedBoardIndex(undefined);
                  }
                }}
                size="small"
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="board" disabled={boardMemberOptions.length === 0}>
                  Select from Board Members
                </Radio.Button>
                <Radio.Button value="custom">Designated Contact Person</Radio.Button>
              </Radio.Group>
            </div>

            {contactPersonMode === "board" ? (
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Board Member as Contact Person"
                    className="mb-1"
                  >
                    <Select
                      placeholder="Select a board member from above"
                      value={selectedBoardIndex}
                      options={boardMemberOptions}
                      onChange={handleSelectBoardContact}
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Row>
            ) : (
              <Row gutter={16}>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="contactPerson" label="Contact Name" className="mb-1">
                    <Input placeholder="Full name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item
                    name="contactPersonDesignation"
                    label="Designation / Role"
                    className="mb-1"
                  >
                    <Input placeholder="e.g. Finance Manager" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="contactPersonPhone" label="Phone / Mobile" className="mb-1">
                    <Input placeholder="98XXXXXXXX" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item
                    name="contactPersonEmail"
                    label="Email"
                    rules={[{ type: "email", message: "Invalid email" }]}
                    className="mb-1"
                  >
                    <Input placeholder="contact@company.com" />
                  </Form.Item>
                </Col>
              </Row>
            )}
          </div>

          {/* 3. Classification & Location */}
          <Divider orientation="left">Classification & Location</Divider>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="legalStatusId" label="Legal Status">
                <Select
                  placeholder="Select legal status"
                  loading={businessOptionsLoading.legalStatuses}
                  options={
                    legalStatusOptions.length > 0
                      ? legalStatusOptions
                      : legalStatusEnumOptions
                  }
                  optionFilterProp="label"
                  showSearch
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="businessSizeId" label="Business Size">
                <Select
                  placeholder="Select business size"
                  loading={businessOptionsLoading.businessSizes}
                  options={
                    businessSizeOptions.length > 0
                      ? businessSizeOptions
                      : businessSizeEnumOptions
                  }
                  optionFilterProp="label"
                  showSearch
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="industryNatureId" label="Industry Nature">
                <Select
                  placeholder="Select industry nature"
                  loading={businessOptionsLoading.businessNatures}
                  options={
                    businessNatureOptions.length > 0
                      ? businessNatureOptions
                      : businessNatureEnumOptions
                  }
                  optionFilterProp="label"
                  showSearch
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="country" label="Country">
                <Select
                  placeholder="Select country"
                  options={countries}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  onChange={(value: string) => {
                    setSelectedCountry(value || null);
                    form.setFieldsValue({
                      state: undefined,
                      district: undefined,
                      localJurisdiction: undefined,
                    });
                    setSelectedState(null);
                    setSelectedDistrict(null);
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="state" label="State / Province">
                <Select
                  placeholder="Select state/province"
                  options={selectedCountry ? getStateOptions(selectedCountry) : []}
                  disabled={!selectedCountry}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  onChange={(value: string) => {
                    setSelectedState(value || null);
                    form.setFieldsValue({
                      district: undefined,
                      localJurisdiction: undefined,
                    });
                    setSelectedDistrict(null);
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="district" label="District">
                <Select
                  placeholder="Select district"
                  options={selectedState ? getDistrictOptions(selectedState) : []}
                  disabled={!selectedState}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  onChange={(value: string) => {
                    setSelectedDistrict(value || null);
                    form.setFieldsValue({ localJurisdiction: undefined });
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="localJurisdiction" label="Local Jurisdiction">
                <Select
                  placeholder="Select local jurisdiction"
                  options={
                    selectedDistrict
                      ? getLocalJurisdictionOptions(selectedDistrict)
                      : []
                  }
                  disabled={!selectedDistrict}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="locality"
                label="Locality / Tole"
                rules={[{ max: 100, message: "Cannot exceed 100 characters" }]}
              >
                <Input placeholder="e.g. Pepsikola, Babarmahal" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="wardNo"
                label="Ward No"
                rules={[{ max: 10, message: "Cannot exceed 10 characters" }]}
              >
                <Input placeholder="e.g. 32" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="taxOffice" label="Tax Office (IRO)">
                <Input placeholder="e.g. IRO Putalisadak, LTO" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="ocrRegNo" label="OCR Registration No.">
                <Input placeholder="e.g. 123456/078/079" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="isVatRegistered"
                label="VAT Registered"
                valuePropName="checked"
              >
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>

          {/* 4. Official Contact & Banking */}
          <Divider orientation="left">Official Contact & Banking</Divider>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="mobileNo"
                label="Mobile No."
                rules={[
                  {
                    pattern: /^9[78]\d{8}$/,
                    message: "Enter valid 10-digit mobile (98/97...)",
                  },
                ]}
              >
                <Input
                  placeholder="9851000000"
                  maxLength={15}
                  onBlur={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "");
                    form.setFieldsValue({ mobileNo: cleaned });
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="telephoneNo"
                label="Telephone / Landline"
                rules={[{ max: 15, message: "Cannot exceed 15 characters" }]}
              >
                <Input placeholder="014400000" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="email"
                label="Official Email"
                rules={[{ type: "email", message: "Invalid email address" }]}
              >
                <Input placeholder="info@company.com" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="website" label="Website">
                <Input placeholder="https://company.com.np" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="bankName" label="Bank Name">
                <Input placeholder="e.g. Nabil Bank, Global IME" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="bankAccountNumber" label="Account Number">
                <Input placeholder="e.g. 01201017500001" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="bankBranch" label="Bank Branch">
                <Input placeholder="e.g. New Road Branch" />
              </Form.Item>
            </Col>
          </Row>

          {/* 5. Initial Portal / IRD Credentials (Create Mode & Admin Only) */}
          {!id && canManagePortalCredentials && (
            <>
              <Divider orientation="left">Portal & IRD Credentials</Divider>
              <Form.List name="portalCredentials">
                {(fields, { add, remove }) => (
                  <div className="mb-4">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Button
                        size="small"
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() =>
                          add({
                            portalName: "IRD Portal (Inland Revenue PAN)",
                            website: "https://taxpayerportal.ird.gov.np",
                            loginUser: watchedPan
                              ? String(watchedPan).replace(/\D/g, "")
                              : "",
                          })
                        }
                      >
                        Add IRD PAN Login
                      </Button>
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => add({})}
                      >
                        Add Portal Credential
                      </Button>
                    </div>

                    {fields.map(({ key, name, ...restField }) => (
                      <div
                        key={key}
                        className="p-3 mb-2 border border-gray-200 rounded-md bg-gray-50/40"
                      >
                        <Row gutter={12} align="middle">
                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              {...restField}
                              name={[name, "portalName"]}
                              label="Portal / Authority"
                              rules={[
                                { required: true, message: "Enter portal name" },
                              ]}
                              className="mb-2"
                            >
                              <AutoComplete
                                options={PORTAL_PRESETS.map((p) => ({
                                  value: p.name,
                                  label: p.name,
                                }))}
                                placeholder="e.g. IRD Portal"
                                onSelect={(val) => {
                                  const found = PORTAL_PRESETS.find(
                                    (p) => p.name === val
                                  );
                                  if (found) {
                                    const list =
                                      form.getFieldValue("portalCredentials") ||
                                      [];
                                    list[name] = {
                                      ...list[name],
                                      website: found.website,
                                      loginUser:
                                        found.name.includes("IRD") && watchedPan
                                          ? String(watchedPan).replace(/\D/g, "")
                                          : list[name]?.loginUser,
                                    };
                                    form.setFieldsValue({
                                      portalCredentials: list,
                                    });
                                  }
                                }}
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12} md={5}>
                            <Form.Item
                              {...restField}
                              name={[name, "loginUser"]}
                              label="Login Username / PAN"
                              rules={[
                                { required: true, message: "Enter username" },
                              ]}
                              className="mb-2"
                            >
                              <Input placeholder="Username or PAN" />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12} md={5}>
                            <Form.Item
                              {...restField}
                              name={[name, "password"]}
                              label="Password"
                              rules={[
                                { required: true, message: "Enter password" },
                              ]}
                              className="mb-2"
                            >
                              <Input.Password placeholder="Portal password" />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              {...restField}
                              name={[name, "website"]}
                              label="Portal URL"
                              className="mb-2"
                            >
                              <Input placeholder="https://taxpayerportal.ird.gov.np" />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={2} className="text-right">
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(name)}
                              title="Remove credential"
                            />
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </div>
                )}
              </Form.List>
            </>
          )}

          {/* 6. Timeline / Record Change Effective Date */}
          <Divider orientation="left">Timeline & Record Settings</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="effectiveDate"
                label="Effective / Record Date"
                tooltip="Leave blank to record as today, or pick a past date to reflect historical records accurately on the client timeline."
              >
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Default: Today (or select past date)"
                />
              </Form.Item>
            </Col>

            {id && (
              <Col xs={24} sm={12} md={16}>
                <Form.Item
                  name="lastEditReason"
                  label="Change Note (Timeline & Audit)"
                  rules={[{ max: 500, message: "Cannot exceed 500 characters" }]}
                >
                  <Input placeholder="Document the reason for this company or board update" />
                </Form.Item>
              </Col>
            )}
          </Row>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
            <Button onClick={() => navigate(-1)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreating || isEditing}
            >
              {id ? "Save Changes" : "Create Client"}
            </Button>
          </div>
        </Form>
      </Card>

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
