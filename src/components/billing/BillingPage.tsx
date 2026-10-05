import { useBilling } from "@/hooks/billing/useBilling";
import { BillingType } from "@/types/billing";
import { Button, Card, Modal, Spin, Tabs, Popover } from "antd";
import { SettingOutlined, PlusOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import BillingForm from "./BillingForm";
import BillingTable from "./BillingTable";
import { useColumnVisibility } from "@/components/Table";
import { ALL_BILLING_COLUMNS } from "./billingColumnsConfig";

const BillingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<BillingType | undefined>(
    undefined
  );
  const { data: activeBillings, isLoading: activeLoading, refetch: refetchActive } = useBilling("active");
  const { data: suspendedBillings, isLoading: suspendedLoading, refetch: refetchSuspended } = useBilling("suspended");
  const { data: archivedBillings, isLoading: archivedLoading, refetch: refetchArchived } = useBilling("archived");

  // Standard Column Visibility Hook with LocalStorage Persistence
  const { visibleColumnKeys, setVisibleColumnKeys, columnCustomizer } = useColumnVisibility({
    persistenceKey: "billing_table",
    columns: ALL_BILLING_COLUMNS,
  });

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedBilling(undefined);
  };

  const showModal = (billing?: BillingType) => {
    setSelectedBilling(billing);
    setIsModalOpen(true);
  };

  const refreshAll = () => {
    refetchActive();
    refetchSuspended();
    refetchArchived();
  };

  const items = [
    {
      key: "1",
      label: "Active",
      children: activeLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <BillingTable 
          data={activeBillings || []} 
          showModal={showModal}
          onRefresh={refreshAll}
          visibleColumnKeys={visibleColumnKeys}
          onVisibleColumnKeysChange={setVisibleColumnKeys}
        />
      ),
    },
    {
      key: "2",
      label: "Suspended",
      children: suspendedLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <BillingTable 
          data={suspendedBillings || []} 
          showModal={showModal}
          onRefresh={refreshAll}
          visibleColumnKeys={visibleColumnKeys}
          onVisibleColumnKeysChange={setVisibleColumnKeys}
        />
      ),
    },
    {
      key: "3",
      label: "Archived",
      children: archivedLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <BillingTable 
          data={archivedBillings || []} 
          showModal={showModal}
          onRefresh={refreshAll}
          visibleColumnKeys={visibleColumnKeys}
          onVisibleColumnKeysChange={setVisibleColumnKeys}
        />
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Tabs 
          defaultActiveKey="1" 
          items={items} 
          tabBarExtraContent={
            <div className="flex items-center gap-2">
              {columnCustomizer}
              <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                Add Billing Entity
              </Button>
            </div>
          }
        />
      </Card>

      {isModalOpen && (
        <Modal
          title={selectedBilling ? "Edit Billing Entity" : "Add Billing Entity"}
          open={isModalOpen}
          onCancel={handleCancel}
          footer={null}
          width={800}
        >
          <BillingForm
            editBillingData={selectedBilling}
            handleCancel={handleCancel}
          />
        </Modal>
      )}
    </div>
  );
};

export default BillingPage;
