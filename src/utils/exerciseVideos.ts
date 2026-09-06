export interface ExerciseVideoInfo {
  videoId: string;
  startSec: number;
  endSec: number;
  title: string;
  channel: string;
}

// Mapeamento de exercícios para trecho de 5 a 10 segundos focado 100% na execução do movimento
const EXERCISE_EXECUTION_CLIPS: Record<string, ExerciseVideoInfo> = {
  // Peitoral
  "supino reto barra": {
    videoId: "rT7DgCr-3pg",
    startSec: 8,
    endSec: 18,
    title: "Supino Reto com Barra - Execução Correta",
    channel: "Treino em Foco",
  },
  "supino reto": {
    videoId: "rT7DgCr-3pg",
    startSec: 8,
    endSec: 18,
    title: "Supino Reto com Barra",
    channel: "Treino em Foco",
  },
  "supino inclinado halter": {
    videoId: "8iPEnn-ltC8",
    startSec: 10,
    endSec: 20,
    title: "Supino Inclinado com Halteres",
    channel: "Max Titanium",
  },
  "supino inclinado com halteres": {
    videoId: "8iPEnn-ltC8",
    startSec: 10,
    endSec: 20,
    title: "Supino Inclinado com Halteres",
    channel: "Max Titanium",
  },
  "crucifixo na polia média": {
    videoId: "taI4XduLpTk",
    startSec: 6,
    endSec: 16,
    title: "Crucifixo no Cross / Polia Média",
    channel: "Execução Perfeita",
  },
  "crucifixo": {
    videoId: "taI4XduLpTk",
    startSec: 6,
    endSec: 16,
    title: "Crucifixo na Polia",
    channel: "Execução Perfeita",
  },
  "flexao de bracos inclinada": {
    videoId: "4dF1DOWzf20",
    startSec: 5,
    endSec: 15,
    title: "Flexão de Braços Inclinada",
    channel: "Biomecânica do Treino",
  },

  // Ombros
  "desenvolvimento militar": {
    videoId: "qEwKCR5JCog",
    startSec: 7,
    endSec: 17,
    title: "Desenvolvimento Militar com Barra",
    channel: "IntegralMedica",
  },
  "desenvolvimento": {
    videoId: "qEwKCR5JCog",
    startSec: 7,
    endSec: 17,
    title: "Desenvolvimento de Ombros",
    channel: "IntegralMedica",
  },
  "elevacao lateral": {
    videoId: "3VcKaXpzqRo",
    startSec: 6,
    endSec: 16,
    title: "Elevação Lateral com Halteres",
    channel: "Leandro Twin",
  },

  // Tríceps
  "triceps corda": {
    videoId: "vB5OHsJ3EME",
    startSec: 6,
    endSec: 16,
    title: "Tríceps Corda na Polia",
    channel: "Treino em Foco",
  },
  "triceps corda polia": {
    videoId: "vB5OHsJ3EME",
    startSec: 6,
    endSec: 16,
    title: "Tríceps Corda na Polia",
    channel: "Treino em Foco",
  },
  "triceps frances": {
    videoId: "YbX7Wd8jQ-Q",
    startSec: 5,
    endSec: 15,
    title: "Tríceps Francês com Halter",
    channel: "Renato Cariani",
  },
  "mergulho nas paralelas": {
    videoId: "2z8JmcrW-As",
    startSec: 8,
    endSec: 18,
    title: "Mergulho nas Barras Paralelas",
    channel: "Calistenia Brasil",
  },

  // Pernas / Glúteos
  "agachamento livre": {
    videoId: "ultWZbUMPL8",
    startSec: 10,
    endSec: 20,
    title: "Agachamento Livre com Barra",
    channel: "IntegralMedica",
  },
  "leg press 45": {
    videoId: "IZxyjW7MPJQ",
    startSec: 8,
    endSec: 18,
    title: "Leg Press 45 Graus",
    channel: "Treino em Foco",
  },
  "agachamento bulgaro": {
    videoId: "2C-uNgKwPLE",
    startSec: 6,
    endSec: 16,
    title: "Agachamento Búlgaro",
    channel: "Leandro Twin",
  },
  "elevacao pelvica com barra": {
    videoId: "SEdqd1n01g4",
    startSec: 8,
    endSec: 18,
    title: "Elevação Pélvica com Barra",
    channel: "Treino em Foco",
  },
  "elevacao pelvica": {
    videoId: "SEdqd1n01g4",
    startSec: 8,
    endSec: 18,
    title: "Elevação Pélvica com Barra",
    channel: "Treino em Foco",
  },
  "stiff com halteres": {
    videoId: "0hXvM8kRj3Y",
    startSec: 6,
    endSec: 16,
    title: "Stiff com Halteres",
    channel: "Max Titanium",
  },
  "stiff": {
    videoId: "0hXvM8kRj3Y",
    startSec: 6,
    endSec: 16,
    title: "Stiff com Halteres",
    channel: "Max Titanium",
  },
  "cadeira abdutora inclinada": {
    videoId: "vV9Vb3h79fI",
    startSec: 6,
    endSec: 16,
    title: "Cadeira Abdutora",
    channel: "Biomecânica Aplicada",
  },
  "agachamento goblet com kettlebell": {
    videoId: "MeIiIdhvXT4",
    startSec: 6,
    endSec: 16,
    title: "Agachamento Goblet com Kettlebell",
    channel: "Crossfit & Funcional",
  },

  // Costas / Bíceps
  "levantamento terra barra": {
    videoId: "op9kVnSso6Q",
    startSec: 10,
    endSec: 20,
    title: "Levantamento Terra com Barra",
    channel: "Treino em Foco",
  },
  "levantamento terra": {
    videoId: "op9kVnSso6Q",
    startSec: 10,
    endSec: 20,
    title: "Levantamento Terra com Barra",
    channel: "Treino em Foco",
  },
  "puxada alta pronada": {
    videoId: "CAwf7n6Luuc",
    startSec: 8,
    endSec: 18,
    title: "Puxada Alta Pronada no Pulley",
    channel: "IntegralMedica",
  },
  "puxada alta": {
    videoId: "CAwf7n6Luuc",
    startSec: 8,
    endSec: 18,
    title: "Puxada Alta Pronada",
    channel: "IntegralMedica",
  },
  "remada curvada com barra": {
    videoId: "FWJR5Ve8gkQ",
    startSec: 7,
    endSec: 17,
    title: "Remada Curvada com Barra",
    channel: "Leandro Twin",
  },
  "remada baixa polia": {
    videoId: "GZbfZ033f74",
    startSec: 6,
    endSec: 16,
    title: "Remada Baixa no Triângulo",
    channel: "Treino em Foco",
  },
  "rosca direta barra w": {
    videoId: "kwG2ipFRgfo",
    startSec: 6,
    endSec: 16,
    title: "Rosca Direta com Barra W",
    channel: "Max Titanium",
  },
  "rosca direta": {
    videoId: "kwG2ipFRgfo",
    startSec: 6,
    endSec: 16,
    title: "Rosca Direta",
    channel: "Max Titanium",
  },

  // Abdômen & Core
  "abdominal infra no banco": {
    videoId: "7hGZqV7QxG8",
    startSec: 5,
    endSec: 15,
    title: "Abdominal Infra no Banco Declinado",
    channel: "Treino em Foco",
  },
  "abdominal infra": {
    videoId: "7hGZqV7QxG8",
    startSec: 5,
    endSec: 15,
    title: "Abdominal Infra no Banco",
    channel: "Treino em Foco",
  },
  "prancha abdominal dinamica": {
    videoId: "pSHjTRCQxIw",
    startSec: 6,
    endSec: 16,
    title: "Prancha Abdominal Isométrica e Dinâmica",
    channel: "Funcional Pro",
  },
  "prancha": {
    videoId: "pSHjTRCQxIw",
    startSec: 6,
    endSec: 16,
    title: "Prancha Abdominal",
    channel: "Funcional Pro",
  },
};

