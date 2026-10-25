import React from "react";
import { Modal, Button, Space, Typography, Divider } from "antd";
import { PrinterOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { ReportColumnConfig } from "../types/reportTypes";
import { ExportMetadata } from "../utils/reportExportUtils";
import { hasHtmlTags } from "@/utils/formatUtils";

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
    const printArea = document.getElementById("printable-report-content");
    if (!printArea) {
      window.print();
      return;
    }

    // Create isolated hidden iframe for printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${metadata.reportTitle || "Report"}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              color: #0f172a;
              background-color: #ffffff;
              margin: 0;
              padding: 8px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-table {
              border-collapse: collapse;
              width: 100%;
              margin-top: 14px;
            }
            .print-table th, .print-table td {
              border: 1px solid #cbd5e1 !important;
              padding: 6px 8px !important;
              font-size: 11px !important;
              color: #0f172a !important;
              vertical-align: top;
            }
            .print-table th {
              background-color: #f1f5f9 !important;
              font-weight: 700 !important;
              text-align: left;
            }
            .print-table tr:nth-child(even) td {
              background-color: #f8fafc !important;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          ${printArea.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Print failed:", err);
      } finally {
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {
            // Already detached
          }
        }, 2000);
      }
    }, 250);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1100}
      centered
      destroyOnClose
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
      styles={{ body: { maxHeight: "calc(85vh - 120px)", overflowY: "auto", padding: "16px 24px" } }}
    >
      <div id="printable-report-content" className="printable-report-area">
        {/* Print Styles */}
        <style>{`
          @media print {
            body {
              background: #ffffff !important;
            }
            .ant-modal-mask,
            .ant-modal-footer,
            .ant-modal-header,
            .ant-modal-close,
            .no-print {
              display: none !important;
            }
            .ant-modal-wrap {
              position: static !important;
              display: block !important;
              overflow: visible !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .ant-modal {
              position: static !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .ant-modal-content {
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              max-height: none !important;
              overflow: visible !important;
            }
            .ant-modal-body {
              max-height: none !important;
              overflow: visible !important;
              padding: 0 !important;
            }
            #printable-report-content {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
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
                    const isHtml = typeof val === "string" && hasHtmlTags(val);
                    return (
                      <td key={col.key} style={{ textAlign: col.align || "left" }}>
                        {val === null || val === undefined ? (
                          "-"
                        ) : typeof val === "boolean" ? (
                          val ? "Yes" : "No"
                        ) : isHtml ? (
                          <div
                            className="[&_p]:m-0 [&_p]:inline [&_ul]:pl-3.5 [&_li]:list-disc text-xs"
                            dangerouslySetInnerHTML={{ __html: String(val) }}
                          />
                        ) : (
                          String(val)
                        )}
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
