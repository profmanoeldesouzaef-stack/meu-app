import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  X,
  FileText,
  Camera,
  AlertTriangle,
  Award,
  Lock,
  Check,
} from "lucide-react";
import { ActiveChallenge } from "../types";
import { useApp } from "../context/AppContext";

interface ChallengeTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: ActiveChallenge | null;
  onAccept: () => void;
}

export const ChallengeTermsModal: React.FC<ChallengeTermsModalProps> = ({
  isOpen,
  onClose,
  challenge,
  onAccept,
}) => {
  const { currentUserName, currentUserEmail, currentUserNickname } = useApp();
  const [accepted, setAccepted] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  if (!isOpen) return null;

  const challengeTitle = challenge?.title || "Desafio de Transformação Corporal Vyra";
  const athleteIdentifier =
    currentUserName ||
    (currentUserNickname ? `@${currentUserNickname}` : null) ||
    currentUserEmail ||
    "Atleta Vyra";

  const handleConfirm = () => {
    if (!accepted) return;
    try {
      const challengeKey = challenge ? `vyra_challenge_accepted_${challenge.id}` : "vyra_challenge_accepted_general";
      localStorage.setItem(challengeKey, "true");
      localStorage.setItem("vyra_challenge_terms_accepted", "true");
      localStorage.setItem("vyra_challenge_terms_accepted_at", new Date().toISOString());
    } catch {}

    onAccept();
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 40) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <div
      id="challenge-terms-modal-overlay"
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-xl bg-[#141416] border border-[#2B2B2F] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 my-auto relative">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#9B9BA1] hover:text-[#F5F5F7] hover:bg-[#1D1D1F] transition-all cursor-pointer"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="space-y-2 pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D8B46A]/15 border border-[#D8B46A]/30 text-[#D8B46A] text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Termo Oficial de Participação & Aceite</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F7] tracking-tight">
            Regulamento do Desafio
          </h3>
          <p className="text-xs text-[#D8B46A] font-semibold flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>{challengeTitle}</span>
          </p>
        </div>

        {/* Caixa de Texto do Regulamento com Rolagem */}
        <div
          onScroll={handleScroll}
          className="p-4 sm:p-5 rounded-2xl bg-[#0D0D0E] border border-[#26262B] max-h-72 overflow-y-auto space-y-4 text-xs text-[#9B9BA1] leading-relaxed scrollbar-thin scrollbar-thumb-[#2B2B2F]"
        >
          <div className="space-y-1 text-[#F5F5F7]">
            <p className="font-bold text-sm text-[#F5F5F7] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#D8B46A]" />
              Termo de Consentimento, Autorização de Imagem e Regras de Elegibilidade
            </p>
            <p className="text-[11px] text-[#6E6E73]">
              Identificação do Atleta: <span className="text-[#D8B46A] font-medium">{athleteIdentifier}</span>
            </p>
          </div>

          {/* Cláusula 1 */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#141416] border border-[#2B2B2F]/60">
            <h5 className="font-bold text-[#F5F5F7] flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-[#D8B46A]" />
              1. Autenticidade e Veracidade das Fotografias
            </h5>
            <p className="text-[11px]">
              O atleta participante declara e garante que todas as fotos de evolução (antes e depois) submetidas representam fielmente seu próprio corpo e foram capturadas exclusivamente durante o período de vigência oficial do desafio.
            </p>
            <p className="text-[11px] text-[#FF9A62]">
              • É estritamente proibido o uso de filtros cosméticos, ferramentas de distorção anatômica, inteligência artificial generativa ou edições que alterem as proporções musculares reais.
            </p>
          </div>

          {/* Cláusula 2 */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#141416] border border-[#2B2B2F]/60">
            <h5 className="font-bold text-[#F5F5F7] flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-[#D8B46A]" />
              2. Autorização de Exibição e Apuração
            </h5>
            <p className="text-[11px]">
              Ao submeter suas fotografias, o participante autoriza expressamente a exibição de suas fotos no painel de apuração interno da plataforma Vyra, na galeria oficial da comunidade e na cédula de votação popular e técnica para a definição dos campeões.
            </p>
          </div>

          {/* Cláusula 3 */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#141416] border border-[#2B2B2F]/60">
            <h5 className="font-bold text-[#F5F5F7] flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#FF9A62]" />
              3. Fair Play, Conduta Esportiva e Desclassificação
            </h5>
            <p className="text-[11px]">
              É proibida a utilização de robôs, compra de votos ou automações no processo de votação pública. O desrespeito a essas regras ou a outros participantes resultará na desclassificação imediata do atleta, com cancelamento da premiação.
            </p>
          </div>

          {/* Cláusula 4 */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#141416] border border-[#2B2B2F]/60">
            <h5 className="font-bold text-[#F5F5F7] flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#34C759]" />
              4. Saúde e Prática Segura
            </h5>
            <p className="text-[11px]">
              O participante declara que atingiu sua evolução por meio de práticas desportivas e nutricionais saudáveis, zelando por sua higidez física e bem-estar.
            </p>
          </div>
        </div>

        {/* Checkbox de Aceite Obrigatório */}
        <div className="space-y-3 pt-1">
          <label className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#D8B46A]/50 transition-all cursor-pointer select-none">
            <input
              type="checkbox"
              id="challenge-terms-agree-checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#D8B46A] border-[#2B2B2F] bg-black focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#D8B46A]"
            />
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#F5F5F7] block leading-snug">
                Li, compreendi e concordo integralmente com o regulamento e autorizo o envio das fotos para apuração do desafio.
              </span>
              <span className="text-[10px] text-[#9B9BA1] block">
                Aceite vinculado a <strong className="text-[#D8B46A]">{athleteIdentifier}</strong> em {new Date().toLocaleDateString("pt-BR")}.
              </span>
            </div>
          </label>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#2B2B2F]">
          <button
            type="button"
            id="challenge-terms-cancel-btn"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#9B9BA1] hover:text-[#F5F5F7] transition-colors cursor-pointer"
          >
            Voltar / Cancelar
          </button>

          <button
            type="button"
            id="challenge-terms-accept-btn"
            disabled={!accepted}
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              accepted
                ? "bg-[#D8B46A] text-black hover:brightness-110 active:scale-95 shadow-lg shadow-[#D8B46A]/20"
                : "bg-[#2B2B2F] text-[#6E6E73] cursor-not-allowed"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Aceitar e Prosseguir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
