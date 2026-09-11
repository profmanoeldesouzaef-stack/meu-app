import React, { useState, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Upload,
  X,
  Check,
  Trash2,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Award,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { getVotingUserId } from "../lib/supabaseClient";
import { useApp } from "../context/AppContext";

export interface GaleriaPhotoUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoUploaded?: () => void;
  onToast?: (message: string) => void;
}

export const GaleriaPhotoUpload: React.FC<GaleriaPhotoUploadProps> = ({
  isOpen,
  onClose,
  onPhotoUploaded,
  onToast,
}) => {
  const { isVeteran, consecutiveMonths, monthlyFeePaid } = useApp();
  const [participantName, setParticipantName] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<"shape" | "forge" | "reset12">("shape");
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>("");
  const [isPicking, setIsPicking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  /**
   * Abre a seleção de imagem utilizando expo-image-picker
   */
  const handlePickImageWithExpo = async () => {
    try {
      setIsPicking(true);
      setErrorMessage(null);

      // Solicita permissões se suportado pelo ambiente
      try {
        if (ImagePicker.requestMediaLibraryPermissionsAsync) {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (perm && perm.status !== "granted" && !perm.granted) {
            console.warn("Permissão de mídia não concedida:", perm);
          }
        }
      } catch (permErr) {
        console.warn("Aviso ao solicitar permissão de mídia:", permErr);
      }

      // Executa a seleção com expo-image-picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImageUri(asset.uri);
        setImageFileName(asset.fileName || `foto_${Date.now()}.jpg`);
      }
    } catch (err: any) {
      console.error("Erro ao selecionar imagem com expo-image-picker:", err);
      // Fallback gracioso para acionar o input web caso o ambiente restrinja expo-image-picker
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        setErrorMessage("Não foi possível abrir o seletor. Use o envio tradicional de arquivos.");
      }
    } finally {
      setIsPicking(false);
    }
  };

  /**
   * Fallback / Suporte a arrastar e soltar e seleção direta de arquivo no navegador
   */
  const handleNativeFileChange = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).");
      return;
    }
    setErrorMessage(null);
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedImageUri(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * Envia a imagem para o Supabase Storage ('challenge_photos') e insere na tabela 'challenge_photos'
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!participantName.trim()) {
      setErrorMessage("Informe o nome do participante.");
      return;
    }

    if (!selectedImageUri) {
      setErrorMessage("Selecione uma foto da sua evolução antes de enviar.");
      return;
    }

    try {
      setIsUploading(true);

      // ETAPA 1: Upload para o bucket 'challenge_photos' do Supabase Storage
      setUploadStep("Enviando foto para o bucket 'challenge_photos'...");

      const res = await fetch(selectedImageUri);
      const blob = await res.blob();
      const ext = blob.type.includes("png")
        ? "png"
        : blob.type.includes("webp")
        ? "webp"
        : "jpg";
      const uniqueFileName = `photo_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}.${ext}`;
      const filePath = uniqueFileName;

      let publicPhotoUrl = selectedImageUri;

      const { error: storageError } = await supabase.storage
        .from("challenge_photos")
        .upload(filePath, blob, {
          contentType: blob.type || "image/jpeg",
          upsert: true,
        });

      if (storageError) {
        console.warn("Aviso ao fazer upload no bucket challenge_photos:", storageError);
        // Se houver erro de permissão ou bucket inexistente, prossegue com o fallback seguro da URL
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("challenge_photos")
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          publicPhotoUrl = publicUrlData.publicUrl;
        }
      }

      // ETAPA 2: Inserção do registro na tabela 'challenge_photos'
      setUploadStep("Gravando registro na tabela 'challenge_photos'...");
      const currentUserId = getVotingUserId();

      const { data: insertedData, error: insertError } = await supabase
        .from("challenge_photos")
        .insert({
          participant_name: participantName.trim(),
          caption: caption.trim() || null,
          photo_url: publicPhotoUrl,
          category: category,
          status: "approved",
          votes_count: 0,
          user_id: currentUserId,
          is_veteran: isVeteran,
          patente_level: monthlyFeePaid ? Math.floor(consecutiveMonths / 3) : 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Erro ao inserir na tabela challenge_photos:", insertError);
        throw insertError;
      }

      if (onToast) {
        onToast("Foto enviada com sucesso para o desafio!");
      }

      // Limpeza do formulário
      setParticipantName("");
      setCaption("");
      setSelectedImageUri(null);
      setImageFileName("");

      if (onPhotoUploaded) {
        onPhotoUploaded();
      }

      onClose();
    } catch (err: any) {
      console.error("Erro completo no processo de upload de foto:", err);
      setErrorMessage(
        err?.message || "Falha ao enviar a foto. Verifique a conexão com o Supabase e tente novamente."
      );
    } finally {
      setIsUploading(false);
      setUploadStep(null);
    }
  };

  return (
    <div
      id="galeria-photo-upload-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-[#151515] border border-[#2B2B2F] w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200">
        {/* Botão Fechar */}
        <button
          id="close-galeria-photo-upload-btn"
          type="button"
          onClick={onClose}
          disabled={isUploading}
          className="absolute top-5 right-5 p-2 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F] transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabeçalho */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#FF6A2A] uppercase bg-[#FF6A2A]/15 px-2.5 py-0.5 rounded-full border border-[#FF6A2A]/30 flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>Desafio & Transformação</span>
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-[#F5F5F7] mt-2">
            Publicar Evolução
          </h3>
          <p className="text-xs text-[#9B9BA1] mt-0.5">
            Selecione uma foto da sua evolução e envie para o ranking da comunidade.
          </p>
        </div>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Participante */}
          <div>
            <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
              Nome do Participante *
            </label>
            <input
              id="upload-participant-name"
              type="text"
              required
              placeholder="Ex: Seu Nome ou Apelido"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              disabled={isUploading}
              className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-4 py-2.5 text-xs text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A] transition-colors disabled:opacity-50"
            />
          </div>

          {/* Seleção de Imagem com expo-image-picker */}
          <div>
            <label className="text-xs font-bold text-[#9B9BA1] block mb-1.5">
              Foto da Evolução (expo-image-picker) *
            </label>

            {/* Input nativo oculto para drag & drop ou fallback */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleNativeFileChange(file);
              }}
            />

            {!selectedImageUri ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleNativeFileChange(file);
                }}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#2B2B2F] hover:border-[#FF6A2A] rounded-2xl bg-[#1D1D1F] hover:bg-[#1D1D1F]/80 transition-all text-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#FF6A2A]/10 border border-[#FF6A2A]/20 flex items-center justify-center text-[#FF6A2A] group-hover:scale-105 transition-transform mb-3 shadow-inner">
                  <Camera className="w-7 h-7" />
                </div>

                <span className="text-xs font-bold text-[#F5F5F7] block group-hover:text-[#FF6A2A] transition-colors">
                  {isPicking ? "Abrindo seletor..." : "Selecionar Foto do Aparelho"}
                </span>
                <span className="text-[11px] text-[#9B9BA1] mt-1 block max-w-xs">
                  Toque no botão abaixo para abrir sua galeria com expo-image-picker
                </span>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    id="expo-pick-image-btn"
                    type="button"
                    onClick={handlePickImageWithExpo}
                    disabled={isPicking || isUploading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF6A2A] hover:bg-[#FF8045] text-white flex items-center gap-2 shadow-md shadow-[#FF6A2A]/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isPicking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                    <span>{isPicking ? "Carregando..." : "Escolher da Galeria"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#2B2B2F] text-[#9B9BA1] hover:text-[#F5F5F7] hover:bg-[#343438] transition-colors cursor-pointer"
                  >
                    Arquivos
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden border border-[#2B2B2F] bg-black h-52 flex items-center justify-center">
                  <img
                    src={selectedImageUri}
                    alt="Preview da foto selecionada"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 flex items-center gap-1.5 truncate max-w-[200px]">
                      <Check className="w-3.5 h-3.5 text-[#34C759] shrink-0" />
                      <span className="truncate">{imageFileName || "Foto selecionada"}</span>
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handlePickImageWithExpo}
                        disabled={isUploading}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#1D1D1F] hover:bg-[#2B2B2F] text-[#F5F5F7] border border-white/20 hover:border-[#FF6A2A] transition-all cursor-pointer flex items-center gap-1 shadow-md disabled:opacity-50"
                      >
                        <Upload className="w-3 h-3 text-[#FF6A2A]" />
                        <span>Trocar</span>
                      </button>

                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => {
                          setSelectedImageUri(null);
                          setImageFileName("");
                        }}
                        className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all cursor-pointer disabled:opacity-50"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Categoria do Desafio */}
          <div>
            <label className="text-xs font-bold text-[#9B9BA1] block mb-1.5">
              Programa / Categoria
            </label>
            <div className="flex gap-2">
              {(
                [
                  { id: "shape", label: "Vyra Shape" },
                  { id: "forge", label: "Forge Protocol" },
                  { id: "reset12", label: "Reset 12" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  disabled={isUploading}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                    category === cat.id
                      ? "bg-[#FF6A2A]/15 border-[#FF6A2A] text-[#FF6A2A]"
                      : "bg-[#1D1D1F] border-[#2B2B2F] text-[#9B9BA1] hover:text-[#F5F5F7]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Legenda */}
          <div>
            <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
              Legenda / Metas da Transformação
            </label>
            <textarea
              id="upload-caption"
              rows={2}
              placeholder="Ex: 8 semanas de treino pesado e alimentação equilibrada!"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={isUploading}
              className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-4 py-2 text-xs text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A] transition-colors disabled:opacity-50"
            />
          </div>

          {/* Status do Envio */}
          {isUploading && uploadStep && (
            <div className="p-3 rounded-xl bg-[#FF6A2A]/10 border border-[#FF6A2A]/30 flex items-center gap-2.5 text-xs text-[#FF6A2A]">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span className="font-semibold">{uploadStep}</span>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#9B9BA1] border border-[#2B2B2F] hover:text-[#F5F5F7] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              id="submit-galeria-photo-btn"
              type="submit"
              disabled={isUploading || !selectedImageUri}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 shadow-lg shadow-[#FF6A2A]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Publicar Foto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
