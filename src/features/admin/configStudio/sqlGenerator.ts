import type {
  ConfigStudioState,
  GeneratedChangeset,
  PolicyDraft,
  ProjectPreferenceDraft,
  StudioScope,
  TableColumnDraft,
  TableDraft,
  TriggerDraft,
} from './types';

const quoteIdentifier = (value: string): string => {
  const safe = value.replace(/[^a-zA-Z0-9_]/g, '_');
  return `"${safe}"`;
};

const quoteLiteral = (value: string): string => `'${value.replace(/'/g, "''")}'`;

const buildColumnSql = (column: TableColumnDraft): string => {
  const fragments = [quoteIdentifier(column.name), column.type || 'text'];

  if (column.notNull) {
    fragments.push('not null');
  }

  if (column.unique) {
    fragments.push('unique');
  }

  if (column.defaultValue && column.defaultValue.trim()) {
    fragments.push(`default ${column.defaultValue.trim()}`);
  }

  if (column.referencesTable && column.referencesColumn) {
    fragments.push(`references public.${quoteIdentifier(column.referencesTable)}(${quoteIdentifier(column.referencesColumn)})`);
  }

  return fragments.join(' ');
};

const buildTableStatements = (table: TableDraft, sql: string[], rollbackSql: string[]) => {
  const tableName = quoteIdentifier(table.tableName);

  if (table.createIfMissing && table.columns.length > 0) {
    const columns = table.columns.map(buildColumnSql).join(', ');
    sql.push(`create table if not exists public.${tableName} (${columns});`);
    rollbackSql.unshift(`drop table if exists public.${tableName};`);
  } else {
    table.columns.forEach((column) => {
      sql.push(`alter table if exists public.${tableName} add column if not exists ${buildColumnSql(column)};`);
      rollbackSql.unshift(`alter table if exists public.${tableName} drop column if exists ${quoteIdentifier(column.name)};`);
    });
  }

  if (table.enableRls) {
    sql.push(`alter table if exists public.${tableName} enable row level security;`);
  }

  table.indexes.forEach((index) => {
    if (!index.name.trim() || !index.expression.trim()) {
      return;
    }

    const indexName = quoteIdentifier(index.name);
    const unique = index.unique ? 'unique ' : '';
    sql.push(`create ${unique}index if not exists ${indexName} on public.${tableName} (${index.expression});`);
    rollbackSql.unshift(`drop index if exists public.${indexName};`);
  });
};

const buildPolicyStatements = (policy: PolicyDraft, sql: string[], rollbackSql: string[]) => {
  const tableName = quoteIdentifier(policy.tableName);
  const policyName = quoteIdentifier(policy.policyName);
  const command = policy.command === 'all' ? 'all' : policy.command;

  sql.push(`drop policy if exists ${policyName} on public.${tableName};`);

  const fragments = [`create policy ${policyName} on public.${tableName} for ${command}`];
  if (policy.usingExpr?.trim()) {
    fragments.push(`using (${policy.usingExpr.trim()})`);
  }
  if (policy.withCheckExpr?.trim()) {
    fragments.push(`with check (${policy.withCheckExpr.trim()})`);
  }
  sql.push(`${fragments.join(' ')};`);
  rollbackSql.unshift(`drop policy if exists ${policyName} on public.${tableName};`);
};

const buildTriggerStatements = (trigger: TriggerDraft, sql: string[], rollbackSql: string[]) => {
  const tableName = quoteIdentifier(trigger.tableName);
  const triggerName = quoteIdentifier(trigger.triggerName);

  if (!trigger.events.length) {
    return;
  }

  const timing = trigger.timing.toUpperCase();
  const events = trigger.events.map((event) => event.toUpperCase()).join(' OR ');
  sql.push(`drop trigger if exists ${triggerName} on public.${tableName};`);
  sql.push(`create trigger ${triggerName} ${timing} ${events} on public.${tableName} for each row execute function public.${trigger.functionName}();`);

  rollbackSql.unshift(`drop trigger if exists ${triggerName} on public.${tableName};`);
};

const buildPreferenceUpsert = (setting: ProjectPreferenceDraft): string => {
  const key = quoteLiteral(setting.key);
  const description = quoteLiteral(setting.description ?? 'Configurado desde Config Studio');
  const value = setting.valueJson.trim() || '{}';

  return [
    'insert into public.platform_settings (setting_key, setting_value, description, updated_by)',
    `values (${key}, ${value}::jsonb, ${description}, auth.uid())`,
    'on conflict (setting_key) do update set',
    'setting_value = excluded.setting_value,',
    'description = excluded.description,',
    'updated_by = excluded.updated_by,',
    'updated_at = now();',
  ].join(' ');
};

