
import React, { useState } from "react";
import { Card, Modal, message, Space, Button } from "antd";
import WorkhourTable, { ALL_WORKHOUR_COLUMNS } from "../../components/Workhour/WorkhourTable";
import WorkhourForm from "../../components/Workhour/WorkhourForm";
import { useCreateWorkhour, useUpdateWorkhour } from "../../hooks/workhour/useWorkhour";
import { WorkhourType } from "../../types/workhour";
import { useColumnVisibility } from "@/components/Table";

// Dummy users for select (replace with API call in real app)
const users = [
	{ label: "User 1", value: 1 },
	{ label: "User 2", value: 2 },
];

const WorkhourPage: React.FC = () => {
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<WorkhourType | null>(null);
	const createMutation = useCreateWorkhour();
	const updateMutation = useUpdateWorkhour();
	const { visibleColumnKeys, columnCustomizer } = useColumnVisibility({
		persistenceKey: "workhour_table",
		columns: ALL_WORKHOUR_COLUMNS,
		size: "small",
	});

	const handleAdd = () => {
		setEditing(null);
		setModalOpen(true);
	};

	const handleEdit = (workhour: WorkhourType) => {
		setEditing(workhour);
		setModalOpen(true);
	};

	const handleSubmit = (values: any) => {
		if (editing) {
			updateMutation.mutate(
				{ id: editing.id, payload: values },
				{
					onSuccess: () => {
						message.success("Workhour updated");
						setModalOpen(false);
					},
				}
			);
		} else {
			createMutation.mutate(values, {
				onSuccess: () => {
					message.success("Workhour created");
					setModalOpen(false);
				},
			});
		}
	};

	return (
		<Card
			title="Workhour Configurations"
			extra={
				<Space>
					{columnCustomizer}
					<Button type="primary" size="small" onClick={handleAdd}>
						Add Workhour
					</Button>
				</Space>
			}
		>
			<WorkhourTable onEdit={handleEdit} visibleColumnKeys={visibleColumnKeys} />
			<Modal
				open={modalOpen}
				onCancel={() => setModalOpen(false)}
				footer={null}
				destroyOnClose
				title={editing ? "Edit Workhour" : "Add Workhour"}
			>
				<WorkhourForm
					initialValues={editing || undefined}
					onSubmit={handleSubmit}
					onCancel={() => setModalOpen(false)}
					users={users}
					loading={createMutation.isPending || updateMutation.isPending}
				/>
			</Modal>
		</Card>
	);
};

export default WorkhourPage;
