import fs from "fs";
import path from "path";

const baseDir = "c:/Users/heae2/AppData/Roaming/Code/User/workspaceStorage/e735bdced6a013265946bacd6d0fa2a8/GitHub.copilot-chat/chat-session-resources/c1e651b4-f7a6-45c5-9f88-94781735f0c7";

const files = {
	columns: "call_0MaLXFt9mACpw1sp4qlvU8MI__vscode-1771452739555/content.json",
	constraints: "call_omWItY7boOEyNhaAW5CzV0Gs__vscode-1771452739567/content.json",
	constraintsAll: "call_IdFgcxM6FZ3niRAxI0pMnJig__vscode-1771452739570/content.json",
	indexes: "call_C0KwDiUV65VVefs0OB1FA8Fb__vscode-1771452739576/content.json",
	views: "call_CJRXJb58TQqFfqPPwsXbzFVc__vscode-1771452739557/content.json",
	functions: "call_2SfasnelpTsnhJaqcBPhTNeM__vscode-1771452739558/content.json",
	types: "call_ZoTGnlZW5rb5HOzF4BYkrG3Z__vscode-1771452739561/content.json",
	policies: "call_MFckPlrPO7YRtZQi6v4uYinV__vscode-1771452739579/content.json",
	partitions: "call_zPbfWcdUlZXPvvcE04AzZ5fW__vscode-1771452739575/content.json",
	defaults: "call_LfXvogRZbV9DjTQ1bJCEk1h8__vscode-1771452739568/content.json"
};

const rowCounts = [
	{ schema_name: "auth", table_name: "audit_log_entries", row_count: 0 },
	{ schema_name: "auth", table_name: "flow_state", row_count: 0 },
	{ schema_name: "auth", table_name: "identities", row_count: 1 },
	{ schema_name: "auth", table_name: "instances", row_count: 0 },
	{ schema_name: "auth", table_name: "mfa_amr_claims", row_count: 1 },
	{ schema_name: "auth", table_name: "mfa_challenges", row_count: 0 },
	{ schema_name: "auth", table_name: "mfa_factors", row_count: 0 },
	{ schema_name: "auth", table_name: "oauth_authorizations", row_count: 0 },
	{ schema_name: "auth", table_name: "oauth_client_states", row_count: 0 },
	{ schema_name: "auth", table_name: "oauth_clients", row_count: 0 },
	{ schema_name: "auth", table_name: "oauth_consents", row_count: 0 },
	{ schema_name: "auth", table_name: "one_time_tokens", row_count: 0 },
	{ schema_name: "auth", table_name: "refresh_tokens", row_count: 1 },
	{ schema_name: "auth", table_name: "saml_providers", row_count: 0 },
	{ schema_name: "auth", table_name: "saml_relay_states", row_count: 0 },
	{ schema_name: "auth", table_name: "schema_migrations", row_count: 74 },
	{ schema_name: "auth", table_name: "sessions", row_count: 1 },
	{ schema_name: "auth", table_name: "sso_domains", row_count: 0 },
	{ schema_name: "auth", table_name: "sso_providers", row_count: 0 },
	{ schema_name: "auth", table_name: "users", row_count: 1 },
	{ schema_name: "public", table_name: "action_types", row_count: 12 },
	{ schema_name: "public", table_name: "audit_logs", row_count: 0 },
	{ schema_name: "public", table_name: "case_followups", row_count: 1 },
	{ schema_name: "public", table_name: "case_message_attachments", row_count: 1 },
	{ schema_name: "public", table_name: "case_messages", row_count: 2 },
	{ schema_name: "public", table_name: "cases", row_count: 1 },
	{ schema_name: "public", table_name: "catalog_staging_batches", row_count: 2 },
	{ schema_name: "public", table_name: "conduct_catalog", row_count: 38 },
	{ schema_name: "public", table_name: "conduct_types", row_count: 4 },
	{ schema_name: "public", table_name: "followup_evidence", row_count: 0 },
	{ schema_name: "public", table_name: "involucrados", row_count: 0 },
	{ schema_name: "public", table_name: "platform_versions", row_count: 1 },
	{ schema_name: "public", table_name: "process_stages", row_count: 0 },
	{ schema_name: "public", table_name: "stage_sla", row_count: 7 },
	{ schema_name: "public", table_name: "stg_action_types", row_count: 12 },
	{ schema_name: "public", table_name: "stg_conduct_catalog", row_count: 26 },
	{ schema_name: "public", table_name: "stg_conduct_types", row_count: 18 },
	{ schema_name: "public", table_name: "stg_stage_sla", row_count: 10 },
	{ schema_name: "public", table_name: "students", row_count: 41 },
	{ schema_name: "public", table_name: "tenant_catalogs", row_count: 16 },
	{ schema_name: "public", table_name: "tenant_profiles", row_count: 1 },
	{ schema_name: "public", table_name: "tenant_settings", row_count: 0 },
	{ schema_name: "public", table_name: "tenant_versions", row_count: 1 },
	{ schema_name: "public", table_name: "tenants", row_count: 3 },
	{ schema_name: "realtime", table_name: "messages_2026_02_13", row_count: 0 },
	{ schema_name: "realtime", table_name: "messages_2026_02_14", row_count: 0 },
	{ schema_name: "realtime", table_name: "messages_2026_02_15", row_count: 0 },
	{ schema_name: "realtime", table_name: "messages_2026_02_16", row_count: 0 },
	{ schema_name: "realtime", table_name: "messages_2026_02_17", row_count: 0 },
	{ schema_name: "realtime", table_name: "messages_2026_02_18", row_count: 0 },
	{ schema_name: "realtime", table_name: "messages_2026_02_19", row_count: 0 },
	{ schema_name: "realtime", table_name: "schema_migrations", row_count: 67 },
	{ schema_name: "realtime", table_name: "subscription", row_count: 0 },
	{ schema_name: "storage", table_name: "buckets", row_count: 2 },
	{ schema_name: "storage", table_name: "buckets_analytics", row_count: 0 },
	{ schema_name: "storage", table_name: "buckets_vectors", row_count: 0 },
	{ schema_name: "storage", table_name: "migrations", row_count: 57 },
	{ schema_name: "storage", table_name: "objects", row_count: 6 },
	{ schema_name: "storage", table_name: "s3_multipart_uploads", row_count: 0 },
	{ schema_name: "storage", table_name: "s3_multipart_uploads_parts", row_count: 0 },
	{ schema_name: "storage", table_name: "vector_indexes", row_count: 0 },
	{ schema_name: "vault", table_name: "secrets", row_count: 0 }
];

