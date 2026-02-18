/**
 * Ejemplos de uso de Tenant Context, Route Guards y tenantClient
 */

// ============================================================================
// 1. Usar TenantContext en un componente
// ============================================================================

import React from "react";
import { useTenant } from "@/shared/context/TenantProvider";

export const DashboardComponent = () => {
  const { tenant, config } = useTenant();

  return (
    <>
      <h1>Establecimiento: {config?.textos?.institucion || "N/A"}</h1>
      <p>Tenant actual: {tenant}</p>
      <img src={config?.theme?.logoUrl} alt="Logo" />
    </>
  );
};

// ============================================================================
// 2. Usar TenantRouteGuard en rutas
// ============================================================================

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TenantRouteGuard } from "@/shared/context/TenantRouteGuard";

export const AppRoutes = () => {
  const { tenant } = useTenant();

  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <TenantRouteGuard requiredTenant={tenant}>
            <Dashboard />
          </TenantRouteGuard>
        }
      />
      <Route
        path="/expedientes"
        element={
          <TenantRouteGuard requiredTenant={tenant}>
            <ExpedientesList />
          </TenantRouteGuard>
        }
      />
    </Routes>
  );
};

// ============================================================================
// 3. Usar queryWithTenant para consultas seguras
// ============================================================================

import { queryWithTenant, sanitizeResponse } from "@/shared/lib/tenantClient";
import { useEffect, useState } from "react";

export const ExpedientesListComponent = () => {
  const [expedientes, setExpedientes] = useState([]);
  const { tenant } = useTenant();

  useEffect(() => {
    const fetchExpedientes = async () => {
      // queryWithTenant automáticamente filtra por tenant
      const { data, error } = await queryWithTenant("expedientes", {
        estado_legal: "apertura", // Filtro adicional
      });

      if (error) {
        console.error("Error:", error);
        return;
      }

      // Sanitizar respuesta (validar que todos sean del tenant actual)
      const sanitized = sanitizeResponse(data, tenant);
      setExpedientes(sanitized);
    };

    if (tenant) {
      fetchExpedientes();
    }
  }, [tenant]);

  return (
    <div>
      <h2>Expedientes ({expedientes.length})</h2>
      <ul>
        {expedientes.map((exp) => (
          <li key={exp.id}>{exp.folio}</li>
        ))}
      </ul>
    </div>
  );
};

// ============================================================================
// 4. Usar logCrossTenantAccess para auditoría
// ============================================================================

import { logCrossTenantAccess } from "@/shared/lib/tenantClient";
import { useAuth } from "@/shared/hooks/useAuth";

export const AuditedAction = () => {
  const { usuario } = useAuth();
  const { tenant } = useTenant();

  const handleSuspiciousAccess = async () => {
    if (usuario && tenant !== usuario.establecimientoId) {
      // Registrar intento de acceso cruzado
      await logCrossTenantAccess(
        usuario.id,
        tenant,
        "attempted_cross_tenant_access"
      );
      // Redirigir o mostrar error
      console.warn("Acceso denegado: tenant mismatch");
    }
  };

  return <button onClick={handleSuspiciousAccess}>Acción supervisada</button>;
};

// ============================================================================
// 5. Validar permisos y tenant en componentes
// ============================================================================

export const AdminPanel = () => {
  const { usuario, tienePermiso } = useAuth();
  const { tenant } = useTenant();

  // Validar que usuario tenga acceso al tenant actual
  const hasAccess =
    usuario && (usuario.rol === "superadmin" || usuario.establecimientoId === tenant);

  if (!hasAccess) {
    return <div>No tienes acceso a este establecimiento</div>;
  }

  // Validar permisos específicos
  if (!tienePermiso("configuracion:editar")) {
    return <div>Permiso denegado: no puedes editar configuración</div>;
  }

  return <div>Panel de administración</div>;
};

// ============================================================================
// 6. Componente con ThemeProvider
// ============================================================================

import { ThemeProvider } from "@/shared/components/ThemeProvider";

export const App = () => {
  return (
    <ThemeProvider>
      <div className="app-content">
        {/* Los estilos del tema se aplican automáticamente */}
      </div>
    </ThemeProvider>
  );
};

// ============================================================================
// 7. Hook personalizado para acceso seguro a datos
// ============================================================================

import { useCallback } from "react";

export function useTenantData<T>(tableName: string) {
  const { tenant } = useTenant();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (filters?: Record<string, unknown>) => {
      if (!tenant) return;

      setLoading(true);
      try {
        const { data: result, error: queryError } = await queryWithTenant(
          tableName,
          filters
        );

        if (queryError) throw queryError;

        const sanitized = sanitizeResponse(result, tenant);
        setData(sanitized);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [tenant, tableName]
  );

  return { data, loading, error, fetchData };
}

// Uso:
export const EstudiantesComponent = () => {
  const { data: estudiantes, loading, fetchData } = useTenantData("estudiantes");

  useEffect(() => {
    fetchData({ activo: true });
  }, [fetchData]);

  if (loading) return <div>Cargando...</div>;
  return <ul>{estudiantes.map((e) => <li key={e.id}>{e.nombre}</li>)}</ul>;
};

// ============================================================================
// 8. Manejo de errores de acceso cruzado
// ============================================================================

export const ProtectedComponent = ({ requiredTenant }) => {
  const { tenant } = useTenant();
  const navigate = useNavigate();

  useEffect(() => {
    if (tenant && tenant !== requiredTenant) {
      // Registrar acceso no autorizado
      logCrossTenantAccess("current-user-id", requiredTenant, "unauthorized_access_attempt");
      
      // Redirigir
      navigate("/unauthorized", {
        state: { reason: "Tenant no autorizado" },
      });
    }
  }, [tenant, requiredTenant, navigate]);

  return <div>Contenido protegido del tenant: {requiredTenant}</div>;
};
