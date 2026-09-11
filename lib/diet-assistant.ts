import { GoogleGenAI, Type } from "@google/genai";

export interface MealRecipe {
  nome_receita: string;
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  ingredientes: string[];
}

export interface IngredientMealOption {
  nome_receita: string;
  tipo_refeicao: string;
  tempo_preparo: string;
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  ingredientes: Array<{ name: string; quantity: string }>;
  modo_preparo: string[];
  dica_chef: string;
}

export interface DietAssistantParams {
  objetivo: string;
  calorias_alvo: number;
  restricoes?: string | string[];
}

export interface IngredientsRecipesParams {
  ingredientes: string[];
  tipo_refeicao?: string;
  calorias_alvo?: number;
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
          // Wait 600ms before retrying on temporary spike
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
        // If this model failed, loop will continue to next model in cascade
      }
    }
  }

  // Graceful fallback if external model cluster is temporarily unavailable
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

/**
 * Gera pelo menos 5 opções de cardápio com base nos ingredientes que o aluno tem em casa,
 * contendo quantidade exata de cada ingrediente, modo de preparo passo a passo e macros.
 */
export async function getRecipesByIngredients(
  params: IngredientsRecipesParams
): Promise<IngredientMealOption[]> {
  const { ingredientes, tipo_refeicao = "Qualquer refeição", calorias_alvo = 500, restricoes } = params;

  const ingredientsList = Array.isArray(ingredientes) ? ingredientes.join(", ") : ingredientes;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return getFallbackRecipesByIngredients(ingredientes, calorias_alvo, tipo_refeicao);
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const systemInstruction = `Você é o Chef de Cozinha e Nutricionista Esportivo de alta gastronomia saudável do aplicativo Vyra.
O aluno informou os ingredientes que possui em casa.
Sua missão é criar OBRIGATORIAMENTE PELO MENOS 5 opções de cardápio/pratos diferentes e criativos utilizando esses ingredientes (e temperos/básicos comuns de cozinha).

Regras de ouro:
1. Gere no mínimo 5 opções distintas e deliciosas.
2. Cada opção DEVE conter a quantidade precisa de cada ingrediente (ex: "3 ovos inteiros (150g)", "150g de peito de frango em cubos", "40g de aveia em flocos").
3. Cada opção DEVE conter um modo de preparo ("modo_preparo") com array de passos claros e práticos ensinando o aluno exatamente como cozinhar o prato.
4. Responda ESTRITAMENTE em formato JSON (Array de objetos) sem markdown externo.
Estrutura de cada objeto:
{
  "nome_receita": string,
  "tipo_refeicao": string,
  "tempo_preparo": string,
  "calorias": number,
  "proteinas": number,
  "carboidratos": number,
  "gorduras": number,
  "ingredientes": [ { "name": string, "quantity": string } ],
  "modo_preparo": [ string, string, string ],
  "dica_chef": string
}`;

  const userPrompt = `Ingredientes disponíveis em casa: ${ingredientsList}
Tipo de refeição sugerida: ${tipo_refeicao}
Meta calórica aproximada da refeição: ${calorias_alvo} kcal
${restricoes ? `Restrições do aluno: ${Array.isArray(restricoes) ? restricoes.join(", ") : restricoes}` : ""}

Crie pelo menos 5 opções completas de pratos/cardápio seguindo o formato JSON.`;

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
          },
        });

        if (response.text) {
          const cleanText = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanText);
          if (Array.isArray(parsed) && parsed.length >= 5) {
            return parsed;
          } else if (Array.isArray(parsed) && parsed.length > 0) {
            // If model returned fewer than 5, complement with fallback
            const fallback = getFallbackRecipesByIngredients(ingredientes, calorias_alvo, tipo_refeicao);
            const combined = [...parsed, ...fallback];
            return combined.slice(0, Math.max(5, combined.length));
          }
        }
      } catch (err: any) {
        console.warn(`Tentativa com ${model} (ingredientes) falhou:`, err?.message || err);
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
      }
    }
  }

  return getFallbackRecipesByIngredients(ingredientes, calorias_alvo, tipo_refeicao);
}

