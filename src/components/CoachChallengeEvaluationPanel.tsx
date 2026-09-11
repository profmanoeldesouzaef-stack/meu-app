import React, { useState } from "react";
import {
  Trophy,
  Crown,
  Users,
  Flame,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  Loader2,
  Heart,
  Eye,
  X,
} from "lucide-react";
import { ActiveChallenge, ChallengeEntry } from "../types";
import { declareChampionAction } from "../lib/storage";

interface CoachChallengeEvaluationPanelProps {
  challenges: ActiveChallenge[];
  entries: ChallengeEntry[];
  selectedChallengeId: string;
  onSelectChallenge: (id: string) => void;
  onRefresh: () => void;
}

export const CoachChallengeEvaluationPanel: React.FC<CoachChallengeEvaluationPanelProps> = ({
  challenges,
  entries,
  selectedChallengeId,
  onSelectChallenge,
  onRefresh,
}) => {
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    entry: ChallengeEntry | null;
  }>({ isOpen: false, entry: null });

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [declaring, setDeclaring] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const currentChallenge =
    challenges.find((c) => c.id === selectedChallengeId) || challenges[0];

  const challengeEntries = entries.filter(
    (e) => !currentChallenge || e.challenge_id === currentChallenge.id
  );

  const totalVotes = challengeEntries.reduce((sum, e) => sum + (e.votes_count || 0), 0);
  const isFinished = currentChallenge?.status === "finished" || currentChallenge?.status === "closed";

  const handleDeclareChampion = async () => {
    if (!confirmModal.entry || !currentChallenge) return;
    try {
      setDeclaring(true);
      const res = await declareChampionAction(currentChallenge.id, {
        entry_id: confirmModal.entry.id,
        user_id: confirmModal.entry.user_id,
        participant_name: confirmModal.entry.participant_name || "Atleta Campeão",
        photo_url: confirmModal.entry.photo_url,
      });

      setSuccessToast(
        `🏆 ${confirmModal.entry.participant_name} foi oficialmente coroado(a) Campeão(ã) do ${currentChallenge.title}! As submissões foram encerradas.`
      );
      setConfirmModal({ isOpen: false, entry: null });
      onRefresh();
    } catch (err: any) {
      console.error("Erro ao declarar campeão:", err);
      alert("Ocorreu um erro ao registrar o campeão.");
    } finally {
      setDeclaring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback de Campeão */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-[#D8B46A]/20 border border-[#D8B46A] flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Crown className="w-5 h-5 text-[#D8B46A] shrink-0" />
            <p className="text-xs sm:text-sm font-bold text-[#F5F5F7]">{successToast}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-xs text-[#9B9BA1] hover:text-[#F5F5F7] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header do Painel do Coach */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#151515] border border-[#D8B46A]/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#D8B46A]/20 text-[#D8B46A] border border-[#D8B46A]/40 flex items-center gap-1.5">
                <Crown className="w-3 h-3" />
                Painel de Avaliação do Coach
              </span>
              {isFinished ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/40">
                  Desafio Encerrado
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6A2A]/20 text-[#FF6A2A] border border-[#FF6A2A]/40">
                  Submissões Abertas
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F7] tracking-tight">
              Gerenciar Submissões & Declarar Campeão
            </h2>
            <p className="text-xs text-[#9B9BA1]">
              Avalie as transformações enviadas pelos alunos e declare o vencedor oficial com encerramento do desafio.
            </p>
          </div>

          {/* Seletor de Desafio */}
          {challenges.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#9B9BA1] font-semibold hidden sm:inline">
                Desafio:
              </span>
              <div className="relative">
                <select
                  value={selectedChallengeId}
                  onChange={(e) => onSelectChallenge(e.target.value)}
                  className="appearance-none bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#D8B46A] text-xs font-bold text-[#F5F5F7] px-4 py-2.5 pr-8 rounded-xl focus:outline-none cursor-pointer transition-all"
                >
                  {challenges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.status === "finished" ? "Finalizado" : "Ativo"})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#9B9BA1] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Linha de Métricas do Desafio */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#2B2B2F]">
          <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F]">
            <div className="flex items-center gap-1.5 text-xs text-[#9B9BA1]">
              <Users className="w-3.5 h-3.5 text-[#D8B46A]" />
              <span>Alunos Inscritos</span>
            </div>
            <p className="text-xl font-extrabold text-[#F5F5F7] mt-1">
              {challengeEntries.length}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F]">
            <div className="flex items-center gap-1.5 text-xs text-[#9B9BA1]">
              <Heart className="w-3.5 h-3.5 text-[#FF6A2A]" />
              <span>Votos Totais</span>
            </div>
            <p className="text-xl font-extrabold text-[#F5F5F7] mt-1">
              {totalVotes}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F]">
            <div className="flex items-center gap-1.5 text-xs text-[#9B9BA1]">
              <Calendar className="w-3.5 h-3.5 text-[#34C759]" />
              <span>Status</span>
            </div>
            <p className="text-xs font-bold text-[#F5F5F7] mt-1.5">
              {isFinished ? "Finalizado com Campeão" : "Avaliação em Andamento"}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F]">
            <div className="flex items-center gap-1.5 text-xs text-[#9B9BA1]">
              <Crown className="w-3.5 h-3.5 text-[#D8B46A]" />
              <span>Vencedor Atual</span>
            </div>
            <p className="text-xs font-bold text-[#D8B46A] mt-1.5 truncate" title={currentChallenge?.winner_name || "Ainda não definido"}>
              {currentChallenge?.winner_name || "Pendente"}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Fotos dos Alunos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#9B9BA1] uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#FF6A2A]" />
            Galeria de Transformações dos Alunos ({challengeEntries.length})
          </h3>
          <span className="text-xs text-[#6E6E73]">
            {isFinished
              ? "Desafio encerrado - submissões bloqueadas"
              : "Clique em 'Declarar Campeão' para coroar o vencedor"}
          </span>
        </div>

        {challengeEntries.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#151515] border border-[#2B2B2F] text-center space-y-3">
            <Users className="w-10 h-10 text-[#9B9BA1] mx-auto opacity-40" />
            <h4 className="text-base font-bold text-[#F5F5F7]">Nenhuma foto enviada ainda</h4>
            <p className="text-xs text-[#9B9BA1] max-w-sm mx-auto">
              Nenhum aluno submeteu fotos para este desafio no momento. As participações aparecerão automaticamente aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {challengeEntries.map((entry) => {
              const isWinner =
                entry.is_winner ||
                currentChallenge?.winner_id === entry.user_id ||
                currentChallenge?.winner_name === entry.participant_name;

              return (
                <div
                  key={entry.id}
                  className={`p-4 rounded-3xl bg-[#151515] border transition-all flex flex-col justify-between space-y-3.5 shadow-xl group ${
                    isWinner
                      ? "border-[#D8B46A] ring-1 ring-[#D8B46A]/50 bg-[#1D1A14]"
                      : "border-[#2B2B2F] hover:border-[#D8B46A]/50"
                  }`}
                >
                  {/* Foto da Participação */}
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-black border border-[#2B2B2F]">
                    <img
                      src={entry.photo_url}
                      alt={entry.participant_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Badge de Campeão se venceu */}
                    {isWinner && (
                      <div className="absolute top-2.5 left-2.5 px-3 py-1 rounded-full bg-[#D8B46A] text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-black/50">
                        <Crown className="w-3.5 h-3.5 fill-black" />
                        <span>Campeão Oficial</span>
                      </div>
                    )}

                    {/* Botão de Ver foto expandida */}
                    <button
                      type="button"
                      onClick={() => setPreviewPhoto(entry.photo_url)}
                      className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-black/70 hover:bg-black text-[#F5F5F7] backdrop-blur-sm transition-all cursor-pointer"
                      title="Expandir foto"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Informações do Aluno */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-[#F5F5F7] truncate">
                        {entry.participant_name || "Atleta Vyra"}
                      </h4>
                      <span className="text-[11px] font-bold text-[#D8B46A] flex items-center gap-1 shrink-0">
                        <Heart className="w-3 h-3 fill-[#D8B46A]" />
                        {entry.votes_count || 0} votos
                      </span>
                    </div>

                    {entry.caption && (
                      <p className="text-xs text-[#9B9BA1] line-clamp-2 leading-relaxed">
                        "{entry.caption}"
                      </p>
                    )}

                    <span className="text-[10px] text-[#6E6E73] block">
                      Enviado em: {new Date(entry.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  {/* Botão Definitivo: Declarar Campeão */}
                  <div className="pt-2 border-t border-[#2B2B2F]">
                    {isWinner ? (
                      <div className="w-full py-2.5 rounded-xl bg-[#D8B46A]/20 border border-[#D8B46A]/50 text-[#D8B46A] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2">
                        <Crown className="w-4 h-4 fill-[#D8B46A]" />
                        <span>Vencedor Declarado</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isFinished}
                        onClick={() => setConfirmModal({ isOpen: true, entry })}
                        className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isFinished
                            ? "bg-[#1D1D1F] text-[#6E6E73] border border-[#2B2B2F] cursor-not-allowed"
                            : "bg-[#D8B46A] text-black hover:brightness-110 active:scale-95 shadow-lg shadow-[#D8B46A]/20"
                        }`}
                      >
                        <Trophy className="w-3.5 h-3.5 fill-black" />
                        <span>Declarar Campeão</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Confirmação Definitiva do Campeão */}
      {confirmModal.isOpen && confirmModal.entry && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#151515] border border-[#D8B46A] rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#D8B46A]/20 text-[#D8B46A] flex items-center justify-center mx-auto border border-[#D8B46A]/40 shadow-xl">
                <Crown className="w-8 h-8 fill-[#D8B46A]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-[#F5F5F7]">
                  Declarar Campeão Oficial
                </h3>
                <p className="text-xs text-[#9B9BA1] leading-relaxed">
                  Você está prestes a coroar{" "}
                  <strong className="text-[#F5F5F7] font-black">
                    {confirmModal.entry.participant_name}
                  </strong>{" "}
                  como o grande vencedor do{" "}
                  <strong className="text-[#D8B46A] font-bold">
                    {currentChallenge?.title}
                  </strong>
                  .
                </p>
              </div>
            </div>

            {/* Preview do Aluno */}
            <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex items-center gap-3">
              <img
                src={confirmModal.entry.photo_url}
                alt="Winner"
                className="w-14 h-18 rounded-xl object-cover border border-[#D8B46A]/40 shrink-0"
              />
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-[#F5F5F7]">{confirmModal.entry.participant_name}</p>
                <p className="text-[#D8B46A] font-semibold">{confirmModal.entry.votes_count || 0} votos</p>
                <p className="text-[#9B9BA1] text-[11px] line-clamp-1">{confirmModal.entry.caption}</p>
              </div>
            </div>

            {/* Aviso de impacto */}
            <div className="p-3 rounded-xl bg-[#FF9A62]/10 border border-[#FF6A2A]/30 text-[11px] text-[#FF9A62] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Ações automáticas:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[#9B9BA1]">
                <li>Status do desafio atualizado para "finished".</li>
                <li>Novas submissões de fotos serão encerradas.</li>
                <li>O atleta será imortalizado no Hall da Fama Oficial.</li>
              </ul>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, entry: null })}
                disabled={declaring}
                className="flex-1 py-3 rounded-xl text-xs font-bold text-[#9B9BA1] hover:text-[#F5F5F7] bg-[#1D1D1F] border border-[#2B2B2F] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeclareChampion}
                disabled={declaring}
                className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-[#D8B46A] text-black hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D8B46A]/20"
              >
                {declaring ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Coroando...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-3.5 h-3.5 fill-black" />
                    <span>Confirmar Campeão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização da Foto em Alta Resolução */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[85vh] flex items-center justify-center">
            <img
              src={previewPhoto}
              alt="Evolução ampliada"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain border border-[#2B2B2F]"
            />
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-2 right-2 p-2 rounded-xl bg-black/80 text-white hover:bg-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
