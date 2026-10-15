# Despliegue de Conutria con servicios gratuitos

La arquitectura preparada es: cliente React en Cloudflare Pages, API Node/Express en Render y MySQL en Aiven. Usa un dominio propio con dos subdominios bajo el mismo dominio registrable, por ejemplo `www.tudominio.com` para la app y `api.tudominio.com` para la API. Así las cookies de sesión seguras funcionan entre ambos servicios.

No subas contraseñas, claves, certificados ni archivos `.env` al repositorio. El `.gitignore` excluye esos archivos; `server/.env.example` solo contiene nombres de variables y ejemplos.

## 1. Publica el repositorio

Sube el proyecto a GitHub. Mantén el repositorio privado si contiene configuración interna y revisa que el certificado de Aiven y tus `.env` estén excluidos antes de publicar.

## 2. Crea MySQL en Aiven

1. Crea un servicio MySQL y una base de datos para Conutria.
2. Descarga el certificado CA de Aiven y guárdalo en `server/prisma/ca.pem`.
3. Prepara `DATABASE_URL` con el host, puerto, base, usuario y contraseña de Aiven:

   `mysql://USUARIO:CONTRASEÑA_CODIFICADA@HOST:PUERTO/BASE?sslcert=ca.pem&sslaccept=strict&connection_limit=5`

   Codifica los caracteres especiales de la contraseña como URL (por ejemplo, `@` como `%40`). Prisma resuelve el certificado desde `server/prisma`.

## 3. Despliega la API en Render

1. En Render selecciona **New → Blueprint**, conecta el repositorio y confirma el servicio descrito en `render.yaml`.
2. Completa las variables secretas solicitadas:
   - `DATABASE_URL`: URL TLS de Aiven.
   - `CLIENT_URL`: origen final del cliente, por ejemplo `https://www.tudominio.com` (sin `/` al final).
   - `PUBLIC_API_URL`: URL pública de la API, por ejemplo `https://api.tudominio.com` (sin `/` al final).
   - `SUPERADMIN_EMAIL`: correo de tu cuenta administradora.
   - `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET`: credenciales de producción de Mercado Pago.
   - `RESEND_API_KEY` y `MAIL_FROM`: configuración de envío de correo.
3. Render genera `JWT_SECRET`. Cuando el dominio de la API esté conectado, valida `https://api.tudominio.com/api/health`; debe responder `{"ok":true}`.

Render ejecuta `prisma migrate deploy` al iniciar el servicio. Si aún no tienes las credenciales de pagos o correo, déjalas vacías y no actives esos flujos hasta configurarlas.

## 4. Conecta el dominio a Cloudflare

Usa Cloudflare como DNS gratuito para el dominio. Añádelo a Cloudflare y sigue el cambio de nameservers indicado por el panel del registrador.

### API en Render

En el servicio de Render abre **Settings → Custom Domains**, añade `api.tudominio.com` y sigue sus instrucciones DNS. Para el registro CNAME de `api`, apunta a `Conutria-api.onrender.com`; durante la validación TLS déjalo como **DNS only** (nube gris) y elimina cualquier registro AAAA conflictivo. Espera a que Render indique que el certificado TLS está listo.

### Cliente en Cloudflare Pages

1. En Cloudflare abre **Workers & Pages → Create application → Pages → Connect to Git** y elige el repositorio.
2. Configura **Root directory** como `client`, **Build command** como `npm run build` y **Build output directory** como `dist`.
3. En las variables de entorno de producción del proyecto Pages añade `VITE_API_URL` con el valor `https://api.tudominio.com/api`.
4. Despliega. En **Custom domains** añade `www.tudominio.com` y sigue las instrucciones DNS de Cloudflare.
5. En Render confirma que `CLIENT_URL` coincida exactamente con `https://www.tudominio.com`. Guarda cambios y vuelve a desplegar el cliente para que incorpore `VITE_API_URL`.

Cloudflare Pages sirve las rutas de esta app React como SPA de forma automática mientras no se agregue un `404.html` de nivel superior.

## 5. Crea el superadministrador

Cuando Render y Aiven estén listos, en tu equipo crea `server/.env.production` a partir de `server/.env.example` y configura allí la URL `DATABASE_URL` de Aiven y `SUPERADMIN_EMAIL`. Este archivo está ignorado por Git. En PowerShell, desde `server`, ejecuta:

```powershell
$env:DOTENV_CONFIG_PATH = '.env.production'
npm run create-superadmin
Remove-Item Env:DOTENV_CONFIG_PATH
```

El script solicitará nombre, correo y contraseña.

## 6. Activa pagos y correo

En Mercado Pago configura el webhook con:

`https://api.tudominio.com/api/webhooks/mercadopago`

Guarda las credenciales de producción y `PUBLIC_API_URL` en Render. Verifica también el dominio remitente en Resend antes de usar `MAIL_FROM`. Si aún no tienes dominio, Render puede ofrecer temporalmente `https://Conutria-api.onrender.com`, pero actualiza `PUBLIC_API_URL`, `CLIENT_URL` y `VITE_API_URL` a los subdominios propios antes de habilitar el acceso de clientes.

## Límites del presupuesto de $0

- Cloudflare Pages puede alojar los archivos estáticos de React en su plan Free; el límite gratuito actual incluye 500 builds al mes.
- Render Free suspende el servicio web tras 15 minutos sin tráfico; una visita posterior puede esperar alrededor de un minuto mientras despierta. No ofrece las garantías de disponibilidad de un plan de producción.
- Aiven MySQL Free incluye 1 GB de RAM y 1 GB de almacenamiento, sin SLA; está pensado para prototipos y cargas pequeñas.
- La combinación sirve para preparar y validar el despliegue, pero no es una base adecuada para comprometer disponibilidad o almacenar datos clínicos reales sin evaluar capacidad, respaldos, seguridad y obligaciones aplicables.
