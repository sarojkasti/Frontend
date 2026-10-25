import React, { useState } from 'react';
import { Button, Modal, Input } from 'antd';
import { SettingOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { useWebPushNotifications } from '@/hooks/useWebPushNotifications';

interface BackgroundAlertsStatusProps {
  compact?: boolean;
}

export const BackgroundAlertsStatus: React.FC<BackgroundAlertsStatusProps> = () => {
  const {
    pushSupported,
    isPushSubscribed,
    pushLoading,
    isBrave,
    showBraveModal,
    setShowBraveModal,
    handleTogglePush,
  } = useWebPushNotifications();

  const [copied, setCopied] = useState<boolean>(false);

  // If push is not supported, or not enabled, show nothing on the title row
  // (The original Enable card is placed inside the Notification drawer body as before)
  if (!pushSupported || !isPushSubscribed) return null;

  return (
    <>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '12px',
            backgroundColor: '#e6f7ff',
            color: '#0958d9',
            border: '1px solid #91caff',
            fontWeight: 500,
            fontSize: '11px',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: '#1677ff',
              display: 'inline-block',
              boxShadow: '0 0 0 2px rgba(22, 119, 255, 0.25)',
            }}
          />
          Active
        </span>

        <Button
          type="link"
          size="small"
          loading={pushLoading}
          onClick={handleTogglePush}
          style={{
            padding: 0,
            fontSize: '11px',
            color: '#8c8c8c',
            height: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          Disable
        </Button>
      </div>

      {/* Brave Browser Setup Modal - ONLY rendered for Brave Browser */}
      {isBrave && (
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SettingOutlined style={{ color: '#fa8c16', fontSize: '18px' }} />
              <span style={{ fontSize: '16px', fontWeight: 600 }}>Enable Background Notifications in Brave</span>
            </div>
          }
          open={showBraveModal}
          onCancel={() => setShowBraveModal(false)}
          footer={[
            <Button key="close" onClick={() => setShowBraveModal(false)}>
              Close
            </Button>,
            <Button
              key="retry"
              type="primary"
              loading={pushLoading}
              onClick={async () => {
                setShowBraveModal(false);
                await handleTogglePush();
              }}
            >
              Check & Enable Again
            </Button>,
          ]}
          width={560}
        >
          <div style={{ padding: '8px 0' }}>
            <div
              style={{
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#0050b3',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}
            >
              ℹ️ <b>Browser Security Notice:</b> For security, browsers prevent websites from directly opening internal <code>brave://</code> links automatically. We&apos;ve copied the settings address to your clipboard!
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#262626' }}>
                Settings Address:
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input
                  value="brave://settings/privacy"
                  readOnly
                  style={{ background: '#f5f5f5', fontFamily: 'monospace' }}
                />
                <Button
                  type="primary"
                  icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText('brave://settings/privacy');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button
                  onClick={() => {
                    try {
                      window.open('brave://settings/privacy', '_blank');
                    } catch (e) {}
                  }}
                >
                  Try Open
                </Button>
              </div>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#262626' }}>
              Quick 3-Step Setup:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#1677ff',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  1
                </span>
                <div style={{ fontSize: '13px', color: '#595959', lineHeight: 1.5 }}>
                  Open a new tab with{' '}
                  <kbd
                    style={{
                      background: '#f0f0f0',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #d9d9d9',
                    }}
                  >
                    Ctrl
                  </kbd>{' '}
                  +{' '}
                  <kbd
                    style={{
                      background: '#f0f0f0',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #d9d9d9',
                    }}
                  >
                    T
                  </kbd>{' '}
                  (or{' '}
                  <kbd
                    style={{
                      background: '#f0f0f0',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #d9d9d9',
                    }}
                  >
                    Cmd
                  </kbd>{' '}
                  +{' '}
                  <kbd
                    style={{
                      background: '#f0f0f0',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #d9d9d9',
                    }}
                  >
                    T
                  </kbd>{' '}
                  on Mac).
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#1677ff',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  2
                </span>
                <div style={{ fontSize: '13px', color: '#595959', lineHeight: 1.5 }}>
                  Paste <b><code>brave://settings/privacy</code></b> into the address bar and press{' '}
                  <kbd
                    style={{
                      background: '#f0f0f0',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #d9d9d9',
                    }}
                  >
                    Enter
                  </kbd>.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#1677ff',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  3
                </span>
                <div style={{ fontSize: '13px', color: '#595959', lineHeight: 1.5 }}>
                  Scroll down to <b>&quot;Use Google services for push messaging&quot;</b> and toggle it <b>ON</b>. Then click the blue <b>&quot;Relaunch&quot;</b> button that appears.
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default BackgroundAlertsStatus;
