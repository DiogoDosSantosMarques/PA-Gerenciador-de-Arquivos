# Notas rápidas

- `GET /health` retorna status do serviço, timestamp e uptime. Útil para verificações locais e pipelines.
- Cabeçalho `X-App-Version` é definido em todas as respostas HTTP (atual: `2025.11.27`).
- Rotas de categorias (`/api/categories`) exigem autenticação + admin para criar/remover; listagem é pública.
- Uploads locais estão em `uploads/` e são servidos em `/uploads/{arquivo}`.
