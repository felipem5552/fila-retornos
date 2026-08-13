# Fila de Retornos — versão com login e servidor

Versão com backend real: login de verdade (senha com hash + sessão em
cookie httpOnly), cada usuário com sua própria fila de retornos, e um
painel Admin separado para cadastrar/editar/excluir usuários.

## Estrutura

```
retornos-app/
  server/               # backend (Node + Express)
    index.js             # sobe o servidor, cria os logins iniciais
    db.js                 # leitura/escrita do banco (arquivo JSON)
    auth.js                # hash de senha + JWT
    middleware.js           # exige login / exige admin
    routes/
      auth.routes.js          # login, logout, "quem sou eu"
      users.routes.js          # CRUD de usuários (só admin)
      tasks.routes.js           # CRUD dos retornos + ações (concluir/adiar/reabrir)
  public/                # front-end (servido pelo próprio Express)
    shared.css             # tema visual compartilhado
    login.html               # tela de login
    app.html / app.js          # fila de retornos (uso de cada analista)
    admin.html / admin.js        # painel admin (gestão de usuários)
  data/db.json           # "banco de dados" (criado automaticamente)
```

## Rodando localmente

```bash
npm install
npm start
```

Abra `http://localhost:3000` — ele te leva para `login.html`.

Na primeira vez que o servidor sobe (banco vazio), estes logins são
criados automaticamente:

| Usuário     | Senha      | Papel  |
|-------------|------------|--------|
| `admin`     | `admin123` | Admin  |
| `felipe`    | `poli123`  | Usuário |
| `analista2` | `poli123`  | Usuário |

**Troque essas senhas assim que possível** — entre como `admin`, vá em
"Painel Admin" e edite cada usuário (o campo de senha, se preenchido,
substitui a antiga).

## Como funciona o login

- Senhas nunca ficam salvas em texto puro — usam hash (`bcrypt`).
- Sessão é um token JWT guardado num cookie `httpOnly` (não pode ser lido
  por JavaScript no navegador, o que protege contra roubo de sessão).
- Cada usuário só enxerga e só consegue mexer nos **próprios** retornos —
  isso é garantido no servidor, não no front-end (então não dá pra
  burlar só editando o HTML/JS do navegador).
- Só quem tem `role: admin` consegue acessar as rotas de gestão de
  usuários — validado no servidor também.

## Colocando no ar (deploy)

Qualquer serviço que rode Node.js funciona (Render, Railway, Fly.io, um
VPS com PM2, etc). Passos gerais:

1. Suba este projeto pro GitHub (ou envie os arquivos direto pro host).
2. Configure a variável de ambiente `JWT_SECRET` com uma string longa e
   aleatória (copie `.env.example` para `.env` se for rodar num VPS
   próprio; em Render/Railway isso se configura no painel deles).
3. Comando de start: `npm start`.
4. **Importante**: o arquivo `data/db.json` guarda todos os dados. Em
   hosts com sistema de arquivos "efêmero" (alguns free tiers apagam o
   disco a cada deploy), isso vai perder os dados. Se for esse o caso,
   me avise que adaptamos para usar um banco externo (Postgres) — a
   troca fica isolada em `server/db.js`, o resto do app não muda.

## O que NÃO está nesta versão (ainda)

Para focar em entregar login + isolamento de dados funcionando de
verdade, esta primeira versão **não** inclui (mas dá pra portar da
versão local se você quiser):

- Alarme sonoro/pop-up automático no horário do retorno
- Tutorial guiado de primeiro uso
- Central de Atendimento (capacidade diária, métricas, playbook)
- Exportar/Importar CSV/JSON, exportar `.ics`
- Copiar mensagem pronta / resumo do card / resumo do dia
- Ordenação por coluna, modo compacto

O núcleo (criar, editar, concluir com diálogo "definitivo ou
atualização", adiar rápido ou com motivo, histórico de estágios do
atendimento, busca e filtro por motivo) está todo funcional.