const triggers = [
	{
		schema_name: "public",
		table_name: "case_followups",
		trigger_name: "update_case_followups_updated_at",
		trigger_def: "CREATE TRIGGER update_case_followups_updated_at BEFORE UPDATE ON public.case_followups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
		function_name: "update_updated_at_column"
	},
	{
		schema_name: "public",
		table_name: "case_message_attachments",
		trigger_name: "trg_case_message_attachments_set_tenant",
		trigger_def: "CREATE TRIGGER trg_case_message_attachments_set_tenant BEFORE INSERT ON public.case_message_attachments FOR EACH ROW EXECUTE FUNCTION set_case_message_attachment_tenant_id()",
		function_name: "set_case_message_attachment_tenant_id"
	},
	{
		schema_name: "public",
		table_name: "case_message_attachments",
		trigger_name: "trigger_case_message_attachments_updated_at",
		trigger_def: "CREATE TRIGGER trigger_case_message_attachments_updated_at BEFORE UPDATE ON public.case_message_attachments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
		function_name: "update_updated_at_column"
	},
	{
		schema_name: "public",
		table_name: "case_messages",
		trigger_name: "trg_case_messages_set_tenant",
		trigger_def: "CREATE TRIGGER trg_case_messages_set_tenant BEFORE INSERT ON public.case_messages FOR EACH ROW EXECUTE FUNCTION set_case_message_tenant_id()",
		function_name: "set_case_message_tenant_id"
	},
	{
		schema_name: "public",
		table_name: "case_messages",
		trigger_name: "trigger_case_messages_updated_at",
		trigger_def: "CREATE TRIGGER trigger_case_messages_updated_at BEFORE UPDATE ON public.case_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
		function_name: "update_updated_at_column"
	},
	{
		schema_name: "public",
		table_name: "cases",
		trigger_name: "update_cases_updated_at",
		trigger_def: "CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
		function_name: "update_updated_at_column"
	},
	{
		schema_name: "public",
		table_name: "followup_evidence",
		trigger_name: "update_followup_evidence_updated_at",
		trigger_def: "CREATE TRIGGER update_followup_evidence_updated_at BEFORE UPDATE ON public.followup_evidence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
		function_name: "update_updated_at_column"
	},
	{
		schema_name: "public",
		table_name: "students",
		trigger_name: "update_students_updated_at",
		trigger_def: "CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
		function_name: "update_updated_at_column"
	},
	{
		schema_name: "public",
		table_name: "tenant_profiles",
		trigger_name: "update_tenant_profiles_updated_at",
		trigger_def: "CREATE TRIGGER update_tenant_profiles_updated_at BEFORE UPDATE ON public.tenant_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
		function_name: "update_updated_at_column"
	},
	{
		schema_name: "public",
		table_name: "tenant_settings",
		trigger_name: "trigger_tenant_settings_updated_at",
		trigger_def: "CREATE TRIGGER trigger_tenant_settings_updated_at BEFORE UPDATE ON public.tenant_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
		function_name: "update_updated_at_column"
	},
	{
		schema_name: "public",
		table_name: "tenants",
		trigger_name: "update_tenants_updated_at",
		trigger_def: "CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
		function_name: "update_updated_at_column"
	},
	{
		schema_name: "realtime",
		table_name: "subscription",
		trigger_name: "tr_check_filters",
		trigger_def: "CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters()",
		function_name: "subscription_check_filters"
	},
	{
		schema_name: "storage",
		table_name: "buckets",
		trigger_name: "enforce_bucket_name_length_trigger",
		trigger_def: "CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length()",
		function_name: "enforce_bucket_name_length"
	},
	{
		schema_name: "storage",
		table_name: "buckets",
		trigger_name: "protect_buckets_delete",
		trigger_def: "CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete()",
		function_name: "protect_delete"
	},
	{
		schema_name: "storage",
		table_name: "objects",
		trigger_name: "protect_objects_delete",
		trigger_def: "CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete()",
		function_name: "protect_delete"
	},
	{
		schema_name: "storage",
		table_name: "objects",
		trigger_name: "update_objects_updated_at",
		trigger_def: "CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column()",
		function_name: "update_updated_at_column"
	}
];

