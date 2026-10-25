import React, { useState, useEffect, useCallback } from 'react';
import { notification as antdNotification, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import {
  isPushNotificationSupported,
  getActivePushSubscription,
  subscribeToWebPush,
  unsubscribeFromWebPush,
  testPushDelivery,
} from '@/utils/pushNotification';

const PUSH_STATUS_EVENT = 'artha:push-status-changed';

export function useWebPushNotifications() {
  const [pushSupported, setPushSupported] = useState<boolean>(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState<boolean>(false);
  const [pushLoading, setPushLoading] = useState<boolean>(false);
  const [isBrave, setIsBrave] = useState<boolean>(false);
  const [showBraveModal, setShowBraveModal] = useState<boolean>(false);

  const getCurrentUserId = () => localStorage.getItem('userId') || '';

  // Detect Brave browser & support
  useEffect(() => {
    const init = async () => {
      if (!isPushNotificationSupported()) {
        setPushSupported(false);
        return;
      }
      setPushSupported(true);

      // Detect Brave
      if ((navigator as any)?.brave && typeof (navigator as any).brave.isBrave === 'function') {
        try {
          const res = await (navigator as any).brave.isBrave();
          setIsBrave(Boolean(res));
        } catch {
          setIsBrave(true);
        }
      } else if ((navigator as any)?.brave !== undefined) {
        setIsBrave(true);
      }

      // Check current subscription
      const sub = await getActivePushSubscription();
      setIsPushSubscribed(Boolean(sub));
    };

    init();

    const handleSync = (e: any) => {
      if (typeof e?.detail?.isSubscribed === 'boolean') {
        setIsPushSubscribed(e.detail.isSubscribed);
      }
    };

    window.addEventListener(PUSH_STATUS_EVENT, handleSync);
    return () => window.removeEventListener(PUSH_STATUS_EVENT, handleSync);
  }, []);

  const notifyChange = (newState: boolean) => {
    setIsPushSubscribed(newState);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(PUSH_STATUS_EVENT, { detail: { isSubscribed: newState } })
      );
    }
  };

  const handleTogglePush = useCallback(async () => {
    setPushLoading(true);
    const userId = getCurrentUserId();
    try {
      if (isPushSubscribed) {
        const res = await unsubscribeFromWebPush();
        if (res.success) {
          notifyChange(false);
          antdNotification.info({
            message: 'Desktop Notifications Disabled',
            description: 'You will no longer receive alerts when Artha is closed.',
            placement: 'top',
          });
        }
      } else {
        const res = await subscribeToWebPush(userId);
        if (res.success) {
          notifyChange(true);
          antdNotification.success({
            message: 'Desktop Notifications Active! 🎉',
            description: 'You will receive native alerts even when Artha tabs or your browser are closed.',
            placement: 'top',
          });
        } else if ((res as any)?.isPushServiceBlocked && isBrave) {
          // ONLY for Brave
          const notifKey = 'push-blocked-' + Date.now();
          antdNotification.warning({
            key: notifKey,
            message: 'Browser Push Service Blocked',
            description:
              'You granted site notifications, but Brave blocks background push services by default. To receive alerts when closed, enable "Use Google services for push messaging" in Brave settings.',
            btn: (
              <Button
                type="primary"
                size="small"
                icon={<SettingOutlined />}
                onClick={() => {
                  antdNotification.destroy(notifKey);
                  setShowBraveModal(true);
                  try {
                    navigator.clipboard?.writeText('brave://settings/privacy');
                  } catch (e) {}
                  try {
                    window.open('brave://settings/privacy', '_blank');
                  } catch (e) {}
                }}
                style={{ borderRadius: '4px' }}
              >
                Go to Settings
              </Button>
            ),
            duration: 15,
            placement: 'top',
          });
        } else {
          // Non-Brave standard notification
          antdNotification.warning({
            message: 'Permission Required',
            description: res.message || 'Please allow notifications in your browser settings to receive alerts.',
            placement: 'top',
          });
        }
      }
    } finally {
      setPushLoading(false);
    }
  }, [isPushSubscribed, isBrave]);

  const handleSendTestPush = useCallback(async () => {
    const userId = getCurrentUserId();
    try {
      const res = await testPushDelivery(userId);
      if (res.success) {
        antdNotification.info({
          message: 'Test Push Sent',
          description: 'You should see a native notification pop up on your screen momentarily!',
          placement: 'top',
        });
      } else {
        antdNotification.warning({
          message: 'Notice',
          description: res.message,
          placement: 'top',
        });
      }
    } catch (err: any) {
      antdNotification.error({
        message: 'Delivery Error',
        description: err?.message || 'Could not trigger test notification.',
        placement: 'top',
      });
    }
  }, []);

  return {
    pushSupported,
    isPushSubscribed,
    pushLoading,
    isBrave,
    showBraveModal,
    setShowBraveModal,
    handleTogglePush,
    handleSendTestPush,
  };
}
