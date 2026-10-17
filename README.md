# RMS-Nutri — Sistema de Gestão Nutricional e Clínica

Sistema web completo para nutricionistas realizarem controle de pacientes, histórico de consultas, avaliações antropométricas e prescrição de planos alimentares, integrado com Neon Database e Neon Auth.

---

## 🚀 Tecnologias

- **Frontend**: React 19, TypeScript, Vite
- **Estilização**: Tailwind CSS v4, Lucide React
- **Banco de Dados**: PostgreSQL Serverless via [Neon Database](https://neon.tech)
- **Autenticação**: Neon Auth (Better Auth gerenciado) com Row Level Security (RLS)

---

## 🔐 Configuração das Variáveis de Ambiente

Para rodar localmente ou configurar no Vercel, crie as variáveis baseadas no `.env.example`:

| Variável | Descrição |
| :--- | :--- |
| `VITE_NEON_AUTH_URL` | URL do endpoint de autenticação do Neon Auth |
| `VITE_NEON_PROJECT_ID` | Identificador do projeto Neon |
| `VITE_NEON_DATABASE_URL` | String de conexão segura com o Neon Database |

> **Nota de Segurança**: O arquivo com os valores reais (`.env.local` / `.env`) está configurado no `.gitignore` e **nunca** deve ser versionado no GitHub. Configure essas variáveis diretamente no painel da Vercel.

---

## 📦 Como Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Compilar bundle de produção
npm run build
```

---

## 🌐 Deploy na Vercel

1. Importe o repositório `https://github.com/santanarodrigomiranda/RMS-Nutri` na [Vercel](https://vercel.com).
2. O framework preset será detectado automaticamente como **Vite**.
3. Na seção **Environment Variables**, adicione as variáveis listadas acima.
4. Clique em **Deploy**.
