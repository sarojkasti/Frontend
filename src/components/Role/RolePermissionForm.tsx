import { useEffect, useState } from "react";
import { usePermission } from "@/hooks/permission/usePermission";
import { useRolePermissionById } from "@/hooks/permission/useRolePermissionById";
import { useUpdateRolePermissions } from "@/hooks/role/useUpdateRolePermissions";
import { Spin, message, Input, Button, Space, Card, Collapse, Checkbox, Row, Col, Divider, Alert } from "antd";
import { SearchOutlined, SaveOutlined, InfoCircleOutlined } from "@ant-design/icons";

const { Search } = Input;
const { Panel } = Collapse;

const PAGE_SIZE = 500; // Increased to get more permissions

interface RolePermissionFormProps {
  id: string;
}

const RolePermissionForm = ({ id }: RolePermissionFormProps) => {
  const { data: allPermissions, isLoading: loadingPermissions } = usePermission({ page: 1, limit: PAGE_SIZE });
  const { data: rolePermissions, isLoading: loadingRolePerms } = useRolePermissionById({ id });
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedResource, setSelectedResource] = useState<string>('');
  const updateRolePermissions = useUpdateRolePermissions();

  useEffect(() => {
    if (rolePermissions) {
      setCheckedKeys(rolePermissions.map((perm: any) => perm.toString()));
    }
  }, [rolePermissions]);

  if (loadingPermissions || loadingRolePerms) return <Spin size="large" />;

  const permissions = allPermissions?.results || [];

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc: any, perm: any) => {
    const resource = perm.resource || 'Other';
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(perm);
    return acc;
  }, {});

  // Filter permissions based on search and selected resource
  const filteredGroupedPermissions = Object.keys(groupedPermissions).reduce((acc: any, resource: string) => {
    if (selectedResource && selectedResource !== resource) {
      return acc;
    }

    const filteredPerms = groupedPermissions[resource].filter((perm: any) => 
      !searchValue || 
      perm.description.toLowerCase().includes(searchValue.toLowerCase()) ||
      perm.path?.toLowerCase().includes(searchValue.toLowerCase()) ||
      perm.method?.toLowerCase().includes(searchValue.toLowerCase())
    );

    if (filteredPerms.length > 0) {
      acc[resource] = filteredPerms;
    }
    return acc;
  }, {});

  const resources = Object.keys(groupedPermissions).sort();

  const handleSubmit = async () => {
    try {
      // Use the string UUIDs directly - no conversion needed
      const permissionIds = checkedKeys.filter((key: string) => key && key.trim() !== '');
      
      await updateRolePermissions.mutateAsync({ id, permissions: permissionIds });
      message.success("Permissions updated successfully!");
    } catch (error) {
      message.error("Failed to update permissions.");
    }
  };

  const handleSelectAll = () => {
    const allPermissionIds = permissions.map((perm: any) => perm.id.toString());
    setCheckedKeys(allPermissionIds);
  };

  const handleSelectNone = () => {
    setCheckedKeys([]);
  };

  const handleResourceToggle = (resource: string) => {
    const resourcePermissions = groupedPermissions[resource]?.map((perm: any) => perm.id.toString()) || [];
    const isAllSelected = resourcePermissions.every((id: string) => checkedKeys.includes(id));
    
    if (isAllSelected) {
      // Deselect all permissions for this resource
      setCheckedKeys(prev => prev.filter(key => !resourcePermissions.includes(key)));
    } else {
      // Select all permissions for this resource
      setCheckedKeys(prev => [...new Set([...prev, ...resourcePermissions])]);
    }
  };

  const getSelectedCount = () => checkedKeys.length;
  const getTotalCount = () => permissions.length;

  return (
    <div style={{ padding: '20px' }}>
      <Card
        title={
          <div>
            <h3>Role Permissions Management</h3>
            <p style={{ margin: 0, fontWeight: 'normal', fontSize: '14px' }}>
              Selected: {getSelectedCount()} / {getTotalCount()} permissions
            </p>
          </div>
        }
        extra={
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={updateRolePermissions.isPending}
          >
            Save Permissions
          </Button>
        }
      >
        {/* Informative banner regarding baseline employee capabilities */}
        <Alert
          message="Baseline Employee Self-Service Included"
          description="Standard employee actions (clocking in/out, viewing assigned projects & tasks, creating personal worklogs, and submitting leave requests) are built into the system by default for all authenticated users. Use this matrix to grant privileged managerial, financial, or administrative permissions."
          type="info"
          showIcon
          className="mb-4"
        />

        {/* Search and Filter Controls */}
        <Space direction="vertical" style={{ width: '100%', marginBottom: '20px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Search
                placeholder="Search permissions by name, path, or method..."
                prefix={<SearchOutlined />}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={12}>
              <select
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
                style={{ width: '100%', height: '32px', padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
              >
                <option value="">All Resources</option>
                {resources.map(resource => (
                  <option key={resource} value={resource}>{resource}</option>
                ))}
              </select>
            </Col>
          </Row>

          <Space>
            <Button onClick={handleSelectAll}>Select All</Button>
            <Button onClick={handleSelectNone}>Select None</Button>
          </Space>
        </Space>

        <Divider />

        {/* Resource-based Permission Lists */}
        <Collapse>
          {Object.keys(filteredGroupedPermissions).map(resource => {
            const resourcePermissions = filteredGroupedPermissions[resource];
            const resourcePermissionIds = resourcePermissions.map((perm: any) => perm.id.toString());
            const selectedInResource = resourcePermissionIds.filter((id: string) => checkedKeys.includes(id)).length;
            const totalInResource = resourcePermissionIds.length;
            const isAllSelected = selectedInResource === totalInResource;
            const isPartiallySelected = selectedInResource > 0 && selectedInResource < totalInResource;

            return (
              <Panel 
                header={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isPartiallySelected}
                        onChange={() => handleResourceToggle(resource)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                        {resource} ({selectedInResource}/{totalInResource})
                      </span>
                    </span>
                  </div>
                }
                key={resource}
              >
                <Row gutter={[16, 8]}>
                  {resourcePermissions.map((perm: any) => (
                    <Col span={24} key={perm.id}>
                      <Checkbox
                        checked={checkedKeys.includes(perm.id.toString())}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCheckedKeys(prev => [...prev, perm.id.toString()]);
                          } else {
                            setCheckedKeys(prev => prev.filter(key => key !== perm.id.toString()));
                          }
                        }}
                      >
                        <div style={{ marginLeft: 8 }}>
                          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{perm.description}</div>
                          <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>
                            <span style={{ 
                              background: perm.method === 'GET' ? '#52c41a' : 
                                        perm.method === 'POST' ? '#1890ff' : 
                                        perm.method === 'PUT' ? '#faad14' :
                                        perm.method === 'PATCH' ? '#722ed1' : 
                                        perm.method === 'DELETE' ? '#f5222d' : '#666',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              marginRight: '8px'
                            }}>
                              {perm.method}
                            </span>
                            {perm.path}
                          </div>
                        </div>
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              </Panel>
            );
          })}
        </Collapse>

        <Divider />

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Space>
            <Button 
              type="primary" 
              size="large"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={updateRolePermissions.isPending}
            >
              Save Permissions ({getSelectedCount()})
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default RolePermissionForm;