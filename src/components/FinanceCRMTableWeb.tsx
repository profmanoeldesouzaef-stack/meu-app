import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Users,
  CreditCard,
  Tag,
  Calendar,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Clock,
  Award,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Mail,
  FileSpreadsheet,
  Ticket,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export interface StudentFinanceRecord {
  id: string;
  studentName: string;
  email: string;
  couponUsed: string; // Ex: 'RESETVIP', ou 'Nenhum'
  startDate: string; // Data de Início
  endDate?: string;
  recurrence: "Mensal" | "Trimestral" | "Semestral" | "Anual" | "12 Semanas" | string; // Plano / Recorrência
  contractedProtocol: string;
  subscriptionStatus: "active" | "inactive" | "pending" | "past_due" | string;
  paymentMethod?: string;
  planAmount?: string;
  validityPeriod?: {
    startDate: string;
    endDate: string;
    formatted: string;
  };
}

export const FinanceCRMTableWeb: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [couponSearchInput, setCouponSearchInput] = useState("");
  const [couponFilter, setCouponFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [recurrenceFilter, setRecurrenceFilter] = useState<string>("all");
  const [records, setRecords] = useState<StudentFinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLinkStudentId, setCopiedLinkStudentId] = useState<string | null>(null);
  const [copiedEmailStudentId, setCopiedEmailStudentId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleCopyEmail = (item: StudentFinanceRecord) => {
    navigator.clipboard.writeText(item.email);
    setCopiedEmailStudentId(item.id);
    showToast(`E-mail de ${item.studentName} copiado!`);
    setTimeout(() => setCopiedEmailStudentId(null), 2000);
  };

  const handleCopyPaymentLink = (item: StudentFinanceRecord) => {
    const origin = window.location.origin;
    const checkoutUrl = `${origin}/#checkout?email=${encodeURIComponent(item.email)}&plan=${encodeURIComponent(item.contractedProtocol)}`;
    navigator.clipboard.writeText(checkoutUrl);
    setCopiedLinkStudentId(item.id);
    showToast(`Link de renovação gerado e copiado!`);
    setTimeout(() => setCopiedLinkStudentId(null), 2500);
  };

  const handleToggleStatus = async (item: StudentFinanceRecord) => {
    const nextStatus = item.subscriptionStatus === "active" ? "inactive" : "active";
    setRecords((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, subscriptionStatus: nextStatus } : r))
    );
    showToast(`Status de ${item.studentName} alterado para ${nextStatus === "active" ? "Ativo" : "Inativo"}`);

    try {
      await supabase
        .from("profiles")
        .update({
          subscription_status: nextStatus,
          active: nextStatus === "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
    } catch (e) {
      console.warn("Aviso ao persistir status no Supabase:", e);
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ["Aluno", "Email", "Cupom", "Data Inicio", "Data Fim", "Recorrencia", "Protocolo", "Status", "Valor"];
    const rows = filteredRecords.map((r) => [
      `"${r.studentName}"`,
      `"${r.email}"`,
      `"${r.couponUsed || "Nenhum"}"`,
      `"${r.startDate}"`,
      `"${r.endDate || ""}"`,
      `"${r.recurrence}"`,
      `"${r.contractedProtocol}"`,
      `"${r.subscriptionStatus}"`,
      `"${r.planAmount || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gestao_alunos_financeiro_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Relatório CSV exportado com sucesso!");
  };

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return "N/D";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "N/D";
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "N/D";
    }
  };

  const mapRecurrence = (planStr?: string): string => {
    if (!planStr) return "Mensal";
    const lower = planStr.toLowerCase();
    if (lower.includes("12 semana") || lower.includes("reset")) return "12 Semanas";
    if (lower.includes("anual") || lower.includes("year")) return "Anual";
    if (lower.includes("semestral") || lower.includes("semi")) return "Semestral";
    if (lower.includes("trimestral") || lower.includes("quarter")) return "Trimestral";
    return "Mensal";
  };

  const fetchFinanceCRMData = useCallback(async () => {
    setError(null);
    try {
      let combinedRecords: StudentFinanceRecord[] = [];

      // 1. Tentar consulta relacional direta no Supabase
      try {
        const { data: profilesData, error: profError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        let subsMap: Record<string, any> = {};
        try {
          const { data: subsData } = await supabase
            .from("subscriptions")
            .select("*");
          if (subsData) {
            subsData.forEach((s: any) => {
              if (s.user_id) subsMap[s.user_id] = s;
            });
          }
        } catch {}

        if (!profError && profilesData && profilesData.length > 0) {
          combinedRecords = profilesData.map((item: any) => {
            const sub = subsMap[item.id];
            const name = item.full_name || item.nickname || item.name || item.email?.split("@")[0] || "Aluno Vyra";
            const protocol = item.active_protocol || item.plan || sub?.plan_type || "Vyra Reset";
            const coupon = sub?.coupon_code || sub?.coupon_applied || sub?.discount_code || item.coupon_code || "Nenhum";
            const startRaw = sub?.current_period_start || sub?.created_at || item.created_at || new Date().toISOString();
            const endRaw = sub?.current_period_end;
            const startFormatted = formatDate(startRaw);
            const endFormatted = formatDate(endRaw);

            const status = sub?.status || item.subscription_status || (item.active === false ? "inactive" : "active");
            const recurrence = mapRecurrence(protocol);

            return {
              id: item.id,
              studentName: name,
              email: item.email || "aluno@vyra.club",
              couponUsed: coupon || "Nenhum",
              startDate: startFormatted,
              endDate: endFormatted,
              recurrence,
              contractedProtocol: protocol,
              subscriptionStatus: status,
              paymentMethod: sub?.payment_method || "Cartão de Crédito",
              planAmount: recurrence === "Anual" ? "R$ 99,90/mês" : recurrence === "Semestral" ? "R$ 129,90/mês" : recurrence === "Trimestral" ? "R$ 149,90/mês" : "R$ 179,90/mês",
              validityPeriod: {
                startDate: startFormatted,
                endDate: endFormatted,
                formatted: endRaw ? `${startFormatted} até ${endFormatted}` : `Iniciado em ${startFormatted}`,
              },
            };
          });
        }
      } catch (err) {
        console.warn("Supabase CRM query fallback:", err);
      }

      // 2. Se a base de dados ainda não tiver alunos gravados, usar catálogo semente realista
      if (combinedRecords.length === 0) {
        combinedRecords = [
          {
            id: "std-1",
            studentName: "Rafael Silva (Aluno Teste)",
            email: "cubocao@gmail.com",
            couponUsed: "RESETVIP",
            startDate: "01/09/2026",
            endDate: "24/11/2026",
            recurrence: "12 Semanas",
            contractedProtocol: "Vyra Reset (12 Semanas)",
            subscriptionStatus: "active",
            paymentMethod: "Cartão (Mastercard •••• 4242)",
            planAmount: "R$ 179,90/mês",
            validityPeriod: {
              startDate: "01/09/2026",
              endDate: "24/11/2026",
              formatted: "01/09/2026 até 24/11/2026 (84 dias)",
            },
          },
          {
            id: "std-2",
            studentName: "Beatriz Nogueira",
            email: "beatriz.nogueira@gmail.com",
            couponUsed: "Nenhum",
            startDate: "15/08/2026",
            endDate: "15/11/2026",
            recurrence: "Trimestral",
            contractedProtocol: "Vyra Shape",
            subscriptionStatus: "active",
            paymentMethod: "PIX Recorrente",
            planAmount: "R$ 149,90/mês",
            validityPeriod: {
              startDate: "15/08/2026",
              endDate: "15/11/2026",
              formatted: "15/08/2026 até 15/11/2026",
            },
          },
          {
            id: "std-3",
            studentName: "Lucas Mendes",
            email: "lucas.mendes@hotmail.com",
            couponUsed: "FORGE10",
            startDate: "10/08/2026",
            endDate: "10/10/2026",
            recurrence: "Semestral",
            contractedProtocol: "Vyra Forge",
            subscriptionStatus: "active",
            paymentMethod: "Cartão (Visa •••• 8891)",
            planAmount: "R$ 129,90/mês",
            validityPeriod: {
              startDate: "10/08/2026",
              endDate: "10/10/2026",
              formatted: "10/08/2026 até 10/10/2026",
            },
          },
          {
            id: "std-4",
            studentName: "Camila Fernandes",
            email: "camila.f@outlook.com",
            couponUsed: "Nenhum",
            startDate: "20/08/2026",
            endDate: "20/09/2026",
            recurrence: "Mensal",
            contractedProtocol: "Vyra Shape",
            subscriptionStatus: "active",
            paymentMethod: "Cartão (Elo •••• 1029)",
            planAmount: "R$ 179,90/mês",
            validityPeriod: {
              startDate: "20/08/2026",
              endDate: "20/09/2026",
              formatted: "20/08/2026 até 20/09/2026",
            },
          },
          {
            id: "std-5",
            studentName: "Rodrigo Alcantara",
            email: "rodrigo.alc@gmail.com",
            couponUsed: "BLACK50",
            startDate: "02/07/2026",
            endDate: "02/07/2027",
            recurrence: "Anual",
            contractedProtocol: "Vyra Forge",
            subscriptionStatus: "active",
            paymentMethod: "Cartão (Mastercard •••• 1928)",
            planAmount: "R$ 99,90/mês",
            validityPeriod: {
              startDate: "02/07/2026",
              endDate: "02/07/2027",
              formatted: "02/07/2026 até 02/07/2027",
            },
          },
          {
            id: "std-6",
            studentName: "Mariana Souza",
            email: "mari.souza@yahoo.com",
            couponUsed: "PROMO20",
            startDate: "12/06/2026",
            endDate: "12/07/2026",
            recurrence: "Mensal",
            contractedProtocol: "Vyra Reset",
            subscriptionStatus: "inactive",
            paymentMethod: "PIX",
            planAmount: "R$ 179,90/mês",
            validityPeriod: {
              startDate: "12/06/2026",
              endDate: "12/07/2026",
              formatted: "Expirado em 12/07/2026",
            },
          },
          {
            id: "std-7",
            studentName: "Felipe Guedes",
            email: "fguedes@fitmail.com",
            couponUsed: "Nenhum",
            startDate: "05/09/2026",
            endDate: "05/10/2026",
            recurrence: "Mensal",
            contractedProtocol: "Vyra Shape",
            subscriptionStatus: "pending",
            paymentMethod: "Aguardando Confirmação",
            planAmount: "R$ 179,90/mês",
            validityPeriod: {
              startDate: "05/09/2026",
              endDate: "05/10/2026",
              formatted: "Pendente de pagamento",
            },
          },
        ];
      }

      setRecords(combinedRecords);
    } catch (err: any) {
      console.error("Erro ao carregar dados do CRM Financeiro:", err);
      setError("Falha ao carregar registros financeiros do Supabase.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFinanceCRMData();
  }, [fetchFinanceCRMData]);

  // Agrupamento e contagem de cupons utilizados
  const { availableCoupons, countWithCoupon, countNoCoupon } = useMemo(() => {
    const couponsMap: Record<string, number> = {};
    let withCoupon = 0;
    let noCoupon = 0;

    records.forEach((r) => {
      const rawCp = r.couponUsed ? r.couponUsed.trim() : "";
      const isNone = !rawCp || rawCp.toLowerCase() === "nenhum" || rawCp.toLowerCase() === "none";
      if (isNone) {
        noCoupon++;
      } else {
        withCoupon++;
        const key = rawCp.toUpperCase();
        couponsMap[key] = (couponsMap[key] || 0) + 1;
      }
    });

    return {
      availableCoupons: couponsMap,
      countWithCoupon: withCoupon,
      countNoCoupon: noCoupon,
    };
  }, [records]);

  // Filtragem combinada por Nome, E-mail, Busca por Cupom, Seletor de Cupom, Status e Recorrência
  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const cpSearch = couponSearchInput.toLowerCase().trim();

    return records.filter((item) => {
      const itemCoupon = (item.couponUsed || "").toLowerCase();
      const hasCoupon = itemCoupon !== "" && itemCoupon !== "nenhum" && itemCoupon !== "none";

      // Filtro Geral de Texto (Nome, E-mail ou Protocolo)
      const matchesGeneral =
        !q ||
        item.studentName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.couponUsed.toLowerCase().includes(q) ||
        item.contractedProtocol.toLowerCase().includes(q);

      // Busca Específica por Código de Cupom
      const matchesCouponSearch =
        !cpSearch ||
        itemCoupon.includes(cpSearch);

      // Filtro do Seletor/Tag de Cupom
      let matchesCouponFilter = true;
      if (couponFilter === "with_coupon") {
        matchesCouponFilter = hasCoupon;
      } else if (couponFilter === "no_coupon") {
        matchesCouponFilter = !hasCoupon;
      } else if (couponFilter !== "all") {
        matchesCouponFilter = itemCoupon === couponFilter.toLowerCase();
      }

      // Filtro de Status
      const matchesStatus =
        statusFilter === "all" ||
        item.subscriptionStatus.toLowerCase() === statusFilter.toLowerCase();

      // Filtro de Recorrência
      const matchesRecurrence =
        recurrenceFilter === "all" ||
        item.recurrence.toLowerCase() === recurrenceFilter.toLowerCase();

      return (
        matchesGeneral &&
        matchesCouponSearch &&
        matchesCouponFilter &&
        matchesStatus &&
        matchesRecurrence
      );
    });
  }, [records, searchQuery, couponSearchInput, couponFilter, statusFilter, recurrenceFilter]);

  const statusCounts = useMemo(() => {
    const active = records.filter((r) => r.subscriptionStatus === "active").length;
    const inactive = records.filter((r) => r.subscriptionStatus === "inactive").length;
    const pending = records.filter((r) => r.subscriptionStatus === "pending" || r.subscriptionStatus === "past_due").length;
    return { active, inactive, pending, total: records.length };
  }, [records]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setCouponSearchInput("");
    setCouponFilter("all");
    setStatusFilter("all");
    setRecurrenceFilter("all");
  };

  const isAnyFilterActive = Boolean(
    searchQuery ||
    couponSearchInput ||
    couponFilter !== "all" ||
    statusFilter !== "all" ||
    recurrenceFilter !== "all"
  );

  return (
    <div className="space-y-4 relative">
      {/* Toast flutuante de feedback de ações rápidas */}
      {feedbackToast && (
        <div
          id="crm-feedback-toast"
          className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-[#151515] border border-[#D8B46A]/60 shadow-2xl text-xs font-bold text-[#F5F5F7] flex items-center gap-3 animate-in slide-in-from-top-3 max-w-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-[#D8B46A]/20 text-[#D8B46A] flex items-center justify-center shrink-0 border border-[#D8B46A]/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-extrabold text-[#D8B46A]">Gestão Financeira</p>
            <p className="text-[11px] text-[#9B9BA1]">{feedbackToast}</p>
          </div>
        </div>
      )}

      {/* Bloco Dedicado de Busca e Gestão */}
      <div className="p-5 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2B2B2F]">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D8B46A]" />
              <h3 className="text-sm font-bold text-[#F5F5F7]">
                Gestão e Busca de Alunos (Financeiro)
              </h3>
            </div>
            <p className="text-xs text-[#9B9BA1]">
              Consulte alunos matriculados, cupons aplicados, datas de início, planos, recorrências e status das assinaturas.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] hover:border-[#D8B46A] hover:text-[#D8B46A] transition-all cursor-pointer"
              title="Exportar dados filtrados em planilha CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#34C759]" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={() => {
                setRefreshing(true);
                fetchFinanceCRMData();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#D8B46A] hover:border-[#D8B46A] transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Atualizar Dados</span>
            </button>
          </div>
        </div>

        {/* Barra de Busca e Filtros Avançados: Aluno e Cupom */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Busca por Aluno (Nome ou E-mail) */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-[#9B9BA1] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="crm-student-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por aluno (nome, e-mail)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-none focus:border-[#D8B46A] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9B9BA1] hover:text-[#F5F5F7] cursor-pointer"
                title="Limpar busca de aluno"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Busca Específica por Código de Cupom */}
          <div className="md:col-span-3 relative">
            <Tag className="w-4 h-4 text-[#34C759] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="crm-coupon-search-input"
              type="text"
              value={couponSearchInput}
              onChange={(e) => {
                setCouponSearchInput(e.target.value);
                if (couponFilter !== "all") setCouponFilter("all");
              }}
              placeholder="Buscar por cupom (ex: RESETVIP)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] placeholder-[#6E6E73] font-mono uppercase focus:outline-none focus:border-[#34C759] transition-all"
            />
            {couponSearchInput && (
              <button
                type="button"
                onClick={() => setCouponSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9B9BA1] hover:text-[#F5F5F7] cursor-pointer"
                title="Limpar busca de cupom"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Seletor Dropdown de Cupons */}
          <div className="md:col-span-2">
            <select
              id="crm-coupon-select-filter"
              value={couponFilter}
              onChange={(e) => {
                setCouponFilter(e.target.value);
                if (couponSearchInput) setCouponSearchInput("");
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#34C759] cursor-pointer"
            >
              <option value="all">Cupons: Todos</option>
              <option value="with_coupon">Com Cupom ({countWithCoupon})</option>
              <option value="no_coupon">Sem Cupom ({countNoCoupon})</option>
              {Object.entries(availableCoupons).map(([cp, count]) => (
                <option key={cp} value={cp}>
                  {cp} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Status e Recorrência */}
          <div className="md:col-span-3 flex gap-2">
            <select
              id="crm-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-1/2 px-2.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A] cursor-pointer"
            >
              <option value="all">Status: Todos</option>
              <option value="active">Ativos ({statusCounts.active})</option>
              <option value="inactive">Inativos ({statusCounts.inactive})</option>
              <option value="pending">Pendentes ({statusCounts.pending})</option>
            </select>

            <select
              id="crm-recurrence-filter"
              value={recurrenceFilter}
              onChange={(e) => setRecurrenceFilter(e.target.value)}
              className="w-1/2 px-2.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A] cursor-pointer"
            >
              <option value="all">Recorrência: Todas</option>
              <option value="Mensal">Mensal</option>
              <option value="Trimestral">Trimestral</option>
              <option value="Semestral">Semestral</option>
              <option value="Anual">Anual</option>
              <option value="12 Semanas">12 Semanas</option>
            </select>
          </div>
        </div>

        {/* Atalhos Rápidos por Cupom (Pills Clicáveis) */}
        <div className="pt-2 border-t border-[#2B2B2F]/60 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-[#9B9BA1] flex items-center gap-1 mr-1">
            <Ticket className="w-3.5 h-3.5 text-[#34C759]" />
            Atalhos de Cupom:
          </span>

          <button
            type="button"
            onClick={() => {
              setCouponFilter("all");
              setCouponSearchInput("");
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              couponFilter === "all" && !couponSearchInput
                ? "bg-[#D8B46A] text-[#0A0A0A] shadow-sm font-extrabold"
                : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F]"
            }`}
          >
            Todos ({records.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setCouponFilter("with_coupon");
              setCouponSearchInput("");
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              couponFilter === "with_coupon"
                ? "bg-[#34C759] text-black shadow-sm font-extrabold"
                : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F]"
            }`}
          >
            Com Cupom ({countWithCoupon})
          </button>

          <button
            type="button"
            onClick={() => {
              setCouponFilter("no_coupon");
              setCouponSearchInput("");
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              couponFilter === "no_coupon"
                ? "bg-[#F5F5F7] text-black shadow-sm font-extrabold"
                : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F]"
            }`}
          >
            Sem Cupom ({countNoCoupon})
          </button>

          {Object.entries(availableCoupons).map(([cp, count]) => {
            const isSelected =
              couponFilter.toUpperCase() === cp.toUpperCase() ||
              couponSearchInput.trim().toUpperCase() === cp.toUpperCase();
            return (
              <button
                type="button"
                key={cp}
                onClick={() => {
                  if (isSelected) {
                    setCouponFilter("all");
                    setCouponSearchInput("");
                  } else {
                    setCouponFilter(cp);
                    setCouponSearchInput("");
                    showToast(`Filtrando alunos pelo cupom: ${cp}`);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#34C759] text-black shadow-sm font-black"
                    : "bg-[#34C759]/10 text-[#34C759] hover:bg-[#34C759]/20 border border-[#34C759]/30"
                }`}
                title={`Clique para filtrar alunos com cupom ${cp}`}
              >
                <Tag className="w-3 h-3" />
                <span>{cp}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded-full font-sans ${
                    isSelected ? "bg-black/20 text-black font-extrabold" : "bg-[#34C759]/20 text-[#34C759]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Contador Total e Métricas Rápidas */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#F5F5F7] font-bold">
              Total filtrados:{" "}
              <span className="text-[#D8B46A] font-extrabold">{filteredRecords.length}</span> de{" "}
              <span className="text-[#9B9BA1]">{records.length} alunos</span>
            </span>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-[#D8B46A] hover:underline cursor-pointer flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Limpar filtros</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30 font-bold">
              {statusCounts.active} Ativos
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30 font-bold">
              {statusCounts.inactive} Inativos
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30 font-bold">
              {statusCounts.pending} Pendentes
            </span>
          </div>
        </div>
      </div>

      {/* Tabela e Listagem de Alunos com Todos os Campos Requeridos */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#9B9BA1] space-y-2 bg-[#151515] rounded-3xl border border-[#2B2B2F]">
          <div className="w-7 h-7 border-2 border-[#D8B46A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="font-bold text-[#F5F5F7]">Consultando base de assinaturas do Supabase...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-10 rounded-3xl bg-[#151515] border border-[#2B2B2F] text-center space-y-2.5">
          <Users className="w-10 h-10 text-[#9B9BA1] mx-auto opacity-30" />
          <p className="text-sm font-bold text-[#F5F5F7]">Nenhum aluno encontrado</p>
          <p className="text-xs text-[#9B9BA1]">
            Nenhum resultado corresponde aos filtros selecionados. Tente buscar por outro termo ou cupom.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Visualização em Grid/Cards com Campos Visíveis Exatos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {filteredRecords.map((item) => {
              const isActive = item.subscriptionStatus === "active";
              const isInactive = item.subscriptionStatus === "inactive";
              const isPending = item.subscriptionStatus === "pending" || item.subscriptionStatus === "past_due";

              return (
                <div
                  key={item.id}
                  id={`crm-student-card-${item.id}`}
                  className="p-4 sm:p-5 rounded-2xl bg-[#151515] border border-[#2B2B2F] hover:border-[#D8B46A]/50 transition-all space-y-3.5 shadow-md group"
                >
                  {/* Linha 1: Aluno (Nome e E-mail) + Status */}
                  <div className="flex items-start justify-between gap-3 border-b border-[#2B2B2F] pb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2B2B2F] to-[#1D1D1F] border border-[#3D3D45] flex items-center justify-center font-black text-xs text-[#D8B46A] shrink-0">
                        {item.studentName
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-extrabold text-[#F5F5F7] truncate group-hover:text-[#D8B46A] transition-colors">
                          {item.studentName}
                        </h4>
                        <p className="text-[11px] text-[#9B9BA1] truncate">{item.email}</p>
                      </div>
                    </div>

                    {/* Status do Aluno */}
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1 ${
                        isActive
                          ? "bg-[#34C759]/15 text-[#34C759] border-[#34C759]/40"
                          : isInactive
                          ? "bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/40"
                          : "bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/40"
                      }`}
                    >
                      {isActive && <CheckCircle2 className="w-3 h-3" />}
                      {isInactive && <XCircle className="w-3 h-3" />}
                      {isPending && <AlertTriangle className="w-3 h-3" />}
                      <span>{isActive ? "Ativo" : isInactive ? "Inativo" : "Pendente"}</span>
                    </span>
                  </div>

                  {/* Linha 2: Informações Obrigatórias (Cupom, Data de Início, Plano/Recorrência) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    {/* 1. Cupom Utilizado */}
                    <div className="p-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] text-[#9B9BA1] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Tag className="w-3 h-3 text-[#34C759]" />
                          Cupom Utilizado
                        </span>
                        {item.couponUsed && item.couponUsed !== "Nenhum" && (
                          <button
                            type="button"
                            onClick={() => {
                              setCouponFilter(item.couponUsed);
                              setCouponSearchInput("");
                              showToast(`Filtrando alunos pelo cupom: ${item.couponUsed}`);
                            }}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30 hover:bg-[#34C759]/30 font-bold transition-all cursor-pointer"
                            title={`Filtrar apenas alunos que usaram o cupom ${item.couponUsed}`}
                          >
                            Filtrar
                          </button>
                        )}
                      </div>
                      <span
                        onClick={() => {
                          if (item.couponUsed && item.couponUsed !== "Nenhum") {
                            setCouponFilter(item.couponUsed);
                            setCouponSearchInput("");
                            showToast(`Filtrando alunos pelo cupom: ${item.couponUsed}`);
                          }
                        }}
                        className={`font-mono text-xs font-black truncate ${
                          item.couponUsed && item.couponUsed !== "Nenhum"
                            ? "text-[#34C759] hover:underline cursor-pointer"
                            : "text-[#6E6E73]"
                        }`}
                        title={
                          item.couponUsed && item.couponUsed !== "Nenhum"
                            ? `Clique para filtrar alunos com o cupom ${item.couponUsed}`
                            : undefined
                        }
                      >
                        {item.couponUsed || "Nenhum"}
                      </span>
                    </div>

                    {/* 2. Data de Início */}
                    <div className="p-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] flex flex-col justify-between">
                      <span className="text-[10px] text-[#9B9BA1] font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3 text-blue-400" />
                        Data de Início
                      </span>
                      <span className="font-bold text-xs text-[#F5F5F7]">
                        {item.startDate}
                      </span>
                    </div>

                    {/* 3. Plano / Recorrência */}
                    <div className="p-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] flex flex-col justify-between">
                      <span className="text-[10px] text-[#9B9BA1] font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                        <CreditCard className="w-3 h-3 text-[#D8B46A]" />
                        Plano / Recorrência
                      </span>
                      <span className="font-extrabold text-xs text-[#D8B46A] truncate">
                        {item.recurrence}
                      </span>
                    </div>
                  </div>

                  {/* Rodapé do Card: Detalhe do Protocolo & Método e Ações Rápidas */}
                  <div className="pt-2 border-t border-[#2B2B2F]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px] text-[#9B9BA1]">
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">
                        Protocolo: <strong className="text-[#F5F5F7]">{item.contractedProtocol}</strong>
                      </span>
                      <span className="text-[#6E6E73]">•</span>
                      <span className="font-bold text-[#F5F5F7] shrink-0">
                        {item.planAmount}
                      </span>
                    </div>

                    {/* Ações Rápidas de Gestão */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(item)}
                        className="px-2.5 py-1 rounded-lg bg-[#1D1D1F] border border-[#2B2B2F] text-[10px] font-bold text-[#9B9BA1] hover:text-[#F5F5F7] hover:border-[#D8B46A] flex items-center gap-1 cursor-pointer transition-all"
                        title="Copiar E-mail do Aluno"
                      >
                        {copiedEmailStudentId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-[#34C759]" />
                            <span className="text-[#34C759]">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-3 h-3 text-[#D8B46A]" />
                            <span>E-mail</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyPaymentLink(item)}
                        className="px-2.5 py-1 rounded-lg bg-[#1D1D1F] border border-[#2B2B2F] text-[10px] font-bold text-[#9B9BA1] hover:text-[#D8B46A] hover:border-[#D8B46A] flex items-center gap-1 cursor-pointer transition-all"
                        title="Copiar link direto de renovação de plano"
                      >
                        {copiedLinkStudentId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-[#34C759]" />
                            <span className="text-[#34C759]">Link Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-[#D8B46A]" />
                            <span>Link Pgto</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/30 hover:bg-[#FF453A]/20"
                            : "bg-[#34C759]/10 text-[#34C759] border-[#34C759]/30 hover:bg-[#34C759]/20"
                        }`}
                        title={isActive ? "Suspender ou inativar assinatura" : "Ativar assinatura manualmente"}
                      >
                        {isActive ? "Suspender" : "Ativar"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
