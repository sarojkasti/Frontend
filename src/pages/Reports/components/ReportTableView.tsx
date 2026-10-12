import React, { useState, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
} from "antd";
import {
  FileExcelOutlined,
  PrinterOutlined,
  DownloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  ReportColumnConfig,
  ReportSummaryKpi,
} from "../types/reportTypes";
import {
  exportReportToExcel,
  exportReportToCsv,
  printReportSheet,
  ExportMetadata,
} from "../utils/reportExportUtils";

const { Title, Text } = Typography;

interface ReportTableViewProps {
  reportTitle: string;
  metadata: ExportMetadata;
  columns: ReportColumnConfig[];
  selectedColumnKeys: string[];
  data: any[];
  kpis: ReportSummaryKpi[];
  isLoading: boolean;
  onOpenPrintPreview?: () => void;
}

export const ReportTableView: React.FC<ReportTableViewProps> = ({
  reportTitle,
  metadata,
  columns,
  selectedColumnKeys,
  data,
  kpis,
  isLoading,
  onOpenPrintPreview,
}) => {
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState(25);

  // Filter columns based on user selection
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => selectedColumnKeys.includes(col.key));
  }, [columns, selectedColumnKeys]);

  // Search filter across all data items
  const filteredData = useMemo(() => {
    if (!searchText.trim()) return data;
    const lower = searchText.toLowerCase();
    return data.filter((item) => {
      return Object.values(item).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(lower);
      });
    });
  }, [data, searchText]);

  // Calculate summary totals row
  const summaryTotals = useMemo(() => {
    const totals: Record<string, any> = {};

    visibleColumns.forEach((col) => {
      const key = col.dataIndex || col.key;
      // Check if numeric column suitable for summation
      const isNumeric = filteredData.some(
        (row) => typeof row[key] === "number" || (!isNaN(Number(row[key])) && row[key] !== "" && row[key] !== null)
      );

      if (
        key.includes("Hour") ||
        key.includes("hour") ||
        key.includes("budget") ||
        key.includes("Budget") ||
        key.includes("cost") ||
        key.includes("Cost") ||
        key.includes("variance") ||
        key.includes("Variance") ||
        key.includes("days") ||
        key.includes("Days") ||
        key.includes("Count") ||
        key.includes("count")
      ) {
        const sum = filteredData.reduce((acc, row) => {
          const val = Number(row[key]);
          return isNaN(val) ? acc : acc + val;
        }, 0);
        totals[key] = Number(sum.toFixed(2));
      }
    });

    return totals;
  }, [visibleColumns, filteredData]);

  // Handle Export
  const handleExportExcel = () => {
    exportReportToExcel(metadata, visibleColumns, filteredData, summaryTotals);
  };

  const handleExportCsv = () => {
    exportReportToCsv(metadata, visibleColumns, filteredData);
  };

  const handlePrint = () => {
    if (onOpenPrintPreview) {
      onOpenPrintPreview();
    } else {
      printReportSheet();
    }
  };

  return (
    <Card
      style={{
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        border: "1px solid #e2e8f0",
      }}
      bodyStyle={{ padding: "20px 24px" }}
    >
      {/* 1. Header Banner & Action Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, color: "#0f172a", fontWeight: 600 }}>
            {reportTitle}
          </Title>
          <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Tag color="cyan" style={{ borderRadius: 4, margin: 0 }}>
              Period: {metadata.dateRangeText}
            </Tag>
            {metadata.filterSummaryText && (
              <Tag color="geekblue" style={{ borderRadius: 4, margin: 0 }}>
                {metadata.filterSummaryText}
              </Tag>
            )}
            <Tag color="default" style={{ borderRadius: 4, margin: 0 }}>
              Generated: {filteredData.length} entries
            </Tag>
          </div>
        </div>

        {/* Export / Print Buttons */}
        <Space wrap size="small">
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
            style={{
              borderRadius: 6,
              backgroundColor: "#21a366",
              borderColor: "#21a366",
              boxShadow: "0 2px 6px rgba(33, 163, 102, 0.2)",
            }}
          >
            Export Excel (.xlsx)
          </Button>

          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportCsv}
            style={{ borderRadius: 6 }}
          >
            Export CSV
          </Button>

          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            style={{ borderRadius: 6 }}
          >
            Printable Sheet / PDF
          </Button>
        </Space>
      </div>

      {/* 2. KPI Summary Cards Strip */}
      {kpis.length > 0 && (
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          {kpis.map((kpi, idx) => (
            <Col xs={12} sm={8} md={24 / Math.min(kpis.length, 6)} key={idx}>
              <Card
                size="small"
                style={{
                  borderRadius: 8,
                  backgroundColor: "#f8fafc",
                  border: "1px solid #f1f5f9",
                }}
              >
                <Statistic
                  title={<Text style={{ fontSize: 12, color: "#64748b" }}>{kpi.label}</Text>}
                  value={kpi.value}
                  suffix={kpi.suffix}
                  prefix={kpi.prefix}
                  valueStyle={{
                    color: kpi.color || "#0f172a",
                    fontWeight: 600,
                    fontSize: 20,
                  }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 3. Search and Count Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <Input
          placeholder="Filter within generated table (name, project, task, status...)"
          prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 360, borderRadius: 6 }}
        />

        <Text type="secondary" style={{ fontSize: 12 }}>
          Showing {filteredData.length} of {data.length} records
        </Text>
      </div>

      {/* 4. Table */}
      <Table
        dataSource={filteredData}
        columns={visibleColumns as any}
        rowKey={(record, index) => record.id || record.key || `row-${index}`}
        loading={isLoading}
        size="middle"
        bordered
        scroll={{ x: "max-content" }}
        pagination={{
          pageSize: pageSize,
          pageSizeOptions: ["10", "25", "50", "100", "500"],
          showSizeChanger: true,
          onShowSizeChange: (_, size) => setPageSize(size),
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records`,
          style: { marginTop: 16 },
        }}
        summary={() => {
          if (filteredData.length === 0 || Object.keys(summaryTotals).length === 0) return null;
          return (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ backgroundColor: "#f8fafc", fontWeight: 600 }}>
                {visibleColumns.map((col, idx) => {
                  const key = col.dataIndex || col.key;
                  if (idx === 0) {
                    return (
                      <Table.Summary.Cell index={idx} key={col.key}>
                        <Text strong style={{ color: "#0f172a" }}>TOTAL</Text>
                      </Table.Summary.Cell>
                    );
                  }
                  const val = summaryTotals[key];
                  return (
                    <Table.Summary.Cell index={idx} key={col.key} align={col.align || "left"}>
                      {val !== undefined ? (
                        <Text strong style={{ color: "#0f172a" }}>
                          {typeof val === "number" ? val.toLocaleString("en-IN") : val}
                        </Text>
                      ) : null}
                    </Table.Summary.Cell>
                  );
                })}
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
    </Card>
  );
};
