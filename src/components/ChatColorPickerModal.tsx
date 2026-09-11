import React, { useState } from "react";
import { X, Check, MessageSquare, Palette } from "lucide-react";
import { CHAT_NAME_COLOR_PRESETS, CHAT_TEXT_COLOR_PRESETS } from "../lib/patents";

interface ChatColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNameColor?: string;
  currentTextColor?: string;
  onSave: (nameColor: string, textColor: string) => void;
  authorName?: string;
}

export const ChatColorPickerModal: React.FC<ChatColorPickerModalProps> = ({
  isOpen,
  onClose,
  currentNameColor = "#D8B46A",
  currentTextColor = "#F5F5F7",
  onSave,
  authorName = "Rafael Costa",
}) => {
  const [selectedNameColor, setSelectedNameColor] = useState(currentNameColor);
  const [selectedTextColor, setSelectedTextColor] = useState(currentTextColor);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(selectedNameColor, selectedTextColor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#151515] border border-[#FFD700]/50 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFD700]/20 text-[#FFD700] flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-[#FFD700] tracking-wider">
                Privilégio VIP · 5+ Estrelas
              </span>
              <h3 className="text-base font-bold text-[#F5F5F7]">
                Personalização do Chat Global
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Chat Message Preview */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[#9B9BA1] uppercase">
            Pré-visualização da sua mensagem no Chat:
          </label>
          <div className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2B2B2F] border border-[#D8B46A]/40 flex items-center justify-center text-xs font-bold text-[#F5F5F7]">
              {authorName.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: selectedNameColor }}>
                  {authorName}
                </span>
                <span className="text-[9px] text-[#9B9BA1]">Agora</span>
              </div>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: selectedTextColor }}>
                Treino de hoje finalizado com intensidade máxima! Rumo à evolução.
              </p>
            </div>
          </div>
        </div>

        {/* Name Color Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#F5F5F7] flex items-center justify-between">
            <span>Cor do seu Nome</span>
            <span className="text-[10px] font-mono text-[#9B9BA1]">{selectedNameColor}</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {CHAT_NAME_COLOR_PRESETS.map((color) => (
              <button
                key={color.hex}
                type="button"
                onClick={() => setSelectedNameColor(color.hex)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedNameColor.toLowerCase() === color.hex.toLowerCase()
                    ? "bg-[#252528] border-[#FFD700] shadow-md shadow-[#FFD700]/20"
                    : "bg-[#1D1D1F] border-[#2B2B2F] hover:border-[#3E3E44]"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="truncate text-[10px]" style={{ color: color.hex }}>
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Text Color Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#F5F5F7] flex items-center justify-between">
            <span>Cor do Texto das Mensagens</span>
            <span className="text-[10px] font-mono text-[#9B9BA1]">{selectedTextColor}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CHAT_TEXT_COLOR_PRESETS.map((color) => (
              <button
                key={color.hex}
                type="button"
                onClick={() => setSelectedTextColor(color.hex)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedTextColor.toLowerCase() === color.hex.toLowerCase()
                    ? "bg-[#252528] border-[#FFD700] shadow-md shadow-[#FFD700]/20"
                    : "bg-[#1D1D1F] border-[#2B2B2F] hover:border-[#3E3E44]"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="truncate text-[10px]" style={{ color: color.hex }}>
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#9B9BA1] hover:bg-[#1D1D1F] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#FFD700] to-[#FFA000] text-[#0A0A0A] hover:brightness-110 flex items-center gap-2 cursor-pointer shadow-md shadow-[#FFD700]/20"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Salvar Cores VIP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
