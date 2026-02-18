/**
 * TENANT PATTERNS - Ejemplos prácticos multi-tenant
 *
 * INSTRUCCIONES:
 * 1. Abre este archivo como referencia
 * 2. Copia el patrón que necesitas
 * 3. Ajusta imports según tu proyecto
 * 4. NO ejecutes este archivo, es solo para copiar patrones
 */

// ============================================================================
// PATRÓN 1: Acceder a datos del tenant actual (Hook básico)
// ============================================================================

// import { useTenant } from "@/shared/context";
//
// export const MyComponent = () => {
//   const { tenant, loading } = useTenant();
//
//   if (loading) return <div>Cargando...</div>;
//   if (!tenant) return <div>Sin tenant</div>;
//
//   return (
//     <div>
//       <h1>{tenant.nombre}</h1>
//       <p>ID: {tenant.id}</p>
//     </div>
//   );
// };

// ============================================================================
// PATRÓN 2: Renderizado condicional por rol/tenant
// ============================================================================

// import { useTenant } from "@/shared/context";
// import { useAuth } from "@/shared/hooks/useAuth";
//
// export const ConditionalComponent = () => {
//   const { tenant } = useTenant();
//   const { user } = useAuth();
//
//   const isSuperadmin = user?.role === "superadmin";
//   const isAdmin = user?.role === "admin" && user?.establecimientoId === tenant?.id;
//
//   if (!isSuperadmin && !isAdmin) {
//     return <div>❌ No autorizado</div>;
//   }
//
//   return (
//     <div>
//       {isSuperadmin && <p>⚠️ Eres SUPERADMIN - cambios aquí afectan todas instituciones</p>}
//       <h1>{tenant?.nombre}</h1>
//     </div>
//   );
// };

// ============================================================================
// PATRÓN 3: Query a Supabase CON validación de tenant
// ============================================================================

// import { useEffect, useState } from "react";
// import { useTenant } from "@/shared/context";
// import { supabase } from "@/shared/lib/supabaseClient";
//
// interface Expediente {
//   id: string;
//   folio: string;
//   establecimiento_id: string;
// }
//
// export const FetchWithTenant = () => {
//   const { tenant } = useTenant();
//   const [expedientes, setExpedientes] = useState<Expediente[]>([]);
//   const [loading, setLoading] = useState(true);
//
//   useEffect(() => {
//     if (!tenant?.id) return;
//
//     const fetchData = async () => {
//       try {
//         // ✅ IMPORTANTE: Filtrar por establecimiento_id
//         const { data, error } = await supabase
//           .from("expedientes")
//           .select("*")
//           .eq("establecimiento_id", tenant.id); // ← SIEMPRE filtrar
//
//         if (error) throw error;
//
//         // ✅ VALIDAR: Respuesta contiene datos del tenant actual
//         if (data && data.every((item) => item.establecimiento_id === tenant.id)) {
//           setExpedientes(data);
//         }
//       } catch (err) {
//         console.error("Error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//
//     fetchData();
//   }, [tenant?.id]);
//
//   return (
//     <div>
//       {loading ? (
//         <p>Cargando...</p>
//       ) : (
//         <ul>
//           {expedientes.map((e) => (
//             <li key={e.id}>{e.folio}</li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// };

// ============================================================================
// PATRÓN 4: Validación en formulario
// ============================================================================

