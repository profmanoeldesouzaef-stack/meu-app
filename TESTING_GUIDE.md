# Guia de Testes do Aplicativo Vyra (Coach vs. Aluno & Stripe Checkout)

Este documento descreve como testar e validar todas as novas lógicas de interface implementadas, garantindo que os fluxos de **Coach**, **Aluno**, **Paywall**, **Calendário Semanal** e **Checkout Dinâmico** operem com integridade.

---

## 1. Teste de Separação de Papéis (Perfil / `profile.tsx`)

### Visão do Aluno (`student`)
- **Como testar:** Faça login com um e-mail de aluno comum (ou altere o perfil no Supabase para `role = 'student'`).
- **Comportamento esperado:**
  - Seções visíveis:
    - **Assinatura & Cartão de Crédito**: Gestão de forma de pagamento e cartões salvos.
    - **Meu Protocolo**: Visualização da periodização, foco muscular e calorias prescritas.
    - **Avaliação Física (20 Dias)**: Formulário de peso, medidas corporais (braço, cintura, peitoral, coxa) e upload de fotos.
    - **Status da Patente / Veterano**: Emblemas e meses de fidelidade.
  - **Oculto**: Nenhum botão de gestão financeira ou gestão de alunos deve ser exibido.

### Visão do Coach (`coach`)
- **Como testar:** Faça login com `cubocao@gmail.com` ou qualquer e-mail de coach cadastrado (`coach@vyra.club`, `mari@vyra.club`, etc., ou `role = 'coach'`).
- **Comportamento esperado:**
  - Seções ocultas:
    - Ocultos os botões de "Assinatura / Cartão de Crédito", "Meu Protocolo" e avaliação de aluno.
  - Seções visíveis:
    - **Dashboard Financeiro**: Modal com faturamento líquido mensal, MRR de alunos, taxa de retenção e histórico de repasses.
    - **Gestão de Alunos**: Modal com lista de alunos, status de assinatura, nível de patente e ação de **Prescrever / Despachar Treino**.

---

## 2. Teste do Calendário Semanal de Treinos (Visão do Aluno)

- **Local:** Aba de **Treino**.
- **Comportamento esperado:**
  - No topo da tela, é exibido o **Calendário Semanal** interativo com os 7 dias da semana (Segunda a Domingo).
  - O dia atual é identificado visualmente com borda destacada e o dia selecionado fica em evidência.
  - Ao alternar entre os dias:
    - Se houver treino prescrito para o dia selecionado: Carrega os blocos de exercícios, contadores de séries, histórico de cargas e timer flutuante de descanso.
    - Se for um dia sem treino prescrito: Apresenta o estado amigável **"Dia de Descanso & Regeneração"**, reforçando a hidratação e sono anabólico.

---

## 3. Teste do Paywall & Proteção de Rotas

- **Cenário:** Aluno com assinatura inativa (`subscription.active = false`).
- **Telas protegidas:** Treino, Dieta e Desafio.
- **Comportamento esperado:**
  - O conteúdo é imediatamente protegido e substituído pelo componente `EmptyStatePaywall`.
  - Exibe a mensagem oficial:  
    `"Assinatura Inativa. Libere seu acesso para visualizar seu treino e dieta."`
  - Ao clicar no botão **"Assinar Agora"**, o usuário é redirecionado instantaneamente para a aba de **Perfil**, onde pode selecionar um plano ou gerenciar seu pagamento.
  - Usuários identificados como **Coach** têm acesso livre sem bloqueio de paywall.

---

## 4. Teste do Checkout Dinâmico (Stripe & PIX)

- **Local:** Tela de Checkout (`/checkout` ou via seleção de plano).
- **Como testar:**
  1. Selecione um plano (ex: Trimestral ou Anual).
  2. Alterne entre os métodos de pagamento:
     - **Cartão de Crédito**: Abre o modal com os campos seguros para inserção do cartão com o valor real associado ao `price_id`.
     - **PIX**: Dispara a chamada para `/stripe-checkout` com `paymentMethod: 'pix'`, gerando o QR Code instantâneo e o código Copia e Cola.
  3. Ao confirmar o pagamento, a rota `/subscription/confirm-payment` atualiza o status no Supabase e ativa o acesso imediatamente.

---

## 5. Teste de Persistência e Aderência Semanal (Sem Dados Mockados)

- **Local:** Tela Inicial (`HomeView.tsx`) e Perfil (`ProfileView.tsx`).
- **Verificação:**
  - O componente de aderência semanal calcula a presença e conclusão de treinos com base nos registros reais do Supabase (`workout_logs`) e logs locais de sessões.
  - As medidas corporais no Perfil (braço, cintura, peitoral, coxa) leem os valores dinâmicos do objeto `profile` do Supabase, sem valores fixos de exemplo.
