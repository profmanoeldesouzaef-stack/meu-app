import { MealIngredient } from "../types";

/**
 * Retorna os ingredientes discriminados com quantidade exata com base no nome do alimento e gramatura.
 */
export function getMealIngredients(
  mealName: string,
  totalGrams: number,
  customIngredients?: MealIngredient[]
): MealIngredient[] {
  if (customIngredients && customIngredients.length > 0) {
    return customIngredients;
  }

  const lower = mealName.toLowerCase();

  if (lower.includes("omelete") || (lower.includes("ovo") && lower.includes("aveia"))) {
    const eggCount = Math.max(2, Math.round(totalGrams / 80));
    const oatsGrams = Math.round(totalGrams * 0.2);
    return [
      { name: "Ovos inteiros pasteurizados", quantity: `${eggCount} unidades (~${eggCount * 50}g)` },
      { name: "Aveia em flocos finos", quantity: `${oatsGrams}g` },
      { name: "Frutas vermelhas / banana picada", quantity: `${Math.max(40, Math.round(totalGrams * 0.25))}g` },
      { name: "Canela em pó a gosto", quantity: "1 pitada (1g)" },
    ];
  }

  if (lower.includes("frango") && (lower.includes("arroz") || lower.includes("legume"))) {
    const chickenG = Math.round(totalGrams * 0.45);
    const riceG = Math.round(totalGrams * 0.35);
    const vegG = Math.max(50, totalGrams - chickenG - riceG);
    return [
      { name: "Filé de peito de frango grelhado", quantity: `${chickenG}g (pesado pronto)` },
      { name: "Arroz jasmim ou integral cozido", quantity: `${riceG}g` },
      { name: "Mix de legumes no vapor (brócolis e cenoura)", quantity: `${vegG}g` },
      { name: "Azeite de oliva extra virgem", quantity: "1 colher de chá (5ml)" },
    ];
  }

  if (lower.includes("patinho") || lower.includes("carne") || lower.includes("músculo")) {
    const meatG = Math.round(totalGrams * 0.42);
    const carbG = Math.round(totalGrams * 0.38);
    const saladG = Math.max(40, totalGrams - meatG - carbG);
    return [
      { name: "Patinho moído magro grelhado / cozido", quantity: `${meatG}g` },
      { name: "Purê de mandioquinha ou arroz integral", quantity: `${carbG}g` },
      { name: "Salada verde com tomate", quantity: `${saladG}g` },
      { name: "Tempero de ervas finas e sal rosa", quantity: "A gosto (1g)" },
    ];
  }

  if (lower.includes("whey") || lower.includes("shake") || lower.includes("iogurte")) {
    return [
      { name: "Whey Protein Concentrado/Isolado", quantity: "30g (1 dosador)" },
      { name: "Iogurte natural desnatado ou leite sem lactose", quantity: `${Math.round(totalGrams * 0.6)}ml` },
      { name: "Fruta fresca (banana ou morangos)", quantity: `${Math.round(totalGrams * 0.25)}g` },
      { name: "Sementes de chia ou pasta de amendoim", quantity: "15g (1 colher de sopa)" },
    ];
  }

  if (lower.includes("salmão") || lower.includes("tilápia") || lower.includes("peixe")) {
    const fishG = Math.round(totalGrams * 0.5);
    const potatoG = Math.round(totalGrams * 0.35);
    return [
      { name: "Filé de peixe (tilápia/salmão)", quantity: `${fishG}g grelhado` },
      { name: "Batata doce assada em rodelas", quantity: `${potatoG}g` },
      { name: "Salada de folhas verdes à vontade", quantity: "1 prato de sobremesa" },
      { name: "Limão espremido e azeite extravirgem", quantity: "1 colher de chá (5ml)" },
    ];
  }

  // Genérico equilibrado
  const mainG = Math.round(totalGrams * 0.45);
  const sideG = Math.round(totalGrams * 0.4);
  const extraG = Math.max(20, totalGrams - mainG - sideG);

  return [
    { name: `Proteína principal (${mealName.split(" com ")[0] || "Fonte proteica"})`, quantity: `${mainG}g` },
    { name: "Guarnição de carboidrato complexo", quantity: `${sideG}g` },
    { name: "Fibras e vegetais selecionados", quantity: `${extraG}g` },
  ];
}

/**
 * Retorna as instruções de modo de preparo passo a passo
 */
export function getMealPrepInstructions(
  mealName: string,
  customInstructions?: string[]
): string[] {
  if (customInstructions && customInstructions.length > 0) {
    return customInstructions;
  }

  const lower = mealName.toLowerCase();

  if (lower.includes("omelete") || lower.includes("ovo")) {
    return [
      "Bata os ovos vigorosamente em um recipiente até espumar levemente.",
      "Acrescente a aveia e uma pitada de sal ou canela.",
      "Aqueça uma frigideira antiaderente levemente untada em fogo médio-baixo.",
      "Despeje a mistura, tampe por 2 a 3 minutos até firmar a borda e vire delicadamente.",
      "Sirva imediatamente acompanhado das frutas frescas.",
    ];
  }

  if (lower.includes("frango")) {
    return [
      "Higienize e corte o filé de peito de frango em bifes médios uniformes.",
      "Tempere com alho amassado, limão, páprica defumada e uma pitada de sal marinho.",
      "Aqueça uma grelha ou frigideira grossa com fios de azeite em fogo alto.",
      "Sele o frango por cerca de 4 a 5 minutos de cada lado até dourar e manter a suculência.",
      "Sirva quente com a porção de arroz e os legumes cozidos no vapor.",
    ];
  }

  if (lower.includes("whey") || lower.includes("shake")) {
    return [
      "Adicione o líquido base (água gelada ou leite) primeiro no copo do mixer/liquidificador.",
      "Acrescente a dose prescrita de Whey Protein e as frutas picadas.",
      "Bata por 30 a 45 segundos até atingir textura cremosa e homogênea.",
      "Finalize salpicando as sementes de chia ou pasta de amendoim por cima e consuma fresco.",
    ];
  }

  return [
    "Separe e pese todos os ingredientes em balança de precisão culinária.",
    "Aqueça a panela ou grelha antiaderente em temperatura média com o mínimo de gordura.",
    "Grelhe ou asse a proteína principal até o ponto ideal de cozimento seguro.",
    "Aqueça a guarnição e monte o prato decorando com ervas naturais e vegetais frescos.",
    "Aprecie sua refeição mastigando com calma para favorecer a digestão e a saciedade.",
  ];
}