export const buildConfigStudioChangeset = (
  scope: StudioScope,
  tenantId: string | null,
  state: ConfigStudioState,
  title: string,
  summary: string,
): GeneratedChangeset => {
  const sql: string[] = [];
  const rollbackSql: string[] = [];
  const warnings: string[] = [];

  state.tables.forEach((table) => buildTableStatements(table, sql, rollbackSql));
  state.policies.forEach((policy) => buildPolicyStatements(policy, sql, rollbackSql));
  state.triggers.forEach((trigger) => buildTriggerStatements(trigger, sql, rollbackSql));

  state.functions.forEach((fn) => {
    if (!fn.signature.trim() || !fn.bodySql.trim()) {
      return;
    }

    sql.push(`create or replace function public.${fn.signature.trim()} ${fn.bodySql.trim()}`);
    rollbackSql.unshift(`-- rollback manual requerido para funcion public.${fn.signature.trim()}`);
    warnings.push(`La funcion ${fn.signature.trim()} requiere rollback manual de version.`);
  });

  const authPrefSql = [
    {
      key: 'auth.password_min_length',
      valueJson: JSON.stringify({ value: state.auth.passwordMinLength }),
      description: 'Longitud minima de contrasena',
    },
    {
      key: 'auth.require_mfa_admins',
      valueJson: JSON.stringify({ enabled: state.auth.requireMfaAdmins }),
      description: 'MFA obligatorio para administradores',
    },
    {
      key: 'auth.session_timeout_minutes',
      valueJson: JSON.stringify({ value: state.auth.sessionTimeoutMinutes }),
      description: 'Timeout de sesion en minutos',
    },
    {
      key: 'auth.allowed_providers',
      valueJson: JSON.stringify({ providers: state.auth.allowedProviders }),
      description: 'Proveedores auth permitidos',
    },
    {
      key: 'api.rate_limit_per_minute',
      valueJson: JSON.stringify({ value: state.api.rateLimitPerMinute }),
      description: 'Rate limit por minuto',
    },
    {
      key: 'api.custom_claims',
      valueJson: state.api.customClaimsJson || '{}',
      description: 'Custom claims API',
    },
  ];

  authPrefSql.forEach((setting) => {
    sql.push(buildPreferenceUpsert(setting));
  });

  state.projectPreferences.forEach((setting) => {
    if (!setting.key.trim()) {
      return;
    }
    sql.push(buildPreferenceUpsert(setting));
  });

  state.storage.forEach((bucket) => {
    if (!bucket.bucketName.trim()) {
      return;
    }

    const scopeSql = quoteLiteral(scope);
    const tenantSql = scope === 'tenant' && tenantId ? quoteLiteral(tenantId) : 'null';
    const bucketNameSql = quoteLiteral(bucket.bucketName);
    const mimeSql = bucket.allowedMimeTypes.length
      ? `array[${bucket.allowedMimeTypes.map(quoteLiteral).join(',')}]::text[]`
      : "'{}'::text[]";

    sql.push([
      'insert into public.storage_bucket_registry (scope, tenant_id, bucket_name, is_public, file_size_limit_mb, allowed_mime_types, policy_json, updated_by)',
      `values (${scopeSql}::public.admin_scope, ${tenantSql}::uuid, ${bucketNameSql}, ${bucket.isPublic}, ${bucket.maxSizeMb}, ${mimeSql}, '{}'::jsonb, auth.uid())`,
      'on conflict (scope, tenant_id, bucket_name) do update set',
      'is_public = excluded.is_public,',
      'file_size_limit_mb = excluded.file_size_limit_mb,',
      'allowed_mime_types = excluded.allowed_mime_types,',
      'updated_by = excluded.updated_by,',
      'updated_at = now();',
    ].join(' '));
  });

  state.edgeFunctions.forEach((fn) => {
    if (!fn.functionName.trim()) {
      return;
    }

    const scopeSql = quoteLiteral(scope);
    const tenantSql = scope === 'tenant' && tenantId ? quoteLiteral(tenantId) : 'null';

    sql.push([
      'insert into public.edge_function_registry (scope, tenant_id, function_name, enabled, version, route_path, env_json, updated_by)',
      `values (${scopeSql}::public.admin_scope, ${tenantSql}::uuid, ${quoteLiteral(fn.functionName)}, ${fn.enabled}, ${quoteLiteral(fn.version || 'latest')}, ${quoteLiteral(fn.routePath || '')}, ${(fn.envJson || '{}')}::jsonb, auth.uid())`,
      'on conflict (scope, tenant_id, function_name) do update set',
      'enabled = excluded.enabled,',
      'version = excluded.version,',
      'route_path = excluded.route_path,',
      'env_json = excluded.env_json,',
      'updated_by = excluded.updated_by,',
      'updated_at = now();',
    ].join(' '));
  });

  if (scope === 'tenant' && !tenantId) {
    warnings.push('Seleccionaste scope tenant pero no hay tenant seleccionado.');
  }

  return {
    module: 'config_studio',
    title: title.trim() || 'Changeset sin titulo',
    summary: summary.trim() || 'Cambios generados desde Config Studio',
    desiredState: state,
    sql,
    rollbackSql,
    impactPreview: {
      tablesTouched: Array.from(new Set(state.tables.map((table) => table.tableName).filter(Boolean))),
      policiesTouched: Array.from(new Set(state.policies.map((policy) => policy.policyName).filter(Boolean))),
      triggersTouched: Array.from(new Set(state.triggers.map((trigger) => trigger.triggerName).filter(Boolean))),
      functionsTouched: Array.from(new Set(state.functions.map((fn) => fn.signature).filter(Boolean))),
      warnings,
    },
  };
};

export const basicStudioValidation = (state: ConfigStudioState): string[] => {
  const errors: string[] = [];

  state.tables.forEach((table, index) => {
    if (!table.tableName.trim()) {
      errors.push(`Tabla #${index + 1}: nombre obligatorio.`);
    }

    const duplicates = new Set<string>();
    table.columns.forEach((column) => {
      const normalized = column.name.trim().toLowerCase();
      if (!normalized) {
        errors.push(`Tabla ${table.tableName || index + 1}: columna sin nombre.`);
        return;
      }
      if (duplicates.has(normalized)) {
        errors.push(`Tabla ${table.tableName || index + 1}: columna duplicada ${column.name}.`);
      }
      duplicates.add(normalized);
    });
  });

  state.policies.forEach((policy, index) => {
    if (!policy.tableName.trim() || !policy.policyName.trim()) {
      errors.push(`Politica #${index + 1}: tabla y nombre son obligatorios.`);
    }
  });

  state.functions.forEach((fn, index) => {
    if (!fn.signature.trim() && fn.bodySql.trim()) {
      errors.push(`Funcion #${index + 1}: falta signature.`);
    }
  });

  return errors;
};