/**
 * Extrai o ID do vídeo do YouTube a partir de qualquer formato de URL
 */
export function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Obtém a informação do vídeo de execução de 5 a 10 segundos para o exercício
 */
export function getExerciseVideoInfo(
  exerciseName: string,
  videoUrl?: string
): ExerciseVideoInfo {
  const norm = normalizeKey(exerciseName || "");

  // 1. Procura no mapa de execuções com trechos de 5-10s
  for (const [key, info] of Object.entries(EXERCISE_EXECUTION_CLIPS)) {
    if (norm === key || norm.includes(key) || key.includes(norm)) {
      return info;
    }
  }

  // 2. Se tiver video_url do exercício, extrai o ID e cria clipe padrão de 5 a 15s (10s de execução)
  const extractedId = extractYouTubeId(videoUrl);
  if (extractedId) {
    return {
      videoId: extractedId,
      startSec: 5,
      endSec: 15,
      title: `${exerciseName} - Demonstração de Execução`,
      channel: "Treino Oficial",
    };
  }

  // 3. Fallback para supino reto padrão
  return {
    videoId: "rT7DgCr-3pg",
    startSec: 8,
    endSec: 18,
    title: `${exerciseName} - Execução Técnica`,
    channel: "Canal Oficial",
  };
}

/**
 * Gera URL de embed do YouTube configurado para loop de 5 a 10 segundos
 */
export function buildYouTubeEmbedUrl(
  videoId: string,
  startSec = 5,
  endSec = 15,
  autoplay = 1
): string {
  const duration = Math.max(5, endSec - startSec);
  // Parâmetros: loop contínuo, sem cookies invasivos, controles mínimos, mute para autoplay funcionar em todos os navegadores
  return `https://www.youtube-nocookie.com/embed/${videoId}?start=${startSec}&end=${endSec}&autoplay=${autoplay}&mute=1&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0&playsinline=1`;
}
