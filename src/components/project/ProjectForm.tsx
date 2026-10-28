import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Divider, Form, Row, Select, Switch, Space, Tag, message } from "antd";
import TextArea from "antd/es/input/TextArea";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import dayjs from "dayjs";

import { useCreateProject } from "@/hooks/project/useCreateProject";
import { useEditProject } from "@/hooks/project/useEditProject";
import { useUser } from "@/hooks/user/useUser";
import { useClient } from "@/hooks/client/useClient";
import { useBilling } from "@/hooks/billing/useBilling";
import { listActiveUsers } from "@/service/user.service";
import {
  fetchNatureOfWorkGroups,
  fetchNatureOfWorks,
  NatureOfWork,
  NatureOfWorkGroup,
} from "@/service/natureOfWork.service";
import { ProjectType, ProjectStatus } from "@/types/project";
import FormInputWrapper from "../FormInputWrapper";
import NepaliDatePicker, { NepaliDate } from "../NepaliDatePicker";
import { DualDateConverter } from "@/utils/dateConverter";

function adToBs(adDate: string): NepaliDate {
  try {
    const adDateObj = dayjs(adDate);
    if (!adDateObj.isValid()) {
      throw new Error("Invalid date format");
    }
    const dual = DualDateConverter.createDualDate(adDateObj);
    return {
      year: dual.nepali.getYear(),
      month: dual.nepali.getMonth() + 1,
      day: dual.nepali.getDate(),
    };
  } catch (error) {
    const [year, month, day] = adDate.split("-").map(Number);
    return { year: year + 57, month, day };
  }
}

function formatNepaliDateForForm(nepaliDate: NepaliDate | undefined): string | null {
  if (!nepaliDate) return null;
  return `${nepaliDate.year}-${String(nepaliDate.month).padStart(2, "0")}-${String(
    nepaliDate.day
  ).padStart(2, "0")}`;
}

