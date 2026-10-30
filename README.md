# Derrumbes Urbanos - Emergencia

Videojuego táctico de simulación de emergencias viales y despeje de derrumbes con maquinaria pesada, sistema de cambios de marcha, sirenas de tren, freno de motor, tráfico civil y escudo de alta resistencia.

## Despliegue en Vercel

El proyecto está configurado para desplegarse automáticamente en [Vercel](https://vercel.com):

### Opción 1: Conectar con GitHub / GitLab / Bitbucket (Recomendado)
1. Sube tu código a un repositorio (ej. GitHub).
2. Entra en [vercel.com](https://vercel.com) e inicia sesión.
3. Haz clic en **"Add New Project"** e importa tu repositorio.
4. Vercel detectará la configuración automáticamente gracias al archivo `vercel.json`:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Haz clic en **"Deploy"**.

### Opción 2: Usar Vercel CLI
1. Instala Vercel CLI globalmente:
   ```bash
   npm i -g vercel
   ```
2. Ejecuta el comando en la raíz del proyecto:
   ```bash
   vercel
   ```
3. Para desplegar directamente a producción:
   ```bash
   vercel --prod
   ```
