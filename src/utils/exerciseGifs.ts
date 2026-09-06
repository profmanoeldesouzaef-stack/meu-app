import exerciseGifsData from "../data/exerciseGifs.json";

export interface ExerciseGifItem {
  id: string;
  fileName: string;
  title: string;
  category: string;
  gifUrl: string;
  previewUrl: string;
}

export const ALL_EXERCISE_GIFS: ExerciseGifItem[] = exerciseGifsData as ExerciseGifItem[];

// Normalização para busca sem acentos e minúscula
function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Mapeamento de grupos musculares para categorias de GIFs
const MUSCLE_TO_CATEGORY: Record<string, string[]> = {
  peito: ["Peitoral"],
  peitoral: ["Peitoral"],
  chest: ["Peitoral"],
  costas: ["Costas", "Eretores da espinha"],
  dorsal: ["Costas"],
  dorsais: ["Costas"],
  back: ["Costas"],
  ombro: ["Ombros", "Trapézio"],
  ombros: ["Ombros", "Trapézio"],
  deltoide: ["Ombros"],
  deltoides: ["Ombros"],
  shoulders: ["Ombros"],
  biceps: ["Bíceps", "Antebraço"],
  braço: ["Bíceps", "Tríceps", "Antebraço"],
  triceps: ["Tríceps"],
  perna: ["Pernas", "Membros Inferiores", "Glúteos"],
  pernas: ["Pernas", "Membros Inferiores", "Glúteos"],
  quadriceps: ["Pernas", "Membros Inferiores"],
  posterior: ["Pernas", "Membros Inferiores", "Glúteos"],
  gluteo: ["Glúteos", "Pernas", "Membros Inferiores"],
  gluteos: ["Glúteos", "Pernas", "Membros Inferiores"],
  panturrilha: ["Panturrilhas", "Membros Inferiores"],
  panturrilhas: ["Panturrilhas", "Membros Inferiores"],
  abdomen: ["Abdominal"],
  abdominal: ["Abdominal"],
  core: ["Abdominal"],
  cardio: ["Cardio", "Funcional e HIIT"],
  alongamento: ["Alongamentos e Mobilidade"],
  mobilidade: ["Alongamentos e Mobilidade"],
  calistenia: ["Calistenia"],
  crossfit: ["Crossfit"],
  funcional: ["Funcional e HIIT"]
};

// Dicionário de sinônimos/atalhos frequentes para encontrar o melhor GIF exato
const SPECIFIC_MATCHES: Record<string, string> = {
  "agachamento livre": "1c56dlYn3hor3huHIyt-pvwTe1LI1p4kn", // agachamento barra
  "agachamento smith": "1c56dlYn3hor3huHIyt-pvwTe1LI1p4kn",
  "agachamento bulgaro": "1GDL5KSNH2saGTKiAhXM-m4Xh8YN7kwXW", // agachamento bulgaro
  "leg press": "1wy0IB6a2jgIEYVPBJAKZBFITgfQn7XoP", // leg press 45
  "leg press 45": "1wy0IB6a2jgIEYVPBJAKZBFITgfQn7XoP",
  "leg press horizontal": "1U90dH3L91KwwAK-s7oYv96Selz6nt6fl",
  "extensora": "1qtmhaV5gWbGcL9D4YSU8yHLJHnAR4q_f",
  "cadeira extensora": "1qtmhaV5gWbGcL9D4YSU8yHLJHnAR4q_f",
  "flexora": "10hXvM8kRj3Y",
  "mesa flexora": "10hXvM8kRj3Y",
  "supino reto": "1N2REoD3zvwBTmhQ2NF7HpxVXJipXJImi", // Supino com Halteres
  "supino inclinado": "1eLhGHpbGjGVOkIwlCTDnjnzYDXxQO5LM", // Supino banco inclinado
  "supino declinado": "1XJNJgvOgFEWMYNGkVVohI6VOvSJQzmvg", // Supino com barra declinado
  "crucifixo": "1SVQv1BW1HeP8MM9_2HrQYMxocRXxz2Wd",
  "cross over": "15jyiAJ2bfNuNjlvEIkrdacaGFWuF73lF", // Cross over polia Alta
  "crossover": "15jyiAJ2bfNuNjlvEIkrdacaGFWuF73lF",
  "desenvolvimento": "1PZ3IaKlKXIsAvU2YRbAjOQOvAYm5dlhF",
  "desenvolvimento com halteres": "1HssotLgpNZoukItNWOq_1QTFuKY5MvJB",
  "elevacao lateral": "1AGd2vppmPQsZxutEoEiOnU4pKfIMuH96",
  "elevacao frontal": "1AGd2vppmPQsZxutEoEiOnU4pKfIMuH96",
  "puxada frontal": "1P0eWjh-ZLVSC7WKsHTXGnDhabvCBP5l8", // Puxada Alta
  "puxada alta": "1P0eWjh-ZLVSC7WKsHTXGnDhabvCBP5l8",
  "remada baixa": "12sStC76LCND3aOau6sCB9lfavtlYWPkx", // Remada com barra
  "remada curvada": "12sStC76LCND3aOau6sCB9lfavtlYWPkx",
  "barra fixa": "1B3KnNgjL74QI5LWXtmP0qztbfKaz4qFN",
  "rosca direta": "1mp-1DMfh9NW28YpOzlIzGTPQ8LhtW4vu",
  "rosca scott": "1mp-1DMfh9NW28YpOzlIzGTPQ8LhtW4vu",
  "triceps corda": "1Mhov3Z0SK89FQZ2F9q3O1Lpv8L_e3VlQ",
  "triceps frances": "1MVci_ARMRBXMlVn_DvV6lo0WW_VM2UFR",
  "triceps testa": "1Mhov3Z0SK89FQZ2F9q3O1Lpv8L_e3VlQ",
  "elevacao pelvica": "1hBkywiz4M4TRfcd3tIAJ06Fy_fblfBBE", // Elevação Pélvica com Barra
  "stiff": "1GDL5KSNH2saGTKiAhXM-m4Xh8YN7kwXW",
  "afundo": "1GDL5KSNH2saGTKiAhXM-m4Xh8YN7kwXW",
  "panturrilha": "1wy0IB6a2jgIEYVPBJAKZBFITgfQn7XoP",
  "panturrilha em pe": "1wy0IB6a2jgIEYVPBJAKZBFITgfQn7XoP",
  "abdominal infra": "1SlZUTu-MAxjtisr9KKgSgTDgxLdxMV1z",
  "prancha": "1SlZUTu-MAxjtisr9KKgSgTDgxLdxMV1z"
};

