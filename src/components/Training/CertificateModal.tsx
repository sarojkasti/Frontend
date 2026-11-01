import React, { useRef } from "react";
import { Modal, Button } from "antd";
import { PrinterOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { TrainingEnrollment } from "@/types/training";

interface CertificateModalProps {
  enrollment: TrainingEnrollment | null;
  open: boolean;
  onCancel: () => void;
}

const CertificateModal: React.FC<CertificateModalProps> = ({ enrollment, open, onCancel }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  if (!enrollment) return null;

  const course = enrollment.batch?.course;
  const completedDate = enrollment.completedAt
    ? new Date(enrollment.completedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Completed";

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          Close
        </Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          Print / Save PDF
        </Button>,
      ]}
      width={780}
      centered
      styles={{
        body: {
          overflowX: "hidden",
          overflowY: "auto",
          maxHeight: "calc(88vh - 100px)",
          padding: 12,
        },
      }}
      destroyOnClose
    >
      <div
        ref={printRef}
        className="p-8 border-4 border-double border-blue-900 bg-gradient-to-b from-blue-50/30 to-white text-center rounded-lg shadow-sm"
      >
        <div className="flex justify-center mb-2 text-blue-800">
          <SafetyCertificateOutlined style={{ fontSize: 52 }} />
        </div>
        <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">
          Artha Practice Management & Professional Academy
        </div>
        <h1 className="text-2xl font-serif text-blue-950 font-bold mt-2 mb-1">
          Certificate of Completion
        </h1>
        <p className="text-xs text-gray-500 italic">This is to officially certify that</p>

        <div className="text-2xl font-bold text-gray-900 border-b-2 border-blue-900/20 inline-block px-8 py-1 my-3 font-serif">
          {enrollment.user?.name || enrollment.user?.email}
        </div>

        <p className="text-sm text-gray-600 max-w-lg mx-auto">
          has successfully attended and completed the professional development course
        </p>

        <h3 className="text-lg font-bold text-blue-900 mt-2 mb-1">
          {course?.title || "Professional Development Training"}
        </h3>
        <p className="text-xs text-gray-500 font-medium">
          Course Code: {course?.code} | Category: {course?.category}
        </p>

        <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t border-gray-200 text-xs text-gray-600">
          <div>
            <div className="font-semibold text-gray-800">{course?.cpdHours || 0} Hours</div>
            <div className="text-gray-400">Recognized CPD Credits</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800">{completedDate}</div>
            <div className="text-gray-400">Date of Award</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800">{enrollment.certificateNumber || "VERIFIED"}</div>
            <div className="text-gray-400">Certificate Verification No.</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CertificateModal;
