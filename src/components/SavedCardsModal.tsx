import React, { useState, useEffect } from "react";
import {
  SavedCreditCard,
} from "../types";
import {
  getSavedCreditCards,
  saveCreditCard,
  removeCreditCard,
  setDefaultCreditCard,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  validateCard,
} from "../lib/creditCards";
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  ShieldCheck,
  X,
  Lock,
  Star,
  Check,
  AlertCircle,
} from "lucide-react";

interface SavedCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard?: (card: SavedCreditCard) => void;
}

export const SavedCardsModal: React.FC<SavedCardsModalProps> = ({
  isOpen,
  onClose,
  onSelectCard,
}) => {
  const [cards, setCards] = useState<SavedCreditCard[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New card form state
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCards(getSavedCreditCards());
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsAddingNew(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentBrand = detectCardBrand(cardNumber);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    setErrorMessage(null);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    setExpiry(formatted);
    setErrorMessage(null);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvv(digits);
    setErrorMessage(null);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validateCard(cardNumber, cardholderName, expiry, cvv);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Dados do cartão incorretos.");
      return;
    }

    setSaving(true);
    setTimeout(() => {
      const saved = saveCreditCard({
        cardholderName,
        rawNumber: cardNumber,
        expiry,
        isDefault,
      });

      setCards(getSavedCreditCards());
      setSaving(false);
      setSuccessMessage("Cartão salvo com sucesso e pronto para uso!");
      setIsAddingNew(false);

      // Reset form
      setCardholderName("");
      setCardNumber("");
      setExpiry("");
      setCvv("");
      setIsDefault(false);

      if (onSelectCard) {
        onSelectCard(saved);
      }
    }, 600);
  };

  const handleRemove = (cardId: string) => {
    if (confirm("Tem certeza que deseja remover este cartão?")) {
      const updated = removeCreditCard(cardId);
      setCards(updated);
    }
  };

  const handleSetDefault = (cardId: string) => {
    const updated = setDefaultCreditCard(cardId);
    setCards(updated);
  };

  const getBrandBadge = (brand: SavedCreditCard["brand"]) => {
    switch (brand) {
      case "mastercard":
        return (
          <div className="flex items-center -space-x-1.5">
            <div className="w-4 h-4 rounded-full bg-[#EB001B] opacity-90" />
            <div className="w-4 h-4 rounded-full bg-[#F79E1B] opacity-90" />
          </div>
        );
      case "visa":
        return (
          <span className="font-black italic text-sm tracking-wider text-[#1A1F71] bg-white px-1 rounded">
            VISA
          </span>
        );
      case "elo":
        return (
          <span className="font-bold text-xs bg-[#00A4E8] text-white px-1.5 py-0.5 rounded">
            ELO
          </span>
        );
      case "amex":
        return (
          <span className="font-bold text-xs bg-[#2E77BC] text-white px-1.5 py-0.5 rounded">
            AMEX
          </span>
        );
      default:
        return <CreditCard className="w-4 h-4 text-[#9B9BA1]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-[#151515] border border-[#2B2B2F] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#2B2B2F] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6A2A]/10 border border-[#FF6A2A]/30 flex items-center justify-center text-[#FF6A2A]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F5F5F7]">
                Formas de Pagamento & Cartões
              </h2>
              <p className="text-xs text-[#9B9BA1]">
                Gerencie seus cartões para assinaturas e renovações automáticas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1D1D1F] border border-[#2B2B2F] text-[#9B9BA1] hover:text-[#F5F5F7] flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/30 text-[#34C759] text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* List of Saved Cards */}
          {!isAddingNew && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
                  Cartões Cadastrados ({cards.length})
                </span>
                <button
                  id="add-new-card-btn"
                  onClick={() => {
                    setIsAddingNew(true);
                    setSuccessMessage(null);
                    setErrorMessage(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#FF6A2A]/10 hover:bg-[#FF6A2A]/20 border border-[#FF6A2A]/40 text-[#FF6A2A] text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Cartão</span>
                </button>
              </div>

              {cards.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#1D1D1F] border border-dashed border-[#2B2B2F] space-y-3">
                  <CreditCard className="w-8 h-8 text-[#9B9BA1] mx-auto opacity-50" />
                  <p className="text-sm font-semibold text-[#F5F5F7]">
                    Nenhum cartão cadastrado ainda
                  </p>
                  <p className="text-xs text-[#9B9BA1] max-w-xs mx-auto">
                    Adicione um cartão de crédito para ativar protocolos e renovar suas assinaturas com 1 clique.
                  </p>
                  <button
                    onClick={() => setIsAddingNew(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white font-bold text-xs"
                  >
                    Cadastrar Meu Primeiro Cartão
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        card.isDefault
                          ? "bg-gradient-to-br from-[#1E1B18] to-[#151515] border-[#FF6A2A]/50 shadow-lg shadow-[#FF6A2A]/5"
                          : "bg-[#1D1D1F] border-[#2B2B2F] hover:border-[#3D3D42]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#2B2B2F]/60 flex items-center justify-center">
                            {getBrandBadge(card.brand)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-[#F5F5F7]">
                                {card.brand.toUpperCase()} {card.cardNumberMasked}
                              </span>
                              {card.isDefault && (
                                <span className="px-2 py-0.5 rounded-full bg-[#FF6A2A]/20 text-[#FF6A2A] border border-[#FF6A2A]/40 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  Principal
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[#9B9BA1] mt-0.5">
                              <span>Titular: <strong className="text-[#E0E0E2]">{card.cardholderName}</strong></span>
                              <span>•</span>
                              <span>Exp: {card.expiryMonth}/{card.expiryYear}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!card.isDefault && (
                            <button
                              onClick={() => handleSetDefault(card.id)}
                              title="Definir como cartão principal"
                              className="px-2.5 py-1.5 rounded-lg bg-[#2B2B2F] hover:bg-[#3B3B42] text-[11px] font-semibold text-[#F5F5F7] transition-all"
                            >
                              Tornar Principal
                            </button>
                          )}
                          <button
                            onClick={() => handleRemove(card.id)}
                            title="Remover cartão"
                            className="p-2 rounded-lg text-[#9B9BA1] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Form to Add New Card */}
          {isAddingNew && (
            <form onSubmit={handleSaveCard} className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#2B2B2F]">
                <h3 className="text-xs font-bold text-[#FF9A62] uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Cadastrar Novo Cartão de Crédito
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-[#9B9BA1] hover:text-[#F5F5F7]"
                >
                  Cancelar
                </button>
              </div>

              {/* Dynamic Virtual Card Preview */}
              <div className="w-full h-44 rounded-2xl p-5 relative overflow-hidden bg-gradient-to-br from-[#2D241E] via-[#1A1817] to-[#0D0D0E] border border-[#FF6A2A]/40 shadow-xl flex flex-col justify-between text-white">
                <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-[#FF6A2A]/10 blur-xl pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-6 rounded bg-amber-400/80 flex items-center justify-center">
                      <div className="w-5 h-4 border border-amber-800/40 rounded-sm" />
                    </div>
                    <span className="text-[10px] tracking-widest text-[#9B9BA1] font-mono">
                      VYRA PLATINUM
                    </span>
                  </div>
                  <div>{getBrandBadge(currentBrand)}</div>
                </div>

                <div className="relative z-10 font-mono tracking-widest text-lg sm:text-xl font-bold text-white drop-shadow">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>

                <div className="flex items-end justify-between relative z-10">
                  <div>
                    <span className="text-[9px] text-[#9B9BA1] uppercase block font-sans">
                      Titular do Cartão
                    </span>
                    <span className="text-xs font-bold tracking-wider font-mono truncate max-w-[180px] block">
                      {cardholderName || "NOME DO TITULAR"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-[#9B9BA1] uppercase block font-sans">
                      Validade
                    </span>
                    <span className="text-xs font-bold font-mono">
                      {expiry || "MM/AA"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                    Número do Cartão
                  </label>
                  <div className="relative">
                    <input
                      id="card-number-input"
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-mono text-sm focus:outline-none focus:border-[#FF6A2A]"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {getBrandBadge(currentBrand)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                    Nome Completo do Titular
                  </label>
                  <input
                    id="card-name-input"
                    type="text"
                    required
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                    placeholder="Ex: RAFAEL M SILVA"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm uppercase focus:outline-none focus:border-[#FF6A2A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                      Validade (MM/AA)
                    </label>
                    <input
                      id="card-expiry-input"
                      type="text"
                      required
                      value={expiry}
                      onChange={handleExpiryChange}
                      placeholder="12/28"
                      maxLength={5}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-mono text-sm focus:outline-none focus:border-[#FF6A2A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                      Código de Segurança (CVV)
                    </label>
                    <div className="relative">
                      <input
                        id="card-cvv-input"
                        type="password"
                        required
                        value={cvv}
                        onChange={handleCvvChange}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-mono text-sm focus:outline-none focus:border-[#FF6A2A]"
                      />
                      <Lock className="w-3.5 h-3.5 text-[#9B9BA1] absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-[#FF6A2A] focus:ring-0 bg-[#1D1D1F] border-[#2B2B2F]"
                  />
                  <span className="text-xs text-[#E0E0E2] font-medium">
                    Definir como cartão principal para renovações
                  </span>
                </label>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-[#FF453A]/10 border border-[#FF453A]/30 text-[#FF453A] text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="flex-1 py-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-bold text-[#9B9BA1] hover:text-[#F5F5F7]"
                  >
                    Voltar
                  </button>
                  <button
                    id="save-card-submit-btn"
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white text-xs font-bold shadow-lg shadow-[#FF6A2A]/20 hover:brightness-110 flex items-center justify-center gap-2 transition-all"
                  >
                    {saving ? (
                      <span>Validando e Salvando...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Salvar Cartão</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Security Notice */}
          <div className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-[#34C759] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#9B9BA1] leading-relaxed">
              <strong className="text-[#F5F5F7] font-semibold">Criptografia PCI-DSS Nível 1:</strong> Seus dados de pagamento são protegidos por criptografia de ponta a ponta e tokenizados diretamente pelo gateway seguro da Stripe.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
