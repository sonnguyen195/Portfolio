# Portfolio - Nguyễn Minh Sơn

Frontend portfolio được build bằng **React + Vite** (TypeScript), mock data ngay trên FE (không cần backend) để dễ deploy static lên `sonnguyen-portfolio.com`.

## Chạy local

```bash
cd portfolio/frontend
npm install          # đã chạy 1 lần thì có thể bỏ qua
npm run dev          # mở http://localhost:5173/
```

## Build production

```bash
cd portfolio/frontend
npm run build        # tạo thư mục dist/
```

Thư mục `dist/` là static assets, có thể serve bằng bất kỳ web server nào (Nginx, Caddy, Apache, S3 + CloudFront, v.v.).

## Gợi ý cấu hình Nginx cho `sonnguyen-portfolio.com`

Giả sử bạn deploy trên 1 VPS Linux với Nginx, copy nội dung `dist/` lên thư mục ví dụ `/var/www/sonnguyen-portfolio.com`.

File cấu hình Nginx tối thiểu:

```nginx
server {
    listen 80;
    server_name sonnguyen-portfolio.com www.sonnguyen-portfolio.com;

    root /var/www/sonnguyen-portfolio.com;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    access_log /var/log/nginx/sonnguyen-portfolio.access.log;
    error_log  /var/log/nginx/sonnguyen-portfolio.error.log;
}
```

Các bước cơ bản:

1. Build project:
   ```bash
   npm run build
   ```
2. Copy thư mục `dist/` lên server (scp/rsync).
3. Cập nhật `root` trong config Nginx trỏ tới thư mục đó.
4. `sudo nginx -t` để kiểm tra config, sau đó `sudo systemctl reload nginx`.

Sau khi trỏ DNS của `sonnguyen-portfolio.com` về IP server, site sẽ hoạt động ở dạng static SPA.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
