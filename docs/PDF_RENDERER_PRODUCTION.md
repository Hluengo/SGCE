# PDF Renderer Production Cutover

## Estado actual
- La Edge Function `generate-pdf` ya está desplegada en `pfvrgrwlxbqiwatcaoop`.
- Hoy usa `PDF_RENDERER_URL` apuntando a demo pública de Gotenberg.

## Pendiente para cerrar producción
1. Desplegar tu instancia propia de Gotenberg.
2. Configurar secretos en Supabase:
   - `PDF_RENDERER_URL`
   - `PDF_RENDERER_TOKEN` (si tu instancia exige auth)
   - `PDF_RENDERER_TIMEOUT_MS` (opcional)
3. Redeploy de la función:
   - `npx supabase functions deploy generate-pdf`
4. Smoke test:
   - `npm run test:pdf:smoke`

## Ejemplo de comandos
```bash
npx supabase secrets set PDF_RENDERER_URL="https://tu-gotenberg.com"
npx supabase secrets set PDF_RENDERER_TOKEN="tu-token-opcional"
npx supabase secrets set PDF_RENDERER_TIMEOUT_MS="25000"
npx supabase functions deploy generate-pdf
npm run test:pdf:smoke
```

## Notas
- Si `PDF_RENDERER_URL` es host base, la función agrega automáticamente `/forms/chromium/convert/html`.
- La función rechaza payload HTML > 2 MB con `413`.
- Timeout upstream configurable (default 25s) con respuesta `504` clara.
