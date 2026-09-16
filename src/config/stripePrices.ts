// src/config/stripePrices.ts

export const STRIPE_PAYMENT_LINKS = {
  // Assinaturas Recorrentes Oficiais
  mensal: 'https://buy.stripe.com/test_5kQfZh9ZiaXveHNayk04801',      // R$ 179,90/mês
  trimestral: 'https://buy.stripe.com/test_4gM8wP7Ra5Db2Z56i404803',  // R$ 499,90 (3 meses)
  semestral: 'https://buy.stripe.com/test_cNi28r4EYd5DarxeOA04804',   // R$ 899,90 (6 meses)
  anual: 'https://buy.stripe.com/test_14A9ATb3m4z7gPVcGs04802',       // R$ 1.739,90 (ano)

  // Protocolo Intensivo Fechado
  reset12: 'https://buy.stripe.com/test_3cI00j7RaghP4399ug04800',     // R$ 479,90

  // Modo Teste (Vyra Forge / Shape - R$ 1,00)
  // price_1UCUoSF7VqDt14kNlN81QRA1
  teste: 'https://buy.stripe.com/test_9B68wP1sM5DbgPV9ug04805',       // R$ 1,00
};

export const STRIPE_PRICES = {
  // Assinaturas periódicas (Vyra Shape & Vyra Forge)
  assinaturas: {
    mensal: {
      id: 'price_1U9FMDF7VqDt14kN3LneAWDA',
      valorMensal: 'R$ 179,90',
      total: 'R$ 179,90',
      faturamento: 'Faturado mensalmente',
      desconto: null,
      link: STRIPE_PAYMENT_LINKS.mensal,
    },
    trimestral: {
      id: 'price_1U9FMDF7VqDt14kNZhtT1hIO',
      valorMensal: 'R$ 166,63',
      total: 'R$ 499,90',
      faturamento: 'Faturado R$ 499,90 a cada 3 meses',
      desconto: '7% OFF',
      link: STRIPE_PAYMENT_LINKS.trimestral,
    },
    semestral: {
      id: 'price_1U9FMDF7VqDt14kNRVRuJWd0',
      valorMensal: 'R$ 149,98',
      total: 'R$ 899,90',
      faturamento: 'Faturado R$ 899,90 a cada 6 meses',
      desconto: '17% OFF',
      link: STRIPE_PAYMENT_LINKS.semestral,
    },
    anual: {
      id: 'price_1U9FMDF7VqDt14kNu6fxBRkh',
      valorMensal: 'R$ 144,99',
      total: 'R$ 1.739,90',
      faturamento: 'Faturado R$ 1.739,90 por ano',
      desconto: '19% OFF',
      link: STRIPE_PAYMENT_LINKS.anual,
    },
    teste: {
      id: 'price_1UCUoSF7VqDt14kNlN81QRA1',
      valorMensal: 'R$ 1,00',
      total: 'R$ 1,00',
      faturamento: 'Ambiente de teste • Cobrança simbólica de R$ 1,00',
      desconto: 'TESTE',
      link: STRIPE_PAYMENT_LINKS.teste,
    },
  },

  // Protocolo Intensivo Fechado (Reset 12)
  reset12: {
    id: 'price_1UDGQQF7VqDt14kNHfhR3RlZ',
    valor: 'R$ 479,90',
    faturamento: 'Pagamento único • Ciclo fechado de 12 semanas',
    link: STRIPE_PAYMENT_LINKS.reset12,
  },

  // ID de Teste
  teste: 'price_1UCUoSF7VqDt14kNlN81QRA1',
};

// Mapa por Price ID para compatibilidade
export const PAYMENT_LINKS: Record<string, string> = {
  'price_1U9FMDF7VqDt14kN3LneAWDA': STRIPE_PAYMENT_LINKS.mensal,
  'price_1U9FMDF7VqDt14kNZhtT1hIO': STRIPE_PAYMENT_LINKS.trimestral,
  'price_1U9FMDF7VqDt14kNRVRuJWd0': STRIPE_PAYMENT_LINKS.semestral,
  'price_1U9FMDF7VqDt14kNu6fxBRkh': STRIPE_PAYMENT_LINKS.anual,
  'price_1UDGQQF7VqDt14kNHfhR3RlZ': STRIPE_PAYMENT_LINKS.reset12,
  'price_1UCUoSF7VqDt14kNlN81QRA1': STRIPE_PAYMENT_LINKS.teste,
};

export const handleCheckout = (priceIdOrPeriod: string, userEmail?: string) => {
  const targetUrl =
    (STRIPE_PAYMENT_LINKS as any)[priceIdOrPeriod] ||
    PAYMENT_LINKS[priceIdOrPeriod] ||
    STRIPE_PAYMENT_LINKS.trimestral;

  if (targetUrl) {
    let finalUrl = targetUrl;
    if (userEmail && finalUrl.includes('buy.stripe.com')) {
      const separator = finalUrl.includes('?') ? '&' : '?';
      finalUrl = `${finalUrl}${separator}prefilled_email=${encodeURIComponent(userEmail)}`;
    }
    window.location.href = finalUrl;
  }
};

