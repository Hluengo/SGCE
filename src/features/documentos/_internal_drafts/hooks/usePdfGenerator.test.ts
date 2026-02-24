import { describe, it, expect } from 'vitest';

import { sanitizeHtml } from './usePdfGenerator';

describe('sanitizeHtml', () => {
  it('removes script tags and keeps content', () => {
    const input = '<div>hola<script>alert(1)</script></div>';
    const out = sanitizeHtml(input);
    expect(out).not.toContain('<script>');
    expect(out).toContain('hola');
  });

  it('escapes dangerous attributes', () => {
    const input = '<img src=x onerror=alert(1) />';
    const out = sanitizeHtml(input);
    expect(out).not.toContain('onerror');
  });
});
