# Fila de Retornos — servidor + front-end React

```
retornos-app/
  server/            # backend (Node + Express) — igual de antes, intacto
  client/            # front-end React (Vite) — o mesmo visual do protótipo original
    src/
      pages/           LoginPage, DashboardPage, AdminPage
      components/      Header, KpiGrid, UrgencyStrip, MetricsPanel, Toolbar,
                        TaskTable, TaskPanel, ActionDialog, AlarmOverlay, Popover
      hooks/useTasks.js   dados + alarme sonoro
      context/            AuthContext (login), ToastContext
      api/client.js        chamadas à API
      utils/format.js       formatação/regra de negócio compartilhada
      styles/theme.css        CSS extraído 1:1 do protótipo original
  public_react/       # build de produção do client (gerado, não editar)
```

## Rodando

```bash
npm install
npm run build:client   # compila o React para public_react/
npm start               # sobe o servidor em http://localhost:3000
```

Em desenvolvimento, para hot-reload do React:
```bash
npm start                    # backend na porta 3000
cd client && npm run dev     # front-end na porta 5173 (proxy /api -> 3000)
```

Logins iniciais: `admin/admin123`, `felipe/poli123`, `analista2/poli123`.

Tudo que existia (KPIs, banner de próximo retorno, métricas por motivo,
filtros, tabela com WhatsApp/concluir/editar/menu de mais ações, diálogo
definitivo/atualização, timeline de estágios, alarme sonoro, export CSV)
está no React, chamando a mesma API do servidor.
