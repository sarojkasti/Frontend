import React, { useState, useEffect, useRef } from "react";
import {
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  Button,
  Spin,
  message,
} from "antd";
import type { InputRef } from "antd";
import { CheckOutlined, CloseOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { CellEditConfig } from "../types";

export interface EditableCellProps<T = any> {
  value: any;
  record: T;
  dataIndex: string;
  config?: CellEditConfig<T>;
  onSave?: (
    record: T,
    dataIndex: string,
    newValue: any,
    oldValue: any
  ) => Promise<boolean | void> | boolean | void;
  renderDefault?: () => React.ReactNode;
  editable?: boolean | ((record: T) => boolean);
  disabled?: boolean | ((record: T) => boolean);
}

export const EditableCell: React.FC<EditableCellProps> = ({
  value: initialValue,
  record,
  dataIndex,
  config = {},
  onSave,
  renderDefault,
  editable = true,
  disabled = false,
}) => {
  const isEditable =
    typeof editable === "function" ? editable(record) : editable;
  const isDisabled =
    typeof disabled === "function"
      ? disabled(record)
      : typeof config.disabled === "function"
      ? config.disabled(record)
      : !!config.disabled || disabled;

  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState<any>(initialValue);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<InputRef>(null);

  // Sync internal state if initialValue changes externally
  useEffect(() => {
    if (!isEditing) {
      setCurrentValue(initialValue);
    }
  }, [initialValue, isEditing]);

  // Focus input when editing begins
  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isEditing]);

  if (!isEditable || isDisabled) {
    return <>{renderDefault ? renderDefault() : formatDisplayValue(initialValue, config)}</>;
  }

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentValue(initialValue);
    setIsEditing(true);
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentValue(initialValue);
    setIsEditing(false);
  };

  const handleCommit = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentValue === initialValue) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      let success: boolean | void = true;
      if (config.onSave) {
        success = await config.onSave(record, currentValue, initialValue);
      } else if (onSave) {
        success = await onSave(record, dataIndex, currentValue, initialValue);
      }

      if (success !== false) {
        setIsEditing(false);
      }
    } catch (err: any) {
      message.error(err?.message || "Failed to update value");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && config.type !== "textarea") {
      e.preventDefault();
      handleCommit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  // Switch type can toggle directly without multi-step edit mode
  if (config.type === "switch") {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Switch
          size="small"
          checked={!!currentValue}
          loading={saving}
          onChange={async (checked) => {
            setCurrentValue(checked);
            setSaving(true);
            try {
              if (config.onSave) {
                await config.onSave(record, checked, initialValue);
              } else if (onSave) {
                await onSave(record, dataIndex, checked, initialValue);
              }
            } catch (err: any) {
              message.error(err?.message || "Failed to update");
              setCurrentValue(initialValue);
            } finally {
              setSaving(false);
            }
          }}
        />
      </div>
    );
  }

  // Active editing view
  if (isEditing) {
    const rawOptions =
      typeof config.options === "function"
        ? config.options(record)
        : config.options || [];

    return (
      <div
        className="flex items-center gap-1 min-w-[140px] z-20 py-0.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex-1">
          {config.renderCustomInput ? (
            config.renderCustomInput({
              value: currentValue,
              record,
              onChange: setCurrentValue,
              onSave: handleCommit,
              onCancel: handleCancel,
              loading: saving,
            })
          ) : config.type === "select" ? (
            <Select
              size="small"
              value={currentValue}
              onChange={setCurrentValue}
              options={rawOptions}
              className="w-full text-xs"
              autoFocus
              disabled={saving}
              placeholder={config.placeholder || "Select"}
            />
          ) : config.type === "number" ? (
            <InputNumber
              size="small"
              value={currentValue}
              onChange={setCurrentValue}
              className="w-full text-xs"
              autoFocus
              disabled={saving}
              placeholder={config.placeholder}
            />
          ) : config.type === "date" ? (
            <DatePicker
              size="small"
              value={currentValue ? dayjs(currentValue) : null}
              onChange={(date) =>
                setCurrentValue(date ? date.toISOString() : null)
              }
              className="w-full text-xs"
              autoFocus
              disabled={saving}
            />
          ) : config.type === "textarea" ? (
            <Input.TextArea
              size="small"
              rows={2}
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              className="text-xs"
              autoFocus
              disabled={saving}
              placeholder={config.placeholder}
            />
          ) : (
            <Input
              ref={inputRef}
              size="small"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              className="text-xs"
              disabled={saving}
              placeholder={config.placeholder}
            />
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            type="primary"
            size="small"
            icon={saving ? <Spin size="small" /> : <CheckOutlined />}
            onClick={handleCommit}
            disabled={saving}
            className="w-6 h-6 p-0 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 border-none"
            title="Save (Enter)"
          />
          <Button
            size="small"
            icon={<CloseOutlined />}
            onClick={handleCancel}
            disabled={saving}
            className="w-6 h-6 p-0 flex items-center justify-center text-slate-500 hover:text-slate-700"
            title="Cancel (Esc)"
          />
        </div>
      </div>
    );
  }

  // Normal view with subtle hover-to-edit indicator
  return (
    <div
      onClick={handleStartEdit}
      className="group/cell flex items-center justify-between gap-1.5 cursor-pointer rounded px-1.5 py-0.5 -mx-1.5 hover:bg-blue-50/80 transition-all border border-transparent hover:border-blue-200"
      title="Click to edit"
    >
      <span className="truncate flex-1">
        {renderDefault ? renderDefault() : formatDisplayValue(initialValue, config)}
      </span>
      <EditOutlined className="text-slate-400 group-hover/cell:text-blue-600 text-xs opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0" />
    </div>
  );
};

function formatDisplayValue(val: any, config?: CellEditConfig<any>): React.ReactNode {
  if (val === undefined || val === null || val === "") {
    return <span className="text-slate-400">-</span>;
  }
  if (config?.type === "select" && Array.isArray(config.options)) {
    const matched = config.options.find((o) => o.value === val);
    if (matched) return matched.label;
  }
  if (config?.type === "date" && dayjs(val).isValid()) {
    return dayjs(val).format("YYYY-MM-DD");
  }
  return String(val);
}

export default EditableCell;
