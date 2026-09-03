import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Bell, Droplet, Zap, MessageSquare, X, Check, Smartphone } from "lucide-react";

export const NotificationBanner: React.FC = () => {
  const {
    systemNotifications,
    dismissNotification,
    requestPushPermission,
    pushPermissionState,
    setActiveView,
  } = useApp();

  const [activeToast, setActiveToast] = useState<any | null>(null);

  useEffect(() => {
    // Show top unread notification if available
    const unread = systemNotifications[0];
    if (unread && !activeToast) {
      setActiveToast(unread);
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [systemNotifications]);

  const handleAction = () => {
    if (!activeToast) return;
    if (activeToast.type === "coach") {
      setActiveView("community");
    } else if (activeToast.type === "water") {
      setActiveView("home");
    } else if (activeToast.type === "creatine") {
      setActiveView("home");
    }
    dismissNotification(activeToast.id);
    setActiveToast(null);
  };

  return (
    <>
      {/* Native-style Floating Mobile Notification Banner */}
      {activeToast && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md animate-in slide-in-from-top-4 duration-300">
          <div
            onClick={handleAction}
            className="p-3.5 rounded-2xl bg-[#151515]/95 backdrop-blur-xl border border-[#D8B46A]/40 shadow-2xl shadow-black/80 flex items-center justify-between gap-3 cursor-pointer hover:border-[#D8B46A] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  activeToast.type === "coach"
                    ? "bg-[#D8B46A]/20 text-[#D8B46A]"
                    : activeToast.type === "water"
                    ? "bg-[#6D9BFF]/20 text-[#6D9BFF]"
                    : "bg-[#FF6A2A]/20 text-[#FF6A2A]"
                }`}
              >
                {activeToast.type === "coach" && <MessageSquare className="w-5 h-5 stroke-[2.5]" />}
                {activeToast.type === "water" && <Droplet className="w-5 h-5 fill-current" />}
                {activeToast.type === "creatine" && <Zap className="w-5 h-5 fill-current" />}
                {activeToast.type === "general" && <Bell className="w-5 h-5" />}
              </div>

              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-widest text-[#D8B46A] uppercase">
                    VYRA NOTIFICAÇÃO
                  </span>
                  <span className="text-[9px] text-[#9B9BA1]">{activeToast.timestamp}</span>
                </div>
                <h4 className="text-xs font-bold text-[#F5F5F7] group-hover:text-[#D8B46A] transition-colors leading-tight mt-0.5">
                  {activeToast.title}
                </h4>
                <p className="text-[11px] text-[#9B9BA1] line-clamp-1 leading-tight mt-0.5">
                  {activeToast.message}
                </p>
              </div>
            </div>

            <button
              id="dismiss-toast-btn"
              onClick={(e) => {
                e.stopPropagation();
                dismissNotification(activeToast.id);
                setActiveToast(null);
              }}
              className="p-1.5 rounded-lg text-[#9B9BA1] hover:text-[#F5F5F7] hover:bg-[#2B2B2F] shrink-0"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Push Enable Prompt if not yet granted */}
      {pushPermissionState === "default" && (
        <div className="fixed bottom-24 md:bottom-6 left-4 z-40 max-w-xs animate-in slide-in-from-bottom-2">
          <div className="p-3 rounded-2xl bg-[#151515] border border-[#2B2B2F] shadow-xl flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FF6A2A]/20 text-[#FF6A2A] flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-[#F5F5F7] leading-tight font-medium">
                Ativar avisos de treino, água e creatina no celular?
              </p>
            </div>
            <button
              id="enable-push-perm-btn"
              onClick={requestPushPermission}
              className="px-2.5 py-1.5 rounded-xl bg-[#FF6A2A] hover:bg-[#FF9A62] text-white text-[10px] font-extrabold whitespace-nowrap transition-all shadow-md shadow-[#FF6A2A]/20"
            >
              Ativar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
