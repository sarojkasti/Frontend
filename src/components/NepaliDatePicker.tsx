import React, { useState, useEffect } from "react";
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
  // Get today's Nepali date as default
  const today = getTodayNepaliDate();
  // Use either the provided value or today's date as default
  const defaultDate = value || today;

  // Initialize state with the default date
  const [selectedYear, setSelectedYear] = useState<number>(defaultDate.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(defaultDate.month);
  const [selectedDay, setSelectedDay] = useState<number>(defaultDate.day);

  // Update the component when the external value changes
  useEffect(() => {
    if (value) {
      setSelectedYear(value.year);
      setSelectedMonth(value.month);
      setSelectedDay(value.day);
    }
  }, [value]);

  const handleChange = (type: "year" | "month" | "day", val: number) => {
    let newYear = selectedYear;
    let newMonth = selectedMonth;
    let newDay = selectedDay;
    if (type === "year") newYear = val;
    if (type === "month") newMonth = val;
    if (type === "day") newDay = val;

    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
    setSelectedDay(newDay);

    // Trigger the onChange callback with the new date
    if (onChange) {
      const newDate = { year: newYear, month: newMonth, day: newDay };
      onChange(newDate);
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
          value={selectedYear}
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
          value={selectedMonth}
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
          value={selectedDay}
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
