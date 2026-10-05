
import React, { useState } from "react";
import { Button, Popconfirm, Input, Space } from "antd";
import { WorkhourType } from "../../types/workhour";
import { useWorkhours, useDeleteWorkhour } from "../../hooks/workhour/useWorkhour";
import { SearchOutlined } from "@ant-design/icons";
import { PowerTable, PowerTableColumn, useTableSearch } from "@/components/Table";

export const ALL_WORKHOUR_COLUMNS = [
	{ key: "user", label: "User" },
	{ key: "workHours", label: "Work Hours" },
	{ key: "startTime", label: "Start Time" },
	{ key: "endTime", label: "End Time" },
	{ key: "validFrom", label: "Valid From" },
	{ key: "validTo", label: "Valid To" },
	{ key: "actions", label: "Actions", required: true },
];

interface WorkhourTableProps {
	onEdit: (workhour: WorkhourType) => void;
	visibleColumnKeys?: string[];
}

const WorkhourTable: React.FC<WorkhourTableProps> = ({ onEdit, visibleColumnKeys }) => {
	const { data, isLoading } = useWorkhours();
	const deleteMutation = useDeleteWorkhour();
	const [sortedInfo, setSortedInfo] = useState<any>({});
	const { getColumnSearchProps } = useTableSearch({ dataSource: data || [] });

	const handleTableChange = (pagination: any, filters: any, sorter: any) => {
		setSortedInfo(sorter);
	};


	const columns = [
		{
			title: "User",
			dataIndex: ["user", "name"],
			key: "user",
			...getColumnSearchProps('user.name', 'User'),
			sorter: (a: WorkhourType, b: WorkhourType) => 
				(a.user?.name || '').localeCompare(b.user?.name || ''),
			sortOrder: sortedInfo.columnKey === 'user' && sortedInfo.order,
			render: (_: any, record: WorkhourType) => record.user?.name || "-",
		},
		{
			title: "Work Hours",
			dataIndex: "workHours",
			key: "workHours",
			...getColumnSearchProps('workHours', 'Work Hours'),
			sorter: (a: WorkhourType, b: WorkhourType) => 
				(Number(a.workHours) || 0) - (Number(b.workHours) || 0),
			sortOrder: sortedInfo.columnKey === 'workHours' && sortedInfo.order,
		},
		{
			title: "Start Time",
			dataIndex: "startTime",
			key: "startTime",
			...getColumnSearchProps('startTime', 'Start Time'),
			sorter: (a: WorkhourType, b: WorkhourType) => 
				(a.startTime || '').localeCompare(b.startTime || ''),
			sortOrder: sortedInfo.columnKey === 'startTime' && sortedInfo.order,
		},
		{
			title: "End Time",
			dataIndex: "endTime",
			key: "endTime",
			...getColumnSearchProps('endTime', 'End Time'),
			sorter: (a: WorkhourType, b: WorkhourType) => 
				(a.endTime || '').localeCompare(b.endTime || ''),
			sortOrder: sortedInfo.columnKey === 'endTime' && sortedInfo.order,
		},
		{
			title: "Valid From",
			dataIndex: "validFrom",
			key: "validFrom",
			...getColumnSearchProps('validFrom', 'Valid From'),
			sorter: (a: WorkhourType, b: WorkhourType) => 
				(a.validFrom || '').localeCompare(b.validFrom || ''),
			sortOrder: sortedInfo.columnKey === 'validFrom' && sortedInfo.order,
		},
		{
			title: "Valid To",
			dataIndex: "validTo",
			key: "validTo",
			...getColumnSearchProps('validTo', 'Valid To'),
			sorter: (a: WorkhourType, b: WorkhourType) => 
				(a.validTo || '').localeCompare(b.validTo || ''),
			sortOrder: sortedInfo.columnKey === 'validTo' && sortedInfo.order,
		},
		{
			title: "Actions",
			key: "actions",
			render: (_: any, record: WorkhourType) => (
				<Space>
					<Button type="link" onClick={() => onEdit(record)}>
						Edit
					</Button>
					<Popconfirm
						title="Are you sure to delete?"
						onConfirm={() => deleteMutation.mutate(record.id)}
						okText="Yes"
						cancelText="No"
					>
						<Button type="link" danger loading={deleteMutation.isPending}>
							Delete
						</Button>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<PowerTable
			rowKey="id"
			columns={columns as any}
			dataSource={data || []}
			loading={isLoading}
			onChange={handleTableChange}
			enableResize
			visibleColumnKeys={visibleColumnKeys}
			showToolbar={false}
			persistenceKey="workhour_table"
			pagination={{
				showSizeChanger: true,
				showQuickJumper: true,
				pageSizeOptions: [5, 10, 20, 50],
				showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
			}}
		/>
	);
};

export default WorkhourTable;
