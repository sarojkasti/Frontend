import { Form, Select } from "antd";
import React from "react";

interface FormSelectWrapperProps {
  children?: React.ReactNode;
  error?: string;
  rules?: any[];
  options: { value: string; label: string }[];
  allowClear?: boolean;
  disabled?: boolean;
  label?: string;
  name?: string;
  id: string;
  classname?: string;
  changeHandler?: any;
  value?: string;
  defaultValue?: any;
  placeholder?: string;
  required?: boolean;
  mode?: "multiple" | "tags";
  showSearch?: boolean;
  filterOption?: boolean | ((input: string, option: any) => boolean);
  loading?: boolean;
  optionFilterProp?: string;
}

const FormSelectWrapper = (props: FormSelectWrapperProps) => {
  const {
    label = null,
    rules = [],
    options,
    placeholder,
    children = null,
    required = false,
    disabled = false,
    name,
    id,
    classname = "h-12 bg-gray-200",
    changeHandler = () => {},
    value,
    allowClear = false,
    error,
    mode,
    defaultValue,
    showSearch = false,
    filterOption = true,
    ...rest
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
        <Select
          className={classname}
          placeholder={placeholder}
          options={options}
          onChange={changeHandler}
          value={value}
          disabled={disabled}
          allowClear={allowClear}
          mode={mode}
          defaultValue={defaultValue}
          showSearch={showSearch}
          filterOption={filterOption}
          {...rest}
        />
      </Form.Item>
    </>
  );
};

export default FormSelectWrapper;
