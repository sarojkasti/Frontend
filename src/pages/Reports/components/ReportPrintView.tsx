import React from "react";
import { Modal, Button, Space, Typography, Divider } from "antd";
import { PrinterOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { ReportColumnConfig } from "../types/reportTypes";
import { ExportMetadata } from "../utils/reportExportUtils";

const { Title, Text } = Typography;

interface ReportPrintViewProps {
  open: boolean;
  onClose: () => void;
  metadata: ExportMetadata;
  columns: ReportColumnConfig[];
  selectedColumnKeys: string[];
  data: any[];
}

export const ReportPrintView: React.FC<ReportPrintViewProps> = ({
  open,
  onClose,
  metadata,
  columns,
  selectedColumnKeys,
  data,
}) => {
  const visibleColumns = columns.filter((col) => selectedColumnKeys.includes(col.key));

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1100}
      footer={[
        <Button key="close" icon={<CloseOutlined />} onClick={onClose}>
          Close Preview
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          style={{ backgroundColor: "#1677ff" }}
        >
          Print / Save as PDF
        </Button>,
      ]}
      title="Printable Report Preview"
      styles={{ body: { maxHeight: "75vh", overflowY: "auto", padding: "16px 24px" } }}
    >
      <div id="printable-report-content" className="printable-report-area">
        {/* Print Styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-report-content,
            #printable-report-content * {
              visibility: visible;
            }
            #printable-report-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
              margin: 0;
              background: #ffffff !important;
              color: #000000 !important;
            }
            .ant-modal-mask,
            .ant-modal-wrap,
            .ant-modal-footer,
            .ant-modal-header,
            .ant-modal-close {
              display: none !important;
            }
            .print-table {
              border-collapse: collapse;
              width: 100%;
              margin-top: 16px;
            }
            .print-table th,
            .print-table td {
              border: 1px solid #333333 !important;
              padding: 6px 8px !important;
              font-size: 10px !important;
              color: #000000 !important;
            }
            .print-table th {
              background-color: #f2f2f2 !important;
              font-weight: bold !important;
              text-align: left;
            }
            .no-print {
              display: none !important;
            }
          }

          .print-table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 16px;
          }
          .print-table th,
          .print-table td {
            border: 1px solid #d1d5db;
            padding: 8px 10px;
            font-size: 12px;
          }
          .print-table th {
            background-color: #f8fafc;
            font-weight: 600;
            color: #1e293b;
          }
          .print-table tr:nth-child(even) {
            background-color: #fafafa;
          }
        `}</style>

        {/* Formal Report Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Text
            strong
            style={{
              fontSize: 16,
              letterSpacing: "1.5px",
              color: "#475569",
              textTransform: "uppercase",
            }}
          >
            Artha Enterprise Management System
          </Text>
          <Title
            level={3}
            style={{
              margin: "4px 0 8px",
              fontWeight: 700,
              color: "#0f172a",
              textTransform: "uppercase",
            }}
          >
            {metadata.reportTitle}
          </Title>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#64748b",
              borderTop: "1px solid #e2e8f0",
              borderBottom: "1px solid #e2e8f0",
              padding: "8px 0",
              marginTop: 10,
            }}
          >
            <span>
              <strong>Date Range:</strong> {metadata.dateRangeText}
            </span>
            {metadata.filterSummaryText && (
              <span>
                <strong>Filters:</strong> {metadata.filterSummaryText}
              </span>
            )}
            <span>
              <strong>Total Records:</strong> {data.length}
            </span>
            <span>
              <strong>Generated On:</strong> {dayjs().format("YYYY-MM-DD hh:mm A")}
            </span>
          </div>
        </div>

        {/* Report Table */}
        <table className="print-table">
          <thead>
            <tr>
              {visibleColumns.map((col, idx) => (
                <th
                  key={col.key}
                  style={{
                    textAlign: col.align || "left",
                    width: col.width ? `${col.width}px` : undefined,
                  }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} style={{ textAlign: "center", padding: "20px" }}>
                  No records found for the selected criteria.
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr key={rIdx}>
                  {visibleColumns.map((col) => {
                    if (col.key === "sn" || col.key === "sno" || col.key === "index") {
                      return (
                        <td key={col.key} style={{ textAlign: "center" }}>
                          {rIdx + 1}
                        </td>
                      );
                    }
                    const val = col.dataIndex ? row[col.dataIndex] : row[col.key];
                    return (
                      <td key={col.key} style={{ textAlign: col.align || "left" }}>
                        {val === null || val === undefined ? "-" : typeof val === "boolean" ? (val ? "Yes" : "No") : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Formal Signature Blocks */}
        <div style={{ marginTop: 48, pageBreakInside: "avoid" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: 40,
              paddingTop: 10,
            }}
          >
            <div style={{ textAlign: "center", width: 200 }}>
              <div style={{ borderBottom: "1px solid #333", marginBottom: 6 }}></div>
              <Text strong style={{ fontSize: 12 }}>
                Prepared By
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {metadata.generatedBy || "Authorized User"}
              </Text>
            </div>

            <div style={{ textAlign: "center", width: 200 }}>
              <div style={{ borderBottom: "1px solid #333", marginBottom: 6 }}></div>
              <Text strong style={{ fontSize: 12 }}>
                Verified By
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>
                HR / Team Lead
              </Text>
            </div>

            <div style={{ textAlign: "center", width: 200 }}>
              <div style={{ borderBottom: "1px solid #333", marginBottom: 6 }}></div>
              <Text strong style={{ fontSize: 12 }}>
                Approved By
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Operations / Management
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
