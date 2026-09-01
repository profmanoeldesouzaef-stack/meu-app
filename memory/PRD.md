# VYRA Training & Performance — PRD

## Visão
App fitness premium — clube de treino com estética escura, editorial, laranja queimado (#FF6A2A). Baseado no documento `vyra-fitness` enviado. Refeito na stack Emergent (FastAPI + MongoDB + Expo Router) para o usuário editar livremente no futuro.

## Personas
- **Aluno** (padrão) — vê Início, Treinos, Dieta, Evolução, Perfil, Desafios, Comunidade.
- **Coach** / **Moderador** — desbloqueia o Painel Gerencial (KPIs, Financeiro, Montar treino, Radar).

Troca de persona em `Perfil → Persona demo`, sem cadastro (modo demonstração).

## Idiomas & Preços
- **Toggle PT ⇄ EN** em Login e em Perfil.
- PT usa **BRL (R$)** — Reset 12 R$297/mês, R$797/tri, R$2.497/ano; Shape a partir de R$147; Forge a partir de R$167.
- EN usa **USD ($)** — Reset 12 $59/mês, $159/qtr, $499/yr.

## Telas
1. **Login/Demo** — email/senha mock + "Entrar em modo demonstração" + toggle idioma.
2. **Paywall/Vitrine** — 3 planos (Reset 12 gold, Shape pink, Forge blue), ciclos mensal/trimestral/anual, badge "Mais solicitado", card "Em breve · Vyra Kids".
3. **Checkout** — resumo, cupom `VYRA10` (10%) ou `RESET25` (25%), total dinâmico, "Confirmar compra" ativa assinatura.
4. **Início (tab)** — saudação, upsell premium se sem assinatura, progresso da semana, hero do treino do dia, macros do dia, atalhos Desafios/Comunidade.
5. **Treinos (tab)** — 6 exercícios do dia, progresso %, marcar concluído, CTA "Analisar execução (IA)", "Finalizar treino".
6. **Dieta (tab)** — macro-calculadora (kcal ± 50), distribuição P/C/G em % + gramas, 5 refeições com substituição.
7. **Evolução (tab)** — peso atual, delta, mini gráfico de barras histórico, bottom-sheet para registrar peso/cintura, galeria do shape.
8. **Perfil (tab)** — avatar, badge da assinatura, seletor de persona, seletor de idioma (com moeda), sair, versão.
9. **Form Checker** — placeholder de vídeo, checklist, análise mockada com nota técnica, veredito e 3 dicas (PT/EN).
10. **Desafios** — grade Antes/Depois, filtros (Todos, Reset 12, Shape, Forge), like persistido, "Publicar transformação".
11. **Comunidade** — chat global com FAB persistente na barra de tabs, coach com selo dourado.
12. **Coach/Admin** — 4 abas: Overview (KPIs), Finanças (novo cupom + parceiros isentos), Treinos (montar treino, salvar rascunho), Radar (alertas de alunos).

## Backend (`/api/*`)
- `GET /plans`, `GET /workout/today`, `GET/PUT /diet`, `GET/POST /progress`, `GET /challenges`, `POST /challenges/{id}/like`, `GET/POST /chat`, `POST /coupon/check`, `GET /kpis`, `GET /radar`, `GET /form-checker/mock`.
- MongoDB coleções: `plans, workouts, diet, progress, challenges, chat, kpis, radar` — todos com **seed automático no startup**.

## Design tokens
Obsidian #0A0A0A, glass #151515/#1D1D1F, borda #2B2B2F, texto #F5F5F7/#9B9BA1, marca #FF6A2A, gold #D8B46A, pink #D96E92, blue #6D9BFF. Cards 20-24px radius, botões 52px altura / 16px radius.
