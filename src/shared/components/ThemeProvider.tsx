import React, { useEffect } from "react";
import { useTenant } from "@/shared/context/TenantContext";
import { useTenantBranding } from "@/shared/hooks";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { establecimiento } = useTenant();
  const { branding } = useTenantBranding();

  // Fuente unica para aplicar branding global
  useEffect(() => {
    if (!branding) return;

    const root = document.documentElement;
    
    // CSS Variables para colores
    root.style.setProperty('--color-primario', branding.color_primario);
    root.style.setProperty('--color-secundario', branding.color_secundario);
    root.style.setProperty('--color-acento', branding.color_acento);
    root.style.setProperty('--color-texto', branding.color_texto);
    root.style.setProperty('--color-fondo', branding.color_fondo);
    root.style.setProperty('--font-body', branding.tipografia_body);
    root.style.setProperty('--font-heading', branding.tipografia_heading);

    if (branding.nombre_publico) {
      document.title = branding.nombre_publico;
    }

    if (branding.favicon_url) {
      let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = branding.favicon_url;
    }
  }, [branding]);

  const style = {
    background: branding?.color_fondo || "#fff",
    color: branding?.color_texto || "#0f172a",
    minHeight: "100dvh",
  };

  return (
    <div style={style} className="transition-colors duration-300">
      <div className="sr-only">{establecimiento?.nombre ?? "tenant"}</div>
      {children}
    </div>
  );
};