// import { useState } from "react";
// import { useTenant } from "@/shared/context";
// import { useAuth } from "@/shared/hooks/useAuth";
//
// interface FormData {
//   nombre: string;
//   email: string;
// }
//
// export const FormWithValidation = () => {
//   const { tenant } = useTenant();
//   const { user } = useAuth();
//   const [errors, setErrors] = useState<Record<string, string>>({});
//
//   const validateForm = (data: FormData): boolean => {
//     const newErrors: Record<string, string> = {};
//
//     // Validación 1: Email debe ser del dominio de la institución
//     const institutionDomain = tenant?.nombre.toLowerCase().replace(/\s+/g, "");
//     if (institutionDomain && !data.email.includes(institutionDomain)) {
//       newErrors.email = `Email debe pertenecer a ${institutionDomain}`;
//     }
//
//     // Validación 2: Solo admin pueda crear
//     if (user?.role !== "admin") {
//       newErrors.general = "Solo administradores pueden crear";
//     }
//
//     // Validación 3: Nombre requerido
//     if (!data.nombre.trim()) {
//       newErrors.nombre = "Nombre es requerido";
//     }
//
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };
//
//   return (
//     <div>
//       <form
//         onSubmit={(e) => {
//           e.preventDefault();
//           const fd = new FormData(e.currentTarget);
//           validateForm({
//             nombre: fd.get("nombre") as string,
//             email: fd.get("email") as string,
//           });
//         }}
//       >
//         <input name="nombre" placeholder="Nombre completo" required />
//         <input name="email" placeholder="Email" type="email" required />
//         <button type="submit">Guardar</button>
//
//         {Object.entries(errors).map(([key, msg]) => (
//           <div key={key} className="text-red-600 text-sm">
//             {msg}
//           </div>
//         ))}
//       </form>
//     </div>
//   );
// };

// ============================================================================
// PATRÓN 5: Error handling y fallbacks
// ============================================================================

// import { useTenant } from "@/shared/context";
//
// export const ComponentWithErrorHandling = () => {
//   const { tenant, loading, error } = useTenant();
//
//   // Estado 1: Cargando tenant info
//   if (loading) {
//     return <div className="p-4 bg-blue-50">Conectando con tu institución...</div>;
//   }
//
//   // Estado 2: Error resolviendo tenant
//   if (error) {
//     return (
//       <div className="p-4 bg-red-100">
//         <h3>Error de conexión</h3>
//         <p>{error}</p>
//         <button onClick={() => window.location.reload()}>Reintentar</button>
//       </div>
//     );
//   }
//
//   // Estado 3: Sin tenant asignado
//   if (!tenant) {
//     return (
//       <div className="p-4 bg-yellow-100">
//         <p>No tienes una institución asignada. Contacta al administrador.</p>
//       </div>
//     );
//   }
//
//   // Estado 4: Todo ok
//   return <div>✅ Conectado a {tenant.nombre}</div>;
// };

// ============================================================================
// PATRÓN 6: Usar información de configuración del tenant
// ============================================================================

// import { useTenant } from "@/shared/context";
//
// export const TenantConfigComponent = () => {
//   const { tenant } = useTenant();
//
//   return (
//     <div
//       style={{
//         backgroundColor: tenant?.theme?.primaryColor || "#007bff",
//         padding: "1rem",
//       }}
//     >
//       {tenant?.theme?.logoUrl && (
//         <img src={tenant.theme.logoUrl} alt="Logo" style={{ height: "60px" }} />
//       )}
//
//       <h1 style={{ color: tenant?.theme?.textColor }}>
//         {tenant?.nombre}
//       </h1>
//
//       <p>{tenant?.textos?.bienvenida}</p>
//
//       <div>
//         <strong>Administradores:</strong>
//         <ul>
//           {tenant?.adminUsers?.map((email) => (
//             <li key={email}>{email}</li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// };

// ============================================================================
// PATRÓN 7: Proteger componente con validación de tenant
// ============================================================================

