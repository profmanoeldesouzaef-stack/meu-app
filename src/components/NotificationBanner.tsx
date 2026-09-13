import React, { useEffect } from "react";
import { useApp } from "../context/AppContext";

export const NotificationBanner: React.FC = () => {
  const {
    systemNotifications,
    requestPushPermission,
    pushPermissionState,
  } = useApp();

  // Enviar automaticamente notificação nativa para o celular se a permissão já estiver concedida
  useEffect(() => {
    const unread = systemNotifications.find((n) => !n.read);
    if (unread && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(`VYRA · ${unread.title}`, {
          body: unread.message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          // @ts-ignore
          vibrate: [200, 100, 200],
        });
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      } catch {}
    }
  }, [systemNotifications]);

  // Não renderiza nenhum popup invasivo que necessite ser fechado na tela
  return null;
};

