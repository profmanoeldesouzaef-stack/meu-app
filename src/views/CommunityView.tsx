import React, { useEffect, useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { ChatMessage } from "../types";
import { supabase, getVotingUserId } from "../lib/supabaseClient";
import { VeteranBadge, PatentBadge, getPatentInfo } from "../lib/patents";
import {
  MessageSquare,
  Send,
  Heart,
  UserCheck,
  Shield,
  Sparkles,
  Image as ImageIcon,
  X,
  Upload,
  Palette,
} from "lucide-react";

export const CommunityView: React.FC<{ onOpenColorPicker?: () => void }> = ({ onOpenColorPicker }) => {
  const {
    t,
    persona,
    clearUnreadCommunity,
    currentUserEmail,
    isVeteran,
    consecutiveMonths,
    monthlyFeePaid,
    chatNameColor,
    chatTextColor,
    hasVipChatColors,
    currentUserName,
    currentUserNickname,
  } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Identificador exclusivo por usuário/dispositivo para evitar acúmulo de likes em um único perfil
  const userIdentifier =
    currentUserEmail && currentUserEmail !== "student@vyra.club"
      ? currentUserEmail
      : `vyra_${getVotingUserId()}`;

  const loadChat = async () => {
    try {
      const data = await api.getChat(userIdentifier);
      const localLikes = new Set<string>(
        JSON.parse(localStorage.getItem("vyra_chat_likes") || "[]")
      );
      const normalized = data.map((m) => ({
        ...m,
        has_liked: Boolean(m.has_liked || localLikes.has(m.id)),
      }));
      setMessages(normalized);
    } catch (e) {
      console.error("Error loading chat:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChat();
    clearUnreadCommunity();
  }, [clearUnreadCommunity, userIdentifier]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanText = text.trim().slice(0, 200);
    if (!cleanText || sending) return;

    setSending(true);

    const authorName =
      persona === "coach"
        ? "Coach Manoel"
        : persona === "moderator"
        ? "Moderador Vyra"
        : currentUserNickname || currentUserName || "Aluno";

    const currentPatentInfo = getPatentInfo(consecutiveMonths, monthlyFeePaid);
    const tempId = `m${Date.now()}`;
    const timestamp = new Date().toISOString();

    const optimisticMsg: ChatMessage = {
      id: tempId,
      author: authorName,
      persona,
      text: cleanText,
      image: image || null,
      likes: 0,
      timestamp,
      is_veteran: persona === "student" ? isVeteran : false,
      patente_level:
        persona === "student" && !currentPatentInfo.isRevoked
          ? currentPatentInfo.level
          : undefined,
      consecutive_months:
        persona === "student" ? consecutiveMonths : undefined,
      name_color:
        persona === "student" && hasVipChatColors ? chatNameColor : undefined,
      text_color:
        persona === "student" && hasVipChatColors ? chatTextColor : undefined,
      has_liked: false,
    };

    // Atualização imediata para o usuário
    setMessages((prev) => [...prev, optimisticMsg]);
    setText("");
    setImage(null);

    try {
      // 1. Envio via API do backend
      const newMsg = await api.postChat({
        author: authorName,
        persona,
        text: cleanText,
        image: optimisticMsg.image,
        is_veteran: optimisticMsg.is_veteran,
        patente_level: optimisticMsg.patente_level,
        consecutive_months: optimisticMsg.consecutive_months,
        name_color: optimisticMsg.name_color,
        text_color: optimisticMsg.text_color,
      });

      // 2. Persistência direta no Supabase com autor, texto e timestamp
      try {
        const { data: authData } = await supabase.auth.getUser();
        await supabase.from("chat_messages").insert([
          {
            id: newMsg?.id || tempId,
            author: authorName,
            user_id: authData?.user?.id || null,
            user_email: authData?.user?.email || currentUserEmail || null,
            persona,
            text: cleanText,
            image: optimisticMsg.image,
            likes: 0,
            timestamp,
            is_veteran: optimisticMsg.is_veteran,
            patente_level: optimisticMsg.patente_level,
            consecutive_months: optimisticMsg.consecutive_months,
            name_color: optimisticMsg.name_color,
            text_color: optimisticMsg.text_color,
            created_at: timestamp,
          },
        ]);
      } catch (errSupabase) {
        console.warn("Aviso ao persistir mensagem no Supabase:", errSupabase);
      }

      if (newMsg?.id && newMsg.id !== tempId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...newMsg, has_liked: false } : m))
        );
      }
    } catch (e) {
      console.error("Error sending message:", e);
    } finally {
      setSending(false);
    }
  };

  const handleLike = async (id: string) => {
    const localLikes = new Set<string>(
      JSON.parse(localStorage.getItem("vyra_chat_likes") || "[]")
    );
    const targetMsg = messages.find((m) => m.id === id);
    const alreadyLiked = Boolean(targetMsg?.has_liked || localLikes.has(id));

    if (alreadyLiked) {
      localLikes.delete(id);
    } else {
      localLikes.add(id);
    }
    localStorage.setItem("vyra_chat_likes", JSON.stringify(Array.from(localLikes)));

    // Optimistic toggle
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        return {
          ...m,
          has_liked: !alreadyLiked,
          likes: alreadyLiked ? Math.max(0, m.likes - 1) : m.likes + 1,
        };
      })
    );

    try {
      const updated = await api.likeChat(id, userIdentifier);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...updated, has_liked: !alreadyLiked } : m
        )
      );
    } catch (e) {
      console.error("Error liking chat message:", e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const remainingChars = 200 - text.length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 space-y-4 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-black tracking-widest text-[#FF6A2A] uppercase bg-[#FF6A2A]/15 px-3 py-1 rounded-full border border-[#FF6A2A]/30">
            {t("sec.community")}
          </span>
          <h1 className="text-2xl font-extrabold text-[#F5F5F7] tracking-tight mt-1.5">
            {t("comm.title")}
          </h1>
        </div>

        <span className="text-xs font-bold text-[#34C759] flex items-center gap-1.5 bg-[#151515] px-3 py-1.5 rounded-xl border border-[#2B2B2F]">
          <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
          142 online
        </span>
      </div>

      {/* Messages Feed Container */}
      <div className="rounded-3xl bg-[#151515] border border-[#2B2B2F] p-4 sm:p-6 min-h-[420px] max-h-[560px] overflow-y-auto space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isCoach = msg.persona === "coach";
            const isMod = msg.persona === "moderator";
            const cleanedAuthor = (msg.author || "")
              .replace(/—\s*Parceiro Oficial/gi, "")
              .replace(/Parceiro Oficial/gi, "")
              .trim() || "Atleta";

            return (
              <div
                key={msg.id}
                id={`chat-msg-${msg.id}`}
                className={`p-4 rounded-2xl border transition-all ${
                  isCoach
                    ? "bg-gradient-to-r from-[#D8B46A]/15 to-[#D8B46A]/5 border-[#D8B46A]/40"
                    : isMod
                    ? "bg-[#6D9BFF]/10 border-[#6D9BFF]/30"
                    : "bg-[#1D1D1F] border-[#2B2B2F]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Nome do autor com cor personalizada se desbloqueada */}
                      <span
                        className="text-xs font-bold transition-colors"
                        style={{ color: msg.name_color || "#F5F5F7" }}
                      >
                        {cleanedAuthor}
                      </span>

                      {isCoach && (
                        <span className="px-2 py-0.5 rounded-full bg-[#D8B46A] text-[#0A0A0A] text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <UserCheck className="w-2.5 h-2.5" />
                          COACH
                        </span>
                      )}

                      {isMod && (
                        <span className="px-2 py-0.5 rounded-full bg-[#6D9BFF] text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" />
                          MOD
                        </span>
                      )}

                      {/* Selo de Veterano no chat: Apenas a Coroa, sem texto 'VETERANO' */}
                      {msg.is_veteran && <VeteranBadge size="xs" showLabel={false} />}

                      {/* Patente por Recorrência no chat: Apenas as estrelas e a medalha, sem o texto 'Patente' */}
                      {typeof msg.patente_level === "number" && msg.patente_level > 0 && (
                        <PatentBadge
                          level={msg.patente_level}
                          months={msg.consecutive_months || (msg.patente_level * 3)}
                          size="xs"
                          showLabel={false}
                        />
                      )}

                      <span className="text-[10px] text-[#9B9BA1]">{msg.timestamp}</span>
                    </div>

                    {/* Texto com cor personalizada se desbloqueada */}
                    <p
                      className="text-xs sm:text-sm leading-relaxed pt-0.5"
                      style={{ color: msg.text_color || "#F5F5F7" }}
                    >
                      {msg.text}
                    </p>

                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Anexo do chat"
                        className="max-h-48 rounded-xl object-cover mt-2 border border-[#2B2B2F]"
                      />
                    )}
                  </div>

                  <button
                    id={`like-msg-btn-${msg.id}`}
                    onClick={() => handleLike(msg.id)}
                    aria-label={msg.has_liked ? "Remover curtida" : "Curtir mensagem"}
                    className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[11px] font-bold shrink-0 cursor-pointer ${
                      msg.has_liked
                        ? "bg-[#FF6A2A]/15 border-[#FF6A2A]/50 text-[#FF6A2A]"
                        : "bg-[#151515] border-[#2B2B2F] text-[#9B9BA1] hover:text-[#F5F5F7] hover:border-[#3D3D42]"
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                        msg.has_liked ? "fill-[#FF6A2A] text-[#FF6A2A]" : ""
                      }`}
                    />
                    <span>{msg.likes}</span>
                  </button>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Image Preview if attached */}
      {image && (
        <div className="p-3 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={image} alt="Preview" className="w-12 h-12 rounded-xl object-cover" />
            <span className="text-xs font-semibold text-[#F5F5F7]">Foto anexada</span>
          </div>
          <button
            onClick={() => setImage(null)}
            className="p-1.5 rounded-lg bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Input Bar */}
      <form onSubmit={handleSend} className="space-y-1.5">
        <div className="flex items-center gap-2">
          {/* Photo attach button */}
          <label
            htmlFor="chat-image-input"
            className="w-11 h-11 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex items-center justify-center text-[#9B9BA1] hover:text-[#F5F5F7] hover:border-[#FF6A2A] cursor-pointer transition-colors shrink-0"
            title="Anexar foto"
          >
            <ImageIcon className="w-5 h-5" />
            <input
              id="chat-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          {/* VIP Color Picker Shortcut */}
          {hasVipChatColors && onOpenColorPicker && (
            <button
              id="chat-vip-color-btn"
              type="button"
              onClick={onOpenColorPicker}
              className="w-11 h-11 rounded-2xl bg-[#1C1808] border border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/20 flex items-center justify-center transition-all cursor-pointer shadow-sm shadow-[#FFD700]/20 shrink-0"
              title="Personalização VIP de Cores do Chat"
            >
              <Palette className="w-5 h-5" />
            </button>
          )}

          <input
            id="chat-text-input"
            type="text"
            maxLength={200}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("comm.placeholder")}
            className="flex-1 px-4 py-3 rounded-2xl bg-[#151515] border border-[#2B2B2F] text-[#F5F5F7] text-xs sm:text-sm focus:outline-none focus:border-[#FF6A2A]"
          />

          <button
            id="send-chat-btn"
            type="submit"
            onClick={handleSend}
            onPointerDown={handleSend}
            {...({ onPress: handleSend } as any)}
            disabled={!text.trim() || sending}
            className="w-11 h-11 rounded-2xl bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white flex items-center justify-center disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all shrink-0 shadow-lg shadow-[#FF6A2A]/20 cursor-pointer"
            title="Enviar mensagem para a Comunidade"
          >
            {sending ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 ml-0.5" />
            )}
          </button>
        </div>

        <div className="flex justify-end px-1">
          <span
            className={`text-[10px] font-semibold ${
              remainingChars < 20 ? "text-[#FF453A]" : "text-[#9B9BA1]"
            }`}
          >
            {remainingChars} / 200 caracteres
          </span>
        </div>
      </form>
    </div>
  );
};
