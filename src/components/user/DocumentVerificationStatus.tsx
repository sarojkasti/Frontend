import React from "react";
import { Card, List, Badge, Typography, Tag, Space, Button, Tabs } from "antd";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useUserDocuments, UserDocument, documentTypeLabels } from "@/hooks/user/useUserDocuments";
import { useUserBankDetails, UserBankDetail } from "@/hooks/user/useUserBankDetails";
import { useUserEducationDetails, UserEducationDetail } from "@/hooks/user/useUserEducationDetails";
import { useUserTrainingCertificates, UserTrainingCertificate } from "@/hooks/user/useUserTrainingCertificates";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface DocumentVerificationStatusProps {
  userId: string;
}

const DocumentVerificationStatus: React.FC<DocumentVerificationStatusProps> = ({ userId }) => {
  const navigate = useNavigate();
  
  const { 
    data: documents = [], 
    isLoading: isLoadingDocuments 
  } = useUserDocuments(userId);
  
  const {
    data: bankDetails = [],
    isLoading: isLoadingBankDetails
  } = useUserBankDetails(userId);

  const {
    data: educationDetails = [],
    isLoading: isLoadingEducationDetails
  } = useUserEducationDetails(userId);

  const {
    data: trainingCertificates = [],
    isLoading: isLoadingTrainingCertificates
  } = useUserTrainingCertificates(userId);
  
  // Create a stable query key for this component to allow other components to invalidate it
  useQuery({
    queryKey: ["documentVerificationStatus", userId],
    queryFn: () => ({}), // Empty function, we just need the key for invalidation
    enabled: false // Don't actually run this query
  });
  
  // Filter documents that are pending verification
  const pendingDocuments = documents.filter(doc => !doc.isVerified);
  const pendingBankDetails = bankDetails.filter(detail => !detail.isVerified);
  const pendingEducationDetails = educationDetails.filter(detail => !detail.isVerified);
  const pendingTrainingCertificates = trainingCertificates.filter(cert => !cert.isVerified);
  
  // Calculate verification statistics
  const totalDocuments = documents.length;
  const verifiedDocuments = documents.filter(doc => doc.isVerified).length;

  const totalBankDetails = bankDetails.length;
  const verifiedBankDetails = bankDetails.filter(detail => detail.isVerified).length;

  const totalEducationDetails = educationDetails.length;
  const verifiedEducationDetails = educationDetails.filter(detail => detail.isVerified).length;

  const totalTrainingCertificates = trainingCertificates.length;
  const verifiedTrainingCertificates = trainingCertificates.filter(cert => cert.isVerified).length;

  // Calculate overall statistics
  const totalItems = totalDocuments + totalBankDetails + totalEducationDetails + totalTrainingCertificates;
  const verifiedItems = verifiedDocuments + verifiedBankDetails + verifiedEducationDetails + verifiedTrainingCertificates;
  const pendingItems = pendingDocuments.length + pendingBankDetails.length + pendingEducationDetails.length + pendingTrainingCertificates.length;
  
  const handleViewDocuments = () => {
    navigate(`/profile/${userId}/document-detail`);
  };
  
  const isLoading = isLoadingDocuments || isLoadingBankDetails || isLoadingEducationDetails || isLoadingTrainingCertificates;
  
  return (
    <Card 
      title={
        <Space>
          <span>Document Verification</span>
          <Badge 
            count={pendingItems} 
            style={{ backgroundColor: pendingItems > 0 ? '#faad14' : '#52c41a' }}
          />
        </Space>
      }
      extra={
        <Button type="link" onClick={handleViewDocuments}>
          View All
        </Button>
      }
      loading={isLoading}
    >
      {totalItems > 0 ? (
        <>
          <div className="mb-4">
            <Text>
              Overall Verification Status: {verifiedItems} of {totalItems} verified
              {' '}
              <Tag color={verifiedItems === totalItems ? "success" : "warning"}>
                {verifiedItems === totalItems ? "Complete" : "Incomplete"}
              </Tag>
            </Text>
          </div>
          
          <Tabs defaultActiveKey="documents">
            <TabPane tab="Documents" key="documents">
              {totalDocuments > 0 ? (
                <>
                  <Text>
                    Status: {verifiedDocuments} of {totalDocuments} verified
                    {' '}
                    <Tag color={verifiedDocuments === totalDocuments ? "success" : "warning"}>
                      {verifiedDocuments === totalDocuments ? "Complete" : "Incomplete"}
                    </Tag>
                  </Text>
                  
                  {pendingDocuments.length > 0 && (
                    <>
                      <Title level={5}>Pending Documents:</Title>
                      <List
                        size="small"
                        dataSource={pendingDocuments}
                        renderItem={(doc: UserDocument) => (
                          <List.Item>
                            <Space>
                              <Badge status="warning" />
                              <span>{doc.filename}</span>
                              <Tag color="orange">{doc.documentType && documentTypeLabels[doc.documentType] || 'Other'}</Tag>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </>
                  )}
                </>
              ) : (
                <Text>No documents uploaded yet</Text>
              )}
            </TabPane>
            
            <TabPane tab="Bank Details" key="bank">
              {totalBankDetails > 0 ? (
                <>
                  <Text>
                    Status: {verifiedBankDetails} of {totalBankDetails} verified
                    {' '}
                    <Tag color={verifiedBankDetails === totalBankDetails ? "success" : "warning"}>
                      {verifiedBankDetails === totalBankDetails ? "Complete" : "Incomplete"}
                    </Tag>
                  </Text>
                  
                  {pendingBankDetails.length > 0 && (
                    <>
                      <Title level={5}>Pending Bank Details:</Title>
                      <List
                        size="small"
                        dataSource={pendingBankDetails}
                        renderItem={(detail: UserBankDetail) => (
                          <List.Item>
                            <Space>
                              <Badge status="warning" />
                              <span>{detail.bankName} - {detail.accountNo}</span>
                              <Tag color="orange">Bank Document</Tag>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </>
                  )}
                </>
              ) : (
                <Text>No bank details uploaded yet</Text>
              )}
            </TabPane>
            
            <TabPane tab="Education" key="education">
              {totalEducationDetails > 0 ? (
                <>
                  <Text>
                    Status: {verifiedEducationDetails} of {totalEducationDetails} verified
                    {' '}
                    <Tag color={verifiedEducationDetails === totalEducationDetails ? "success" : "warning"}>
                      {verifiedEducationDetails === totalEducationDetails ? "Complete" : "Incomplete"}
                    </Tag>
                  </Text>
                  
                  {pendingEducationDetails.length > 0 && (
                    <>
                      <Title level={5}>Pending Education Details:</Title>
                      <List
                        size="small"
                        dataSource={pendingEducationDetails}
                        renderItem={(detail: UserEducationDetail) => (
                          <List.Item>
                            <Space>
                              <Badge status="warning" />
                              <span>{detail.universityCollege} - {detail.faculty}</span>
                              <Tag color="orange">Education Document</Tag>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </>
                  )}
                </>
              ) : (
                <Text>No education details uploaded yet</Text>
              )}
            </TabPane>
            
            <TabPane tab="Training" key="training">
              {totalTrainingCertificates > 0 ? (
                <>
                  <Text>
                    Status: {verifiedTrainingCertificates} of {totalTrainingCertificates} verified
                    {' '}
                    <Tag color={verifiedTrainingCertificates === totalTrainingCertificates ? "success" : "warning"}>
                      {verifiedTrainingCertificates === totalTrainingCertificates ? "Complete" : "Incomplete"}
                    </Tag>
                  </Text>
                  
                  {pendingTrainingCertificates.length > 0 && (
                    <>
                      <Title level={5}>Pending Training Certificates:</Title>
                      <List
                        size="small"
                        dataSource={pendingTrainingCertificates}
                        renderItem={(cert: UserTrainingCertificate) => (
                          <List.Item>
                            <Space>
                              <Badge status="warning" />
                              <span>{cert.institute} - {cert.designationOfCourse}</span>
                              <Tag color="orange">Training Certificate</Tag>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </>
                  )}
                </>
              ) : (
                <Text>No training certificates uploaded yet</Text>
              )}
            </TabPane>
          </Tabs>
        </>
      ) : (
        <Text>No documents uploaded yet</Text>
      )}
    </Card>
  );
};

export default DocumentVerificationStatus;


