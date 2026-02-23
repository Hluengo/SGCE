import React from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/shared/context/TenantContext";

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId, establecimiento } = useTenant();

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-slate-900">Acceso Denegado</h1>
        </div>

        <p className="text-slate-600 mb-2">
          No tienes permiso para acceder a este recurso.
        </p>

        <p className="text-sm text-slate-500 mb-6">
          Tu establecimiento actual: <strong>{establecimiento?.nombre || tenantId || "No configurado"}</strong>
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/")}
            className="w-full px-4 py-2 min-h-11 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Dashboard
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full px-4 py-2 min-h-11 bg-slate-200 text-slate-900 font-medium rounded-lg hover:bg-slate-300 transition-colors"
          >
            Atrás
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          Si crees que esto es un error, contacta con el administrador de tu establecimiento.
        </p>
      </div>
    </div>
  );
};

export default UnauthorizedPage;

