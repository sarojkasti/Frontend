import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Alert, Typography, Space } from 'antd';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useChangePassword } from '@/hooks/auth/useChangePassword';

const { Title, Paragraph, Text } = Typography;

const passwordValidations = {
  minLength: 6,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /\d/,
  hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/,
};

const ChangePasswordPage: React.FC = () => {
  const [form] = Form.useForm();
  const { mutateAsync: changePasswordMutation, isPending } = useChangePassword();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (passwordValidations.hasUppercase.test(password)) strength++;
    if (passwordValidations.hasLowercase.test(password)) strength++;
    if (passwordValidations.hasNumber.test(password)) strength++;
    if (passwordValidations.hasSpecialChar.test(password)) strength++;

    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 2) return '#ff4d4f';
    if (passwordStrength < 4) return '#faad14';
    return '#52c41a';
  };

  const onFinish = async (values: any) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await changePasswordMutation({
        oldPassword: values.oldPassword,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });

      setSuccessMessage('Your password has been changed successfully!');
      message.success('Password changed successfully!');
      form.resetFields();
      setPasswordStrength(0);
    } catch (err: any) {
      const status = err.response?.status;
      const resData = err.response?.data;

      if (status === 412 || resData?.message === 'incorrectOldPassword' || resData?.title === 'incorrectOldPassword') {
        setErrorMessage('Current password is incorrect. Please check and try again.');
      } else if (resData?.message) {
        if (Array.isArray(resData.message)) {
          const msgs = resData.message
            .map((m: any) => (typeof m === 'string' ? m : Object.values(m.errors || {}).join(', ')))
            .join(', ');
          setErrorMessage(msgs);
        } else {
          setErrorMessage(resData.message);
        }
      } else {
        setErrorMessage('Failed to change password. Please verify your details and try again.');
      }
      message.error('Failed to change password');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '24px auto', padding: '0 16px' }}>
      <Card
        title={
          <Space>
            <LockOutlined style={{ color: '#1677ff' }} />
            <span>Change Password</span>
          </Space>
        }
        className="shadow-sm"
      >
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Ensure your account is using a secure password to protect your information.
        </Paragraph>

        {errorMessage && (
          <Alert
            message="Error"
            description={errorMessage}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMessage(null)}
            style={{ marginBottom: 20 }}
          />
        )}

        {successMessage && (
          <Alert
            message="Success"
            description={successMessage}
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            closable
            onClose={() => setSuccessMessage(null)}
            style={{ marginBottom: 20 }}
          />
        )}

        <Form
          form={form}
          name="change-password-form"
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item
            label="Current Password"
            name="oldPassword"
            rules={[
              { required: true, message: 'Please enter your current password' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Enter current password"
            />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter a new password' },
              {
                min: passwordValidations.minLength,
                message: `Password must be at least ${passwordValidations.minLength} characters!`,
              },
              {
                validator: (_, value) => {
                  if (!value || passwordValidations.hasUppercase.test(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Password must contain at least one uppercase letter!')
                  );
                },
              },
              {
                validator: (_, value) => {
                  if (!value || passwordValidations.hasLowercase.test(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Password must contain at least one lowercase letter!')
                  );
                },
              },
              {
                validator: (_, value) => {
                  if (!value || passwordValidations.hasNumber.test(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Password must contain at least one number!')
                  );
                },
              },
              {
                validator: (_, value) => {
                  if (!value || passwordValidations.hasSpecialChar.test(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Password must contain at least one special character!')
                  );
                },
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Enter new password"
              onChange={(e) => checkPasswordStrength(e.target.value)}
            />
          </Form.Item>

          {form.getFieldValue('password') && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <Text type="secondary">Password strength:</Text>
                <Text strong style={{ color: getPasswordStrengthColor() }}>
                  {passwordStrength < 2 ? 'Weak' : passwordStrength < 4 ? 'Medium' : 'Strong'}
                </Text>
              </div>
              <div
                style={{
                  height: 4,
                  background: '#f0f0f0',
                  marginTop: 6,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(passwordStrength / 5) * 100}%`,
                    background: getPasswordStrengthColor(),
                    transition: 'all 0.3s',
                  }}
                />
              </div>
            </div>
          )}

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('The two passwords that you entered do not match!')
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Re-enter new password"
            />
          </Form.Item>

          <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 20 }}>
            Password must be between 6 and 20 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.
          </Paragraph>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isPending}
              block
              size="large"
            >
              Update Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;
