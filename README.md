# BrokerX Bot — Central de Operações

Aplicação web para automação de operações na corretora (API MyBroker). O usuário
entra apenas com a **chave API**, preenche um onboarding e acessa a central, onde
ativa/desativa um robô que opera sozinho no ritmo configurado.

## Funcionalidades

- **Login por chave API** (mesma chave usada como credencial) com validação real e
  seção "Como obter minha chave API".
- **Onboarding** com nome, e-mail e telefone.
- **Central do robô**:
  - define **operações por hora** e valor por operação;
  - **ativos sorteados automaticamente** (o usuário não escolhe);
  - liga/desliga o robô — ele **não se desliga sozinho**;
  - **termo de aceite** antes de ativar (com aviso reforçado para conta Real);
  - histórico de operações com o **logo da cripto** em cada linha.
- Estética: preto + verde-limão fluorescente, sem emojis (apenas SVGs).

## Arquitetura

- **Next.js 14** (App Router) + React 18, TypeScript.
- As chamadas à corretora passam por um **proxy server-side** em `app/api/*`
  (`lib/broker.ts`), no domínio `broker-api.mybrokerdev.com` com os headers
  `api-token`, `x-timestamp` e `x-partner`. Isso mantém o front same-origin e
  evita CORS.
- Abertura de operação usa `POST /token/trades/open-async` (não exige bot interno).

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de produção
```

## Estrutura

```
app/
  api/{wallets,trades,open}/route.ts   proxy server-side da corretora
  layout.tsx  page.tsx  globals.css
components/
  LoginScreen.tsx  Onboarding.tsx  Central.tsx  TermsModal.tsx  icons.tsx
lib/
  api.ts  broker.ts  storage.ts  assets.ts  useBot.ts
public/
  logo.png  crypto/*.png
```

> Operações em conta **Real** utilizam saldo real. Use por sua conta e risco.