// import { useTenant } from "@/shared/context";
// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
//
// interface ProtectedProps {
//   children: React.ReactNode;
//   requiredTenantId?: string; // Si es undefined, permite cualquier tenant
//   requiredRole?: string;
// }
//
// export const ProtectedComponent = ({
//   children,
//   requiredTenantId,
//   requiredRole,
// }: ProtectedProps) => {
//   const { tenant, loading } = useTenant();
//   const navigate = useNavigate();
//
//   useEffect(() => {
//     if (loading) return;
//
//     // Si requiere tenant específico y no coincide
//     if (requiredTenantId && tenant?.id !== requiredTenantId) {
//       navigate("/unauthorized");
//     }
//
//     // Si requiere rol específico
//     // (Nota: obtener rol de useAuth() y validar acá)
//   }, [tenant, loading, requiredTenantId, navigate]);
//
//   if (loading) return <div>Validando acceso...</div>;
//
//   if (!tenant) {
//     return <div>❌ No tienes acceso a esta institución</div>;
//   }
//
//   return <>{children}</>;
// };
//
// // Uso:
// // <ProtectedComponent requiredTenantId="tenant-123">
// //   <SensitiveComponent />
// // </ProtectedComponent>

// ============================================================================
// PATRÓN 8: Logout seguro (limpiar tenant)
// ============================================================================

// import { useAuth } from "@/shared/hooks/useAuth";
// import { useTenant } from "@/shared/context";
//
// export const LogoutButton = () => {
//   const { signOut } = useAuth();
//   const { tenant } = useTenant();
//
//   const handleLogout = async () => {
//     // Log que el user se va a ir
//     console.log(`Usuario saliendo de ${tenant?.nombre}`);
//
//     // Limpiar localStorage (si aplica)
//     localStorage.removeItem("tenant_id");
//     localStorage.removeItem("user_session");
//
//     // Llamar signOut
//     await signOut();
//
//     // Redirect a /auth (automático en TenantProvider)
//   };
//
//   return <button onClick={handleLogout}>Logout</button>;
// };

// ============================================================================
// PATRÓN 9: Multi-select de institución (cambiar tenant)
// ============================================================================

// import { useEffect, useState } from "react";
// import { useTenant } from "@/shared/context";
// import { useAuth } from "@/shared/hooks/useAuth";
// import { supabase } from "@/shared/lib/supabaseClient";
//
// interface TenantOption {
//   id: string;
//   nombre: string;
// }
//
// export const TenantSelector = () => {
//   const { tenant, setTenantId } = useTenant();
//   const { user } = useAuth();
//   const [availableTenants, setAvailableTenants] = useState<TenantOption[]>([]);
//
//   useEffect(() => {
//     if (!user?.id) return;
//
//     // Cargar instituciones del usuario
//     const fetchTenants = async () => {
//       const { data } = await supabase
//         .from("usuarios_establecimiento")
//         .select("establecimiento_id, establecimiento:establecimientos(nombre)")
//         .eq("usuario_id", user.id);
//
//       setAvailableTenants(
//         data?.map((item: unknown) => ({
//           id: item.establecimiento_id,
//           nombre: item.establecimiento?.nombre,
//         })) || []
//       );
//     };
//
//     fetchTenants();
//   }, [user?.id]);
//
//   return (
//     <div>
//       <label>Cambiar institución:</label>
//       <select value={tenant?.id || ""} onChange={(e) => setTenantId(e.target.value)}>
//         <option value="">Seleccionar...</option>
//         {availableTenants.map((t) => (
//           <option key={t.id} value={t.id}>
//             {t.nombre}
//           </option>
//         ))}
//       </select>
//     </div>
//   );
// };

// ============================================================================
// PATRÓN 10: Auditar cambios por tenant
// ============================================================================

// import { supabase } from "@/shared/lib/supabaseClient";
// import { useTenant } from "@/shared/context";
// import { useAuth } from "@/shared/hooks/useAuth";
//
// export const auditAction = async (
//   action: string,
//   details: Record<string, unknown>
// ) => {
//   const { tenant } = useTenant();
//   const { user } = useAuth();
//
//   // Log a tabla de auditoría
//   await supabase.from("audit_log").insert({
//     usuario_id: user?.id,
//     establecimiento_id: tenant?.id,
//     action,
//     details,
//     timestamp: new Date().toISOString(),
//   });
// };
//
// // Uso:
// // await auditAction("expediente_creado", { expediente_id: "123", folio: "2026-001" });

export default {
  message: "Este archivo es solo para referencia, no ejecutar",
};
