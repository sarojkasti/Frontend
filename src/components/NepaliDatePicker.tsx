import React from "react";
import { Select, Row, Col } from "antd";
import dayjs from "dayjs";
import { DualDateConverter } from "../utils/dateConverter";

// Picker value type (not the library class)
export interface NepaliDate {
  year: number;
  month: number;
  day: number;
}

interface NepaliDatePickerProps {
  value?: NepaliDate;
  onChange?: (date: NepaliDate) => void;
  label?: string;
  disabled?: boolean;
}

// Accurate AD to BS conversion for dates using DualDateConverter
function adToBs(adDate: Date): NepaliDate {
  try {
    const dual = DualDateConverter.createDualDate(dayjs(adDate));
    const nepali = dual.nepali;
    return {
      year: nepali.getYear(),
      month: nepali.getMonth() + 1,
      day: nepali.getDate(),
    };
  } catch (error) {
    return {
      year: 2083,
      month: 7,
      day: 12,
    };
  }
}

function getTodayNepaliDate(): NepaliDate {
  try {
    const todayDual = DualDateConverter.getToday();
    return {
      year: todayDual.nepali.getYear(),
      month: todayDual.nepali.getMonth() + 1,
      day: todayDual.nepali.getDate(),
    };
  } catch {
    return adToBs(new Date());
  }
}

const nepaliYears = Array.from({ length: 91 }, (_, i) => 2000 + i); // 2000 to 2090 BS
const nepaliMonths = [
  "Baishakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];
const nepaliDays = Array.from({ length: 32 }, (_, i) => i + 1);

const NepaliDatePicker: React.FC<NepaliDatePickerProps> = ({
  value,
  onChange,
  label,
  disabled = false,
}) => {
  const currentYear = value?.year;
  const currentMonth = value?.month;
  const currentDay = value?.day;

  const handleChange = (type: "year" | "month" | "day", val: number) => {
    const today = getTodayNepaliDate();
    const newYear = type === "year" ? val : (currentYear ?? today.year);
    const newMonth = type === "month" ? val : (currentMonth ?? today.month);
    const newDay = type === "day" ? val : (currentDay ?? today.day);

    if (onChange) {
      onChange({ year: newYear, month: newMonth, day: newDay });
    }
  };

  return (
    <Row gutter={8} align="middle">
      {label && (
        <Col span={24}>
          <b>{label}</b>
        </Col>
      )}
      <Col xs={24} sm={8}>
        <Select
          value={currentYear}
          placeholder="Year"
          disabled={disabled}
          onChange={(val) => handleChange("year", val)}
          style={{ width: "100%" }}
        >
          {nepaliYears.map((y) => (
            <Select.Option key={y} value={y}>
              {y}
            </Select.Option>
          ))}
        </Select>
      </Col>
      <Col xs={24} sm={8}>
        <Select
          value={currentMonth}
          placeholder="Month"
          disabled={disabled}
          onChange={(val) => handleChange("month", val)}
          style={{ width: "100%" }}
        >
          {nepaliMonths.map((m, i) => (
            <Select.Option key={i + 1} value={i + 1}>
              {m}
            </Select.Option>
          ))}
        </Select>
      </Col>
      <Col xs={24} sm={8}>
        <Select
          value={currentDay}
          placeholder="Day"
          disabled={disabled}
          onChange={(val) => handleChange("day", val)}
          style={{ width: "100%" }}
        >
          {nepaliDays.map((d) => (
            <Select.Option key={d} value={d}>
              {d}
            </Select.Option>
          ))}
        </Select>
      </Col>
    </Row>
  );
};

export default NepaliDatePicker;