interface ProjectFormProps {
  id?: string;
  editProjectData?: ProjectType;
  handleCancel?: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ editProjectData, handleCancel }) => {
  const [form] = Form.useForm();
  const { mutate, isPending } = useCreateProject();
  const { mutate: mutateEdit, isPending: isPendingEdit } = useEditProject();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: clients } = useClient();
  const { data: billings } = useBilling("active");
  const isProjectInactive = editProjectData && editProjectData.status !== "active";

  // 1. Fetch active users via default route /users/list-active (no admin permission required)
  const { data: activeUsersData, isPending: isPendingActiveUsers } = useQuery({
    queryKey: ["active-users"],
    queryFn: listActiveUsers,
  });

  // 2. Fetch full users as fallback/supplement
  const { data: usersData, isPending: isPendingUser } = useUser({
    limit: 1000,
    page: 1,
    keywords: "",
  });

  const [natureOfWorkOptions, setNatureOfWorkOptions] = useState<
    { value: string; label: string; shortName: string; groupId?: string }[]
  >([]);
  const [natureOfWorkGroupOptions, setNatureOfWorkGroupOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [suggestedProjectName, setSuggestedProjectName] = useState("");

  const UNCATEGORIZED_GROUP = "__uncategorized__";
  const selectedGroupId = Form.useWatch("natureOfWorkGroup", form);

  const filteredNatureOfWorkOptions = useMemo(() => {
    if (!selectedGroupId) return natureOfWorkOptions;
    if (selectedGroupId === UNCATEGORIZED_GROUP) {
      return natureOfWorkOptions.filter((n) => !n.groupId);
    }
    return natureOfWorkOptions.filter((n) => n.groupId === selectedGroupId);
  }, [selectedGroupId, natureOfWorkOptions]);

  const [nepaliStartDate, setNepaliStartDate] = useState<NepaliDate | undefined>(undefined);
  const [nepaliEndDate, setNepaliEndDate] = useState<NepaliDate | undefined>(undefined);
  const [isEndDateManuallyChanged, setIsEndDateManuallyChanged] = useState<boolean>(false);

  const projectLead = Form.useWatch("projectLead", form);
  const projectManager = Form.useWatch("projectManager", form);

  const projectManagerRoleNames = new Set([
    "projectmanager",
    "administrator",
    "superadmin",
    "superuser",
  ]);

  const normalizeRoleName = (roleName?: string) =>
    roleName?.toLowerCase().replace(/[\s_-]/g, "") || "";

  // Combine active users, full user query, and project assignees into one unified map
  const allUsersMap = useMemo(() => {
    const map = new Map<string, any>();

    if (Array.isArray(activeUsersData)) {
      activeUsersData.forEach((u: any) => {
        if (u?.id) map.set(u.id, u);
      });
    }

    const paginatedUsers = usersData?.results || (Array.isArray(usersData) ? usersData : []);
    paginatedUsers.forEach((u: any) => {
      if (u?.id) map.set(u.id, { ...map.get(u.id), ...u });
    });

    if (editProjectData?.users && Array.isArray(editProjectData.users)) {
      editProjectData.users.forEach((u: any) => {
        const uId = typeof u === "string" ? u : u?.id;
        if (uId) {
          const existing = map.get(uId) || {};
          const uObj = typeof u === "string" ? { id: uId } : u;
          map.set(uId, { ...existing, ...uObj });
        }
      });
    }

    if (editProjectData?.activeUsers && Array.isArray(editProjectData.activeUsers)) {
      editProjectData.activeUsers.forEach((u: any) => {
        const uId = typeof u === "string" ? u : u?.id;
        if (uId) {
          const existing = map.get(uId) || {};
          const uObj = typeof u === "string" ? { id: uId } : u;
          map.set(uId, { ...existing, ...uObj });
        }
      });
    }

    const leadObj = editProjectData?.projectLead;
    if (leadObj) {
      const leadId = typeof leadObj === "string" ? leadObj : leadObj?.id;
      if (leadId) {
        const existing = map.get(leadId) || {};
        const lObj = typeof leadObj === "string" ? { id: leadId } : leadObj;
        map.set(leadId, { ...existing, ...lObj });
      }
    }

    const managerObj = editProjectData?.projectManager;
    if (managerObj) {
      const managerId = typeof managerObj === "string" ? managerObj : managerObj?.id;
      if (managerId) {
        const existing = map.get(managerId) || {};
        const mObj = typeof managerObj === "string" ? { id: managerId } : managerObj;
        map.set(managerId, { ...existing, ...mObj });
      }
    }

    return map;
  }, [activeUsersData, usersData, editProjectData]);

  const allUserList = useMemo(() => Array.from(allUsersMap.values()), [allUsersMap]);

  const formatUserOptionLabel = (user: any) => {
    const roleName = user.role?.displayName || user.role?.name;
    const emailStr = user.email ? ` - ${user.email}` : "";
    const roleStr = roleName ? ` (${roleName})` : "";
    return `${user.name || user.username || "User"}${roleStr}${emailStr}`;
  };

  // Watch currently selected users so selected users always appear at the top of the dropdown
  const selectedUsersValue = Form.useWatch("users", form);
  const selectedUserSet = useMemo(() => {
    if (Array.isArray(selectedUsersValue) && selectedUsersValue.length > 0) {
      return new Set(selectedUsersValue);
    }
    if (editProjectData?.users && Array.isArray(editProjectData.users)) {
      return new Set(editProjectData.users.map((u: any) => u.id || u));
    }
    return new Set<string>();
  }, [selectedUsersValue, editProjectData]);

  const filteredUsers = useMemo(() => {
    const available = allUserList.filter(
      (user: any) =>
        selectedUserSet.has(user.id) ||
        (user.id !== projectLead && user.id !== projectManager)
    );

    // Sort: selected users at top, then alphabetical by name
    const sorted = [...available].sort((a: any, b: any) => {
      const aSelected = selectedUserSet.has(a.id);
      const bSelected = selectedUserSet.has(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      const aName = a.name || a.username || "";
      const bName = b.name || b.username || "";
      return aName.localeCompare(bName);
    });

    return sorted.map((user: any) => ({
      value: user.id,
      label: formatUserOptionLabel(user),
    }));
  }, [allUserList, projectLead, projectManager, selectedUserSet]);

  const managerOptions = useMemo(() => {
    const managers = allUserList.filter((user: any) =>
      projectManagerRoleNames.has(normalizeRoleName(user.role?.name))
    );
    const sorted = [...managers].sort((a: any, b: any) => {
      const aSelected = a.id === projectManager;
      const bSelected = b.id === projectManager;
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      const aName = a.name || a.username || "";
      const bName = b.name || b.username || "";
      return aName.localeCompare(bName);
    });
    return sorted.map((user: any) => ({
      value: user.id,
      label: formatUserOptionLabel(user),
    }));
  }, [allUserList, projectManager]);

  const leadOptions = useMemo(() => {
    const sorted = [...allUserList].sort((a: any, b: any) => {
      const aSelected = a.id === projectLead;
      const bSelected = b.id === projectLead;
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      const aName = a.name || a.username || "";
      const bName = b.name || b.username || "";
      return aName.localeCompare(bName);
    });
    return sorted.map((user: any) => ({
      value: user.id,
      label: formatUserOptionLabel(user),
    }));
  }, [allUserList, projectLead]);

  const handleFieldChange = () => {
    setTimeout(() => {
      const clientId = form.getFieldValue("client");
      const natureOfWorkId = form.getFieldValue("natureOfWork");
      const fiscalYear = form.getFieldValue("fiscalYear");
      const billingId = form.getFieldValue("billing");

      if (clientId && natureOfWorkId && fiscalYear && clients && natureOfWorkOptions.length > 0) {
        const clientObj = clients.find((c: any) => c.id === clientId);
        const natureObj = natureOfWorkOptions.find((n: any) => n.value === natureOfWorkId);
        const billingObj = billingId && billings ? billings.find((b: any) => b.id === billingId) : null;

        if (clientObj && natureObj) {
          const formattedFiscalYear = `${fiscalYear}/${(fiscalYear + 1).toString().slice(-2)}`;
          const billingSuffix = billingObj?.shortName ? `-${billingObj.shortName}` : "";
          const suggested = `${clientObj.shortName}-${natureObj.shortName}-${formattedFiscalYear}${billingSuffix}`;
          setSuggestedProjectName(suggested);

          const currentName = form.getFieldValue("name");
          if (!currentName || currentName === suggestedProjectName || currentName.includes("-")) {
            form.setFieldsValue({ name: suggested });
          }
        }
      }
    }, 100);
  };

  const handleNatureOfWorkChange = (natureOfWorkId: string) => {
    handleFieldChange();
    const selectedNature = natureOfWorkOptions.find((item) => item.value === natureOfWorkId);
    if (!selectedNature) return;

    if (selectedNature.groupId) {
      form.setFieldsValue({ natureOfWorkGroup: selectedNature.groupId });
    } else {
      form.setFieldsValue({ natureOfWorkGroup: UNCATEGORIZED_GROUP });
    }
  };

  const handleGroupChange = (groupId: string | undefined) => {
    const currentNatureId = form.getFieldValue("natureOfWork");
    if (!currentNatureId) return;

    const currentNature = natureOfWorkOptions.find((n) => n.value === currentNatureId);
    if (!currentNature) return;
    if (!groupId) return;

    const natureBelongs =
      groupId === UNCATEGORIZED_GROUP
        ? !currentNature.groupId
        : currentNature.groupId === groupId;

    if (!natureBelongs) {
      form.setFieldsValue({ natureOfWork: undefined });
    }
  };

  const onFinish = (values: any) => {
    const allFormValues = form.getFieldsValue(true);
    const userIds = [values.projectLead, values.projectManager].filter(Boolean);

    let startDate =
      allFormValues.startingDateEnglish ||
      allFormValues.startingDate ||
      values.startingDateEnglish ||
      values.startingDate;
    let endDate =
      allFormValues.endingDateEnglish ||
      allFormValues.endingDate ||
      values.endingDateEnglish ||
      values.endingDate;

    if (!startDate) {
      const nepaliValue =
        allFormValues.startingDateNepali || values.startingDateNepali || nepaliStartDate;
      if (nepaliValue) {
        try {
          const nepaliDateStr =
            typeof nepaliValue === "string" ? nepaliValue : formatNepaliDateForForm(nepaliValue);
          if (nepaliDateStr) {
            startDate = DualDateConverter.convertToAD(nepaliDateStr);
          }
        } catch (error) {}
      }
    }

    if (!endDate) {
      const nepaliValue =
        allFormValues.endingDateNepali || values.endingDateNepali || nepaliEndDate;
      if (nepaliValue) {
        try {
          const nepaliDateStr =
            typeof nepaliValue === "string" ? nepaliValue : formatNepaliDateForForm(nepaliValue);
          if (nepaliDateStr) {
            endDate = DualDateConverter.convertToAD(nepaliDateStr);
          }
        } catch (error) {}
      }
    }

    if (!startDate || startDate === "") {
      if (nepaliStartDate) {
        const nepaliDateStr = formatNepaliDateForForm(nepaliStartDate);
        if (nepaliDateStr) {
          try {
            startDate = DualDateConverter.convertToAD(nepaliDateStr);
          } catch (err) {}
        }
      }
      if (!startDate) {
        message.error("Please select a starting date");
        return;
      }
    }

    if (!endDate || endDate === "") {
      if (nepaliEndDate) {
        const nepaliDateStr = formatNepaliDateForForm(nepaliEndDate);
        if (nepaliDateStr) {
          try {
            endDate = DualDateConverter.convertToAD(nepaliDateStr);
          } catch (err) {}
        }
      }
      if (!endDate) {
        message.error("Please select an ending date");
        return;
      }
    }

    const transformedValues = {
      ...values,
      status: values.status || editProjectData?.status || ProjectStatus.ACTIVE,
      startingDate: startDate,
      endingDate: endDate,
      users: values.users ? [...new Set([...values.users, ...userIds])] : userIds,
    };

    if (transformedValues.natureOfWorkGroup === UNCATEGORIZED_GROUP) {
      transformedValues.natureOfWorkGroup = null;
    }

    delete transformedValues.startingDateNepali;
    delete transformedValues.endingDateNepali;
    delete transformedValues.startingDateEnglish;
    delete transformedValues.endingDateEnglish;

    if (editProjectData?.id) {
      mutateEdit(
        { id: editProjectData.id, payload: transformedValues },
        { onSuccess: () => handleCancel?.() }
      );
    } else {
      mutate(transformedValues, {
        onSuccess: () => {
          if (handleCancel) handleCancel();
        },
        onError: (error: any) => {
          const msg = error?.response?.data?.message || error?.message || "Failed to create project.";
          setErrorMessage(msg);
          if (msg.toLowerCase().includes("already exists")) {
            message.error(msg);
          } else {
            message.error("Failed to create project. Please try again.");
          }
        },
      });
    }
  };

  useEffect(() => {
    Promise.all([fetchNatureOfWorks(), fetchNatureOfWorkGroups()])
      .then(([natureData, groupData]: [NatureOfWork[], NatureOfWorkGroup[]]) => {
        setNatureOfWorkOptions(
          natureData.map((item) => ({
            value: item.id,
            label: `${item.name} (${item.shortName})`,
            shortName: item.shortName,
            groupId: item.groupId || item.group?.id || undefined,
          }))
        );
        setNatureOfWorkGroupOptions(
          groupData.map((group) => ({
            value: group.id,
            label: group.name,
          }))
        );
      })
      .catch(() => {
        message.error("Failed to load Nature of Work options");
      });
  }, []);

  useEffect(() => {
    handleFieldChange();
  }, [clients, natureOfWorkOptions, billings]);

  useEffect(() => {
    if (editProjectData) {
      const parseDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return null;
        try {
          const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
          const date = moment.utc(dateOnly, "YYYY-MM-DD", true);
          if (date.isValid()) {
            return date.local().clone();
          }
          const fallbackDate = moment.utc(dateOnly).local();
          return fallbackDate.isValid() ? fallbackDate.clone() : null;
        } catch (error) {
          return null;
        }
      };

      const parsedStartDate = parseDate(editProjectData.startingDate);
      const parsedEndDate = parseDate(editProjectData.endingDate);
      const startDateAD = parsedStartDate ? parsedStartDate.format("YYYY-MM-DD") : "";
      const endDateAD = parsedEndDate ? parsedEndDate.format("YYYY-MM-DD") : "";

      let nepaliStart: NepaliDate | undefined = undefined;
      let nepaliEnd: NepaliDate | undefined = undefined;

      if (parsedStartDate && startDateAD) {
        try {
          nepaliStart = adToBs(startDateAD);
        } catch (error) {}
      }
      if (parsedEndDate && endDateAD) {
        try {
          nepaliEnd = adToBs(endDateAD);
        } catch (error) {}
      }

      if (nepaliStart) setNepaliStartDate(nepaliStart);
      if (nepaliEnd) setNepaliEndDate(nepaliEnd);
      setIsEndDateManuallyChanged(true);

      setTimeout(() => {
        const formData: any = {
          name: editProjectData.name || "",
          description: editProjectData.description || "",
          status: editProjectData.status || ProjectStatus.ACTIVE,
          fiscalYear: editProjectData.fiscalYear,
          users: (() => {
            const leadId = editProjectData.projectLead?.id || (typeof editProjectData.projectLead === "string" ? editProjectData.projectLead : undefined);
            const managerId = editProjectData.projectManager?.id || (typeof editProjectData.projectManager === "string" ? editProjectData.projectManager : undefined);
            const allIds = (editProjectData.users || []).map((u: any) => typeof u === "string" ? u : u?.id).filter(Boolean);
            const invitedOnly = allIds.filter((id: string) => id !== leadId && id !== managerId);
            return invitedOnly;
          })(),
          projectLead: editProjectData.projectLead?.id || (typeof editProjectData.projectLead === "string" ? editProjectData.projectLead : undefined),
          projectManager: editProjectData.projectManager?.id || (typeof editProjectData.projectManager === "string" ? editProjectData.projectManager : undefined),
          client:
            (editProjectData as any).client?.id ||
            (editProjectData as any).customer?.id ||
            (editProjectData as any).client ||
            (editProjectData as any).customer,
          billing: (editProjectData as any).billing?.id || (editProjectData as any).billing,
          allowSubtaskWorklog:
            editProjectData.allowSubtaskWorklog !== undefined
              ? editProjectData.allowSubtaskWorklog
              : true,
          countsForAvailability:
            editProjectData.countsForAvailability !== undefined
              ? editProjectData.countsForAvailability
              : true,
          isPaymentDone: editProjectData.isPaymentDone || false,
          isPaymentTemporarilyEnabled: editProjectData.isPaymentTemporarilyEnabled || false,
          natureOfWork:
            typeof editProjectData.natureOfWork === "string"
              ? editProjectData.natureOfWork
              : (editProjectData.natureOfWork as any)?.id,
          natureOfWorkGroup:
            (editProjectData as any).natureOfWorkGroup?.id ||
            (editProjectData as any).natureOfWorkGroupId ||
            (editProjectData as any).natureOfWork?.groupId ||
            (editProjectData.natureOfWork && typeof editProjectData.natureOfWork !== "string"
              ? UNCATEGORIZED_GROUP
              : undefined),
          startingDate: startDateAD,
          endingDate: endDateAD,
          startingDateEnglish: startDateAD,
          endingDateEnglish: endDateAD,
          startingDateNepali: nepaliStart,
          endingDateNepali: nepaliEnd,
        };

        form.resetFields();
        setTimeout(() => {
          form.setFieldsValue(formData);
          form
            .validateFields(["startingDateNepali", "endingDateNepali"])
            .then(() => {})
            .catch(() => {});
        }, 100);
      }, 200);
    } else {
      // For new project, initialize start date with today and default end date to 1 month from today
      form.resetFields();
      setIsEndDateManuallyChanged(false);
      const todayDual = DualDateConverter.getToday();
      const todayNepali: NepaliDate = {
        year: todayDual.nepali.getYear(),
        month: todayDual.nepali.getMonth() + 1,
        day: todayDual.nepali.getDate(),
      };
      const todayAD = todayDual.gregorianString;

      // 1 month from start date (user can change this)
      const endDual = DualDateConverter.createDualDate(dayjs(todayAD).add(1, "month"));
      const endNepali: NepaliDate = {
        year: endDual.nepali.getYear(),
        month: endDual.nepali.getMonth() + 1,
        day: endDual.nepali.getDate(),
      };
      const endAD = endDual.gregorianString;

      setNepaliStartDate(todayNepali);
      setNepaliEndDate(endNepali);

      setTimeout(() => {
        form.setFieldsValue({
          status: ProjectStatus.ACTIVE,
          startingDateNepali: todayNepali,
          startingDate: todayAD,
          startingDateEnglish: todayAD,
          endingDateNepali: endNepali,
          endingDate: endAD,
          endingDateEnglish: endAD,
          allowSubtaskWorklog: true,
          countsForAvailability: true,
          isPaymentDone: false,
          isPaymentTemporarilyEnabled: false,
        });
        form
          .validateFields(["startingDateNepali", "endingDateNepali"])
          .then(() => {})
          .catch(() => {});
      }, 200);
    }
  }, [editProjectData, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      className="w-full"
      initialValues={{
        status: ProjectStatus.ACTIVE,
        allowSubtaskWorklog: true,
        countsForAvailability: true,
        isPaymentDone: false,
        isPaymentTemporarilyEnabled: false,
      }}
    >
      {errorMessage && (
        <div style={{ color: "red", marginBottom: 16 }}>{errorMessage}</div>
      )}

      <Row gutter={[16, 0]} className="mx-0 w-full">
        <Divider className="my-2" />
        <Col xs={24} sm={12}>
          <Form.Item
            label="Client"
            name="client"
            rules={[{ required: true, message: "Please select the client!" }]}
          >
            <Select
              className="h-[48px] w-full"
              placeholder="Select client"
              onChange={handleFieldChange}
              disabled={!!isProjectInactive}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                option?.label && typeof option.label === "string"
                  ? option.label.toLowerCase().includes(input.toLowerCase())
                  : false
              }
              options={clients
                ?.filter((client: any) => client.status === "active")
                .map((client: any) => ({
                  value: client.id,
                  label: `${client.name} (${client.shortName})`,
                }))}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="Billing Entity"
            name="billing"
            rules={[{ required: false, message: "Please select the billing entity!" }]}
          >
            <Select
              className="h-[48px] w-full"
              placeholder="Select billing entity"
              onChange={handleFieldChange}
              disabled={!!isProjectInactive}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                option?.label && typeof option.label === "string"
                  ? option.label.toLowerCase().includes(input.toLowerCase())
                  : false
              }
              options={billings?.map((billing: any) => ({
                value: billing.id,
                label: `${billing.name}${billing.shortName ? ` (${billing.shortName})` : ""}`,
              }))}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="Allow Subtask Worklog"
            name="allowSubtaskWorklog"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch
              checkedChildren="Yes"
              unCheckedChildren="No"
              defaultChecked={true}
              disabled={!!isProjectInactive}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="Counts for User Availability"
            name="countsForAvailability"
            valuePropName="checked"
            initialValue={true}
            tooltip="When enabled, this project will be considered when calculating user availability and workload"
          >
            <Switch
              checkedChildren="Yes"
              unCheckedChildren="No"
              defaultChecked={true}
              disabled={!!isProjectInactive}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="Payment Done"
            name="isPaymentDone"
            valuePropName="checked"
            initialValue={false}
            tooltip="When enabled, client can access documents for this project in their portal"
          >
            <Switch checkedChildren="Paid" unCheckedChildren="Pending" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="Temporary Document Access"
            name="isPaymentTemporarilyEnabled"
            valuePropName="checked"
            initialValue={false}
            tooltip="Temporarily grant document access even if payment is pending"
          >
            <Switch checkedChildren="On" unCheckedChildren="Off" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="Fiscal Year"
            name="fiscalYear"
            rules={[{ required: true, message: "Please select the fiscal year!" }]}
          >
            <Select
              className="h-[48px] w-full"
              placeholder="Select fiscal year"
              onChange={handleFieldChange}
              disabled={!!isProjectInactive}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                option?.label && typeof option.label === "string"
                  ? option.label.toLowerCase().includes(input.toLowerCase())
                  : false
              }
              options={(() => {
                const todayDual = DualDateConverter.getToday();
                const nepaliYear = todayDual.nepali.getYear();
                return [...Array(20).keys()].map((_, idx) => {
                  const startYear = nepaliYear - idx;
                  const endYear = (startYear + 1).toString().slice(-2);
                  return {
                    value: startYear,
                    label: `${startYear}/${endYear}`,
                  };
                });
              })()}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            name="projectLead"
            label="Project Lead"
            rules={[{ required: true, message: "Please select a project lead!" }]}
          >
            <Select
              className="h-[48px] w-full"
              placeholder="Select project lead"
              showSearch
              disabled={!!isProjectInactive}
              optionFilterProp="label"
              filterOption={(input, option) =>
                option?.label && typeof option.label === "string"
                  ? option.label.toLowerCase().includes(input.toLowerCase())
                  : false
              }
              options={leadOptions}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            name="projectManager"
            label="Project Manager"
            rules={[{ required: true, message: "Please select a project manager!" }]}
          >
            <Select
              className="h-[48px] w-full"
              placeholder="Select project manager"
              showSearch
              disabled={!!isProjectInactive}
              optionFilterProp="label"
              filterOption={(input, option) =>
                option?.label && typeof option.label === "string"
                  ? option.label.toLowerCase().includes(input.toLowerCase())
                  : false
              }
              options={managerOptions}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="Invite Users"
            name="users"
            className="user-select-field"
            tooltip="All team members will see this project in their assigned list"
          >
            <Select
              placeholder="Select users"
              options={filteredUsers}
              mode="multiple"
              style={{ width: "100%" }}
              disabled={!!isProjectInactive}
              optionFilterProp="label"
              showSearch
              allowClear
              maxTagCount="responsive"
              virtual={false}
              tagRender={(props) => {
                const { label, value, closable, onClose } = props;
                const userObj = allUsersMap.get(value);
                const userName = userObj?.name || userObj?.username;
                const roleName = userObj?.role?.displayName || userObj?.role?.name;
                const roleStr = roleName ? ` (${roleName})` : "";
                let display = userName ? `${userName}${roleStr}` : label;
                if ((!display || display === value) && userObj?.email) {
                  display = userObj.email;
                }
                return (
                  <Tag
                    closable={closable && !isProjectInactive}
                    onClose={onClose}
                    style={{ marginRight: 4, display: "inline-flex", alignItems: "center" }}
                  >
                    {display}
                  </Tag>
                );
              }}
              filterOption={(input, option) =>
                option?.label && typeof option.label === "string"
                  ? option.label.toLowerCase().includes(input.toLowerCase())
                  : false
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="Nature of Work Group"
            name="natureOfWorkGroup"
            tooltip="Pick a group first to narrow down the list of work types below."
            rules={[{ required: true, message: "Please select a group!" }]}
          >
            <Select
              className="h-[48px] w-full"
              placeholder="Select group"
              allowClear
              showSearch
              disabled={!!isProjectInactive}
              optionFilterProp="label"
              onChange={handleGroupChange}
              filterOption={(input, option) =>
                option?.label && typeof option.label === "string"
                  ? option.label.toLowerCase().includes(input.toLowerCase())
                  : false
              }
              options={[
                ...natureOfWorkGroupOptions,
                { value: UNCATEGORIZED_GROUP, label: "Uncategorized (no group)" },
              ]}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="Nature of Work"
            name="natureOfWork"
            rules={[{ required: true, message: "Please select the nature of work!" }]}
          >
            <Select
              className="h-[48px] w-full"
              placeholder={selectedGroupId ? "Select nature of work" : "Select a group first"}
              disabled={!selectedGroupId || !!isProjectInactive}
              onChange={handleNatureOfWorkChange}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                option?.label && typeof option.label === "string"
                  ? option.label.toLowerCase().includes(input.toLowerCase())
                  : false
              }
              notFoundContent={
                selectedGroupId
                  ? "No nature of work in this group"
                  : "Please select a group first"
              }
              options={filteredNatureOfWorkOptions}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="Starting Date (BS)"
            name="startingDateNepali"
            initialValue={nepaliStartDate}
            rules={[
              {
                required: true,
                message: "Please select the starting date!",
                validator: (_, value) => {
                  if (value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Please select the starting date!"));
                },
              },
            ]}
          >
            <NepaliDatePicker
              value={nepaliStartDate}
              disabled={!!isProjectInactive}
              onChange={(bs) => {
                setNepaliStartDate(bs);
                try {
                  const nepaliDateStr = formatNepaliDateForForm(bs);
                  if (nepaliDateStr) {
                    const adDate = DualDateConverter.convertToAD(nepaliDateStr);
                    const newValues: any = {
                      startingDateNepali: bs,
                      startingDate: adDate,
                      startingDateEnglish: adDate,
                    };

                    // Auto-adjust default end date to 1 month from start date if not manually customized or before start date
                    const currentEndDate = form.getFieldValue("endingDate");
                    if (!isEndDateManuallyChanged || !currentEndDate || dayjs(currentEndDate).isBefore(dayjs(adDate))) {
                      const newEndDual = DualDateConverter.createDualDate(dayjs(adDate).add(1, "month"));
                      const newEndNepali: NepaliDate = {
                        year: newEndDual.nepali.getYear(),
                        month: newEndDual.nepali.getMonth() + 1,
                        day: newEndDual.nepali.getDate(),
                      };
                      const newEndAD = newEndDual.gregorianString;
                      setNepaliEndDate(newEndNepali);
                      newValues.endingDateNepali = newEndNepali;
                      newValues.endingDate = newEndAD;
                      newValues.endingDateEnglish = newEndAD;
                    }

                    form.setFieldsValue(newValues);
                    setTimeout(() => {
                      form.validateFields(["startingDateNepali", "endingDateNepali"]);
                    }, 50);
                  }
                } catch (error) {}
              }}
            />
          </Form.Item>
          <Form.Item name="startingDate" style={{ display: "none" }}>
            <input style={{ display: "none" }} />
          </Form.Item>
          <Form.Item name="startingDateEnglish" style={{ display: "none" }}>
            <input style={{ display: "none" }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="Ending Date (BS)"
            name="endingDateNepali"
            initialValue={nepaliEndDate}
            rules={[
              {
                required: true,
                message: "Please select the ending date!",
                validator: (_, value) => {
                  if (value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Please select the ending date!"));
                },
              },
            ]}
          >
            <NepaliDatePicker
              value={nepaliEndDate}
              disabled={!!isProjectInactive}
              onChange={(bs) => {
                setIsEndDateManuallyChanged(true);
                setNepaliEndDate(bs);
                try {
                  const nepaliDateStr = formatNepaliDateForForm(bs);
                  if (nepaliDateStr) {
                    const adDate = DualDateConverter.convertToAD(nepaliDateStr);
                    form.setFieldsValue({
                      endingDateNepali: bs,
                      endingDate: adDate,
                      endingDateEnglish: adDate,
                    });
                    setTimeout(() => {
                      form.validateFields(["endingDateNepali"]);
                    }, 50);
                  }
                } catch (error: any) {
                  alert("Error converting date: " + (error?.message || "Unknown error"));
                }
              }}
            />
          </Form.Item>
          <Form.Item name="endingDate" style={{ display: "none" }}>
            <input style={{ display: "none" }} />
          </Form.Item>
          <Form.Item name="endingDateEnglish" style={{ display: "none" }}>
            <input style={{ display: "none" }} />
          </Form.Item>
        </Col>

        <Form.Item name="status" style={{ display: "none" }} initialValue={ProjectStatus.ACTIVE}>
          <input style={{ display: "none" }} />
        </Form.Item>

        <Col span={24}>
          <Form.Item
            id="Description"
            label="Description"
            name="description"
            rules={[{ required: true, message: "Please input the description!" }]}
          >
            <TextArea rows={4} disabled={!!isProjectInactive} />
          </Form.Item>
        </Col>

        <Col span={24}>
          <FormInputWrapper
            id="Project Name"
            label="Project Name"
            name="name"
            rules={[{ required: true, message: "Please input the project name!" }]}
            placeholder="Project name will be auto-generated or you can enter manually"
            disabled={!!isProjectInactive}
          />
        </Col>
      </Row>

      <Form.Item className="mt-4 mb-2 flex justify-end">
        <Space>
          {handleCancel && (
            <Button onClick={handleCancel} disabled={isPending || isPendingEdit}>
              Cancel
            </Button>
          )}
          <Button
            type="primary"
            htmlType="submit"
            disabled={isPending || isPendingEdit}
            loading={isPending || isPendingEdit}
          >
            Save
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ProjectForm;
