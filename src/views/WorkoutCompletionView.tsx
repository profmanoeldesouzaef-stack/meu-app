import React, { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import {
  Trophy,
  Copy,
  Download,
  Share2,
  Check,
  Sparkles,
  ArrowLeft,
  Eye,
  Camera,
  Layers,
  Upload,
  RotateCw,
  Info,
  CheckCircle2,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight,
  RotateCcw,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";

interface WorkoutSummaryData {
  workoutTitle: string;
  dayLabel: string;
  durationMin: number;
  completedExercises: number;
  totalExercises: number;
  progressPct: number;
  maxWeightKg: number;
  totalSets: number;
  exercises?: Array<{ name: string; sets: number; reps: string }>;
  date: string;
}

export interface TemplatePosition {
  x: number;
  y: number;
  scale: number;
}

export const WorkoutCompletionView: React.FC = () => {
  const { setActiveView, sendNotification } = useApp();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string>("");
  const [downloading, setDownloading] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<"transparent" | "simulator">("transparent");
  const [simulatorPhoto, setSimulatorPhoto] = useState<string>(
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&auto=format&fit=crop&q=80"
  );

  // Editable position and scale for each template
  const [positions, setPositions] = useState<Record<number, TemplatePosition>>({
    0: { x: 0, y: 0, scale: 1 },
    1: { x: 0, y: 0, scale: 1 },
    2: { x: 0, y: 0, scale: 1 },
    3: { x: 0, y: 0, scale: 1 },
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initX: number; initY: number } | null>(null);

  const currentPos = positions[selectedTemplate] || { x: 0, y: 0, scale: 1 };

  // Load summary data from localStorage or provide fallback
  const [summaryData, setSummaryData] = useState<WorkoutSummaryData>(() => {
    try {
      const saved = localStorage.getItem("vyra_last_completed_workout");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return {
      workoutTitle: "Peito, Ombro & Tríceps",
      dayLabel: "Dia 3 · Push",
      durationMin: 58,
      completedExercises: 6,
      totalExercises: 6,
      progressPct: 100,
      maxWeightKg: 84,
      totalSets: 21,
      exercises: [
        { name: "Supino Reto Barra", sets: 4, reps: "8-10" },
        { name: "Supino Inclinado Halter", sets: 3, reps: "10-12" },
        { name: "Desenvolvimento Militar", sets: 4, reps: "8" },
        { name: "Elevação Lateral", sets: 4, reps: "12-15" },
        { name: "Tríceps Corda Polia", sets: 3, reps: "12-15" },
        { name: "Tríceps Francês", sets: 3, reps: "10" },
      ],
      date: new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };
  });

  const templatesList = [
    {
      id: 0,
      name: "HUD Performance",
      subtitle: "Estilo Cyber High-Tech",
      badge: "Mais Popular",
    },
    {
      id: 1,
      name: "Sticker Minimalista",
      subtitle: "Figurinha Limpa & Discreta",
      badge: "Compacto",
    },
    {
      id: 2,
      name: "Comprovante / Recibo",
      subtitle: "Extrato de Séries Feitas",
      badge: "Detalhado",
    },
    {
      id: 3,
      name: "Editorial Athlete",
      subtitle: "Tipografia Bold & Clean",
      badge: "Estético",
    },
  ];

  // Draw transparent canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Instagram story dimensions: 1080 x 1920 (9:16)
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // 100% CLEAR / TRANSPARENT CANVAS
    ctx.clearRect(0, 0, W, H);

    const dateStr = summaryData.date || new Date().toLocaleDateString("pt-BR");
    const titleStr = summaryData.workoutTitle.toUpperCase();
    const dayStr = summaryData.dayLabel.toUpperCase();
    const durationStr = `${summaryData.durationMin || 58} MIN`;
    const maxWeightStr = summaryData.maxWeightKg > 0 ? `${summaryData.maxWeightKg} KG MÁX` : "INTENSIDADE MÁX";
    const setsStr = `${summaryData.totalSets || 20} SÉRIES`;

    // Helpers
    const drawRoundedRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      strokeColor?: string,
      fillColor?: string,
      lineWidth = 3
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
      }
      if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
      ctx.restore();
    };

    if (selectedTemplate === 0) {
      // ==========================================
      // TEMPLATE 0: HUD PERFORMANCE (CYBER OVERLAY)
      // ==========================================
      const cornerSize = 70;
      const cornerPad = 60;
      ctx.strokeStyle = "rgba(255, 106, 42, 0.85)";
      ctx.lineWidth = 6;
      ctx.lineCap = "square";

      // Top Left Corner Bracket
      ctx.beginPath();
      ctx.moveTo(cornerPad, cornerPad + cornerSize);
      ctx.lineTo(cornerPad, cornerPad);
      ctx.lineTo(cornerPad + cornerSize, cornerPad);
      ctx.stroke();

      // Top Right Corner Bracket
      ctx.beginPath();
      ctx.moveTo(W - cornerPad - cornerSize, cornerPad);
      ctx.lineTo(W - cornerPad, cornerPad);
      ctx.lineTo(W - cornerPad, cornerPad + cornerSize);
      ctx.stroke();

      // Bottom Left Corner Bracket
      ctx.beginPath();
      ctx.moveTo(cornerPad, H - cornerPad - cornerSize);
      ctx.lineTo(cornerPad, H - cornerPad);
      ctx.lineTo(cornerPad + cornerSize, H - cornerPad);
      ctx.stroke();

      // Bottom Right Corner Bracket
      ctx.beginPath();
      ctx.moveTo(W - cornerPad - cornerSize, H - cornerPad);
      ctx.lineTo(W - cornerPad, H - cornerPad);
      ctx.lineTo(W - cornerPad, H - cornerPad - cornerSize);
      ctx.stroke();

      // Apply editable position & scale to HUD elements
      ctx.save();
      const cx0 = W / 2;
      const cy0 = 960;
      ctx.translate(cx0 + currentPos.x, cy0 + currentPos.y);
      ctx.scale(currentPos.scale, currentPos.scale);
      ctx.translate(-cx0, -cy0);

      // Top Brand Header Pill (Semi-transparent black back for readability over photo)
      drawRoundedRect(W / 2 - 320, 90, 640, 70, 35, "rgba(255, 106, 42, 0.5)", "rgba(10, 10, 12, 0.75)", 2);
      ctx.fillStyle = "#FF6A2A";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("●  VYRA PERFORMANCE SYSTEM  ●", W / 2, 134);

      // Central Main HUD Card
      const cardY = 560;
      const cardW = 960;
      const cardH = 800;
      const cardX = (W - cardW) / 2;

      // Card Background with frosted glass feel (still transparent photo shows around and behind)
      drawRoundedRect(cardX, cardY, cardW, cardH, 48, "rgba(216, 180, 106, 0.5)", "rgba(14, 14, 18, 0.82)", 4);

      // Card Header Tag
      drawRoundedRect(W / 2 - 220, cardY + 50, 440, 60, 30, "rgba(52, 199, 89, 0.7)", "rgba(52, 199, 89, 0.2)", 3);
      ctx.fillStyle = "#34C759";
      ctx.font = "900 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✔  TREINO PAGO", W / 2, cardY + 92);

      // Title & Day
      ctx.fillStyle = "#F5F5F7";
      ctx.font = "900 52px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(titleStr, W / 2, cardY + 200);

      ctx.fillStyle = "#D8B46A";
      ctx.font = "bold 30px sans-serif";
      ctx.fillText(dayStr, W / 2, cardY + 255);

      // Divider Line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cardX + 60, cardY + 295);
      ctx.lineTo(cardX + cardW - 60, cardY + 295);
      ctx.stroke();

      // Metric Grid inside card (4 boxes)
      const metricW = 400;
      const metricH = 150;
      const mPadX = 60;
      const mRow1Y = cardY + 340;
      const mRow2Y = cardY + 520;

      // Metric 1: Duração
      drawRoundedRect(cardX + mPadX, mRow1Y, metricW, metricH, 28, "rgba(255, 255, 255, 0.12)", "rgba(25, 25, 30, 0.85)", 2);
      ctx.fillStyle = "#9B9BA1";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("TEMPO DE TREINO", cardX + mPadX + 35, mRow1Y + 50);
      ctx.fillStyle = "#F5F5F7";
      ctx.font = "900 48px sans-serif";
      ctx.fillText(durationStr, cardX + mPadX + 35, mRow1Y + 115);

      // Metric 2: Adesão
      drawRoundedRect(cardX + cardW - mPadX - metricW, mRow1Y, metricW, metricH, 28, "rgba(255, 255, 255, 0.12)", "rgba(25, 25, 30, 0.85)", 2);
      ctx.fillStyle = "#9B9BA1";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("EXECUÇÃO", cardX + cardW - mPadX - metricW + 35, mRow1Y + 50);
      ctx.fillStyle = "#34C759";
      ctx.font = "900 48px sans-serif";
      ctx.fillText("100% PAGO", cardX + cardW - mPadX - metricW + 35, mRow1Y + 115);

      // Metric 3: Carga Máx
      drawRoundedRect(cardX + mPadX, mRow2Y, metricW, metricH, 28, "rgba(255, 255, 255, 0.12)", "rgba(25, 25, 30, 0.85)", 2);
      ctx.fillStyle = "#9B9BA1";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("PROGRESSÃO", cardX + mPadX + 35, mRow2Y + 50);
      ctx.fillStyle = "#D8B46A";
      ctx.font = "900 44px sans-serif";
      ctx.fillText(maxWeightStr, cardX + mPadX + 35, mRow2Y + 115);

      // Metric 4: Séries
      drawRoundedRect(cardX + cardW - mPadX - metricW, mRow2Y, metricW, metricH, 28, "rgba(255, 255, 255, 0.12)", "rgba(25, 25, 30, 0.85)", 2);
      ctx.fillStyle = "#9B9BA1";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("VOLUME TOTAL", cardX + cardW - mPadX - metricW + 35, mRow2Y + 50);
      ctx.fillStyle = "#FF6A2A";
      ctx.font = "900 48px sans-serif";
      ctx.fillText(setsStr, cardX + cardW - mPadX - metricW + 35, mRow2Y + 115);

      // Card Bottom Verified Sign
      ctx.fillStyle = "#9B9BA1";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`PRESCRITO & AUDITADO · MARI HEAD COACH · ${dateStr}`, W / 2, cardY + 735);

      // Bottom Hashtag Pill
      drawRoundedRect(W / 2 - 200, H - 160, 400, 64, 32, "rgba(255, 255, 255, 0.2)", "rgba(10, 10, 12, 0.75)", 2);
      ctx.fillStyle = "#F5F5F7";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("#VYRACLUB  #OVERLOAD", W / 2, H - 118);

      ctx.restore();
    } else if (selectedTemplate === 1) {
      // ==========================================
      // TEMPLATE 1: STICKER MINIMALISTA (CORNER / CENTER BADGE)
      // Designed so that 85% of the photo is visible!
      // ==========================================
      const badgeW = 760;
      const badgeH = 460;
      const badgeX = (W - badgeW) / 2;
      const badgeY = H - badgeH - 240;

      // Apply editable position & scale to Sticker
      ctx.save();
      const cx1 = W / 2;
      const cy1 = badgeY + badgeH / 2;
      ctx.translate(cx1 + currentPos.x, cy1 + currentPos.y);
      ctx.scale(currentPos.scale, currentPos.scale);
      ctx.translate(-cx1, -cy1);

      // Glow / Shadow behind sticker
      drawRoundedRect(badgeX, badgeY, badgeW, badgeH, 50, "rgba(255, 106, 42, 0.6)", "rgba(12, 12, 16, 0.86)", 5);

      // Top Mini Tag
      drawRoundedRect(badgeX + 50, badgeY + 45, 260, 48, 24, "rgba(216, 180, 106, 0.5)", "rgba(216, 180, 106, 0.15)", 2);
      ctx.fillStyle = "#D8B46A";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("● VYRA CLUB", badgeX + 180, badgeY + 77);

      // Date Top Right
      ctx.fillStyle = "#9B9BA1";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(dateStr, badgeX + badgeW - 50, badgeY + 78);

      // Large Title
      ctx.fillStyle = "#F5F5F7";
      ctx.font = "900 60px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("TREINO PAGO ✔", badgeX + 50, badgeY + 175);

      // Subtitle Workout name
      ctx.fillStyle = "#FF6A2A";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(titleStr, badgeX + 50, badgeY + 230);

      // Three Quick Metric Tags
      const tagH = 80;
      const tag1W = 190;
      const tag2W = 210;
      const tag3W = 200;
      const tagY = badgeY + 290;

      drawRoundedRect(badgeX + 50, tagY, tag1W, tagH, 20, "rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.08)", 2);
      ctx.fillStyle = "#F5F5F7";
      ctx.font = "900 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(durationStr, badgeX + 50 + tag1W / 2, tagY + 52);

      drawRoundedRect(badgeX + 50 + tag1W + 20, tagY, tag2W, tagH, 20, "rgba(52, 199, 89, 0.4)", "rgba(52, 199, 89, 0.12)", 2);
      ctx.fillStyle = "#34C759";
      ctx.font = "900 32px sans-serif";
      ctx.fillText("100% FEITO", badgeX + 50 + tag1W + 20 + tag2W / 2, tagY + 52);

      drawRoundedRect(badgeX + 50 + tag1W + 20 + tag2W + 20, tagY, tag3W, tagH, 20, "rgba(216, 180, 106, 0.4)", "rgba(216, 180, 106, 0.12)", 2);
      ctx.fillStyle = "#D8B46A";
      ctx.font = "900 28px sans-serif";
      ctx.fillText(maxWeightStr, badgeX + 50 + tag1W + 20 + tag2W + 20 + tag3W / 2, tagY + 52);

      // Footer
      ctx.fillStyle = "#9B9BA1";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Progressive Overload Garantido · Head Coach Mari", badgeX + 55, badgeY + 415);

      ctx.restore();
    } else if (selectedTemplate === 2) {
      // ==========================================
      // TEMPLATE 2: COMPROVANTE / ATHLETIC RECEIPT
      // Stylized transparent ticket overlay with dashed borders
      // ==========================================
      const recW = 820;
      const recH = 1200;
      const recX = (W - recW) / 2;
      const recY = 360;

      // Apply editable position & scale to Receipt
      ctx.save();
      const cx2 = W / 2;
      const cy2 = recY + recH / 2;
      ctx.translate(cx2 + currentPos.x, cy2 + currentPos.y);
      ctx.scale(currentPos.scale, currentPos.scale);
      ctx.translate(-cx2, -cy2);

      // Transparent ticket container
      drawRoundedRect(recX, recY, recW, recH, 36, "rgba(255, 255, 255, 0.35)", "rgba(10, 10, 14, 0.88)", 3);

      // Header Brand
      ctx.fillStyle = "#D8B46A";
      ctx.font = "bold 26px monospace";
      ctx.textAlign = "center";
      ctx.fillText("========================================", W / 2, recY + 60);
      ctx.font = "900 38px monospace";
      ctx.fillText("VYRA ATHLETIC RECEIPT", W / 2, recY + 115);
      ctx.font = "bold 22px monospace";
      ctx.fillStyle = "#9B9BA1";
      ctx.fillText("COMPROVANTE OFICIAL DE TREINO PAGO", W / 2, recY + 155);
      ctx.fillStyle = "#D8B46A";
      ctx.font = "bold 26px monospace";
      ctx.fillText("========================================", W / 2, recY + 195);

      // Ticket Meta info
      ctx.font = "bold 24px monospace";
      ctx.fillStyle = "#F5F5F7";
      ctx.textAlign = "left";
      ctx.fillText(`DATA: ${dateStr}`, recX + 60, recY + 250);
      ctx.textAlign = "right";
      ctx.fillText(`HORA: ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, recX + recW - 60, recY + 250);

      ctx.textAlign = "left";
      ctx.fillText(`TREINO: ${titleStr.slice(0, 22)}`, recX + 60, recY + 295);
      ctx.textAlign = "right";
      ctx.fillText(`DIVISÃO: ${dayStr.slice(0, 14)}`, recX + recW - 60, recY + 295);

      // Dashed line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(recX + 50, recY + 330);
      ctx.lineTo(recX + recW - 50, recY + 330);
      ctx.stroke();
      ctx.setLineDash([]);

      // List of completed exercises
      const exList = summaryData.exercises || [
        { name: "Supino Reto Barra", sets: 4, reps: "8-10" },
        { name: "Supino Inclinado Halter", sets: 3, reps: "10-12" },
        { name: "Desenvolvimento Militar", sets: 4, reps: "8" },
        { name: "Elevação Lateral", sets: 4, reps: "12-15" },
        { name: "Tríceps Corda Polia", sets: 3, reps: "12-15" },
        { name: "Tríceps Francês", sets: 3, reps: "10" },
      ];

      ctx.font = "bold 22px monospace";
      ctx.fillStyle = "#9B9BA1";
      ctx.textAlign = "left";
      ctx.fillText("ITEM / EXERCÍCIO", recX + 60, recY + 375);
      ctx.textAlign = "right";
      ctx.fillText("SÉRIES / STATUS", recX + recW - 60, recY + 375);

      let curExY = recY + 425;
      exList.slice(0, 6).forEach((ex, idx) => {
        ctx.font = "bold 24px monospace";
        ctx.fillStyle = "#F5F5F7";
        ctx.textAlign = "left";
        const shortName = `${idx + 1}. ${ex.name.length > 22 ? ex.name.slice(0, 21) + "…" : ex.name}`;
        ctx.fillText(shortName, recX + 60, curExY);

        ctx.textAlign = "right";
        ctx.fillStyle = "#34C759";
        ctx.fillText(`${ex.sets}x [✔ OK]`, recX + recW - 60, curExY);
        curExY += 52;
      });

      // Another dashed line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(recX + 50, curExY + 20);
      ctx.lineTo(recX + recW - 50, curExY + 20);
      ctx.stroke();
      ctx.setLineDash([]);

      // Totals
      curExY += 70;
      ctx.font = "bold 26px monospace";
      ctx.fillStyle = "#9B9BA1";
      ctx.textAlign = "left";
      ctx.fillText("TEMPO TOTAL:", recX + 60, curExY);
      ctx.textAlign = "right";
      ctx.fillStyle = "#F5F5F7";
      ctx.fillText(durationStr, recX + recW - 60, curExY);

      curExY += 45;
      ctx.font = "bold 26px monospace";
      ctx.fillStyle = "#9B9BA1";
      ctx.textAlign = "left";
      ctx.fillText("CARGA MÁXIMA:", recX + 60, curExY);
      ctx.textAlign = "right";
      ctx.fillStyle = "#D8B46A";
      ctx.fillText(maxWeightStr, recX + recW - 60, curExY);

      curExY += 45;
      ctx.font = "bold 26px monospace";
      ctx.fillStyle = "#9B9BA1";
      ctx.textAlign = "left";
      ctx.fillText("STATUS:", recX + 60, curExY);
      ctx.textAlign = "right";
      ctx.fillStyle = "#34C759";
      ctx.fillText("100% AUDITADO E PAGO", recX + recW - 60, curExY);

      // Barcode simulation lines
      curExY += 75;
      const barcodeW = recW - 120;
      const barcodeX = recX + 60;
      ctx.fillStyle = "#F5F5F7";
      for (let i = 0; i < barcodeW; i += 7) {
        const barH = 50;
        const lineW = (i % 3 === 0 || i % 5 === 0) ? 4 : 2;
        ctx.fillRect(barcodeX + i, curExY, lineW, barH);
      }

      ctx.fillStyle = "#9B9BA1";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`AUTH: VYRA-${Date.now().toString(36).toUpperCase()}-MARI-COACH`, W / 2, curExY + 80);

      ctx.restore();
    } else if (selectedTemplate === 3) {
      // ==========================================
      // TEMPLATE 3: EDITORIAL ATHLETE (HIGH FASHION / MINIMALIST)
      // ==========================================
      // Top minimal bar
      drawRoundedRect(80, 100, W - 160, 80, 20, "rgba(255, 255, 255, 0.3)", "rgba(10, 10, 12, 0.75)", 2);
      ctx.fillStyle = "#F5F5F7";
      ctx.font = "900 28px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("VYRA ATHLETIC CLUB", 120, 150);

      ctx.textAlign = "right";
      ctx.fillStyle = "#FF6A2A";
      ctx.fillText(`ISSUE // ${dateStr}`, W - 120, 150);

      // Large Editorial Typography Box in lower half (Movable by user)
      const boxY = H - 680;
      const boxW = W - 140;
      const boxX = 70;
      const boxH = 560;

      ctx.save();
      const cx3 = W / 2;
      const cy3 = boxY + boxH / 2;
      ctx.translate(cx3 + currentPos.x, cy3 + currentPos.y);
      ctx.scale(currentPos.scale, currentPos.scale);
      ctx.translate(-cx3, -cy3);

      drawRoundedRect(boxX, boxY, boxW, boxH, 44, "rgba(255, 255, 255, 0.25)", "rgba(8, 8, 10, 0.88)", 3);

      ctx.fillStyle = "#D8B46A";
      ctx.font = "900 26px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("OVERLOAD PROTOCOL // CONFIRMED", boxX + 60, boxY + 75);

      // Enormous text
      ctx.fillStyle = "#F5F5F7";
      ctx.font = "900 88px sans-serif";
      ctx.fillText("FINISHED.", boxX + 60, boxY + 180);

      ctx.fillStyle = "#9B9BA1";
      ctx.font = "bold 34px sans-serif";
      ctx.fillText(titleStr, boxX + 60, boxY + 245);

      // Horizontal subtle line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(boxX + 60, boxY + 295);
      ctx.lineTo(boxX + boxW - 60, boxY + 295);
      ctx.stroke();

      // Stats row
      const statW = (boxW - 120) / 3;
      // Stat 1
      ctx.fillStyle = "#9B9BA1";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("DURATION", boxX + 60, boxY + 360);
      ctx.fillStyle = "#F5F5F7";
      ctx.font = "900 46px sans-serif";
      ctx.fillText(durationStr, boxX + 60, boxY + 420);

      // Stat 2
      ctx.fillStyle = "#9B9BA1";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("MAX LOAD", boxX + 60 + statW, boxY + 360);
      ctx.fillStyle = "#FF6A2A";
      ctx.font = "900 46px sans-serif";
      ctx.fillText(maxWeightStr, boxX + 60 + statW, boxY + 420);

      // Stat 3
      ctx.fillStyle = "#9B9BA1";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("ADHERENCE", boxX + 60 + statW * 2, boxY + 360);
      ctx.fillStyle = "#34C759";
      ctx.font = "900 46px sans-serif";
      ctx.fillText("100%", boxX + 60 + statW * 2, boxY + 420);

      // Footer
      ctx.fillStyle = "#9B9BA1";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("DISCIPLINE > MOTIVATION · HEAD COACH MARI", boxX + 60, boxY + 495);

      ctx.restore();
    }
  }, [selectedTemplate, summaryData, positions]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Copy transparent PNG directly to clipboard as image/png
  const handleCopyTransparentSticker = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error("Falha ao gerar imagem.");
        }

        if (navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                "image/png": blob,
              }),
            ]);
            setCopied(true);
            setCopyFeedback("✔ Figurinha transparente copiada! Abra o Instagram Stories na sua foto e toque em Colar.");
            sendNotification(
              "Figurinha Copiada!",
              "Abra o Instagram Stories na sua foto e toque em 'Colar' para posicionar seu template transparente por cima.",
              "general"
            );
            setTimeout(() => setCopied(false), 5000);
            return;
          } catch (clipErr) {
            console.warn("ClipboardItem write failed, fallback to download:", clipErr);
          }
        }

        // Fallback if browser doesn't allow direct image copy
        handleDownloadTransparentPNG();
        setCopied(true);
        setCopyFeedback("✔ Imagem PNG transparente baixada! No Instagram, use o adesivo de Foto para colocar por cima.");
        setTimeout(() => setCopied(false), 5000);
      }, "image/png");
    } catch (err) {
      console.error("Erro ao copiar figurinha:", err);
      handleDownloadTransparentPNG();
    }
  };

  // Download transparent PNG
  const handleDownloadTransparentPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `vyra-treino-pago-transparente-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setCopyFeedback("✔ PNG com fundo transparente baixado com sucesso!");
      setTimeout(() => setCopyFeedback(""), 4000);
    } catch (err) {
      console.error("Erro ao baixar PNG:", err);
    } finally {
      setDownloading(false);
    }
  };

  // Native share if supported
  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "vyra-treino-pago.png", { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Treino Pago · VYRA",
            text: "Treino finalizado com sucesso! #VYRACLUB",
            files: [file],
          });
        } else {
          handleCopyTransparentSticker();
        }
      }, "image/png");
    } catch (err) {
      console.warn("Share cancelled or failed:", err);
      handleCopyTransparentSticker();
    }
  };

  // Upload user photo for simulator
  const handleSimulatorPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string") {
          setSimulatorPhoto(ev.target.result);
          setPreviewMode("simulator");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop handlers directly on the canvas preview
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initX: currentPos.x,
      initY: currentPos.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const scaleFactorY = 1920 / rect.height;
    const scaleFactorX = 1080 / rect.width;

    const deltaX = (e.clientX - dragStartRef.current.clientX) * scaleFactorX;
    const deltaY = (e.clientY - dragStartRef.current.clientY) * scaleFactorY;

    const newX = Math.round(Math.max(-450, Math.min(450, dragStartRef.current.initX + deltaX)));
    const newY = Math.round(Math.max(-800, Math.min(800, dragStartRef.current.initY + deltaY)));

    setPositions((prev) => ({
      ...prev,
      [selectedTemplate]: {
        ...prev[selectedTemplate],
        x: newX,
        y: newY,
      },
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
      dragStartRef.current = null;
    }
  };

  const updatePos = (updates: Partial<TemplatePosition>) => {
    setPositions((prev) => ({
      ...prev,
      [selectedTemplate]: {
        ...prev[selectedTemplate],
        ...updates,
      },
    }));
  };

  const setPresetPosition = (preset: "top" | "center" | "bottom" | "reset") => {
    if (preset === "reset") {
      updatePos({ x: 0, y: 0, scale: 1 });
    } else if (preset === "top") {
      updatePos({ x: 0, y: -450 });
    } else if (preset === "center") {
      updatePos({ x: 0, y: 0 });
    } else if (preset === "bottom") {
      updatePos({ x: 0, y: 380 });
    }
  };

  const nudge = (dx: number, dy: number) => {
    updatePos({
      x: Math.max(-450, Math.min(450, currentPos.x + dx)),
      y: Math.max(-800, Math.min(800, currentPos.y + dy)),
    });
  };

  // Download merged photo with template (when user uploads or tests photo)
  const handleDownloadMergedPhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setDownloading(true);
    try {
      const mergedCanvas = document.createElement("canvas");
      mergedCanvas.width = 1080;
      mergedCanvas.height = 1920;
      const mCtx = mergedCanvas.getContext("2d");
      if (!mCtx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const imgRatio = img.width / img.height;
        const targetRatio = 1080 / 1920;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (imgRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }
        mCtx.drawImage(img, sx, sy, sw, sh, 0, 0, 1080, 1920);

        const grad = mCtx.createLinearGradient(0, 0, 0, 1920);
        grad.addColorStop(0, "rgba(0,0,0,0.3)");
        grad.addColorStop(0.5, "rgba(0,0,0,0.0)");
        grad.addColorStop(1, "rgba(0,0,0,0.4)");
        mCtx.fillStyle = grad;
        mCtx.fillRect(0, 0, 1080, 1920);

        mCtx.drawImage(canvas, 0, 0);

        const dataUrl = mergedCanvas.toDataURL("image/jpeg", 0.92);
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `vyra-story-completo-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setCopyFeedback("✔ Foto completa com o template baixada com sucesso!");
        setTimeout(() => setCopyFeedback(""), 4000);
        setDownloading(false);
      };
      img.onerror = () => {
        handleDownloadTransparentPNG();
        setDownloading(false);
      };
      img.src = simulatorPhoto;
    } catch (err) {
      console.error(err);
      handleDownloadTransparentPNG();
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Top Banner & Return button */}
      <div className="flex items-center justify-between">
        <button
          id="back-to-home-btn"
          onClick={() => setActiveView("home")}
          className="px-3.5 py-2 rounded-xl bg-[#151515] border border-[#2B2B2F] text-xs font-bold text-[#F5F5F7] hover:border-[#FF6A2A] transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#FF6A2A]" />
          <span>Voltar ao Início</span>
        </button>

        <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/40 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Treino Concluído
        </span>
      </div>

      {/* Hero Congratulations Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#151515] via-[#1A1A1E] to-[#121214] border border-[#D8B46A]/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF6A2A]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#D8B46A] to-[#FF6A2A] text-[#0A0A0A] flex items-center justify-center shrink-0 shadow-xl shadow-[#FF6A2A]/30">
              <Trophy className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-black tracking-widest text-[#D8B46A] uppercase block">
                CHECKOUT DO TREINO · INSTAGRAM TEMPLATES
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] mt-0.5">
                Poste seu Treino com Fundo Transparente
              </h1>
              <p className="text-xs sm:text-sm text-[#9B9BA1] mt-1 max-w-xl leading-relaxed">
                Estes templates foram gerados com <strong>fundo 100% transparente (PNG)</strong> para que você tire sua foto no espelho e cole o template por cima no Instagram Stories!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              id="copy-transparent-sticker-main-btn"
              onClick={handleCopyTransparentSticker}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] hover:brightness-110 text-white font-black text-sm transition-all shadow-xl shadow-[#FF6A2A]/25 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copiado!" : "Copiar Figurinha Transparente"}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert if copied */}
        {copyFeedback && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#34C759]/15 border border-[#34C759]/40 text-[#34C759] text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{copyFeedback}</span>
          </div>
        )}
      </div>

      {/* Main Studio Grid: Left Side Controls & Template Selection, Right Side Canvas Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Template Options & Instructions (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Template Selector Cards */}
          <div className="p-5 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-3">
            <h3 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FF6A2A]" />
                1. Escolha seu Estilo de Template
              </span>
              <span className="text-[#FF6A2A] font-black text-[11px]">4 Opções</span>
            </h3>

            <div className="space-y-2.5">
              {templatesList.map((tpl) => {
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    id={`select-template-${tpl.id}-btn`}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-[#FF6A2A]/15 border-[#FF6A2A] text-[#F5F5F7] shadow-lg shadow-[#FF6A2A]/10"
                        : "bg-[#1D1D1F] border-[#2B2B2F] text-[#9B9BA1] hover:text-[#F5F5F7] hover:border-[#3D3D42]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#F5F5F7] block">
                          {tpl.name}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            isSelected
                              ? "bg-[#FF6A2A] text-white border-[#FF6A2A]"
                              : "bg-[#2B2B2F] text-[#9B9BA1] border-transparent"
                          }`}
                        >
                          {tpl.badge}
                        </span>
                      </div>
                      <span className="text-xs text-[#9B9BA1] mt-0.5 block">
                        {tpl.subtitle}
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "border-[#FF6A2A] bg-[#FF6A2A] text-[#0A0A0A]"
                          : "border-[#3A3A40]"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Position & Scale Editor Panel */}
          <div className="p-5 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Move className="w-4 h-4 text-[#FF6A2A]" />
                <h3 className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider">
                  2. Posição e Tamanho do Template
                </h3>
              </div>
              <button
                type="button"
                id="reset-template-position-btn"
                onClick={() => setPresetPosition("reset")}
                className="text-[11px] font-bold text-[#9B9BA1] hover:text-[#FF6A2A] flex items-center gap-1 transition-colors cursor-pointer"
                title="Restaurar posição original"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar</span>
              </button>
            </div>

            {/* Quick Position Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#9B9BA1]">Alinhamento Rápido:</span>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  id="preset-top-btn"
                  onClick={() => setPresetPosition("top")}
                  className="py-1.5 px-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[11px] font-bold text-[#F5F5F7] hover:border-[#FF6A2A] hover:text-[#FF6A2A] transition-all text-center cursor-pointer"
                >
                  Topo
                </button>
                <button
                  type="button"
                  id="preset-center-btn"
                  onClick={() => setPresetPosition("center")}
                  className="py-1.5 px-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[11px] font-bold text-[#F5F5F7] hover:border-[#FF6A2A] hover:text-[#FF6A2A] transition-all text-center cursor-pointer"
                >
                  Centro
                </button>
                <button
                  type="button"
                  id="preset-bottom-btn"
                  onClick={() => setPresetPosition("bottom")}
                  className="py-1.5 px-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[11px] font-bold text-[#F5F5F7] hover:border-[#FF6A2A] hover:text-[#FF6A2A] transition-all text-center cursor-pointer"
                >
                  Base
                </button>
                <button
                  type="button"
                  id="preset-default-btn"
                  onClick={() => setPresetPosition("reset")}
                  className="py-1.5 px-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[11px] font-bold text-[#9B9BA1] hover:border-[#D8B46A] hover:text-[#D8B46A] transition-all text-center cursor-pointer"
                >
                  Padrão
                </button>
              </div>
            </div>

            {/* Sliders for precise tuning */}
            <div className="space-y-3 pt-1">
              {/* Vertical Y Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#9B9BA1] font-medium flex items-center gap-1">
                    <ArrowUp className="w-3 h-3 text-[#FF6A2A]" />
                    <ArrowDown className="w-3 h-3 text-[#FF6A2A]" />
                    Posição Vertical (Y)
                  </span>
                  <span className="font-mono text-[#D8B46A] font-bold">{currentPos.y}px</span>
                </div>
                <input
                  id="slider-vertical-y"
                  type="range"
                  min="-650"
                  max="650"
                  step="10"
                  value={currentPos.y}
                  onChange={(e) => updatePos({ y: Number(e.target.value) })}
                  className="w-full accent-[#FF6A2A] bg-[#2B2B2F] h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Horizontal X Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#9B9BA1] font-medium flex items-center gap-1">
                    <ArrowLeftIcon className="w-3 h-3 text-[#FF6A2A]" />
                    <ArrowRight className="w-3 h-3 text-[#FF6A2A]" />
                    Posição Horizontal (X)
                  </span>
                  <span className="font-mono text-[#D8B46A] font-bold">{currentPos.x}px</span>
                </div>
                <input
                  id="slider-horizontal-x"
                  type="range"
                  min="-350"
                  max="350"
                  step="10"
                  value={currentPos.x}
                  onChange={(e) => updatePos({ x: Number(e.target.value) })}
                  className="w-full accent-[#FF6A2A] bg-[#2B2B2F] h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Scale Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#9B9BA1] font-medium flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-[#D8B46A]" />
                    Tamanho / Proporção
                  </span>
                  <span className="font-mono text-[#34C759] font-bold">
                    {Math.round(currentPos.scale * 100)}%
                  </span>
                </div>
                <input
                  id="slider-scale-zoom"
                  type="range"
                  min="0.65"
                  max="1.35"
                  step="0.02"
                  value={currentPos.scale}
                  onChange={(e) => updatePos({ scale: Number(e.target.value) })}
                  className="w-full accent-[#34C759] bg-[#2B2B2F] h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* D-Pad Nudge Buttons */}
            <div className="pt-2 border-t border-[#2B2B2F]/60 flex items-center justify-between">
              <span className="text-[11px] text-[#9B9BA1]">Ajuste Fino (Toques):</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="nudge-left-btn"
                  onClick={() => nudge(-30, 0)}
                  className="w-8 h-8 rounded-lg bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-center text-[#F5F5F7] hover:border-[#FF6A2A] hover:text-[#FF6A2A] cursor-pointer"
                  title="Mover para esquerda"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" />
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    id="nudge-up-btn"
                    onClick={() => nudge(0, -30)}
                    className="w-8 h-8 rounded-lg bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-center text-[#F5F5F7] hover:border-[#FF6A2A] hover:text-[#FF6A2A] cursor-pointer"
                    title="Mover para cima"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    id="nudge-down-btn"
                    onClick={() => nudge(0, 30)}
                    className="w-8 h-8 rounded-lg bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-center text-[#F5F5F7] hover:border-[#FF6A2A] hover:text-[#FF6A2A] cursor-pointer"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  id="nudge-right-btn"
                  onClick={() => nudge(30, 0)}
                  className="w-8 h-8 rounded-lg bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-center text-[#F5F5F7] hover:border-[#FF6A2A] hover:text-[#FF6A2A] cursor-pointer"
                  title="Mover para direita"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#9B9BA1] bg-[#1D1D1F]/70 p-2.5 rounded-xl border border-[#2B2B2F]/40 flex items-center gap-2">
              <span className="text-base">💡</span>
              <span>
                Você também pode <strong>arrastar o template diretamente na foto</strong> ao lado com o mouse ou o toque do dedo!
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="p-5 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-3">
            <h3 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
              3. Ações de Exportação
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                id="btn-copy-transparent"
                onClick={handleCopyTransparentSticker}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#FF6A2A] text-white hover:bg-[#FF9A62] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6A2A]/20 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar Figurinha (Transparente)</span>
              </button>

              <button
                id="btn-download-png"
                onClick={handleDownloadTransparentPNG}
                disabled={downloading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] hover:border-[#D8B46A] hover:text-[#D8B46A] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? "Processando..." : "Baixar PNG Transparente"}</span>
              </button>
            </div>

            {previewMode === "simulator" && (
              <button
                id="btn-download-merged"
                onClick={handleDownloadMergedPhoto}
                disabled={downloading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#D8B46A] text-[#0A0A0A] hover:bg-[#E5C780] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D8B46A]/20"
              >
                <Camera className="w-4 h-4" />
                <span>Baixar Foto com Template (Story Completo)</span>
              </button>
            )}

            <button
              id="btn-native-share"
              onClick={handleShare}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#1D1D1F] border border-[#2B2B2F] text-[#9B9BA1] hover:text-[#F5F5F7] hover:border-[#3D3D42] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#D8B46A]" />
              <span>Compartilhar Direto (Stories / WhatsApp)</span>
            </button>
          </div>

          {/* How to use Guide */}
          <div className="p-5 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-3 text-xs text-[#9B9BA1] leading-relaxed">
            <div className="flex items-center gap-2 text-[#D8B46A] font-bold">
              <Info className="w-4 h-4" />
              <span>Como postar no Instagram:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 marker:text-[#FF6A2A]">
              <li>Clique no botão <strong>"Copiar Figurinha Transparente"</strong>.</li>
              <li>Abra o Instagram Stories e tire sua foto no espelho.</li>
              <li>Toque na tela e selecione <strong>Colar</strong> (ou use a figurinha de fotos para adicionar o PNG salvo).</li>
              <li>Pronto! O template ficará na frente com fundo 100% transparente.</li>
            </ol>
          </div>
        </div>

        {/* Right Column: Interactive Live Preview & Photo Simulator (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Preview Mode Switcher */}
          <div className="p-2 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                id="view-mode-transparent-btn"
                onClick={() => setPreviewMode("transparent")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  previewMode === "transparent"
                    ? "bg-[#FF6A2A] text-white"
                    : "text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver Transparência (Original)</span>
              </button>

              <button
                id="view-mode-simulator-btn"
                onClick={() => setPreviewMode("simulator")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  previewMode === "simulator"
                    ? "bg-[#D8B46A] text-[#0A0A0A]"
                    : "text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Simulador de Foto</span>
              </button>
            </div>

            {/* If Simulator, allow uploading personal photo to test */}
            {previewMode === "simulator" && (
              <label
                htmlFor="upload-simulator-photo"
                className="px-2.5 py-1 rounded-lg bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#D8B46A] text-[11px] font-bold text-[#D8B46A] flex items-center gap-1 cursor-pointer transition-colors"
                title="Testar com sua própria foto do espelho"
              >
                <Upload className="w-3 h-3" />
                <span>Minha Foto</span>
                <input
                  id="upload-simulator-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleSimulatorPhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Canvas & Simulator Container with 9:16 Aspect Ratio */}
          <div
            ref={previewContainerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`relative mx-auto w-full max-w-[380px] aspect-[9/16] rounded-3xl overflow-hidden border-2 border-[#2B2B2F] shadow-2xl bg-black touch-none select-none transition-all group ${
              isDragging ? "cursor-grabbing ring-2 ring-[#FF6A2A]/50" : "cursor-grab"
            }`}
            title="Arraste para mover o template para qualquer lugar da foto"
          >
            {/* Background Layer */}
            {previewMode === "transparent" ? (
              // Checkerboard pattern indicating 100% transparency
              <div
                className="absolute inset-0 w-full h-full opacity-35 pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(45deg, #222 25%, transparent 25%), 
                                    linear-gradient(-45deg, #222 25%, transparent 25%), 
                                    linear-gradient(45deg, transparent 75%, #222 75%), 
                                    linear-gradient(-45deg, transparent 75%, #222 75%)`,
                  backgroundSize: "24px 24px",
                  backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
                }}
              />
            ) : (
              // Simulator Gym Photo Layer
              <div className="absolute inset-0 w-full h-full pointer-events-none">
                <img
                  src={simulatorPhoto}
                  alt="Simulação Foto Aluno"
                  className="w-full h-full object-cover brightness-95"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
              </div>
            )}

            {/* HTML5 Canvas overlay (the actual transparent graphic) */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
            />

            {/* Top Left Badge: Preview mode */}
            <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-black text-[#F5F5F7] flex items-center gap-1.5 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-ping" />
              <span>{previewMode === "transparent" ? "Fundo Transparente (PNG)" : "Simulação no Instagram"}</span>
            </div>

            {/* Top Right Floating Badge: Current Live Coordinates & Scale */}
            <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-[#D8B46A] flex items-center gap-1 pointer-events-none">
              <Move className="w-3 h-3 text-[#FF6A2A]" />
              <span>
                Y: {currentPos.y > 0 ? `+${currentPos.y}` : currentPos.y}px
              </span>
            </div>

            {/* Interactive Drag Hint Overlay */}
            <div className="absolute bottom-3 inset-x-3 z-20 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-medium text-[#9B9BA1] flex items-center justify-between pointer-events-none transition-opacity">
              <span className="flex items-center gap-1 text-[#F5F5F7]">
                <Move className="w-3 h-3 text-[#FF6A2A]" />
                {isDragging ? "Movendo posição livremente..." : "Arraste na foto para posicionar"}
              </span>
              <span className="text-[#D8B46A] font-bold">
                {Math.round(currentPos.scale * 100)}%
              </span>
            </div>
          </div>

          <div className="text-center pt-2">
            <span className="text-[11px] text-[#9B9BA1]">
              Resolução nativa de Stories: 1080 × 1920 pixels · Fundo alfa 100% transparente.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
