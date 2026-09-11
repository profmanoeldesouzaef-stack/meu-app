import { GoogleGenAI, Type } from "@google/genai";

export interface MealRecipe {
  nome_receita: string;
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  ingredientes: string[];
}

export interface DietAssistantParams {
  objetivo: string;
  calorias_alvo: number;
  restricoes?: string | string[];
}

/**
 * Assistente Nutricional do App Vyra alimentado pela API do Google Gemini.
 * Sugere 3 opções de refeições de alta performance adaptadas às metas do atleta.
 *
 * @param params Objeto contendo 'objetivo', 'calorias_alvo' e 'restricoes' do aluno
 * @returns Array com 3 receitas contendo macros e ingredientes
 */
export async function getDietAssistantRecommendations(
  params: DietAssistantParams
): Promise<MealRecipe[]> {
  const { objetivo, calorias_alvo, restricoes } = params;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY não encontrada no ambiente. Retornando receitas padrão de contingência.");
    return getFallbackRecipes(objetivo, calorias_alvo);
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const formattedRestrictions = Array.isArray(restricoes)
    ? restricoes.join(", ")
    : restricoes || "Nenhuma restrição informada";

  const systemInstruction = `Você é o assistente nutricional oficial e treinador dietético do app Vyra (Vyra Training & Performance).
Sua missão é sugerir exatamente 3 opções de refeições saudáveis, saborosas e hipernutritivas com base em receitas consagradas da culinária esportiva e saudável da internet.
As refeições devem ser perfeitamente calibradas para o objetivo físico do aluno, sua meta calórica e respeitar rigorosamente quaisquer alergias ou restrições alimentares.

Regra vital de formato:
Você DEVE responder EXATAMENTE em um formato JSON válido, contendo apenas um array de objetos. Cada objeto deve possuir rigorosamente as chaves:
- "nome_receita": string (nome atrativo da receita)
- "calorias": number (total de kcal da porção)
- "proteinas": number (gramas de proteína)
- "carboidratos": number (gramas de carboidratos)
- "gorduras": number (gramas de gorduras totais)
- "ingredientes": array de strings (lista de ingredientes com quantidades aproximadas)

Não inclua NENHUM texto introdutório, conclusões, saudações ou blocos de formatação markdown fora do JSON. Retorne apenas o JSON bruto válido.`;

  const userPrompt = `Perfil do Aluno Vyra:
- Objetivo: ${objetivo}
- Calorias Alvo para a Refeição: aproximadamente ${Math.round(calorias_alvo / 3)} kcal (Meta diária total: ${calorias_alvo} kcal)
- Restrições alimentares e preferências: ${formattedRestrictions}

Gere 3 opções de refeições completas, práticas e equilibradas respeitando rigorosamente o formato JSON solicitado.`;

  const modelsToTry = ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.8-flash"];

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nome_receita: {
                    type: Type.STRING,
                    description: "Nome claro e apetitoso da receita esportiva",
                  },
                  calorias: {
                    type: Type.NUMBER,
                    description: "Total de calorias da porção em kcal",
                  },
                  proteinas: {
                    type: Type.NUMBER,
                    description: "Quantidade de proteínas em gramas",
                  },
                  carboidratos: {
                    type: Type.NUMBER,
                    description: "Quantidade de carboidratos em gramas",
                  },
                  gorduras: {
                    type: Type.NUMBER,
                    description: "Quantidade de gorduras em gramas",
                  },
                  ingredientes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.STRING,
                    },
                    description: "Lista de ingredientes detalhados com porções",
                  },
                },
                required: [
                  "nome_receita",
                  "calorias",
                  "proteinas",
                  "carboidratos",
                  "gorduras",
                  "ingredientes",
                ],
              },
            },
          },
        });

        const rawText = response.text?.trim() || "[]";
        const parsed = JSON.parse(rawText) as MealRecipe[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (error: any) {
        const isUnavailable =
          error?.status === 503 ||
          error?.code === 503 ||
          error?.message?.includes("503") ||
          error?.message?.includes("high demand") ||
          error?.message?.includes("UNAVAILABLE");

        if (isUnavailable && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
      }
    }
  }

  return getFallbackRecipes(objetivo, calorias_alvo);
}

/**
 * Função de contingência caso a API externa esteja inacessível ou sem chave.
 */
function getFallbackRecipes(objetivo: string, calorias_alvo: number): MealRecipe[] {
  const targetPerMeal = Math.round(calorias_alvo / 3);

  return [
    {
      nome_receita: "Bowl Hiperproteico de Frango Grelhado com Quinoa e Legumes",
      calorias: Math.round(targetPerMeal * 1.0),
      proteinas: 45,
      carboidratos: 52,
      gorduras: 14,
      ingredientes: [
        "180g de peito de frango em cubos grelhado",
        "120g de quinoa cozida com cúrcuma",
        "100g de brócolis e cenoura no vapor",
        "1 colher de chá de azeite de oliva extravirgem",
        "Sal marinho e ervas finas a gosto",
      ],
    },
    {
      nome_receita: "Salmão Grelhado com Purê Rústico de Batata Doce",
      calorias: Math.round(targetPerMeal * 1.05),
      proteinas: 42,
      carboidratos: 48,
      gorduras: 18,
      ingredientes: [
        "160g de filé de salmão fresco selado",
        "180g de batata doce amassada com noz-moscada",
        "Salada de rúcula com tomate cereja e limão",
        "1 colher de sobremesa de sementes de gergelim",
      ],
    },
    {
      nome_receita: "Omelete Crepefit de Aveia com Recheio de Carne Moída e Ricota",
      calorias: Math.round(targetPerMeal * 0.95),
      proteinas: 40,
      carboidratos: 38,
      gorduras: 16,
      ingredientes: [
        "3 ovos inteiros batidos com 30g de farelo de aveia",
        "120g de patinho moído temperado com cebola e alho",
        "40g de creme de ricota light",
        "Folhas de espinafre frescas",
      ],
    },
  ];
}
