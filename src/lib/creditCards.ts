import { SavedCreditCard } from "../types";

const CARDS_STORAGE_KEY = "vyra_saved_credit_cards";

// Cartões pré-configurados padrão para demonstração inicial caso ainda não haja nenhum salvo
const DEFAULT_SAVED_CARDS: SavedCreditCard[] = [
  {
    id: "card_default_1",
    cardholderName: "RAFAEL SILVA",
    cardNumberMasked: "•••• •••• •••• 4242",
    last4: "4242",
    brand: "mastercard",
    expiryMonth: "12",
    expiryYear: "28",
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
];

export function detectCardBrand(
  number: string
): SavedCreditCard["brand"] {
  const clean = number.replace(/\D/g, "");
  if (!clean) return "generic";
  if (/^4/.test(clean)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(clean)) return "mastercard";
  if (/^(4011|4389|5041|5067|5090|6277|6362|6363)/.test(clean)) return "elo";
  if (/^3[47]/.test(clean)) return "amex";
  if (/^(606282|3841)/.test(clean)) return "hipercard";
  return "generic";
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(" ");
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
}

export function validateCard(
  rawNumber: string,
  name: string,
  expiry: string,
  cvv: string
): { valid: boolean; error?: string } {
  const digits = rawNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) {
    return { valid: false, error: "Número de cartão inválido (deve conter de 13 a 16 dígitos)." };
  }

  if (!name.trim() || name.trim().length < 3) {
    return { valid: false, error: "Informe o nome completo impresso no cartão." };
  }

  const expParts = expiry.split("/");
  if (expParts.length !== 2 || expParts[0].length !== 2 || expParts[1].length !== 2) {
    return { valid: false, error: "Data de validade inválida. Use o formato MM/AA." };
  }

  const month = parseInt(expParts[0], 10);
  const year = parseInt(`20${expParts[1]}`, 10);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  if (month < 1 || month > 12) {
    return { valid: false, error: "Mês de validade inválido (01 a 12)." };
  }

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, error: "O cartão informado está expirado." };
  }

  const cvvDigits = cvv.replace(/\D/g, "");
  if (cvvDigits.length < 3 || cvvDigits.length > 4) {
    return { valid: false, error: "CVV inválido (deve conter 3 ou 4 dígitos)." };
  }

  return { valid: true };
}

export function getSavedCreditCards(): SavedCreditCard[] {
  try {
    const raw = localStorage.getItem(CARDS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(DEFAULT_SAVED_CARDS));
      return DEFAULT_SAVED_CARDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_SAVED_CARDS;
  } catch {
    return DEFAULT_SAVED_CARDS;
  }
}

export function saveCreditCard(params: {
  cardholderName: string;
  rawNumber: string;
  expiry: string;
  isDefault?: boolean;
}): SavedCreditCard {
  const cards = getSavedCreditCards();
  const digits = params.rawNumber.replace(/\D/g, "");
  const last4 = digits.slice(-4) || "0000";
  const brand = detectCardBrand(digits);
  const [mm, yy] = params.expiry.split("/");

  const shouldBeDefault = params.isDefault || cards.length === 0;

  const newCard: SavedCreditCard = {
    id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    cardholderName: params.cardholderName.trim().toUpperCase(),
    cardNumberMasked: `•••• •••• •••• ${last4}`,
    last4,
    brand,
    expiryMonth: mm,
    expiryYear: yy,
    isDefault: shouldBeDefault,
    createdAt: new Date().toISOString(),
  };

  let updatedCards: SavedCreditCard[];
  if (shouldBeDefault) {
    updatedCards = cards.map((c) => ({ ...c, isDefault: false }));
    updatedCards.unshift(newCard);
  } else {
    updatedCards = [newCard, ...cards];
  }

  try {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(updatedCards));
  } catch {
    // ignore
  }

  return newCard;
}

export function removeCreditCard(cardId: string): SavedCreditCard[] {
  const cards = getSavedCreditCards();
  const filtered = cards.filter((c) => c.id !== cardId);

  // Se o removido era o default e sobrou algum, define o primeiro como default
  if (filtered.length > 0 && !filtered.some((c) => c.isDefault)) {
    filtered[0].isDefault = true;
  }

  try {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }

  return filtered;
}

export function setDefaultCreditCard(cardId: string): SavedCreditCard[] {
  const cards = getSavedCreditCards();
  const updated = cards.map((c) => ({
    ...c,
    isDefault: c.id === cardId,
  }));

  try {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }

  return updated;
}
