# co-ty-phu — Socket Server

Node.js + Socket.io realtime server cho **Cờ Tỷ Phú Toàn Cầu**.

> Repo này là backend. Frontend ở repo `web-FE` trong org `MLN122-CoTyphu`.

## Yêu cầu

- Node.js >= 18
- npm >= 9

## Chạy local

### 1. Clone & cài dependencies

```bash
git clone git@github.com:MLN122-CoTyphu/socket-server-BE-.git
cd socket-server-BE-
npm install
```

### 2. Tạo file .env.local

```bash
cp env.example .env.local
```

Mở `.env.local` và điền giá trị thực (nhận từ team lead):

```
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

### 3. Chạy dev

```bash
npm run dev
```

Server chạy tại: `http://localhost:4000`

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dev với hot-reload (ts-node-dev) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Chạy production (`node dist/index.js`) |

## Deploy lên Railway

1. Vào [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → chọn repo này
2. Railway tự detect `package.json` và chạy `npm start`
3. Thêm các **Environment Variables** trên Railway dashboard (không commit .env lên GitHub):

```
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://<your-web>.vercel.app
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

## Cấu trúc

```
src/
├── index.ts          ← entry point, Express + Socket.io setup
├── types/            ← TypeScript interfaces
├── game/             ← game logic handlers
├── data/             ← dữ liệu ô bàn cờ, thẻ sự kiện
└── db/               ← Supabase client
```
