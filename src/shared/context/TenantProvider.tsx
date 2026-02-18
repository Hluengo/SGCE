/**
 * Compat layer: mantiene imports legacy hacia TenantProvider/TenantContextType
 * y delega al contexto oficial de multi-tenant.
 */
export {
  TenantProvider,
  useTenant,
  type TenantContextType,
  type Establecimiento,
} from './TenantContext';

