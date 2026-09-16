import React from "react";
import { Form, Input } from "antd";

interface FormInputWrapperProps {
  children?: React.ReactNode;
  error?: string;
  rules?: any[];
  min?: number;
  max?: number;
  allowClear?: boolean;
  disabled?: boolean;
  passwordInput?: boolean;
  label?: string;
  name?: string;
  id: string;
  classname?: string;
  changeHandler?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
  autoComplete?: string;
  showCount?: boolean;
  maxLength?: number;
}

const FormInputWrapper = (props: FormInputWrapperProps) => {
  const {
    label = null,
    rules = [],
    placeholder,
    icon,
    children = null,
    required = false,
    passwordInput = false,
    name,
    id,
    classname = "py-3 bg-gray-200",
    type,
    value,
    disabled = false,
    allowClear = false,
    changeHandler = () => {},
    min = 0,
    max = 0,
    error,
    autoComplete,
    showCount = false,
    maxLength,
  } = props;

  return (
    <>
      {children}
      <Form.Item
        label={label ? label : ""}
        name={name}
        rules={rules}
        required={required}
        validateStatus={error ? "error" : undefined}
        help={error}
        hasFeedback
      >
        {passwordInput ? (
          <Input.Password
            className={classname}
            type={type}
            id={id}
            min={min}
            value={value || ""}
            max={max}
            name={name}
            size="large"
            prefix={icon}
            placeholder={placeholder}
            onChange={changeHandler}
            disabled={disabled}
            allowClear={allowClear}
            autoComplete="off"
            visibilityToggle={true}
          />
        ) : (
          <Input
            className={classname}
            type={type}
            id={id}
            min={min}
            value={value || ""}
            max={max}
            name={name}
            prefix={icon}
            placeholder={placeholder}
            onChange={changeHandler}
            disabled={disabled}
            autoComplete={autoComplete || "on"}
            showCount={showCount}
            maxLength={maxLength}
          />
        )}
      </Form.Item>
    </>
  );
};

export default FormInputWrapper;