const sequences = [
	{ sequence_schema: "auth", sequence_name: "refresh_tokens_id_seq", data_type: "bigint", start_value: "1", minimum_value: "1", maximum_value: "9223372036854775807", increment: "1", cycle_option: "NO" },
	{ sequence_schema: "graphql", sequence_name: "seq_schema_version", data_type: "integer", start_value: "1", minimum_value: "1", maximum_value: "2147483647", increment: "1", cycle_option: "YES" },
	{ sequence_schema: "public", sequence_name: "stg_action_types_id_seq", data_type: "bigint", start_value: "1", minimum_value: "1", maximum_value: "9223372036854775807", increment: "1", cycle_option: "NO" },
	{ sequence_schema: "public", sequence_name: "stg_conduct_catalog_id_seq", data_type: "bigint", start_value: "1", minimum_value: "1", maximum_value: "9223372036854775807", increment: "1", cycle_option: "NO" },
	{ sequence_schema: "public", sequence_name: "stg_conduct_types_id_seq", data_type: "bigint", start_value: "1", minimum_value: "1", maximum_value: "9223372036854775807", increment: "1", cycle_option: "NO" },
	{ sequence_schema: "public", sequence_name: "stg_stage_sla_id_seq", data_type: "bigint", start_value: "1", minimum_value: "1", maximum_value: "9223372036854775807", increment: "1", cycle_option: "NO" }
];

