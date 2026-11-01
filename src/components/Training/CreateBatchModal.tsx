import React, { useState, useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, Row, Col, Divider, Button } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useCreateBatch, useTrainingCourses } from "@/hooks/training/useTraining";
import { listActiveUsers } from "@/service/user.service";
import { useQuery } from "@tanstack/react-query";
import NepaliDatePicker, { NepaliDate } from "../NepaliDatePicker";
import { DualDateConverter } from "@/utils/dateConverter";

interface CreateBatchModalProps {
  open: boolean;
  onCancel: () => void;
  defaultCourseId?: string;
}

const CreateBatchModal: React.FC<CreateBatchModalProps> = ({ open, onCancel, defaultCourseId }) => {
  const [form] = Form.useForm();
  const { data: courses } = useTrainingCourses({ status: "active" });
  const { data: activeUsers } = useQuery({ queryKey: ["active-users"], queryFn: listActiveUsers });
  const { mutate: createBatch, isPending } = useCreateBatch();

  const [startBS, setStartBS] = useState<NepaliDate | undefined>(undefined);
  const [endBS, setEndBS] = useState<NepaliDate | undefined>(undefined);
  const [trainerType, setTrainerType] = useState<"internal" | "external">("internal");

  const startDateValue = Form.useWatch("startDate", form);
  const endDateValue = Form.useWatch("endDate", form);

  const formatNepaliDateForForm = (d?: NepaliDate) => {
    if (!d) return "";
    return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
  };

  // Auto-initialize both BS and AD dates with Today on modal open
  useEffect(() => {
    if (open) {
      try {
        const todayDual = DualDateConverter.getToday();
        const todayNepali: NepaliDate = {
          year: todayDual.nepali.getYear(),
          month: todayDual.nepali.getMonth() + 1,
          day: todayDual.nepali.getDate(),
        };
        const todayAD = todayDual.gregorianString;

        setStartBS(todayNepali);
        setEndBS(todayNepali);

        form.resetFields();
        setTimeout(() => {
          form.setFieldsValue({
            startDate: todayAD,
            endDate: todayAD,
            courseId: defaultCourseId,
            deliveryMode: "in_person",
            maxCapacity: 25,
            status: "scheduled",
          });
        }, 50);
      } catch (err) {}
    }
  }, [open, defaultCourseId, form]);

  const handleFinish = (values: any) => {
    const todayDual = DualDateConverter.getToday();
    const todayAD = todayDual.gregorianString;
    const todayNepali = {
      year: todayDual.nepali.getYear(),
      month: todayDual.nepali.getMonth() + 1,
      day: todayDual.nepali.getDate(),
    };

    const effectiveStartBS = startBS || todayNepali;
    const effectiveEndBS = endBS || todayNepali;

    let startDate = values.startDate;
    let endDate = values.endDate;

    if (!startDate && effectiveStartBS) {
      const formatted = formatNepaliDateForForm(effectiveStartBS);
      if (formatted) {
        try {
          startDate = DualDateConverter.convertToAD(formatted);
        } catch (err) {}
      }
    }

    if (!endDate && effectiveEndBS) {
      const formatted = formatNepaliDateForForm(effectiveEndBS);
      if (formatted) {
        try {
          endDate = DualDateConverter.convertToAD(formatted);
        } catch (err) {}
      }
    }

    const payload = {
      ...values,
      startDate: startDate || todayAD,
      endDate: endDate || todayAD,
      startDateNepali: formatNepaliDateForForm(effectiveStartBS),
      endDateNepali: formatNepaliDateForForm(effectiveEndBS),
    };

    createBatch(payload, {
      onSuccess: () => {
        form.resetFields();
        setStartBS(undefined);
        setEndBS(undefined);
        onCancel();
      },
    });
  };

  return (
    <Modal
      title="Schedule Training Batch"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      width={780}
      centered
      styles={{
        body: {
          overflowX: "hidden",
          overflowY: "auto",
          maxHeight: "calc(88vh - 100px)",
          padding: "16px 20px",
        },
      }}
      destroyOnClose
    >
      <div className="overflow-x-hidden w-full">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            courseId: defaultCourseId,
            deliveryMode: "in_person",
            maxCapacity: 25,
            status: "scheduled",
          }}
        >
          <Row gutter={[16, 0]} className="mx-0 w-full">
            <Col xs={24} sm={12} className="px-2">
              <Form.Item
                name="courseId"
                label="Course"
                className="mb-3"
                rules={[{ required: true, message: "Please select course" }]}
              >
                <Select
                  placeholder="Select course"
                  showSearch
                  optionFilterProp="label"
                  options={courses?.map((c) => ({
                    value: c.id,
                    label: `${c.code}: ${c.title} (${c.cpdHours} CPD Hrs)`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} className="px-2">
              <Form.Item
                name="batchName"
                label="Batch Name"
                className="mb-3"
                rules={[{ required: true, message: "Please input batch name" }]}
              >
                <Input placeholder="e.g. Batch 2083-Q1 (Audit Team)" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]} className="mx-0 w-full">
            <Col xs={24} sm={8} className="px-2">
              <Form.Item name="deliveryMode" label="Delivery Mode" className="mb-3">
                <Select
                  options={[
                    { value: "in_person", label: "In-Person (Office / Hall)" },
                    { value: "virtual", label: "Virtual (Teams / Meet)" },
                    { value: "hybrid", label: "Hybrid" },
                    { value: "self_paced", label: "Self-Paced" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} className="px-2">
              <Form.Item name="venueOrLink" label="Venue or Meeting Link" className="mb-3">
                <Input placeholder="e.g. Meeting Room 3 or Teams Link" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} className="px-2">
              <Form.Item name="maxCapacity" label="Seat Limit / Capacity" className="mb-3">
                <InputNumber min={5} max={500} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider className="my-2" />

          {/* Date Selection with BS Calendar */}
          <Row gutter={[16, 0]} className="mx-0 w-full">
            <Col xs={24} sm={12} className="px-2">
              <Form.Item label="Start Date (Nepali BS & English AD)" required className="mb-3">
                <div className="flex flex-col gap-1.5">
                  <NepaliDatePicker
                    value={startBS}
                    onChange={(bs) => {
                      setStartBS(bs);
                      const formatted = formatNepaliDateForForm(bs);
                      if (formatted) {
                        try {
                          const ad = DualDateConverter.convertToAD(formatted);
                          form.setFieldsValue({ startDate: ad });
                        } catch (err) {}
                      }
                    }}
                  />
                  <Form.Item name="startDate" noStyle rules={[{ required: true, message: "Start date is required" }]}>
                    <Input
                      value={startDateValue || ""}
                      placeholder="AD Date (auto-filled)"
                      readOnly
                      className="bg-gray-50 text-xs font-mono font-medium text-blue-900 border-blue-200 cursor-not-allowed"
                    />
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} className="px-2">
              <Form.Item label="End Date (Nepali BS & English AD)" required className="mb-3">
                <div className="flex flex-col gap-1.5">
                  <NepaliDatePicker
                    value={endBS}
                    onChange={(bs) => {
                      setEndBS(bs);
                      const formatted = formatNepaliDateForForm(bs);
                      if (formatted) {
                        try {
                          const ad = DualDateConverter.convertToAD(formatted);
                          form.setFieldsValue({ endDate: ad });
                        } catch (err) {}
                      }
                    }}
                  />
                  <Form.Item name="endDate" noStyle rules={[{ required: true, message: "End date is required" }]}>
                    <Input
                      value={endDateValue || ""}
                      placeholder="AD Date (auto-filled)"
                      readOnly
                      className="bg-gray-50 text-xs font-mono font-medium text-blue-900 border-blue-200 cursor-not-allowed"
                    />
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Divider className="my-2" />

          {/* Trainer Configuration */}
          <div className="px-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-700 text-xs">Trainer Assignment</span>
              <Select
                size="small"
                value={trainerType}
                onChange={(v) => setTrainerType(v)}
                options={[
                  { value: "internal", label: "Internal Colleague / Partner" },
                  { value: "external", label: "External Expert" },
                ]}
              />
            </div>

            {trainerType === "internal" ? (
              <Form.Item name="internalTrainerId" label="Internal Trainer" className="mb-3">
                <Select
                  placeholder="Search and select colleague"
                  showSearch
                  optionFilterProp="label"
                  options={activeUsers?.map((u: any) => ({
                    value: u.id,
                    label: `${u.name || u.username} (${u.role?.displayName || u.role?.name || "Staff"}) - ${u.email}`,
                  }))}
                />
              </Form.Item>
            ) : (
              <Row gutter={[16, 0]} className="mx-0 w-full">
                <Col xs={24} sm={12} className="px-0 pr-2">
                  <Form.Item name="externalTrainerName" label="Trainer Full Name" className="mb-3">
                    <Input placeholder="e.g. CA Ramesh Nepal" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} className="px-0 pl-2">
                  <Form.Item name="externalTrainerOrg" label="Organization / Firm" className="mb-3">
                    <Input placeholder="e.g. Institute of Chartered Accountants" />
                  </Form.Item>
                </Col>
              </Row>
            )}
          </div>

          {/* Dynamic Sessions */}
          <Divider className="my-2" />
          <div className="px-2">
            <Form.List name="sessions">
              {(fields, { add, remove }) => (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700 text-xs">Detailed Sessions (Optional)</span>
                    <Button
                      type="dashed"
                      size="small"
                      onClick={() => add({ sessionNumber: fields.length + 1, title: `Session ${fields.length + 1}` })}
                      icon={<PlusOutlined />}
                    >
                      Add Session
                    </Button>
                  </div>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="p-2 mb-2 bg-gray-50 border rounded flex items-center gap-2">
                      <Form.Item {...restField} name={[name, "title"]} className="mb-0 flex-1">
                        <Input placeholder="Session title" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "date"]} className="mb-0 w-36">
                        <Input placeholder="AD Date YYYY-MM-DD" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "startTime"]} className="mb-0 w-24">
                        <Input placeholder="10:00" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "endTime"]} className="mb-0 w-24">
                        <Input placeholder="12:00" />
                      </Form.Item>
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                    </div>
                  ))}
                </div>
              )}
            </Form.List>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default CreateBatchModal;