function getFallbackRecipesByIngredients(
  userIngredients: string[],
  calorias_alvo: number,
  tipo_refeicao: string
): IngredientMealOption[] {
  const ingStr = (Array.isArray(userIngredients) ? userIngredients.join(" ") : userIngredients || "").toLowerCase();
  const hasChicken = ingStr.includes("frango") || ingStr.includes("peito");
  const hasEggs = ingStr.includes("ovo") || ingStr.includes("clara");
  const hasOats = ingStr.includes("aveia");
  const hasBanana = ingStr.includes("banana");
  const hasRice = ingStr.includes("arroz");

  return [
    {
      nome_receita: hasEggs ? "Omelete Cremosa Fit de Frigideira com Queijo e Ervas" : "Bowl Proteico Rápido com Toque de Azeite e Alecrim",
      tipo_refeicao: tipo_refeicao || "Café da Manhã / Lanche",
      tempo_preparo: "12 min",
      calorias: Math.max(380, calorias_alvo),
      proteinas: 36,
      carboidratos: 28,
      gorduras: 14,
      ingredientes: [
        { name: "Ovos caipiras médios", quantity: "3 unidades inteiras (150g)" },
        { name: "Farelo ou flocos de aveia", quantity: "30g (2 colheres de sopa)" },
        { name: "Queijo minas ou cottage (ou frango desfiado)", quantity: "50g" },
        { name: "Azeite de oliva extravirgem", quantity: "1 colher de chá (5ml)" },
        { name: "Orégano, cúrcuma e pitada de sal", quantity: "a gosto" },
      ],
      modo_preparo: [
        "1. Em uma tigela média, quebre os ovos e bata vigorosamente com um garfo até formar espuma.",
        "2. Adicione a aveia, o sal, cúrcuma e orégano, batendo mais um pouco para hidratar a aveia.",
        "3. Pincele uma frigideira antiaderente com o azeite e leve ao fogo baixo até aquecer.",
        "4. Despeje a mistura de ovos e tampe por 3 a 4 minutos para cozinhar de maneira uniforme.",
        "5. Distribua o queijo (ou frango) em metade da omelete, dobre ao meio e deixe dourar por mais 1 minuto de cada lado.",
      ],
      dica_chef: "Tampar a frigideira em fogo baixo faz a omelete crescer e ficar muito fofa por dentro sem queimar o fundo.",
    },
    {
      nome_receita: hasChicken ? "Frango Dourado ao Lemon Pepper com Arroz e Legumes Salteados" : "Salteado Fit Proteico Dourado na Frigideira",
      tipo_refeicao: tipo_refeicao || "Almoço / Jantar",
      tempo_preparo: "20 min",
      calorias: Math.max(450, Math.round(calorias_alvo * 1.05)),
      proteinas: 48,
      carboidratos: 52,
      gorduras: 12,
      ingredientes: [
        { name: "Filé de peito de frango em tiras", quantity: "180g" },
        { name: "Arroz cozido (integral ou branco)", quantity: "140g (4 colheres cheias)" },
        { name: "Legumes disponíveis (brócolis, abobrinha ou cenoura)", quantity: "100g picados" },
        { name: "Alho picado e cebola", quantity: "2 dentes e 1/4 de cebola" },
        { name: "Azeite de oliva extravirgem", quantity: "1 colher de chá (5ml)" },
      ],
      modo_preparo: [
        "1. Tempere o frango com alho picado, limão, sal marinho e pimenta do reino.",
        "2. Aqueça a frigideira em fogo médio com o azeite e doure as tiras de frango por 4 a 5 minutos até selar bem.",
        "3. Na mesma frigideira, empurre o frango para o canto e salteie os legumes até ficarem al dente.",
        "4. Aqueça o arroz e monte o prato com o frango dourado e os vegetais coloridos.",
      ],
      dica_chef: "Não mexa no frango nos primeiros 2 minutos após colocar na panela quente para criar uma crosta saborosa.",
    },
    {
      nome_receita: hasBanana || hasOats ? "Panqueca Proteica de Banana, Aveia e Canela" : "Panqueca Doce Fit Proteica",
      tipo_refeicao: tipo_refeicao || "Café da Manhã / Pré-Treino",
      tempo_preparo: "10 min",
      calorias: Math.max(360, Math.round(calorias_alvo * 0.9)),
      proteinas: 28,
      carboidratos: 46,
      gorduras: 8,
      ingredientes: [
        { name: "Banana prata madura", quantity: "1 unidade grande (100g)" },
        { name: "Ovos médios", quantity: "2 unidades inteiras (100g)" },
        { name: "Aveia em flocos finos", quantity: "35g (3 colheres de sopa)" },
        { name: "Canela em pó", quantity: "1 colher de chá a gosto" },
        { name: "Fio de mel ou pasta de amendoim opcional", quantity: "1 colher de chá (10g)" },
      ],
      modo_preparo: [
        "1. Em um prato fundo, amasse a banana com um garfo até virar um purê liso.",
        "2. Adicione os ovos, a aveia e a canela, misturando com o garfo até obter uma massa homogênea.",
        "3. Pré-aqueça uma frigideira antiaderente untada levemente em fogo baixo.",
        "4. Despeje a massa formando 2 discos pequenos e tampe.",
        "5. Quando surgirem bolhas na superfície (cerca de 2 minutos), vire com cuidado e asse por mais 1 minuto.",
      ],
      dica_chef: "Fazer discos menores facilita na hora de virar sem quebrar a massa da panqueca.",
    },
    {
      nome_receita: "Crepioca Crocante Recheada com Frango ou Queijo",
      tipo_refeicao: tipo_refeicao || "Lanche Rápido / Pós-Treino",
      tempo_preparo: "10 min",
      calorias: Math.max(410, calorias_alvo),
      proteinas: 34,
      carboidratos: 38,
      gorduras: 12,
      ingredientes: [
        { name: "Ovos inteiros", quantity: "2 unidades (100g)" },
        { name: "Goma de tapioca ou aveia", quantity: "35g (2 colheres de sopa cheias)" },
        { name: "Recheio (frango desfiado, atum ou queijo)", quantity: "80g" },
        { name: "Sementes de chia ou gergelim", quantity: "1 colher de chá (5g)" },
        { name: "Sal marinho", quantity: "1 pitada" },
      ],
      modo_preparo: [
        "1. Bata os ovos com a goma de tapioca, a chia e o sal até dissolver toda a farinha.",
        "2. Despeje na frigideira antiaderente bem aquecida em fogo médio-baixo.",
        "3. Deixe firmar a base por cerca de 2 minutos até soltar das bordas.",
        "4. Coloque o recheio de frango ou queijo em uma das metades.",
        "5. Feche a crepioca e deixe dourar mais 30 segundos para o queijo derreter.",
      ],
      dica_chef: "A chia na massa reduz o índice glicêmico e traz crocância especial à crepioca.",
    },
    {
      nome_receita: "Escondidinho Fit de Frigideira com Purê Rápido e Crosta Dourada",
      tipo_refeicao: tipo_refeicao || "Jantar / Almoço",
      tempo_preparo: "18 min",
      calorias: Math.max(440, Math.round(calorias_alvo * 1.02)),
      proteinas: 44,
      carboidratos: 44,
      gorduras: 11,
      ingredientes: [
        { name: "Frango desfiado ou carne moída magra cozida", quantity: "150g" },
        { name: "Batata doce, batata inglesa ou abóbora amassada", quantity: "160g" },
        { name: "Molho de tomate natural ou tomate picado", quantity: "2 colheres de sopa (30g)" },
        { name: "Queijo ralado ou cottage para gratinar", quantity: "30g" },
        { name: "Cebolinha verde picada e alho", quantity: "a gosto" },
      ],
      modo_preparo: [
        "1. Aqueça a proteína temperada com o molho de tomate em uma panelinha ou frigideira.",
        "2. Amasse o tubérculo escolhido com um garfo, acertando o sal e um toque de azeite.",
        "3. Em uma frigideira pequena, coloque a camada de frango ou carne por baixo.",
        "4. Cubra uniformemente com o purê e finalize salpicando o queijo e cebolinha por cima.",
        "5. Tampe a frigideira em fogo baixíssimo por 3 a 4 minutos até o queijo fundir por completo.",
      ],
      dica_chef: "Excelente opção para preparar usando sobras de batata ou frango do dia anterior em menos de 10 minutos.",
    },
  ];
}