function extractJsonArray(raw) {
	const start = raw.indexOf("<untrusted-data-");
	if (start < 0) {
		throw new Error("Missing untrusted-data start tag");
	}
	const startTagEnd = raw.indexOf(">", start);
	const endTag = raw.indexOf("</untrusted-data-", startTagEnd);
	if (startTagEnd < 0 || endTag < 0) {
		throw new Error("Missing untrusted-data end tag");
	}
	const payload = raw.slice(startTagEnd + 1, endTag).trim();
	const firstBracket = payload.indexOf("[");
	const lastBracket = payload.lastIndexOf("]");
	if (firstBracket < 0 || lastBracket < 0) {
		throw new Error("Missing JSON array brackets in payload");
	}
	const arrayText = payload.slice(firstBracket, lastBracket + 1).trim();
	return JSON.parse(arrayText);
}

function loadData(relativePath) {
	const fullPath = path.join(baseDir, relativePath);
	let raw = fs.readFileSync(fullPath, "utf8").trim();
	if (raw.startsWith("\"") || raw.startsWith("'")) {
		raw = JSON.parse(raw);
	}
	return extractJsonArray(raw);
}

function keyOf(schema, table) {
	return `${schema}.${table}`;
}

function groupBy(array, keyFn) {
	const map = new Map();
	for (const item of array) {
		const key = keyFn(item);
		if (!map.has(key)) {
			map.set(key, []);
		}
		map.get(key).push(item);
	}
	return map;
}

const columns = loadData(files.columns);
const constraints = loadData(files.constraintsAll);
const indexes = loadData(files.indexes);
const views = loadData(files.views);
const functionsList = loadData(files.functions);
const types = loadData(files.types);
const policies = loadData(files.policies);
const partitions = loadData(files.partitions);
const defaults = loadData(files.defaults);

const rowCountMap = new Map(rowCounts.map((r) => [keyOf(r.schema_name, r.table_name), r.row_count]));
const constraintsMap = groupBy(constraints, (c) => keyOf(c.schema_name, c.table_name));
const indexesMap = groupBy(indexes, (i) => keyOf(i.schema_name, i.table_name));
const policiesMap = groupBy(policies, (p) => keyOf(p.schema_name, p.table_name));
const triggersMap = groupBy(triggers, (t) => keyOf(t.schema_name, t.table_name));
const partitionsMap = new Map(partitions.map((p) => [keyOf(p.schema_name, p.relation_name), p]));
const defaultsMap = groupBy(defaults, (d) => keyOf(d.schema_name, d.table_name));

const schemas = Array.from(new Set(columns.map((c) => c.table_schema))).sort();

const now = new Date().toISOString();

const lines = [];
lines.push("# Supabase schema report");
lines.push("");
lines.push(`Generated at: ${now}`);
lines.push("");

