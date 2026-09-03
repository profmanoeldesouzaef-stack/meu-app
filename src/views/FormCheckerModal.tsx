import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Camera,
  Play,
  Check,
} from "lucide-react";

interface FormCheckerModalProps {
  initialExercise?: string;
  onClose: () => void;
}

const EXERCISES_LIST = [
  "Supino Reto com Barra",
  "Agachamento Livre",
  "Levantamento Terra",
  "Elevação Lateral com Halteres",
  "Puxada Alta Pronada",
  "Rosca Direta Barra W",
];

const DEFAULT_CHECKLIST: Record<string, string[]> = {
  "Supino Reto com Barra": [
    "Retração e depressão escapular ativas",
    "Pés firmes no solo (Leg drive)",
    "Trajetória da barra até o terço inferior do esterno",
    "Cotovelos em ângulo de ~75° (sem abertura excessiva)",
  ],
  "Agachamento Livre": [
    "Pés alinhados na largura dos ombros",
    "Pressão intra-abdominal (Bracing)",
    "Joelhos alinhados com a ponta dos pés",
    "Profundidade abaixo do paralelo (90°)",
  ],
  "Levantamento Terra": [
    "Coluna neutra durante todo o levantamento",
    "Barra rente às tíbias e coxas",
    "Extensão simultânea de joelhos e quadril",
    "Encaixe escapular sem hiperextensão lombar no topo",
  ],
  "Elevação Lateral com Halteres": [
    "Leve flexão de cotovelos",
    "Movimento no plano escapular (30° à frente)",
    "Controle na descida excêntrica",
    "Sem elevação excessiva dos trapézios",
  ],
};

export const FormCheckerModal: React.FC<FormCheckerModalProps> = ({
  initialExercise = "Supino Reto com Barra",
  onClose,
}) => {
  const { t, lang } = useApp();
  const [exercise, setExercise] = useState(initialExercise);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    "Retração e depressão escapular ativas": true,
    "Pés firmes no solo (Leg drive)": true,
    "Trajetória da barra até o terço inferior do esterno": true,
    "Cotovelos em ângulo de ~75° (sem abertura excessiva)": false,
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    verdict: string;
    tips: string[];
  } | null>(null);

  const currentChecklist = DEFAULT_CHECKLIST[exercise] || [
    "Postura e alinhamento articular correto",
    "Controle da fase excêntrica",
    "Amplitude completa de movimento",
    "Estabilidade do core",
  ];

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    setResult(null);
    try {
      const activeChecklist = Object.keys(checkedItems).filter((k) => checkedItems[k]);
      const res = await api.formChecker(exercise, activeChecklist);
      setResult({
        score: res.score,
        verdict: lang === "pt" ? res.verdict_pt : res.verdict_en,
        tips: lang === "pt" ? res.tips_pt : res.tips_en,
      });
    } catch (e) {
      console.error("Form checker error:", e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-[#151515] border border-[#2B2B2F] p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6A2A] to-[#D8B46A] text-[#0A0A0A] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#F5F5F7] tracking-tight">
                {t("form.title")}
              </h3>
              <p className="text-xs text-[#9B9BA1]">{t("form.desc")}</p>
            </div>
          </div>

          <button
            id="close-form-checker-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Exercise Selector */}
        <div>
          <label className="block text-xs font-bold text-[#9B9BA1] uppercase tracking-wider mb-1.5">
            Exercício a ser analisado
          </label>
          <select
            id="form-checker-exercise-select"
            value={exercise}
            onChange={(e) => {
              setExercise(e.target.value);
              setCheckedItems({});
              setResult(null);
            }}
            className="w-full px-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold text-sm focus:outline-none focus:border-[#FF6A2A]"
          >
            {EXERCISES_LIST.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        </div>

        {/* Camera / Pose Detection Simulation Viewport */}
        <div className="rounded-2xl bg-[#0A0A0A] border border-[#2B2B2F] p-4 relative overflow-hidden min-h-[170px] flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#1D1D1F] text-[#FF6A2A] flex items-center justify-center border border-[#2B2B2F]">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#F5F5F7]">Visão Computacional & Biomecânica</p>
            <p className="text-[11px] text-[#9B9BA1]">
              A IA mapeia os ângulos articulares do ombro, cotovelo, quadril e joelho.
            </p>
          </div>
          <span className="text-[10px] font-bold text-[#34C759] bg-[#34C759]/15 px-2.5 py-0.5 rounded-full border border-[#34C759]/30">
            Sensor Biomecânico Ativo
          </span>
        </div>

        {/* Checklist */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
            {t("form.checklist")}
          </h4>

          <div className="space-y-2">
            {currentChecklist.map((item, idx) => {
              const isChecked = Boolean(checkedItems[item]);

              return (
                <div
                  key={idx}
                  id={`checklist-item-${idx}`}
                  onClick={() => toggleCheck(item)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isChecked
                      ? "bg-[#1D1D1F] border-[#34C759]/40 text-[#F5F5F7]"
                      : "bg-[#151515] border-[#2B2B2F] text-[#9B9BA1]"
                  }`}
                >
                  <span className="text-xs font-semibold">{item}</span>
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isChecked ? "bg-[#34C759] text-[#0A0A0A]" : "border border-[#2B2B2F]"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Run Analysis CTA */}
        <button
          id="run-form-analysis-btn"
          onClick={runAnalysis}
          disabled={analyzing}
          className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#FF6A2A] to-[#D8B46A] text-[#0A0A0A] hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6A2A]/20"
        >
          {analyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
              <span>Processando biomecânica com IA...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>{t("form.run")}</span>
            </>
          )}
        </button>

        {/* Analysis Result Display */}
        {result && (
          <div className="p-5 rounded-2xl bg-[#1D1D1F] border border-[#D8B46A]/50 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-[#D8B46A] tracking-wider">
                  {t("form.result")}
                </span>
                <h4 className="text-base font-bold text-[#F5F5F7] mt-0.5">{result.verdict}</h4>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#9B9BA1] block">{t("form.score")}</span>
                <span className="text-2xl font-black text-[#34C759]">{result.score}/100</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#2B2B2F] space-y-2">
              <span className="text-xs font-bold text-[#D8B46A]">
                Correções & Dicas Biomecânicas:
              </span>
              {result.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-[#F5F5F7]">
                  <span className="text-[#FF6A2A] font-bold">0{idx + 1}.</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
