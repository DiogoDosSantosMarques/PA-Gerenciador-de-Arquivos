# Bem vindo 

Esse é o nosso projeto desenvolvido para o 5º Semestre do curso de análise e desenvolvimento de sistemas no Projeto Aplicado IV.

## 🌐 **URL de Acesso ao Projeto**
> 🟦 **https://frontend-pa-production.up.railway.app/**


## Tecnologias Utilizadas

Este projeto utiliza as seguintes tecnologias:

<div style="display: flex; gap: 10px;">
   <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Amazon_S3-569A31?style=flat-square&logo=amazonaws&logoColor=white" alt="Amazon S3" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white" alt="Axios" />
</div>

---

## 📦 **Pré-requisitos**

Antes de iniciar, certifique-se de ter instalado:

- **Node.js** (versão recomendada: 18+)
- **NPM** ou **Yarn**
- **PostgreSQL** (ou outro banco configurado no `.env`)
- **Prisma CLI**

---

# 🚀 Guia de Inicialização do Projeto

## 📦 1. Instalar Dependências

Na raiz do projeto, execute:

``` bash
npm install
```

ou:

``` bash
yarn
```

------------------------------------------------------------------------

## ⚙️ 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env`:

``` bash
cp .env.example .env
```

Edite e configure a URL do banco:

``` env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nomedb?schema=public"
```

Se o banco não existir, crie:

``` bash
createdb nomedb
```

------------------------------------------------------------------------

## 🗄️ 3. Rodar as Migrations

Execute as migrations do Prisma:

``` bash
npx prisma migrate dev
```

ou:

``` bash
yarn prisma migrate dev
```

Abrir o Prisma Studio:

``` bash
npx prisma studio
```

------------------------------------------------------------------------

## ▶️ 4. Inicializar o Servidor

### Ambiente de Desenvolvimento

``` bash
npm run dev
```

ou:

``` bash
yarn dev
```

### Ambiente de Produção

``` bash
npm run build
npm start
```

------------------------------------------------------------------------

## 🧪 5. Comandos Complementares

Gerar o Prisma Client manualmente:

``` bash
npx prisma generate
```

Resetar o banco completamente:

``` bash
npx prisma migrate reset
```

------------------------------------------------------------------------

## 📂 Estrutura de Pastas (Exemplo)

    /src
      /controllers
      /routes
      /services
      /prisma
    .env
    package.json
    prisma/schema.prisma

------------------------------------------------------------------------

## 🛠 Logs e Erros Comuns

### 🔴 Erro de conexão com o banco

Verifique: - Credenciais no `.env` - Banco criado - Porta correta do
PostgreSQL

### 🔴 Migrations não executam

Execute:

``` bash
npx prisma generate
```

Depois:

``` bash
npx prisma migrate dev
```