for (const schema of schemas) {
	lines.push(`## Schema: ${schema}`);
	lines.push("");

	const schemaColumns = columns.filter((c) => c.table_schema === schema);
	const tableNames = Array.from(new Set(schemaColumns.map((c) => c.table_name))).sort();

	if (tableNames.length > 0) {
		lines.push("### Tables");
		lines.push("");

		for (const tableName of tableNames) {
			const tableKey = keyOf(schema, tableName);
			const tableCols = schemaColumns.filter((c) => c.table_name === tableName);
			const rowCount = rowCountMap.get(tableKey);
			const partitionInfo = partitionsMap.get(tableKey);

			lines.push(`#### ${schema}.${tableName}`);
			if (rowCount !== undefined) {
				lines.push(`Row count: ${rowCount}`);
			}
			if (partitionInfo && partitionInfo.relation_kind === "p") {
				lines.push("Partitioned table: yes");
			}
			if (partitionInfo && partitionInfo.partition_bound) {
				lines.push(`Partition bound: ${partitionInfo.partition_bound}`);
			}
			lines.push("");

			lines.push("Columns:");
			lines.push("");
			lines.push("| Column | Type | Nullable | Default | PK | Unique | FK |");
			lines.push("| --- | --- | --- | --- | --- | --- | --- |");
			for (const col of tableCols) {
				const type = col.data_type === "USER-DEFINED" ? col.udt_name : col.data_type;
				const nullable = col.is_nullable === "YES" ? "YES" : "NO";
				const defaultExpr = col.column_default ?? "";
				const pk = col.is_primary_key ? "YES" : "";
				const unique = col.is_unique ? "YES" : "";
				const fk = col.foreign_table_name
					? `${col.foreign_table_schema}.${col.foreign_table_name}(${col.foreign_column_name})`
					: "";
				lines.push(`| ${col.column_name} | ${type} | ${nullable} | ${defaultExpr} | ${pk} | ${unique} | ${fk} |`);
			}
			lines.push("");

			const tableConstraints = constraintsMap.get(tableKey) || [];
			if (tableConstraints.length > 0) {
				lines.push("Constraints:");
				for (const c of tableConstraints) {
					lines.push(`- ${c.constraint_name}: ${c.constraint_def}`);
				}
				lines.push("");
			}

			const tableIndexes = indexesMap.get(tableKey) || [];
			if (tableIndexes.length > 0) {
				lines.push("Indexes:");
				for (const idx of tableIndexes) {
					lines.push(`- ${idx.index_name}: ${idx.index_def}`);
				}
				lines.push("");
			}

			const tablePolicies = policiesMap.get(tableKey) || [];
			if (tablePolicies.length > 0) {
				lines.push("Policies (RLS):");
				for (const p of tablePolicies) {
					const cmd = p.cmd === "a" ? "INSERT" : p.cmd === "r" ? "SELECT" : p.cmd === "w" ? "UPDATE" : p.cmd === "d" ? "DELETE" : p.cmd;
					lines.push(`- ${p.policy_name} (cmd=${cmd}, permissive=${p.permissive}): USING ${p.using_expr ?? ""} WITH CHECK ${p.with_check_expr ?? ""}`);
				}
				lines.push("");
			}

			const tableTriggers = triggersMap.get(tableKey) || [];
			if (tableTriggers.length > 0) {
				lines.push("Triggers:");
				for (const t of tableTriggers) {
					lines.push(`- ${t.trigger_name}: ${t.trigger_def}`);
				}
				lines.push("");
			}
		}
	}

	const schemaViews = views.filter((v) => v.schemaname === schema);
	if (schemaViews.length > 0) {
		lines.push("### Views");
		lines.push("");
		for (const view of schemaViews) {
			const definition = view.definition ?? view.view_definition ?? "";
			lines.push(`#### ${schema}.${view.viewname}`);
			lines.push("```sql");
			lines.push(definition.trim());
			lines.push("```");
			lines.push("");
		}
	}

	const schemaFunctions = functionsList.filter((f) => f.schema_name === schema);
	if (schemaFunctions.length > 0) {
		lines.push("### Functions");
		lines.push("");
		for (const fn of schemaFunctions) {
			const definition = fn.definition ?? "";
			lines.push(`#### ${schema}.${fn.function_name}`);
			lines.push("```sql");
			lines.push(definition.trim());
			lines.push("```");
			lines.push("");
		}
	}

	const schemaTypes = types.filter((t) => t.schema_name === schema);
	if (schemaTypes.length > 0) {
		lines.push("### Types");
		lines.push("");
		for (const t of schemaTypes) {
			const enumValues = t.enum_values ? ` (${t.enum_values})` : "";
			lines.push(`- ${t.type_name} [${t.type_kind}]${enumValues}`);
		}
		lines.push("");
	}

	const schemaSequences = sequences.filter((s) => s.sequence_schema === schema);
	if (schemaSequences.length > 0) {
		lines.push("### Sequences");
		lines.push("");
		for (const s of schemaSequences) {
			lines.push(`- ${s.sequence_name}: type=${s.data_type}, start=${s.start_value}, min=${s.minimum_value}, max=${s.maximum_value}, inc=${s.increment}, cycle=${s.cycle_option}`);
		}
		lines.push("");
	}
}

const outPath = path.join(process.cwd(), "docs", "SUPABASE_SCHEMA_REPORT.md");
fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Report written to ${outPath}`);
