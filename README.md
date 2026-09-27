# VYRA Training & Performance

Clube de treino, nutrição e performance de alta fidelidade com estética Obsidian & Gold, separação de papéis (Aluno, Coach, Moderador), sincronização em tempo real via Supabase, integração Stripe e assistência nutricional com Google GenAI.

---

## ⚡ Comandos Rápidos

### 1. Desenvolvimento Local
Para iniciar o servidor de desenvolvimento completo (Express + Vite middlewares):
```bash
npm run dev
```
O servidor estará acessível na porta `3000` (ex: `http://localhost:3000`).

### 2. Validação de Tipos & Linting
Para verificar erros de compilação TypeScript sem gerar arquivos:
```bash
npm run lint
```
Equivale a `tsc --noEmit`.

### 3. Compilação de Produção
Para compilar tanto a aplicação frontend (Vite) quanto o bundle do servidor (esbuild):
```bash
npm run build
```
Os artefatos gerados ficarão localizados na pasta `dist/`:
- `dist/index.html` e `dist/assets/*` (Frontend estático)
- `dist/server.cjs` (Servidor Node.js empacotado)

### 4. Execução em Produção
```bash
npm start
```
Inicia o bundle em `node dist/server.cjs`.

---

## 🛡️ Arquitetura e Controle de Acesso (RBAC)

O sistema implementa uma política de segregação de acessos por papel de usuário:
- **Aluno (`student`)**: Acesso à periodização diária, calendário semanal de treinos, cardápios e substituição de alimentos, envio e votação de fotos de evolução, diário de medidas corporais e paywall quando a assinatura estiver inativa.
- **Coach (`coach`)**: Painel de comando exclusivo (`CoachDashboardView`), prescrição e envio de treinos diários e semanais, radar de alunos com aderência, métricas de faturamento e gestão de protocolos.
- **Moderador (`moderator`)**: Painel de moderação de fotos e comunidade (`ModeratorView`), aprovação/rejeição de envios de participantes, gestão de banners de premiação e combate a fraudes.

---

## 📦 Estrutura de Arquivos

```
├── api/                    # Serverless Functions (ex: /api/create-checkout-session para Vercel)
├── public/                 # Imagens e ativos estáticos (ex: logo.png)
├── src/
│   ├── components/         # Componentes reutilizáveis (Header, Navigation, Paywall, Banners)
│   ├── context/            # AppContext com autenticação, papéis e estados globais
│   ├── views/              # Telas (HomeView, WorkoutsView, DietView, ChallengesView, ProfileView, etc.)
│   ├── lib/                # Clientes auxiliares e integração Supabase / Stripe
│   ├── types.ts            # Definições de tipos e interfaces do TypeScript
│   └── main.tsx            # Ponto de entrada React 19
├── server.ts               # Servidor Express Full-Stack com rotas de API, Gemini e proxy Vite
├── vercel.json             # Regras de redirecionamento SPA e exclusão da pasta /api/
├── package.json            # Dependências e scripts de execução
├── tsconfig.json           # Configuração estrita do compilador TypeScript
└── supabase_challenge_photos.sql # DDL com tabelas, RLS e triggers anti-duplicação de votos
```

---

## 🌐 Deploy na Vercel

O projeto está configurado para deploy imediato na Vercel:
- `vercel.json` inclui redirecionamento SPA para `index.html`, preservando chamadas para as serverless functions em `/api/*`.
- O comando de build `npm run build` compila o Vite sem erros de tipagem.
