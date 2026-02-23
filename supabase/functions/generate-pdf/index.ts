import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface GeneratePdfRequest {
  html: string;
  options?: {
    filename?: string | null;
    format?: 'a4' | 'letter';
    orientation?: 'portrait' | 'landscape';
  };
}

const MAX_HTML_BYTES = 2 * 1024 * 1024; // 2 MB
const DEFAULT_TIMEOUT_MS = 25000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

function normalizeRendererUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (trimmed.endsWith('/forms/chromium/convert/html')) return trimmed;
  if (trimmed.endsWith('/')) return `${trimmed}forms/chromium/convert/html`;
  return `${trimmed}/forms/chromium/convert/html`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { html, options }: GeneratePdfRequest = await req.json();

    if (!html) {
      return new Response(JSON.stringify({ error: 'HTML is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const htmlBytes = new TextEncoder().encode(html).byteLength;
    if (htmlBytes > MAX_HTML_BYTES) {
      return new Response(JSON.stringify({
        error: 'HTML payload too large',
        maxBytes: MAX_HTML_BYTES,
        receivedBytes: htmlBytes,
      }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rendererUrl = Deno.env.get('PDF_RENDERER_URL');
    const rendererToken = Deno.env.get('PDF_RENDERER_TOKEN');
    const timeoutMs = Number(Deno.env.get('PDF_RENDERER_TIMEOUT_MS') || DEFAULT_TIMEOUT_MS);
    const filename = (options?.filename || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
    const format = options?.format || 'a4';
    const orientation = options?.orientation || 'portrait';

    if (!rendererUrl) {
      return new Response(JSON.stringify({
        error: 'PDF renderer is not configured',
        message: 'Set PDF_RENDERER_URL secret (Gotenberg / Chromium render endpoint).',
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const targetUrl = normalizeRendererUrl(rendererUrl);
    const form = new FormData();
    form.append('files', new File([html], 'index.html', { type: 'text/html' }));
    form.append('paperWidth', format === 'letter' ? '8.5' : '8.27');
    form.append('paperHeight', format === 'letter' ? '11' : '11.69');
    form.append('landscape', orientation === 'landscape' ? 'true' : 'false');
    form.append('printBackground', 'true');

    const upstreamHeaders: Record<string, string> = {};
    if (rendererToken) {
      upstreamHeaders.Authorization = `Bearer ${rendererToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('timeout'), timeoutMs);
    let upstream: Response;
    try {
      upstream = await fetch(targetUrl, {
        method: 'POST',
        headers: upstreamHeaders,
        body: form,
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const message = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
      return new Response(JSON.stringify({
        error: 'Renderer is unreachable',
        message,
        timeoutMs,
      }), {
        status: 504,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    clearTimeout(timeoutId);

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      return new Response(JSON.stringify({
        error: 'Renderer request failed',
        status: upstream.status,
        rendererUrl: targetUrl,
        detail: detail.slice(0, 1000),
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pdfBuffer = await upstream.arrayBuffer();
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
