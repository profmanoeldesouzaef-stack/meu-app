import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  Trophy,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  Sparkles,
  Camera,
  X,
  ExternalLink,
} from "lucide-react";

interface ChallengePrizeManagerProps {
  onSuccess?: (newUrl: string) => void;
  className?: string;
}

export const ChallengePrizeManager: React.FC<ChallengePrizeManagerProps> = ({
  onSuccess,
  className = "",
}) => {
  const [currentConfig, setCurrentConfig] = useState<{
    id?: string;
    titulo?: string;
    subtitulo?: string;
    premiacao?: string;
    foto_premiacao_url?: string | null;
    ativo?: boolean;
  } | null>(null);

  const [loadingConfig, setLoadingConfig] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Consulta as informações da tabela desafios_config
  const loadConfig = async () => {
    setLoadingConfig(true);
    try {
      const { data, error } = await supabase
        .from("desafios_config")
        .select("*")
        .single();

      if (!error && data) {
        setCurrentConfig(data);
      } else {
        // Fallback: busca qualquer registro ativo ou cria um se não existir
        const { data: listData } = await supabase
          .from("desafios_config")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);

        if (listData && listData.length > 0) {
          setCurrentConfig(listData[0]);
        }
      }
    } catch (err: any) {
      console.warn("Aviso ao carregar desafios_config no módulo de gestão:", err);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Por favor, selecione um ficheiro de imagem válido (JPG, PNG ou WEBP).");
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleClearSelected = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload da foto para o bucket desafios e atualização da tabela desafios_config
  const handleUpdatePrizePhoto = async () => {
    if (!selectedFile) {
      setErrorMessage("Por favor, selecione uma imagem para a premiação.");
      return;
    }

    setUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const fileExt = selectedFile.name.split(".").pop() || "jpg";
      const fileName = `premiacao_${Date.now()}.${fileExt}`;

      // 1. Upload da foto para o bucket 'desafios' no Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("desafios")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Erro no upload do bucket desafios:", uploadError);
        throw new Error(`Falha no upload do ficheiro: ${uploadError.message}`);
      }

      // 2. Resgata a URL pública gerada
      const {
        data: { publicUrl },
      } = supabase.storage.from("desafios").getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error("Não foi possível gerar a URL pública da imagem.");
      }

      // 3. Atualiza a tabela desafios_config
      const { data: updateData, error: updateError } = await supabase
        .from("desafios_config")
        .update({
          foto_premiacao_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("ativo", true)
        .select();

      if (updateError) {
        console.error("Erro ao atualizar desafios_config:", updateError);
        throw new Error(`Falha ao registrar URL no banco: ${updateError.message}`);
      }

      // Se nenhum registro estava com ativo = true, faz o insert para garantir a persistência
      if (!updateData || updateData.length === 0) {
        const { error: insertError } = await supabase.from("desafios_config").insert({
          foto_premiacao_url: publicUrl,
          ativo: true,
          titulo: currentConfig?.titulo || "Desafio Oficial Vyra - 12 Semanas",
          subtitulo: currentConfig?.subtitulo || "Supere seus limites e conquiste a premiação",
          premiacao: currentConfig?.premiacao || "Troféu Oficial Vyra + Suplementação Completa",
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          console.warn("Aviso ao inserir desafios_config:", insertError);
        }
      }

      // 4. Notificação visual de sucesso e atualização de estado
      setCurrentConfig((prev) => ({
        ...prev,
        foto_premiacao_url: publicUrl,
      }));
      setSuccessMessage("Foto da premiação atualizada com sucesso no Supabase!");
      handleClearSelected();
      onSuccess?.(publicUrl);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error("Erro ao salvar foto da premiação:", err);
      setErrorMessage(err.message || "Ocorreu um erro ao atualizar a foto da premiação.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      id="modulo-gestao-premiacao-desafio"
      className={`p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-5 shadow-2xl relative overflow-hidden ${className}`}
    >
      {/* Decorative gradient glow */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#D8B46A]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2B2B2F] relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#D8B46A] bg-[#D8B46A]/10 border border-[#D8B46A]/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              Gestão de Premiação do Desafio
            </span>
            <span className="text-[10px] font-bold text-[#9B9BA1] bg-[#1D1D1F] px-2 py-0.5 rounded-full">
              Tabela desafios_config · Bucket desafios
            </span>
          </div>
          <h3 className="text-lg font-black text-[#F5F5F7] tracking-tight mt-1.5 flex items-center gap-2">
            <span>Foto de Premiação Oficial do Desafio</span>
          </h3>
          <p className="text-xs text-[#9B9BA1] mt-0.5 max-w-xl">
            Faça upload da fotografia oficial do prémio (troféu, suplementação ou kit). A imagem será exibida em destaque para todos os alunos no ecrã de Desafios.
          </p>
        </div>

        <button
          type="button"
          onClick={loadConfig}
          disabled={loadingConfig}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-bold text-[#9B9BA1] hover:text-[#F5F5F7] transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingConfig ? "animate-spin text-[#D8B46A]" : ""}`} />
          <span>Recarregar</span>
        </button>
      </div>

      {/* Notificações visuais */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-[#34C759]/15 border border-[#34C759]/40 text-[#34C759] flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div className="text-xs font-bold">{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FF3B30]/15 border border-[#FF3B30]/40 text-[#FF3B30] flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-xs font-bold">{errorMessage}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* Lado Esquerdo: Foto Atual no Supabase */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-[#F5F5F7] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D8B46A]" />
              Foto Atual Salva no Banco:
            </span>
            {currentConfig?.foto_premiacao_url ? (
              <span className="text-[10px] font-bold text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded-full">
                Foto Ativa
              </span>
            ) : (
              <span className="text-[10px] font-bold text-[#9B9BA1] bg-[#1D1D1F] px-2 py-0.5 rounded-full">
                Sem foto (Placeholder Ativo)
              </span>
            )}
          </label>

          <div className="h-56 w-full rounded-2xl bg-[#121214] border border-[#2B2B2F] overflow-hidden flex items-center justify-center relative group">
            {currentConfig?.foto_premiacao_url ? (
              <>
                <img
                  src={currentConfig.foto_premiacao_url}
                  alt="Foto de Premiação Atual"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <span className="text-[10px] font-black uppercase text-[#D8B46A] tracking-wider block">
                    Premiação em Exibição
                  </span>
                  <p className="text-xs font-bold text-[#F5F5F7] truncate">
                    {currentConfig.premiacao || "Troféu Oficial Vyra"}
                  </p>
                </div>
                <a
                  href={currentConfig.foto_premiacao_url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 text-[#F5F5F7] hover:text-[#D8B46A] transition-colors"
                  title="Abrir imagem em nova guia"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </>
            ) : (
              <div className="text-center p-6 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-center mx-auto text-[#9B9BA1]">
                  <Trophy className="w-6 h-6 text-[#D8B46A]" />
                </div>
                <p className="text-xs font-bold text-[#F5F5F7]">Prémio a ser anunciado em breve</p>
                <p className="text-[11px] text-[#9B9BA1] max-w-xs">
                  Os alunos estão a ver o placeholder padrão com o ícone de troféu.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Seleção e Pré-visualização da Nova Imagem */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-[#F5F5F7] flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-[#D8B46A]" />
            Nova Imagem Local (JPG / PNG):
          </label>

          {previewUrl ? (
            <div className="space-y-3">
              <div className="h-56 w-full rounded-2xl bg-[#121214] border-2 border-dashed border-[#D8B46A] overflow-hidden flex items-center justify-center relative group">
                <img
                  src={previewUrl}
                  alt="Pré-visualização da Nova Foto"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleClearSelected}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF3B30] text-white text-xs font-bold shadow-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Remover Seleção</span>
                  </button>
                </div>
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#D8B46A] text-black text-[10px] font-black uppercase">
                  Pré-visualização Pronta
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-[#9B9BA1] truncate">
                  Ficheiro: <span className="text-[#F5F5F7] font-semibold">{selectedFile?.name}</span>
                </span>
                <button
                  type="button"
                  id="btn-atualizar-foto-premio"
                  onClick={handleUpdatePrizePhoto}
                  disabled={uploading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D8B46A] text-[#0A0A0A] font-black text-xs hover:bg-[#c4a159] transition-all cursor-pointer shadow-lg shadow-[#D8B46A]/20 disabled:opacity-50 shrink-0"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>A enviar para Supabase...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Atualizar Foto do Prémio</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="h-56 w-full rounded-2xl bg-[#121214] border-2 border-dashed border-[#2B2B2F] hover:border-[#D8B46A] transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="input-foto-premiacao"
              />
              <div className="w-12 h-12 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] group-hover:border-[#D8B46A] flex items-center justify-center text-[#9B9BA1] group-hover:text-[#D8B46A] transition-colors mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-[#F5F5F7] group-hover:text-[#D8B46A] transition-colors">
                Clique para selecionar a foto do prêmio
              </p>
              <p className="text-[11px] text-[#9B9BA1] mt-1">
                Formatos aceitos: JPG, PNG ou WEBP (alta resolução recomendada)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
