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
  // Initialize state with the provided value or undefined
  const [selectedYear, setSelectedYear] = useState<number | undefined>(value?.year);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(value?.month);
  const [selectedDay, setSelectedDay] = useState<number | undefined>(value?.day);

  // Update the component when the external value changes
  useEffect(() => {
    if (value) {
      setSelectedYear(value.year);
      setSelectedMonth(value.month);
      setSelectedDay(value.day);
    } else {
      setSelectedYear(undefined);
      setSelectedMonth(undefined);
      setSelectedDay(undefined);
    }
  }, [value]);

  const handleChange = (type: "year" | "month" | "day", val: number) => {
    const today = getTodayNepaliDate();
    let newYear = selectedYear ?? today.year;
    let newMonth = selectedMonth ?? today.month;
    let newDay = selectedDay ?? today.day;
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
          value={selectedMonth}
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
          value={selectedDay}
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
