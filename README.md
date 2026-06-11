# 🌱 IrrigaBot

Painel web para monitoramento e controle de um sistema de irrigação automática baseado em **ESP32**. Mostra umidade do solo, luminosidade, estado da bomba d'água, perfis de plantas e um log de eventos em tempo real.

Construído com **TanStack Start (React 19 + Vite 7)** e **Tailwind CSS v4**.

---

## ✨ Funcionalidades

- 📊 Dashboard com umidade do solo e luminosidade em tempo real
- 💧 Acionar / desligar a bomba d'água manualmente
- 🤖 Modo automático com limites mínimo e máximo de umidade
- 🌿 Perfis prontos de plantas (temperos, suculentas, flores, hortaliças, arbustos)
- ☀️ Monitor de tempo com luminosidade abaixo de um alvo configurável
- 📝 Log de atividades (bomba ligada/desligada, ESP online/offline, etc.)
- 🔌 Comunicação com o ESP32 via proxy interno (`/api/status`, `/api/pump`, `/api/config`)

---

## 🛠 Pré-requisitos

- **[Bun](https://bun.sh/)** (recomendado) ou Node.js 20+
- Um **ESP32** rodando o firmware do irrigador exposto em uma URL HTTP
  (rede local ou túnel público como [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) / [ngrok](https://ngrok.com/))

---

## 🚀 Como rodar localmente

```bash
# 1. Clone o repositório
git clone <URL_DO_SEU_REPO>
cd <nome-do-repo>

# 2. Instale as dependências
bun install
# ou: npm install

# 3. Configure as variáveis de ambiente (veja abaixo)
cp .env.example .env   # se existir, ou crie manualmente

# 4. Rode em modo desenvolvimento
bun run dev
# ou: npm run dev
```

O app sobe em **http://localhost:8080**.

---

## 🔐 Variáveis de ambiente

Crie um arquivo `.env` na raiz com:

```bash
# URL base do ESP32 (sem barra no final)
ESP_IP=https://seu-tunel.trycloudflare.com
```

Sem essa variável o app entra em **modo simulado** (exibe dados fake e mostra um aviso de "ESP32 offline").

---

## 📜 Scripts disponíveis

| Comando         | O que faz                                      |
| --------------- | ---------------------------------------------- |
| `bun run dev`   | Servidor de desenvolvimento (Vite + SSR)       |
| `bun run build` | Build de produção                              |
| `bun run preview` | Faz preview do build                         |
| `bun run lint`  | Roda o ESLint                                  |
| `bun run format`| Formata o código com Prettier                  |

---

## 📁 Estrutura do projeto

```
src/
├── routes/
│   ├── __root.tsx        # Layout raiz
│   ├── index.tsx         # Dashboard principal
│   └── api/
│       ├── status.ts     # GET status do ESP
│       ├── pump.ts       # POST liga/desliga bomba
│       └── config.ts     # POST limites e modo auto
├── lib/
│   └── esp.ts            # Proxy / fallback simulado
├── components/ui/        # Componentes shadcn/ui
└── styles.css            # Tokens Tailwind v4
```

---

## 🔌 Endpoints esperados no ESP32

O firmware do ESP deve expor:

| Método | Rota                                       | Resposta / efeito                                     |
| ------ | ------------------------------------------ | ----------------------------------------------------- |
| GET    | `/status`                                  | JSON com `solo`, `luz`, `bomba`, `auto`, `limiteMin`, `limiteMax` |
| POST   | `/pump?state=1` / `/pump?state=0`          | Liga (1) ou desliga (0) a bomba                       |
| POST   | `/config?min=40&max=70&auto=1`             | Atualiza limites e modo automático                    |

---

## 📦 Deploy

O projeto está pronto para rodar em qualquer plataforma compatível com **Cloudflare Workers / edge runtimes** (configuração padrão do template TanStack Start usado). Basta configurar a variável `ESP_IP` no ambiente de produção.

---

## 📄 Licença

MIT — sinta-se livre para usar, modificar e distribuir.
