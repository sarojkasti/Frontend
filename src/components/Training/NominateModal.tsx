import React, { useState } from "react";
import { Modal, Select, Input, message } from "antd";
import { useNominateUsers } from "@/hooks/training/useTraining";
import { listActiveUsers } from "@/service/user.service";
import { useQuery } from "@tanstack/react-query";
import { TrainingBatch } from "@/types/training";

interface NominateModalProps {
  batch: TrainingBatch | null;
  open: boolean;
  onCancel: () => void;
}

const NominateModal: React.FC<NominateModalProps> = ({ batch, open, onCancel }) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");
  const { data: activeUsers, isPending: isLoadingUsers } = useQuery({
    queryKey: ["active-users"],
    queryFn: listActiveUsers,
  });

  const { mutate: nominate, isPending } = useNominateUsers();

  const handleOk = () => {
    if (!batch?.id) return;
    if (selectedUserIds.length === 0) {
      message.warning("Please select at least one employee to nominate");
      return;
    }

    nominate(
      { batchId: batch.id, userIds: selectedUserIds, remarks },
      {
        onSuccess: () => {
          setSelectedUserIds([]);
          setRemarks("");
          onCancel();
        },
      }
    );
  };

  // Filter out already enrolled users
  const alreadyEnrolledSet = new Set(batch?.enrollments?.map((e) => e.user?.id) || []);
  const availableUsers = (activeUsers || []).filter((u: any) => !alreadyEnrolledSet.has(u.id));

  return (
    <Modal
      title={`Nominate Staff to: ${batch?.course?.title || batch?.batchName}`}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={isPending}
      width={600}
      centered
      styles={{
        body: {
          overflowX: "hidden",
          overflowY: "auto",
          maxHeight: "calc(85vh - 100px)",
        },
      }}
      destroyOnClose
    >
      <div className="py-2">
        <p className="text-sm text-gray-500 mb-3">
          Nominated employees will receive a notification and calendar update automatically.
        </p>

        <label className="block text-xs font-semibold text-gray-700 mb-1">Select Employees</label>
        <Select
          mode="multiple"
          style={{ width: "100%" }}
          placeholder="Search and select employees..."
          value={selectedUserIds}
          onChange={(vals) => setSelectedUserIds(vals)}
          loading={isLoadingUsers}
          showSearch
          optionFilterProp="label"
          options={availableUsers.map((u: any) => ({
            value: u.id,
            label: `${u.name || u.username} (${u.role?.displayName || u.role?.name || "Staff"}) - ${u.email}`,
          }))}
        />

        <label className="block text-xs font-semibold text-gray-700 mt-4 mb-1">
          Instructions / Remarks (Optional)
        </label>
        <Input.TextArea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="e.g. Mandatory attendance for Q1 audit prep..."
        />
      </div>
    </Modal>
  );
};

export default NominateModal;
