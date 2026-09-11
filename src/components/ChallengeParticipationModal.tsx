import React, { useState, useRef, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Upload,
  X,
  Check,
  Loader2,
  Trophy,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Lock,
  Award,
  AlertTriangle,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { ActiveChallenge, ChallengeEntry } from "../types";
import { uploadToChallengePhotosBucket, saveChallengeEntry } from "../lib/storage";
import { useApp } from "../context/AppContext";

interface ChallengeParticipationModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: ActiveChallenge | null;
  onEntryCreated: (entry: ChallengeEntry) => void;
}

export const ChallengeParticipationModal: React.FC<ChallengeParticipationModalProps> = ({
  isOpen,
  onClose,
  challenge,
  onEntryCreated,
}) => {
  const { currentUserEmail, currentUserName, currentUserNickname } = useApp();
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [participantName, setParticipantName] = useState(
    currentUserName || (currentUserEmail ? currentUserEmail.split("@")[0] : "Atleta Vyra")
  );

  // Verificação de aceite prévio no localStorage
  const checkIsAccepted = (chId?: string) => {
    try {
      if (typeof window !== "undefined") {
        if (chId && localStorage.getItem(`vyra_challenge_accepted_${chId}`) === "true") {
          return true;
        }
        return localStorage.getItem("vyra_challenge_terms_accepted") === "true";
      }
    } catch {}
    return false;
  };

  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(() => checkIsAccepted(challenge?.id));
  const [termsCheckbox, setTermsCheckbox] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<"terms" | "upload">("terms");

  const [isPicking, setIsPicking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successEntry, setSuccessEntry] = useState<ChallengeEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincroniza passo quando modal abre ou desafio muda
  useEffect(() => {
    if (isOpen && challenge) {
      const alreadyAccepted = checkIsAccepted(challenge.id);
      setHasAcceptedTerms(alreadyAccepted);
      setActiveStep(alreadyAccepted ? "upload" : "terms");
      setTermsCheckbox(alreadyAccepted);
      setErrorMsg(null);
    }
  }, [isOpen, challenge?.id]);

  if (!isOpen || !challenge) return null;

  const athleteIdentifier =
    currentUserName ||
    (currentUserNickname ? `@${currentUserNickname}` : null) ||
    (currentUserEmail ? currentUserEmail.split("@")[0] : "Atleta Vyra");

  const handleAcceptTerms = () => {
    if (!termsCheckbox) return;
    try {
      if (challenge) {
        localStorage.setItem(`vyra_challenge_accepted_${challenge.id}`, "true");
      }
      localStorage.setItem("vyra_challenge_terms_accepted", "true");
      localStorage.setItem("vyra_challenge_terms_accepted_at", new Date().toISOString());
    } catch {}

    setHasAcceptedTerms(true);
    setActiveStep("upload");
  };

  const handlePickFromGallery = async () => {
    try {
      setIsPicking(true);
      setErrorMsg(null);

      try {
        if (ImagePicker.requestMediaLibraryPermissionsAsync) {
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        }
      } catch (e) {
        console.warn("Media permission check notice:", e);
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (err: any) {
      console.error("Erro expo-image-picker galeria:", err);
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        setErrorMsg("Não foi possível acessar a galeria. Tente pelo seletor de arquivos.");
      }
    } finally {
      setIsPicking(false);
    }
  };

  const handlePickFromCamera = async () => {
    try {
      setIsPicking(true);
      setErrorMsg(null);

      try {
        if (ImagePicker.requestCameraPermissionsAsync) {
          await ImagePicker.requestCameraPermissionsAsync();
        }
      } catch (e) {
        console.warn("Camera permission check notice:", e);
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (err: any) {
      console.error("Erro expo-image-picker câmera:", err);
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        setErrorMsg("Não foi possível acessar a câmera. Tente selecionar da galeria.");
      }
    } finally {
      setIsPicking(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Selecione um arquivo de imagem válido.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedImageUri(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImageUri) {
      setErrorMsg("Por favor, selecione ou tire uma foto para participar do desafio.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg(null);

      // Etapa 1: Upload para o bucket challenge_photos no Supabase Storage
      setUploadStep("Enviando foto para o Supabase Storage (bucket 'challenge_photos')...");
      const { publicUrl, error } = await uploadToChallengePhotosBucket(
        selectedImageUri,
        `entry_${challenge.id}_${Date.now()}.jpg`
      );

      if (error) {
        console.warn("Upload storage aviso:", error);
      }

      const finalPhotoUrl = publicUrl || selectedImageUri;

      // Etapa 2: Salva registro na tabela challenge_entries
      setUploadStep("Gravando participação na tabela 'challenge_entries'...");
      const entry = await saveChallengeEntry({
        challenge_id: challenge.id,
        user_id: currentUserEmail || "std-me",
        participant_name: participantName.trim() || athleteIdentifier,
        caption: caption.trim() || `Evolução para o ${challenge.title}`,
        photo_url: finalPhotoUrl,
      });

      setSuccessEntry(entry);
      onEntryCreated(entry);
    } catch (err: any) {
      console.error("Erro ao enviar participação:", err);
      setErrorMsg(err?.message || "Ocorreu um erro ao enviar sua foto. Tente novamente.");
    } finally {
      setIsUploading(false);
      setUploadStep(null);
    }
  };

  const handleClose = () => {
    setSelectedImageUri(null);
    setCaption("");
    setSuccessEntry(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div
      id="challenge-participation-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-lg bg-[#141414] border border-[#2B2B2F] rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 my-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2B2B2F] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D8B46A]/20 text-[#D8B46A] flex items-center justify-center border border-[#D8B46A]/30">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F5F5F7]">
                {activeStep === "terms" ? "Regulamento & Aceite" : "Participar do Desafio"}
              </h3>
              <p className="text-xs text-[#D8B46A] font-semibold truncate max-w-xs sm:max-w-sm">
                {challenge.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-[#9B9BA1] hover:text-[#F5F5F7] hover:bg-[#1D1D1F] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input file nativo invisível para fallback */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {successEntry ? (
          /* Sucesso ao enviar */
          <div className="py-6 text-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-[#34C759]/20 text-[#34C759] flex items-center justify-center mx-auto border border-[#34C759]/40 shadow-lg shadow-[#34C759]/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-extrabold text-[#F5F5F7]">
                Participação Confirmada!
              </h4>
              <p className="text-xs text-[#9B9BA1] max-w-sm mx-auto leading-relaxed">
                Sua foto foi enviada para o Supabase Storage no bucket{" "}
                <span className="text-[#D8B46A] font-semibold">challenge_photos</span> e seu registro
                salvo na tabela <span className="text-[#D8B46A] font-semibold">challenge_entries</span>.
              </p>
            </div>

            {successEntry.photo_url && (
              <div className="w-36 h-48 mx-auto rounded-2xl overflow-hidden border border-[#D8B46A]/40 shadow-xl bg-black">
                <img
                  src={successEntry.photo_url}
                  alt="Sua evolução"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider bg-[#D8B46A] text-black hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#D8B46A]/20"
            >
              Concluir & Ver Minha Foto
            </button>
          </div>
        ) : activeStep === "terms" ? (
          /* --- TELA DE ACEITE DO DESAFIO --- */
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#D8B46A]/15 text-[#D8B46A] border border-[#D8B46A]/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Termo Obrigatório de Consentimento</span>
              </span>
            </div>

            <p className="text-xs text-[#9B9BA1] leading-relaxed">
              Para garantir a idoneidade do ranking e a segurança de todos os atletas, leia e confirme o regulamento antes de enviar suas fotos:
            </p>

            {/* Cláusulas do Termo */}
            <div className="p-3.5 rounded-2xl bg-[#0D0D0E] border border-[#26262B] space-y-3 text-xs max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2B2B2F]">
              <div className="space-y-1">
                <h5 className="font-bold text-[#F5F5F7] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#D8B46A]" />
                  1. Autenticidade Visual das Fotos
                </h5>
                <p className="text-[11px] text-[#9B9BA1]">
                  As fotos devem ser 100% reais do seu próprio corpo, sem uso de filtros de edição, retoques de imagem ou alterações por IA. Poses nítidas com boa iluminação.
                </p>
              </div>

              <div className="space-y-1 border-t border-[#26262B] pt-2.5">
                <h5 className="font-bold text-[#F5F5F7] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#D8B46A]" />
                  2. Autorização de Exibição e Apuração
                </h5>
                <p className="text-[11px] text-[#9B9BA1]">
                  Você autoriza a exibição de suas fotos de evolução no painel da comunidade Vyra e na cédula de votação oficial do júri técnico e dos alunos.
                </p>
              </div>

              <div className="space-y-1 border-t border-[#26262B] pt-2.5">
                <h5 className="font-bold text-[#F5F5F7] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#FF9A62]" />
                  3. Fair Play e Desclassificação
                </h5>
                <p className="text-[11px] text-[#9B9BA1]">
                  É estritamente vedada a compra de votos, automações ou bots na votação. Qualquer tentativa de manipulação causará desclassificação sumária.
                </p>
              </div>

              <div className="space-y-1 border-t border-[#26262B] pt-2.5">
                <h5 className="font-bold text-[#F5F5F7] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#34C759]" />
                  4. Saúde Física e Segurança
                </h5>
                <p className="text-[11px] text-[#9B9BA1]">
                  Declaro que meus resultados foram construídos por treinos consistentes e plano alimentar equilibrado, respeitando minha saúde.
                </p>
              </div>
            </div>

            {/* Checkbox de Aceite */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#D8B46A]/50 transition-all cursor-pointer select-none">
              <input
                type="checkbox"
                id="challenge-agree-checkbox"
                checked={termsCheckbox}
                onChange={(e) => setTermsCheckbox(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#D8B46A] border-[#2B2B2F] bg-black accent-[#D8B46A] cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#F5F5F7] block leading-snug">
                  Li, compreendi e concordo integralmente com as regras e autorizo o uso das minhas fotos para o desafio.
                </span>
                <span className="text-[10px] text-[#9B9BA1] block">
                  Aceite nominal registrado para <strong>{athleteIdentifier}</strong>.
                </span>
              </div>
            </label>

            {/* Botões do Aceite */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2B2B2F]">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#9B9BA1] hover:text-[#F5F5F7] cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                id="challenge-confirm-terms-btn"
                disabled={!termsCheckbox}
                onClick={handleAcceptTerms}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  termsCheckbox
                    ? "bg-[#D8B46A] text-black hover:brightness-110 active:scale-95 shadow-lg shadow-[#D8B46A]/20"
                    : "bg-[#2B2B2F] text-[#6E6E73] cursor-not-allowed"
                }`}
              >
                <span>Aceitar e Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* --- ETAPA DE ENVIO DA FOTO --- */
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in">
            {/* Banner de Aceite Concluído */}
            <div className="p-2.5 rounded-xl bg-[#34C759]/10 border border-[#34C759]/30 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#34C759]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="font-bold text-[11px]">Termo de aceite do desafio validado</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveStep("terms")}
                className="text-[10px] font-bold text-[#D8B46A] hover:underline cursor-pointer shrink-0"
              >
                Rever Regras
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#FF453A]/15 border border-[#FF453A]/30 text-xs text-[#FF453A] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Foto Picker com expo-image-picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#9B9BA1] block uppercase tracking-wider">
                Foto da sua Transformação *
              </label>

              {selectedImageUri ? (
                <div className="relative rounded-2xl overflow-hidden border border-[#D8B46A]/50 bg-black aspect-[4/5] max-h-72 mx-auto flex items-center justify-center group shadow-xl">
                  <img
                    src={selectedImageUri}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handlePickFromGallery}
                      className="px-3 py-1.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-bold text-[#F5F5F7] hover:border-[#D8B46A] flex items-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Trocar
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImageUri(null)}
                      className="px-3 py-1.5 rounded-xl bg-[#FF453A]/20 border border-[#FF453A]/40 text-xs font-bold text-[#FF453A] hover:bg-[#FF453A]/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Remover
                    </button>
                  </div>
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#34C759]/90 text-black text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                    Foto Pronta
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isPicking}
                    onClick={handlePickFromCamera}
                    className="p-5 rounded-2xl border border-dashed border-[#D8B46A]/40 bg-[#D8B46A]/5 hover:bg-[#D8B46A]/10 hover:border-[#D8B46A] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-[#D8B46A]/20 text-[#D8B46A] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-[#F5F5F7] block">Tirar Foto</span>
                      <span className="text-[10px] text-[#9B9BA1]">Câmera com expo-image-picker</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isPicking}
                    onClick={handlePickFromGallery}
                    className="p-5 rounded-2xl border border-dashed border-[#2B2B2F] bg-[#151515] hover:bg-[#1D1D1F] hover:border-[#D8B46A]/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-[#2B2B2F] text-[#F5F5F7] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-[#F5F5F7] block">Galeria</span>
                      <span className="text-[10px] text-[#9B9BA1]">Selecionar do dispositivo</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Nome do Aluno */}
            <div>
              <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
                Seu Nome de Atleta
              </label>
              <input
                type="text"
                required
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Ex: Carlos Mendes"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
              />
            </div>

            {/* Legenda / História */}
            <div>
              <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
                Legenda da Evolução (opcional)
              </label>
              <textarea
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Ex: 12 semanas de dedicação total! Menos 8kg de gordura e mais definição muscular."
                className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A] resize-none"
              />
            </div>

            {/* Indicador de carregamento */}
            {isUploading && (
              <div className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#D8B46A]/30 flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 text-[#D8B46A] animate-spin shrink-0" />
                <div className="text-xs text-[#F5F5F7] space-y-0.5">
                  <p className="font-bold text-[#D8B46A]">Processando envio...</p>
                  <p className="text-[11px] text-[#9B9BA1]">{uploadStep || "Aguarde um instante..."}</p>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#2B2B2F]">
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#9B9BA1] hover:text-[#F5F5F7] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="challenge-submit-entry-btn"
                disabled={isUploading || !selectedImageUri}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  isUploading || !selectedImageUri
                    ? "bg-[#2B2B2F] text-[#6E6E73] cursor-not-allowed"
                    : "bg-[#D8B46A] text-black hover:brightness-110 active:scale-95 shadow-lg shadow-[#D8B46A]/20"
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-3.5 h-3.5" />
                    <span>Enviar Participação</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