/**
 * Busca o GIF oficial correspondente ao exercício
 */
export function getExerciseGif(
  exerciseName: string,
  muscleGroup?: string
): ExerciseGifItem {
  const normName = normalizeStr(exerciseName || "");
  const normMuscle = normalizeStr(muscleGroup || "");

  // 1. Checagem direta de atalho específico
  for (const [key, gifId] of Object.entries(SPECIFIC_MATCHES)) {
    if (normName.includes(key) || key.includes(normName)) {
      const found = ALL_EXERCISE_GIFS.find((g) => g.id === gifId);
      if (found) return found;
    }
  }

  // 2. Busca por substring completa no título
  const directMatch = ALL_EXERCISE_GIFS.find((g) => {
    const normTitle = normalizeStr(g.title);
    return (
      normTitle === normName ||
      normTitle.includes(normName) ||
      normName.includes(normTitle)
    );
  });
  if (directMatch) return directMatch;

  // 3. Busca por palavras-chave relevantes
  const words = normName.split(" ").filter((w) => w.length > 3);
  let bestMatch: ExerciseGifItem | null = null;
  let maxScore = 0;

  for (const item of ALL_EXERCISE_GIFS) {
    const normTitle = normalizeStr(item.title);
    let score = 0;
    for (const w of words) {
      if (normTitle.includes(w)) score += 3;
    }
    // Bônus se a categoria coincide com o grupo muscular
    if (muscleGroup) {
      const allowedCategories = MUSCLE_TO_CATEGORY[normMuscle] || [];
      if (allowedCategories.includes(item.category)) {
        score += 2;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && maxScore >= 3) {
    return bestMatch;
  }

  // 4. Fallback por categoria muscular
  if (muscleGroup) {
    for (const [mKey, categories] of Object.entries(MUSCLE_TO_CATEGORY)) {
      if (normMuscle.includes(mKey) || normName.includes(mKey)) {
        const catMatch = ALL_EXERCISE_GIFS.find((g) => categories.includes(g.category));
        if (catMatch) return catMatch;
      }
    }
  }

  // 5. Fallback geral garantido (Supino / Agachamento)
  return (
    ALL_EXERCISE_GIFS.find((g) => g.id === "1N2REoD3zvwBTmhQ2NF7HpxVXJipXJImi") ||
    ALL_EXERCISE_GIFS[0]
  );
}

/**
 * Retorna variações ou exercícios similares da mesma categoria
 */
export function getCategoryGifs(categoryName: string, limit = 12): ExerciseGifItem[] {
  return ALL_EXERCISE_GIFS.filter(
    (g) => g.category.toLowerCase() === categoryName.toLowerCase()
  ).slice(0, limit);
}
