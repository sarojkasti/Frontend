import React, { useMemo, useState } from "react";
import {
  Drawer,
  Form,
  Select,
  Segmented,
  DatePicker,
  Input,
  Button,
  Space,
  Tag,
  Alert,
  Typography,
  Radio,
  message,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import NepaliDatePicker, { NepaliDate } from "../../NepaliDatePicker";
import { useActiveLeaveTypes } from "../../../hooks/useLeaveTypes";
import { useMyLeaveBalances } from "../../../hooks/useLeaveTypes";
import { useApprovers } from "../../../hooks/leave/useApprovers";
import { useCreateLeave } from "../../../hooks/leave/useLeave";
import { useDateSystem } from "../../../context/DateSystemContext";
import { bsToAdString, formatLeaveDate, inclusiveDays } from "../../../utils/leaveDate";
import { leaveColor } from "./leaveMeta";
import type { LeaveBalance } from "../../../types/leave";

const { TextArea } = Input;
const { Text } = Typography;

type Mode = "range" | "custom";

interface Props {
  open: boolean;
  onClose: () => void;
}

const NewRequestDrawer: React.FC<Props> = ({ open, onClose }) => {
  const { system, setSystem } = useDateSystem();
  const [form] = Form.useForm();
  const createLeave = useCreateLeave();

  const { data: leaveTypesRaw } = useActiveLeaveTypes();
  const { data: balancesRaw } = useMyLeaveBalances();
  const { data: approversRaw } = useApprovers();

  const leaveTypes: any[] = Array.isArray(leaveTypesRaw) ? leaveTypesRaw : [];
  const balances: LeaveBalance[] = Array.isArray(balancesRaw) ? balancesRaw : [];
  const approvers: any[] = Array.isArray(approversRaw) ? approversRaw : [];

  const [mode, setMode] = useState<Mode>("range");
  const [typeName, setTypeName] = useState<string | undefined>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [bsFrom, setBsFrom] = useState<NepaliDate | undefined>();
  const [bsTo, setBsTo] = useState<NepaliDate | undefined>();
  const [customDates, setCustomDates] = useState<string[]>([]); // AD ISO strings
  const [bsPick, setBsPick] = useState<NepaliDate | undefined>();
  const [adPick, setAdPick] = useState<Dayjs | null>(null);

  // Fractional Leave state
  const [isFractional, setIsFractional] = useState<boolean>(false);
  const [fractionalType, setFractionalType] = useState<"first_half" | "second_half">(
    "first_half"
  );

  // remaining balance for the selected type
  const remaining = useMemo(() => {
    const bal = balances.find((b) => b.leaveType?.name === typeName);
    return bal ? Number(bal.remainingDays) : undefined;
  }, [balances, typeName]);
  const total = useMemo(() => {
    const bal = balances.find((b) => b.leaveType?.name === typeName);
    return bal ? Number(bal.totalAvailableDays) : undefined;
  }, [balances, typeName]);

  // Resolve the AD start/end + day count for whatever mode/system is active.
  const resolved = useMemo(() => {
    let startAd: string | undefined;
    let endAd: string | undefined;
    let dates: string[] = [];

    if (mode === "range") {
      if (system === "AD") {
        startAd = range[0]?.format("YYYY-MM-DD");
        endAd = range[1]?.format("YYYY-MM-DD");
      } else {
        try {
          startAd = bsFrom ? bsToAdString(bsFrom) : undefined;
          endAd = bsTo ? bsToAdString(bsTo) : undefined;
        } catch {
          /* invalid BS conversion */
        }
      }
    } else {
      dates = [...customDates].sort();
      startAd = dates[0];
      endAd = dates[dates.length - 1];
    }

    const isSingleDay =
      (mode === "custom" && dates.length === 1) ||
      (mode === "range" && !!startAd && startAd === endAd);

    let days = mode === "custom" ? dates.length : inclusiveDays(startAd, endAd);

    if (isSingleDay && isFractional) {
      days = 0.5;
    }

    return { startAd, endAd, dates, days, isSingleDay };
  }, [mode, system, range, bsFrom, bsTo, customDates, isFractional]);

  const exceeds = remaining !== undefined && resolved.days > remaining;
  const canSubmit =
    !!typeName &&
    resolved.days > 0 &&
    !exceeds &&
    !!form.getFieldValue("requestedManagerId");

  const addCustomDate = () => {
    let iso: string | undefined;
    if (system === "AD") iso = adPick?.format("YYYY-MM-DD");
    else if (bsPick) {
      try {
        iso = bsToAdString(bsPick);
      } catch {
        message.error("Could not convert that Nepali date");
      }
    }
    if (iso && !customDates.includes(iso)) setCustomDates((d) => [...d, iso!]);
    setAdPick(null);
    setBsPick(undefined);
  };

  const reset = () => {
    form.resetFields();
    setTypeName(undefined);
    setRange([null, null]);
    setBsFrom(undefined);
    setBsTo(undefined);
    setCustomDates([]);
    setMode("range");
    setIsFractional(false);
    setFractionalType("first_half");
  };

  const handleSubmit = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    if (!resolved.startAd || !resolved.endAd) {
      message.error("Please choose your leave dates");
      return;
    }
    const payload = {
      type: typeName!,
      reason: values.reason,
      requestedManagerId: values.requestedManagerId,
      isCustomDates: mode === "custom",
      isFractional: resolved.isSingleDay && isFractional,
      fractionalType: resolved.isSingleDay && isFractional ? fractionalType : undefined,
      fractionalDuration: resolved.isSingleDay && isFractional ? 0.5 : undefined,
      ...(mode === "custom"
        ? { customDates: resolved.dates }
        : { startDate: resolved.startAd, endDate: resolved.endAd }),
    };
    createLeave.mutate(payload as any, {
      onSuccess: () => {
        message.success("Leave request submitted");
        reset();
        onClose();
      },
      onError: (err: any) =>
        message.error(err?.response?.data?.message || "Could not submit request"),
    });
  };

  const selectedType = leaveTypes.find((t) => t.name === typeName);

  return (
    <Drawer
      title="New time-off request"
      width={460}
      open={open}
      onClose={onClose}
      destroyOnClose
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            loading={createLeave.isPending}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Submit request
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item label="Leave type" required>
          <Select
            placeholder="Select a leave type"
            value={typeName}
            onChange={setTypeName}
            options={leaveTypes.map((t) => {
              const bal = balances.find((b) => b.leaveType?.name === t.name);
              const left = bal ? Number(bal.remainingDays) : undefined;
              return {
                value: t.name,
                label: (
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: leaveColor(t.name),
                      }}
                    />
                    {t.name}
                    {left !== undefined && (
                      <Text type="secondary" style={{ marginLeft: "auto", fontSize: 12 }}>
                        {left} left
                      </Text>
                    )}
                  </span>
                ),
              };
            })}
          />
        </Form.Item>

        <Form.Item label="Enter dates in">
          <Segmented
            value={system}
            onChange={(v) => setSystem(v as "AD" | "BS")}
            options={[
              { label: "BS · नेपाली", value: "BS" },
              { label: "AD", value: "AD" },
            ]}
          />
        </Form.Item>

        <Form.Item label="Duration">
          <Segmented
            value={mode}
            onChange={(v) => {
              setMode(v as Mode);
              setIsFractional(false);
            }}
            options={[
              { label: "Date range", value: "range" },
              { label: "Specific days", value: "custom" },
            ]}
          />
        </Form.Item>

        {mode === "range" ? (
          system === "AD" ? (
            <Form.Item label="From – To" required>
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                value={range as any}
                onChange={(v) => {
                  setRange((v as any) || [null, null]);
                  setIsFractional(false);
                }}
                disabledDate={(d) => d && d < dayjs().startOf("day")}
              />
            </Form.Item>
          ) : (
            <Space size="middle" style={{ display: "flex" }} align="end">
              <NepaliDatePicker label="From" value={bsFrom} onChange={setBsFrom} />
              <NepaliDatePicker label="To" value={bsTo} onChange={setBsTo} />
            </Space>
          )
        ) : (
          <Form.Item label="Add specific days">
            <Space.Compact style={{ width: "100%" }}>
              {system === "AD" ? (
                <DatePicker
                  style={{ width: "100%" }}
                  value={adPick}
                  onChange={setAdPick}
                  disabledDate={(d) => d && d < dayjs().startOf("day")}
                />
              ) : (
                <div style={{ flex: 1 }}>
                  <NepaliDatePicker value={bsPick} onChange={setBsPick} />
                </div>
              )}
              <Button onClick={addCustomDate}>Add</Button>
            </Space.Compact>
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {resolved.dates.map((d) => (
                <Tag
                  key={d}
                  closable
                  onClose={() => setCustomDates((cur) => cur.filter((x) => x !== d))}
                >
                  {formatLeaveDate(d, system)}
                </Tag>
              ))}
            </div>
          </Form.Item>
        )}

        {/* Fractional / Half-Day Selector if Single Day is selected */}
        {resolved.isSingleDay && (
          <div
            style={{
              padding: "10px 14px",
              background: "#fafafa",
              border: "1px dashed #d9d9d9",
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
              Single Day Time-off Option
            </div>
            <Radio.Group
              value={isFractional ? fractionalType : "full"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "full") {
                  setIsFractional(false);
                } else {
                  setIsFractional(true);
                  setFractionalType(val);
                }
              }}
            >
              <Space direction="vertical">
                <Radio value="full">Full Day (1.0 day)</Radio>
                <Radio value="first_half">First Half / Morning (0.5 day)</Radio>
                <Radio value="second_half">Second Half / Afternoon (0.5 day)</Radio>
              </Space>
            </Radio.Group>
          </div>
        )}

        {/* live dual-date + balance feedback */}
        {resolved.days > 0 && resolved.startAd && (
          <div
            style={{
              fontSize: 12.5,
              color: "#5c6b7a",
              background: "rgba(0,0,0,0.03)",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: 8,
              padding: "8px 11px",
              marginBottom: 12,
            }}
          >
            {formatLeaveDate(resolved.startAd, system)}
            {resolved.endAd && resolved.endAd !== resolved.startAd
              ? ` → ${formatLeaveDate(resolved.endAd, system)}`
              : ""}
            {isFractional && ` · Half-Day (${fractionalType === 'first_half' ? 'First Half' : 'Second Half'})`}
          </div>
        )}

        {resolved.days > 0 &&
          (exceeds ? (
            <Alert
              type="warning"
              showIcon
              message={`Not enough balance — ${remaining} days of ${typeName} available, but ${resolved.days} requested.`}
              style={{ marginBottom: 12 }}
            />
          ) : (
            <Alert
              type="info"
              showIcon
              message={
                <span>
                  Requesting <b>{resolved.days}</b> day{resolved.days === 1 ? "" : "s"}
                  {remaining !== undefined && total !== undefined && (
                    <>
                      {" "}
                      · balance after approval <b>{remaining - resolved.days}</b> of {total}
                    </>
                  )}
                </span>
              }
              style={{ marginBottom: 12 }}
            />
          ))}

        <Form.Item
          label="Send to"
          name="requestedManagerId"
          rules={[{ required: true, message: "Choose an approver" }]}
          extra="Staff request from a manager; managers request from admin."
        >
          <Select
            placeholder="Select approver"
            options={approvers.map((a) => ({
              value: a.id,
              label: `${a.name || `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim()} — ${
                a.role?.displayName || a.role?.name || ""
              }`,
            }))}
          />
        </Form.Item>

        <Form.Item label="Reason" name="reason">
          <TextArea rows={3} placeholder="Optional — a short note for your approver" />
        </Form.Item>

        {selectedType?.isEmergency && (
          <Alert
            type="info"
            message="Emergency leave can be requested for today. Other types must be applied at least one day in advance."
          />
        )}
      </Form>
    </Drawer>
  );
};

export default NewRequestDrawer;
