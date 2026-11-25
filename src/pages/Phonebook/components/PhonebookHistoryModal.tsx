import React from "react";
import { Empty, Modal, Spin, Tag, Timeline, Typography } from "antd";
import dayjs from "dayjs";
import { usePhonebookHistory } from "@/hooks/phonebook/usePhonebook";
import { PhonebookEntry } from "@/types/phonebook";

const { Text } = Typography;

interface PhonebookHistoryModalProps {
  open: boolean;
  entry: PhonebookEntry | null;
  onClose: () => void;
}

const PhonebookHistoryModal: React.FC<PhonebookHistoryModalProps> = ({
  open,
  entry,
  onClose,
}) => {
  const { data: history = [], isLoading } = usePhonebookHistory(
    entry?.id || null,
    open
  );

  return (
    <Modal
      title={`Change History — ${entry?.name || ""}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      ) : history.length === 0 ? (
        <Empty description="No change history recorded" className="my-6" />
      ) : (
        <Timeline
          className="mt-4"
          items={history.map((item) => ({
            color: item.action === "created" ? "green" : "blue",
            children: (
              <div className="pb-2">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Tag color={item.action === "created" ? "green" : "blue"}>
                    {item.action === "created" ? "Created" : "Updated"}
                  </Tag>
                  <Text strong>{item.editedBy?.name || "Unknown User"}</Text>
                  <Text type="secondary" className="text-xs">
                    {dayjs(item.editedAt).format("YYYY-MM-DD HH:mm")}
                  </Text>
                </div>
                {item.changes && item.changes.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded p-2 text-xs space-y-1">
                    {item.changes.map((c, idx) => (
                      <div key={`${c.field}-${idx}`}>
                        <span className="font-medium text-slate-700">
                          {c.label}:
                        </span>{" "}
                        {item.action === "created" ? (
                          <span className="text-slate-900">
                            {c.newValue || "—"}
                          </span>
                        ) : (
                          <>
                            <span className="line-through text-red-500">
                              {c.oldValue || "Empty"}
                            </span>{" "}
                            →{" "}
                            <span className="text-emerald-700 font-medium">
                              {c.newValue || "Empty"}
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          }))}
        />
      )}
    </Modal>
  );
};

export default PhonebookHistoryModal;
