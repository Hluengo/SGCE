# Supabase schema report

Generated at: 2026-02-19T01:00:15.723Z

## Schema: auth

### Tables

#### auth.audit_log_entries
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp with time zone | YES |  |  |  |  |
| id | uuid | NO |  | YES |  |  |
| instance_id | uuid | YES |  |  |  |  |
| ip_address | character varying | NO | ''::character varying |  |  |  |
| payload | json | YES |  |  |  |  |

Indexes:
- audit_log_entries_pkey: CREATE UNIQUE INDEX audit_log_entries_pkey ON auth.audit_log_entries USING btree (id)
- audit_logs_instance_id_idx: CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id)

#### auth.flow_state
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| auth_code | text | YES |  |  |  |  |
| auth_code_issued_at | timestamp with time zone | YES |  |  |  |  |
| authentication_method | text | NO |  |  |  |  |
| code_challenge | text | YES |  |  |  |  |
| code_challenge_method | code_challenge_method | YES |  |  |  |  |
| created_at | timestamp with time zone | YES |  |  |  |  |
| email_optional | boolean | NO | false |  |  |  |
| id | uuid | NO |  | YES |  |  |
| invite_token | text | YES |  |  |  |  |
| linking_target_id | uuid | YES |  |  |  |  |
| oauth_client_state_id | uuid | YES |  |  |  |  |
| provider_access_token | text | YES |  |  |  |  |
| provider_refresh_token | text | YES |  |  |  |  |
| provider_type | text | NO |  |  |  |  |
| referrer | text | YES |  |  |  |  |
| updated_at | timestamp with time zone | YES |  |  |  |  |
| user_id | uuid | YES |  |  |  |  |

Indexes:
- flow_state_created_at_idx: CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC)
- flow_state_pkey: CREATE UNIQUE INDEX flow_state_pkey ON auth.flow_state USING btree (id)
- idx_auth_code: CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code)
- idx_user_id_auth_method: CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method)

#### auth.identities
Row count: 1

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp with time zone | YES |  |  |  |  |
| email | text | YES |  |  |  |  |
| id | uuid | NO | gen_random_uuid() | YES |  |  |
| identity_data | jsonb | NO |  |  |  |  |
| last_sign_in_at | timestamp with time zone | YES |  |  |  |  |
| provider | text | NO |  |  | YES |  |
| provider_id | text | NO |  |  | YES |  |
| updated_at | timestamp with time zone | YES |  |  |  |  |
| user_id | uuid | NO |  |  |  |  |

Indexes:
- identities_email_idx: CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops)
- identities_pkey: CREATE UNIQUE INDEX identities_pkey ON auth.identities USING btree (id)
- identities_provider_id_provider_unique: CREATE UNIQUE INDEX identities_provider_id_provider_unique ON auth.identities USING btree (provider_id, provider)
- identities_user_id_idx: CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id)

#### auth.instances
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp with time zone | YES |  |  |  |  |
| id | uuid | NO |  | YES |  |  |
| raw_base_config | text | YES |  |  |  |  |
| updated_at | timestamp with time zone | YES |  |  |  |  |
| uuid | uuid | YES |  |  |  |  |

Indexes:
- instances_pkey: CREATE UNIQUE INDEX instances_pkey ON auth.instances USING btree (id)

#### auth.mfa_amr_claims
Row count: 1

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| authentication_method | text | NO |  |  | YES |  |
| created_at | timestamp with time zone | NO |  |  |  |  |
| id | uuid | NO |  | YES |  |  |
| session_id | uuid | NO |  |  | YES |  |
| updated_at | timestamp with time zone | NO |  |  |  |  |

Indexes:
- amr_id_pk: CREATE UNIQUE INDEX amr_id_pk ON auth.mfa_amr_claims USING btree (id)
- mfa_amr_claims_session_id_authentication_method_pkey: CREATE UNIQUE INDEX mfa_amr_claims_session_id_authentication_method_pkey ON auth.mfa_amr_claims USING btree (session_id, authentication_method)

#### auth.mfa_challenges
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp with time zone | NO |  |  |  |  |
| factor_id | uuid | NO |  |  |  |  |
| id | uuid | NO |  | YES |  |  |
| ip_address | inet | NO |  |  |  |  |
| otp_code | text | YES |  |  |  |  |
| verified_at | timestamp with time zone | YES |  |  |  |  |
| web_authn_session_data | jsonb | YES |  |  |  |  |

Indexes:
- mfa_challenge_created_at_idx: CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC)
- mfa_challenges_pkey: CREATE UNIQUE INDEX mfa_challenges_pkey ON auth.mfa_challenges USING btree (id)

#### auth.mfa_factors
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp with time zone | NO |  |  |  |  |
| factor_type | factor_type | NO |  |  |  |  |
| friendly_name | text | YES |  |  |  |  |
| id | uuid | NO |  | YES |  |  |
| last_challenged_at | timestamp with time zone | YES |  |  | YES |  |
| last_webauthn_challenge_data | jsonb | YES |  |  |  |  |
| phone | text | YES |  |  |  |  |
| secret | text | YES |  |  |  |  |
| status | factor_status | NO |  |  |  |  |
| updated_at | timestamp with time zone | NO |  |  |  |  |
| user_id | uuid | NO |  |  |  |  |
| web_authn_aaguid | uuid | YES |  |  |  |  |
| web_authn_credential | jsonb | YES |  |  |  |  |

Indexes:
- factor_id_created_at_idx: CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at)
- mfa_factors_last_challenged_at_key: CREATE UNIQUE INDEX mfa_factors_last_challenged_at_key ON auth.mfa_factors USING btree (last_challenged_at)
- mfa_factors_pkey: CREATE UNIQUE INDEX mfa_factors_pkey ON auth.mfa_factors USING btree (id)
- mfa_factors_user_friendly_name_unique: CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text)
- mfa_factors_user_id_idx: CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id)
- unique_phone_factor_per_user: CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone)

#### auth.oauth_authorizations
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| approved_at | timestamp with time zone | YES |  |  |  |  |
| authorization_code | text | YES |  |  | YES |  |
| authorization_id | text | NO |  |  | YES |  |
| client_id | uuid | NO |  |  |  |  |
| code_challenge | text | YES |  |  |  |  |
| code_challenge_method | code_challenge_method | YES |  |  |  |  |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| expires_at | timestamp with time zone | NO | (now() + '00:03:00'::interval) |  |  |  |
| id | uuid | NO |  | YES |  |  |
| nonce | text | YES |  |  |  |  |
| redirect_uri | text | NO |  |  |  |  |
| resource | text | YES |  |  |  |  |
| response_type | oauth_response_type | NO | 'code'::auth.oauth_response_type |  |  |  |
| scope | text | NO |  |  |  |  |
| state | text | YES |  |  |  |  |
| status | oauth_authorization_status | NO | 'pending'::auth.oauth_authorization_status |  |  |  |
| user_id | uuid | YES |  |  |  |  |

Indexes:
- oauth_auth_pending_exp_idx: CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status)
- oauth_authorizations_authorization_code_key: CREATE UNIQUE INDEX oauth_authorizations_authorization_code_key ON auth.oauth_authorizations USING btree (authorization_code)
- oauth_authorizations_authorization_id_key: CREATE UNIQUE INDEX oauth_authorizations_authorization_id_key ON auth.oauth_authorizations USING btree (authorization_id)
- oauth_authorizations_pkey: CREATE UNIQUE INDEX oauth_authorizations_pkey ON auth.oauth_authorizations USING btree (id)

#### auth.oauth_client_states
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| code_verifier | text | YES |  |  |  |  |
| created_at | timestamp with time zone | NO |  |  |  |  |
| id | uuid | NO |  | YES |  |  |
| provider_type | text | NO |  |  |  |  |

Indexes:
- idx_oauth_client_states_created_at: CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at)
- oauth_client_states_pkey: CREATE UNIQUE INDEX oauth_client_states_pkey ON auth.oauth_client_states USING btree (id)

#### auth.oauth_clients
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| client_name | text | YES |  |  |  |  |
| client_secret_hash | text | YES |  |  |  |  |
| client_type | oauth_client_type | NO | 'confidential'::auth.oauth_client_type |  |  |  |
| client_uri | text | YES |  |  |  |  |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| deleted_at | timestamp with time zone | YES |  |  |  |  |
| grant_types | text | NO |  |  |  |  |
| id | uuid | NO |  | YES |  |  |
| logo_uri | text | YES |  |  |  |  |
| redirect_uris | text | NO |  |  |  |  |
| registration_type | oauth_registration_type | NO |  |  |  |  |
| token_endpoint_auth_method | text | NO |  |  |  |  |
| updated_at | timestamp with time zone | NO | now() |  |  |  |

Indexes:
- oauth_clients_deleted_at_idx: CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at)
- oauth_clients_pkey: CREATE UNIQUE INDEX oauth_clients_pkey ON auth.oauth_clients USING btree (id)

#### auth.oauth_consents
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| client_id | uuid | NO |  |  | YES |  |
| granted_at | timestamp with time zone | NO | now() |  |  |  |
| id | uuid | NO |  | YES |  |  |
| revoked_at | timestamp with time zone | YES |  |  |  |  |
| scopes | text | NO |  |  |  |  |
| user_id | uuid | NO |  |  | YES |  |

Indexes:
- oauth_consents_active_client_idx: CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL)
- oauth_consents_active_user_client_idx: CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL)
- oauth_consents_pkey: CREATE UNIQUE INDEX oauth_consents_pkey ON auth.oauth_consents USING btree (id)
- oauth_consents_user_client_unique: CREATE UNIQUE INDEX oauth_consents_user_client_unique ON auth.oauth_consents USING btree (user_id, client_id)
- oauth_consents_user_order_idx: CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC)

#### auth.one_time_tokens
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp without time zone | NO | now() |  |  |  |
| id | uuid | NO |  | YES |  |  |
| relates_to | text | NO |  |  |  |  |
| token_hash | text | NO |  |  |  |  |
| token_type | one_time_token_type | NO |  |  |  |  |
| updated_at | timestamp without time zone | NO | now() |  |  |  |
| user_id | uuid | NO |  |  |  |  |

Indexes:
- one_time_tokens_pkey: CREATE UNIQUE INDEX one_time_tokens_pkey ON auth.one_time_tokens USING btree (id)
- one_time_tokens_relates_to_hash_idx: CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to)
- one_time_tokens_token_hash_hash_idx: CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash)
- one_time_tokens_user_id_token_type_key: CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type)

#### auth.refresh_tokens
Row count: 1

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp with time zone | YES |  |  |  |  |
| id | bigint | NO | nextval('auth.refresh_tokens_id_seq'::regclass) | YES |  |  |
| instance_id | uuid | YES |  |  |  |  |
| parent | character varying | YES |  |  |  |  |
| revoked | boolean | YES |  |  |  |  |
| session_id | uuid | YES |  |  |  |  |
| token | character varying | YES |  |  | YES |  |
| updated_at | timestamp with time zone | YES |  |  |  |  |
| user_id | character varying | YES |  |  |  |  |

Indexes:
- refresh_tokens_instance_id_idx: CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id)
- refresh_tokens_instance_id_user_id_idx: CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id)
- refresh_tokens_parent_idx: CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent)
- refresh_tokens_pkey: CREATE UNIQUE INDEX refresh_tokens_pkey ON auth.refresh_tokens USING btree (id)
- refresh_tokens_session_id_revoked_idx: CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked)
- refresh_tokens_token_unique: CREATE UNIQUE INDEX refresh_tokens_token_unique ON auth.refresh_tokens USING btree (token)
- refresh_tokens_updated_at_idx: CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC)

#### auth.saml_providers
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| attribute_mapping | jsonb | YES |  |  |  |  |
| created_at | timestamp with time zone | YES |  |  |  |  |
| entity_id | text | NO |  |  | YES |  |
| id | uuid | NO |  | YES |  |  |
| metadata_url | text | YES |  |  |  |  |
| metadata_xml | text | NO |  |  |  |  |
| name_id_format | text | YES |  |  |  |  |
| sso_provider_id | uuid | NO |  |  |  |  |
| updated_at | timestamp with time zone | YES |  |  |  |  |

Indexes:
- saml_providers_entity_id_key: CREATE UNIQUE INDEX saml_providers_entity_id_key ON auth.saml_providers USING btree (entity_id)
- saml_providers_pkey: CREATE UNIQUE INDEX saml_providers_pkey ON auth.saml_providers USING btree (id)
- saml_providers_sso_provider_id_idx: CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id)

#### auth.saml_relay_states
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp with time zone | YES |  |  |  |  |
| flow_state_id | uuid | YES |  |  |  |  |
| for_email | text | YES |  |  |  |  |
| id | uuid | NO |  | YES |  |  |
| redirect_to | text | YES |  |  |  |  |
| request_id | text | NO |  |  |  |  |
| sso_provider_id | uuid | NO |  |  |  |  |
| updated_at | timestamp with time zone | YES |  |  |  |  |

Indexes:
- saml_relay_states_created_at_idx: CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC)
- saml_relay_states_for_email_idx: CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email)
- saml_relay_states_pkey: CREATE UNIQUE INDEX saml_relay_states_pkey ON auth.saml_relay_states USING btree (id)
- saml_relay_states_sso_provider_id_idx: CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id)

#### auth.schema_migrations
Row count: 74

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| version | character varying | NO |  |  |  |  |

Indexes:
- schema_migrations_pkey: CREATE UNIQUE INDEX schema_migrations_pkey ON auth.schema_migrations USING btree (version)

#### auth.sessions
Row count: 1

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| aal | aal_level | YES |  |  |  |  |
| created_at | timestamp with time zone | YES |  |  |  |  |
| factor_id | uuid | YES |  |  |  |  |
| id | uuid | NO |  | YES |  |  |
| ip | inet | YES |  |  |  |  |
| not_after | timestamp with time zone | YES |  |  |  |  |
| oauth_client_id | uuid | YES |  |  |  |  |
| refresh_token_counter | bigint | YES |  |  |  |  |
| refresh_token_hmac_key | text | YES |  |  |  |  |
| refreshed_at | timestamp without time zone | YES |  |  |  |  |
| scopes | text | YES |  |  |  |  |
| tag | text | YES |  |  |  |  |
| updated_at | timestamp with time zone | YES |  |  |  |  |
| user_agent | text | YES |  |  |  |  |
| user_id | uuid | NO |  |  |  |  |

Indexes:
- sessions_not_after_idx: CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC)
- sessions_oauth_client_id_idx: CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id)
- sessions_pkey: CREATE UNIQUE INDEX sessions_pkey ON auth.sessions USING btree (id)
- sessions_user_id_idx: CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id)
- user_id_created_at_idx: CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at)

#### auth.sso_domains
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp with time zone | YES |  |  |  |  |
| domain | text | NO |  |  |  |  |
| id | uuid | NO |  | YES |  |  |
| sso_provider_id | uuid | NO |  |  |  |  |
| updated_at | timestamp with time zone | YES |  |  |  |  |

Indexes:
- sso_domains_domain_idx: CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain))
- sso_domains_pkey: CREATE UNIQUE INDEX sso_domains_pkey ON auth.sso_domains USING btree (id)
- sso_domains_sso_provider_id_idx: CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id)

#### auth.sso_providers
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp with time zone | YES |  |  |  |  |
| disabled | boolean | YES |  |  |  |  |
| id | uuid | NO |  | YES |  |  |
| resource_id | text | YES |  |  |  |  |
| updated_at | timestamp with time zone | YES |  |  |  |  |

Indexes:
- sso_providers_pkey: CREATE UNIQUE INDEX sso_providers_pkey ON auth.sso_providers USING btree (id)
- sso_providers_resource_id_idx: CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id))
- sso_providers_resource_id_pattern_idx: CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops)

#### auth.users
Row count: 1

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| aud | character varying | YES |  |  |  |  |
| banned_until | timestamp with time zone | YES |  |  |  |  |
| confirmation_sent_at | timestamp with time zone | YES |  |  |  |  |
| confirmation_token | character varying | YES |  |  |  |  |
| confirmed_at | timestamp with time zone | YES |  |  |  |  |
| created_at | timestamp with time zone | YES |  |  |  |  |
| deleted_at | timestamp with time zone | YES |  |  |  |  |
| email | character varying | YES |  |  |  |  |
| email_change | character varying | YES |  |  |  |  |
| email_change_confirm_status | smallint | YES | 0 |  |  |  |
| email_change_sent_at | timestamp with time zone | YES |  |  |  |  |
| email_change_token_current | character varying | YES | ''::character varying |  |  |  |
| email_change_token_new | character varying | YES |  |  |  |  |
| email_confirmed_at | timestamp with time zone | YES |  |  |  |  |
| encrypted_password | character varying | YES |  |  |  |  |
| id | uuid | NO |  | YES |  |  |
| instance_id | uuid | YES |  |  |  |  |
| invited_at | timestamp with time zone | YES |  |  |  |  |
| is_anonymous | boolean | NO | false |  |  |  |
| is_sso_user | boolean | NO | false |  |  |  |
| is_super_admin | boolean | YES |  |  |  |  |
| last_sign_in_at | timestamp with time zone | YES |  |  |  |  |
| phone | text | YES | NULL::character varying |  | YES |  |
| phone_change | text | YES | ''::character varying |  |  |  |
| phone_change_sent_at | timestamp with time zone | YES |  |  |  |  |
| phone_change_token | character varying | YES | ''::character varying |  |  |  |
| phone_confirmed_at | timestamp with time zone | YES |  |  |  |  |
| raw_app_meta_data | jsonb | YES |  |  |  |  |
| raw_user_meta_data | jsonb | YES |  |  |  |  |
| reauthentication_sent_at | timestamp with time zone | YES |  |  |  |  |
| reauthentication_token | character varying | YES | ''::character varying |  |  |  |
| recovery_sent_at | timestamp with time zone | YES |  |  |  |  |
| recovery_token | character varying | YES |  |  |  |  |
| role | character varying | YES |  |  |  |  |
| updated_at | timestamp with time zone | YES |  |  |  |  |

Indexes:
- confirmation_token_idx: CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text)
- email_change_token_current_idx: CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text)
- email_change_token_new_idx: CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text)
- reauthentication_token_idx: CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text)
- recovery_token_idx: CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text)
- users_email_partial_key: CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false)
- users_instance_id_email_idx: CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text))
- users_instance_id_idx: CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id)
- users_is_anonymous_idx: CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous)
- users_phone_key: CREATE UNIQUE INDEX users_phone_key ON auth.users USING btree (phone)
- users_pkey: CREATE UNIQUE INDEX users_pkey ON auth.users USING btree (id)

### Functions

#### auth.email
```sql
CREATE OR REPLACE FUNCTION auth.email()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$function$
```

#### auth.jwt
```sql
CREATE OR REPLACE FUNCTION auth.jwt()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$function$
```

#### auth.role
```sql
CREATE OR REPLACE FUNCTION auth.role()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$function$
```

#### auth.uid
```sql
CREATE OR REPLACE FUNCTION auth.uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$function$
```

### Types

- aal_level [enum] (aal1, aal2, aal3)
- audit_log_entries [composite]
- code_challenge_method [enum] (s256, plain)
- factor_status [enum] (unverified, verified)
- factor_type [enum] (totp, webauthn, phone)
- flow_state [composite]
- identities [composite]
- instances [composite]
- mfa_amr_claims [composite]
- mfa_challenges [composite]
- mfa_factors [composite]
- oauth_authorization_status [enum] (pending, approved, denied, expired)
- oauth_authorizations [composite]
- oauth_client_states [composite]
- oauth_client_type [enum] (public, confidential)
- oauth_clients [composite]
- oauth_consents [composite]
- oauth_registration_type [enum] (dynamic, manual)
- oauth_response_type [enum] (code)
- one_time_token_type [enum] (confirmation_token, reauthentication_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token)
- one_time_tokens [composite]
- refresh_tokens [composite]
- saml_providers [composite]
- saml_relay_states [composite]
- schema_migrations [composite]
- sessions [composite]
- sso_domains [composite]
- sso_providers [composite]
- users [composite]

### Sequences

- refresh_tokens_id_seq: type=bigint, start=1, min=1, max=9223372036854775807, inc=1, cycle=NO

## Schema: extensions

### Tables

#### extensions.pg_stat_statements

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| calls | bigint | YES |  |  |  |  |
| dbid | oid | YES |  |  |  |  |
| jit_deform_count | bigint | YES |  |  |  |  |
| jit_deform_time | double precision | YES |  |  |  |  |
| jit_emission_count | bigint | YES |  |  |  |  |
| jit_emission_time | double precision | YES |  |  |  |  |
| jit_functions | bigint | YES |  |  |  |  |
| jit_generation_time | double precision | YES |  |  |  |  |
| jit_inlining_count | bigint | YES |  |  |  |  |
| jit_inlining_time | double precision | YES |  |  |  |  |
| jit_optimization_count | bigint | YES |  |  |  |  |
| jit_optimization_time | double precision | YES |  |  |  |  |
| local_blk_read_time | double precision | YES |  |  |  |  |
| local_blk_write_time | double precision | YES |  |  |  |  |
| local_blks_dirtied | bigint | YES |  |  |  |  |
| local_blks_hit | bigint | YES |  |  |  |  |
| local_blks_read | bigint | YES |  |  |  |  |
| local_blks_written | bigint | YES |  |  |  |  |
| max_exec_time | double precision | YES |  |  |  |  |
| max_plan_time | double precision | YES |  |  |  |  |
| mean_exec_time | double precision | YES |  |  |  |  |
| mean_plan_time | double precision | YES |  |  |  |  |
| min_exec_time | double precision | YES |  |  |  |  |
| min_plan_time | double precision | YES |  |  |  |  |
| minmax_stats_since | timestamp with time zone | YES |  |  |  |  |
| plans | bigint | YES |  |  |  |  |
| query | text | YES |  |  |  |  |
| queryid | bigint | YES |  |  |  |  |
| rows | bigint | YES |  |  |  |  |
| shared_blk_read_time | double precision | YES |  |  |  |  |
| shared_blk_write_time | double precision | YES |  |  |  |  |
| shared_blks_dirtied | bigint | YES |  |  |  |  |
| shared_blks_hit | bigint | YES |  |  |  |  |
| shared_blks_read | bigint | YES |  |  |  |  |
| shared_blks_written | bigint | YES |  |  |  |  |
| stats_since | timestamp with time zone | YES |  |  |  |  |
| stddev_exec_time | double precision | YES |  |  |  |  |
| stddev_plan_time | double precision | YES |  |  |  |  |
| temp_blk_read_time | double precision | YES |  |  |  |  |
| temp_blk_write_time | double precision | YES |  |  |  |  |
| temp_blks_read | bigint | YES |  |  |  |  |
| temp_blks_written | bigint | YES |  |  |  |  |
| toplevel | boolean | YES |  |  |  |  |
| total_exec_time | double precision | YES |  |  |  |  |
| total_plan_time | double precision | YES |  |  |  |  |
| userid | oid | YES |  |  |  |  |
| wal_bytes | numeric | YES |  |  |  |  |
| wal_fpi | bigint | YES |  |  |  |  |
| wal_records | bigint | YES |  |  |  |  |

#### extensions.pg_stat_statements_info

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| dealloc | bigint | YES |  |  |  |  |
| stats_reset | timestamp with time zone | YES |  |  |  |  |

### Views

#### extensions.pg_stat_statements
```sql
SELECT userid,
    dbid,
    toplevel,
    queryid,
    query,
    plans,
    total_plan_time,
    min_plan_time,
    max_plan_time,
    mean_plan_time,
    stddev_plan_time,
    calls,
    total_exec_time,
    min_exec_time,
    max_exec_time,
    mean_exec_time,
    stddev_exec_time,
    rows,
    shared_blks_hit,
    shared_blks_read,
    shared_blks_dirtied,
    shared_blks_written,
    local_blks_hit,
    local_blks_read,
    local_blks_dirtied,
    local_blks_written,
    temp_blks_read,
    temp_blks_written,
    shared_blk_read_time,
    shared_blk_write_time,
    local_blk_read_time,
    local_blk_write_time,
    temp_blk_read_time,
    temp_blk_write_time,
    wal_records,
    wal_fpi,
    wal_bytes,
    jit_functions,
    jit_generation_time,
    jit_inlining_count,
    jit_inlining_time,
    jit_optimization_count,
    jit_optimization_time,
    jit_emission_count,
    jit_emission_time,
    jit_deform_count,
    jit_deform_time,
    stats_since,
    minmax_stats_since
   FROM pg_stat_statements(true) pg_stat_statements(userid, dbid, toplevel, queryid, query, plans, total_plan_time, min_plan_time, max_plan_time, mean_plan_time, stddev_plan_time, calls, total_exec_time, min_exec_time, max_exec_time, mean_exec_time, stddev_exec_time, rows, shared_blks_hit, shared_blks_read, shared_blks_dirtied, shared_blks_written, local_blks_hit, local_blks_read, local_blks_dirtied, local_blks_written, temp_blks_read, temp_blks_written, shared_blk_read_time, shared_blk_write_time, local_blk_read_time, local_blk_write_time, temp_blk_read_time, temp_blk_write_time, wal_records, wal_fpi, wal_bytes, jit_functions, jit_generation_time, jit_inlining_count, jit_inlining_time, jit_optimization_count, jit_optimization_time, jit_emission_count, jit_emission_time, jit_deform_count, jit_deform_time, stats_since, minmax_stats_since);
```

#### extensions.pg_stat_statements_info
```sql
SELECT dealloc,
    stats_reset
   FROM pg_stat_statements_info() pg_stat_statements_info(dealloc, stats_reset);
```

### Functions

#### extensions.armor
```sql
CREATE OR REPLACE FUNCTION extensions.armor(bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_armor$function$
```

#### extensions.armor
```sql
CREATE OR REPLACE FUNCTION extensions.armor(bytea, text[], text[])
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_armor$function$
```

#### extensions.crypt
```sql
CREATE OR REPLACE FUNCTION extensions.crypt(text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_crypt$function$
```

#### extensions.dearmor
```sql
CREATE OR REPLACE FUNCTION extensions.dearmor(text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_dearmor$function$
```

#### extensions.decrypt
```sql
CREATE OR REPLACE FUNCTION extensions.decrypt(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_decrypt$function$
```

#### extensions.decrypt_iv
```sql
CREATE OR REPLACE FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_decrypt_iv$function$
```

#### extensions.digest
```sql
CREATE OR REPLACE FUNCTION extensions.digest(text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_digest$function$
```

#### extensions.digest
```sql
CREATE OR REPLACE FUNCTION extensions.digest(bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_digest$function$
```

#### extensions.encrypt
```sql
CREATE OR REPLACE FUNCTION extensions.encrypt(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_encrypt$function$
```

#### extensions.encrypt_iv
```sql
CREATE OR REPLACE FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_encrypt_iv$function$
```

#### extensions.gen_random_bytes
```sql
CREATE OR REPLACE FUNCTION extensions.gen_random_bytes(integer)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_random_bytes$function$
```

#### extensions.gen_random_uuid
```sql
CREATE OR REPLACE FUNCTION extensions.gen_random_uuid()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE
AS '$libdir/pgcrypto', $function$pg_random_uuid$function$
```

#### extensions.gen_salt
```sql
CREATE OR REPLACE FUNCTION extensions.gen_salt(text)
 RETURNS text
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_gen_salt$function$
```

#### extensions.gen_salt
```sql
CREATE OR REPLACE FUNCTION extensions.gen_salt(text, integer)
 RETURNS text
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_gen_salt_rounds$function$
```

#### extensions.grant_pg_cron_access
```sql
CREATE OR REPLACE FUNCTION extensions.grant_pg_cron_access()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$function$
```

#### extensions.grant_pg_graphql_access
```sql
CREATE OR REPLACE FUNCTION extensions.grant_pg_graphql_access()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$function$
```

#### extensions.grant_pg_net_access
```sql
CREATE OR REPLACE FUNCTION extensions.grant_pg_net_access()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$function$
```

#### extensions.hmac
```sql
CREATE OR REPLACE FUNCTION extensions.hmac(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_hmac$function$
```

#### extensions.hmac
```sql
CREATE OR REPLACE FUNCTION extensions.hmac(text, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_hmac$function$
```

#### extensions.pg_stat_statements
```sql
CREATE OR REPLACE FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone)
 RETURNS SETOF record
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pg_stat_statements', $function$pg_stat_statements_1_11$function$
```

#### extensions.pg_stat_statements_info
```sql
CREATE OR REPLACE FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone)
 RETURNS record
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pg_stat_statements', $function$pg_stat_statements_info$function$
```

#### extensions.pg_stat_statements_reset
```sql
CREATE OR REPLACE FUNCTION extensions.pg_stat_statements_reset(userid oid DEFAULT 0, dbid oid DEFAULT 0, queryid bigint DEFAULT 0, minmax_only boolean DEFAULT false)
 RETURNS timestamp with time zone
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pg_stat_statements', $function$pg_stat_statements_reset_1_11$function$
```

#### extensions.pgp_armor_headers
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text)
 RETURNS SETOF record
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_armor_headers$function$
```

#### extensions.pgp_key_id
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_key_id(bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_key_id_w$function$
```

#### extensions.pgp_pub_decrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$
```

#### extensions.pgp_pub_decrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$
```

#### extensions.pgp_pub_decrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$
```

#### extensions.pgp_pub_decrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$
```

#### extensions.pgp_pub_decrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$
```

#### extensions.pgp_pub_decrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$
```

#### extensions.pgp_pub_encrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt(text, bytea)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$
```

#### extensions.pgp_pub_encrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt(text, bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$
```

#### extensions.pgp_pub_encrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$
```

#### extensions.pgp_pub_encrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$
```

#### extensions.pgp_sym_decrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt(bytea, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$
```

#### extensions.pgp_sym_decrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt(bytea, text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$
```

#### extensions.pgp_sym_decrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$
```

#### extensions.pgp_sym_decrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$
```

#### extensions.pgp_sym_encrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt(text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$
```

#### extensions.pgp_sym_encrypt
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt(text, text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$
```

#### extensions.pgp_sym_encrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$
```

#### extensions.pgp_sym_encrypt_bytea
```sql
CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$
```

#### extensions.pgrst_ddl_watch
```sql
CREATE OR REPLACE FUNCTION extensions.pgrst_ddl_watch()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $function$
```

#### extensions.pgrst_drop_watch
```sql
CREATE OR REPLACE FUNCTION extensions.pgrst_drop_watch()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $function$
```

#### extensions.set_graphql_placeholder
```sql
CREATE OR REPLACE FUNCTION extensions.set_graphql_placeholder()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$function$
```

#### extensions.uuid_generate_v1
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_generate_v1()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v1$function$
```

#### extensions.uuid_generate_v1mc
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_generate_v1mc()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v1mc$function$
```

#### extensions.uuid_generate_v3
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_generate_v3(namespace uuid, name text)
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v3$function$
```

#### extensions.uuid_generate_v4
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_generate_v4()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v4$function$
```

#### extensions.uuid_generate_v5
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_generate_v5(namespace uuid, name text)
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v5$function$
```

#### extensions.uuid_nil
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_nil()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_nil$function$
```

#### extensions.uuid_ns_dns
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_ns_dns()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_dns$function$
```

#### extensions.uuid_ns_oid
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_ns_oid()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_oid$function$
```

#### extensions.uuid_ns_url
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_ns_url()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_url$function$
```

#### extensions.uuid_ns_x500
```sql
CREATE OR REPLACE FUNCTION extensions.uuid_ns_x500()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_x500$function$
```

### Types

- pg_stat_statements [composite]
- pg_stat_statements_info [composite]

## Schema: public

### Tables

#### public.action_types
Row count: 12

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| description | text | YES |  |  |  |  |
| id | uuid | NO | uuid_generate_v4() | YES |  |  |
| is_active | boolean | YES | true |  |  |  |
| key | text | NO |  |  | YES |  |
| label | text | NO |  |  |  |  |
| sort_order | integer | YES | 0 |  |  |  |
| tenant_id | uuid | NO |  |  | YES | public.tenants(id) |

Indexes:
- action_types_pkey: CREATE UNIQUE INDEX action_types_pkey ON public.action_types USING btree (id)
- action_types_tenant_id_key_key: CREATE UNIQUE INDEX action_types_tenant_id_key_key ON public.action_types USING btree (tenant_id, key)
- idx_action_types_tenant: CREATE INDEX idx_action_types_tenant ON public.action_types USING btree (tenant_id, sort_order)
- ux_action_types_tenant_key: CREATE UNIQUE INDEX ux_action_types_tenant_key ON public.action_types USING btree (tenant_id, key)

Policies (RLS):
- tenant_isolation_actions (cmd=*, permissive=true): USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())

#### public.audit_logs
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| action | text | NO |  |  |  |  |
| admin_note | text | YES |  |  |  |  |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| id | uuid | NO | uuid_generate_v4() | YES |  |  |
| ip_address | text | YES |  |  |  |  |
| new_values | jsonb | YES |  |  |  |  |
| old_values | jsonb | YES |  |  |  |  |
| record_id | uuid | YES |  |  |  |  |
| table_name | text | YES |  |  |  |  |
| tenant_id | uuid | NO |  |  |  | public.tenants(id) |
| user_agent | text | YES |  |  |  |  |
| user_id | uuid | YES |  |  |  |  |

Indexes:
- audit_logs_pkey: CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id)
- idx_audit_logs_tenant: CREATE INDEX idx_audit_logs_tenant ON public.audit_logs USING btree (tenant_id, created_at DESC)
- idx_audit_logs_tenant_action_date: CREATE INDEX idx_audit_logs_tenant_action_date ON public.audit_logs USING btree (tenant_id, action, created_at DESC)
- idx_audit_logs_tenant_table_date: CREATE INDEX idx_audit_logs_tenant_table_date ON public.audit_logs USING btree (tenant_id, table_name, created_at DESC)

Policies (RLS):
- audit_logs_insert (cmd=INSERT, permissive=true): USING  WITH CHECK ((is_platform_admin() = true) OR (tenant_id = current_tenant_id()))
- audit_logs_select (cmd=SELECT, permissive=true): USING ((tenant_id = current_tenant_id()) OR (is_platform_admin() = true)) WITH CHECK 

#### public.case_followups
Row count: 1

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| action_date | date | NO | CURRENT_DATE |  |  |  |
| action_type | text | NO | 'Seguimiento'::text |  |  |  |
| case_id | uuid | YES |  |  |  | public.cases(id) |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| description | text | YES | ''::text |  |  |  |
| detail | text | YES | ''::text |  |  |  |
| due_date | date | YES |  |  |  |  |
| id | uuid | NO | uuid_generate_v4() | YES |  |  |
| observations | text | YES | ''::text |  |  |  |
| process_stage | text | NO | 'Seguimiento'::text |  |  |  |
| responsible | text | YES | ''::text |  |  |  |
| stage_status | text | NO | 'Completada'::text |  |  |  |
| tenant_id | uuid | YES |  |  |  | public.tenants(id) |
| updated_at | timestamp with time zone | NO | now() |  |  |  |

Indexes:
- case_followups_pkey: CREATE UNIQUE INDEX case_followups_pkey ON public.case_followups USING btree (id)
- idx_followups_action_date: CREATE INDEX idx_followups_action_date ON public.case_followups USING btree (action_date DESC)
- idx_followups_case_date: CREATE INDEX idx_followups_case_date ON public.case_followups USING btree (case_id, action_date DESC)
- idx_followups_case_id: CREATE INDEX idx_followups_case_id ON public.case_followups USING btree (case_id)
- idx_followups_process_stage: CREATE INDEX idx_followups_process_stage ON public.case_followups USING btree (process_stage)
- idx_followups_tenant_id: CREATE INDEX idx_followups_tenant_id ON public.case_followups USING btree (tenant_id)

Policies (RLS):
- tenant_isolation_followups (cmd=*, permissive=true): USING true WITH CHECK 

Triggers:
- update_case_followups_updated_at: CREATE TRIGGER update_case_followups_updated_at BEFORE UPDATE ON public.case_followups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

#### public.case_message_attachments
Row count: 1

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| case_id | uuid | NO |  |  |  | public.cases(id) |
| content_type | text | YES |  |  |  |  |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| file_name | text | NO |  |  |  |  |
| file_size | bigint | YES |  |  |  |  |
| id | uuid | NO | uuid_generate_v4() | YES |  |  |
| message_id | uuid | NO |  |  |  | public.case_messages(id) |
| storage_bucket | text | NO | 'evidencias'::text |  |  |  |
| storage_path | text | NO |  |  |  |  |
| tenant_id | uuid | NO |  |  |  | public.tenants(id) |
| updated_at | timestamp with time zone | NO | now() |  |  |  |

Indexes:
- case_message_attachments_pkey: CREATE UNIQUE INDEX case_message_attachments_pkey ON public.case_message_attachments USING btree (id)
- idx_case_message_attachments_case_id: CREATE INDEX idx_case_message_attachments_case_id ON public.case_message_attachments USING btree (case_id)
- idx_case_message_attachments_message: CREATE INDEX idx_case_message_attachments_message ON public.case_message_attachments USING btree (tenant_id, message_id, created_at DESC)
- idx_case_message_attachments_message_id: CREATE INDEX idx_case_message_attachments_message_id ON public.case_message_attachments USING btree (message_id)
- ux_case_message_attachments_storage_path: CREATE UNIQUE INDEX ux_case_message_attachments_storage_path ON public.case_message_attachments USING btree (storage_path)

Policies (RLS):
- case_message_attachments_delete (cmd=DELETE, permissive=true): USING ((tenant_id = current_tenant_id()) AND (is_tenant_admin() = true)) WITH CHECK 
- case_message_attachments_insert (cmd=INSERT, permissive=true): USING  WITH CHECK (tenant_id = current_tenant_id())
- case_message_attachments_select (cmd=SELECT, permissive=true): USING (tenant_id = current_tenant_id()) WITH CHECK 
- case_message_attachments_update (cmd=UPDATE, permissive=true): USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())

Triggers:
- trg_case_message_attachments_set_tenant: CREATE TRIGGER trg_case_message_attachments_set_tenant BEFORE INSERT ON public.case_message_attachments FOR EACH ROW EXECUTE FUNCTION set_case_message_attachment_tenant_id()
- trigger_case_message_attachments_updated_at: CREATE TRIGGER trigger_case_message_attachments_updated_at BEFORE UPDATE ON public.case_message_attachments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

#### public.case_messages
Row count: 2

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| body | text | NO |  |  |  |  |
| case_id | uuid | NO |  |  |  | public.cases(id) |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| id | uuid | NO | uuid_generate_v4() | YES |  |  |
| is_urgent | boolean | NO | false |  |  |  |
| parent_id | uuid | YES |  |  |  | public.case_messages(id) |
| process_stage | text | YES |  |  |  |  |
| sender_name | text | YES |  |  |  |  |
| sender_role | text | YES |  |  |  |  |
| tenant_id | uuid | NO |  |  |  | public.tenants(id) |
| updated_at | timestamp with time zone | NO | now() |  |  |  |
| user_id | uuid | YES |  |  |  |  |

Indexes:
- case_messages_pkey: CREATE UNIQUE INDEX case_messages_pkey ON public.case_messages USING btree (id)
- idx_case_messages_case: CREATE INDEX idx_case_messages_case ON public.case_messages USING btree (tenant_id, case_id, created_at DESC)
- idx_case_messages_parent: CREATE INDEX idx_case_messages_parent ON public.case_messages USING btree (case_id, parent_id)
- idx_case_messages_parent_id: CREATE INDEX idx_case_messages_parent_id ON public.case_messages USING btree (parent_id)

Policies (RLS):
- case_messages_delete (cmd=DELETE, permissive=true): USING ((tenant_id = current_tenant_id()) AND (is_tenant_admin() = true)) WITH CHECK 
- case_messages_insert (cmd=INSERT, permissive=true): USING  WITH CHECK (tenant_id = current_tenant_id())
- case_messages_select (cmd=SELECT, permissive=true): USING (tenant_id = current_tenant_id()) WITH CHECK 
- case_messages_update (cmd=UPDATE, permissive=true): USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())

Triggers:
- trg_case_messages_set_tenant: CREATE TRIGGER trg_case_messages_set_tenant BEFORE INSERT ON public.case_messages FOR EACH ROW EXECUTE FUNCTION set_case_message_tenant_id()
- trigger_case_messages_updated_at: CREATE TRIGGER trigger_case_messages_updated_at BEFORE UPDATE ON public.case_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

#### public.cases
Row count: 1

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| actions_taken | text | YES | ''::text |  |  |  |
| closed_at | timestamp with time zone | YES |  |  |  |  |
| conduct_category | text | YES | ''::text |  |  |  |
| conduct_type | text | YES | ''::text |  |  |  |
| course_incident | text | YES | ''::text |  |  |  |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| guardian_notified | boolean | YES | false |  |  |  |
| id | uuid | NO | uuid_generate_v4() | YES |  |  |
| incident_date | date | NO | CURRENT_DATE |  |  |  |
| incident_time | text | YES | ''::text |  |  |  |
| indagacion_due_date | date | YES |  |  |  |  |
| indagacion_start_date | date | YES |  |  |  |  |
| legacy_case_number | text | YES |  |  |  |  |
| responsible | text | YES | ''::text |  |  |  |
| responsible_role | text | YES | ''::text |  |  |  |
| seguimiento_started_at | timestamp with time zone | YES |  |  |  |  |
| short_description | text | YES | ''::text |  |  |  |
| status | text | NO | 'Reportado'::text |  |  |  |
| student_id | uuid | YES |  |  |  | public.students(id) |
| student_name | text | YES |  |  |  |  |
| tenant_id | uuid | YES |  |  |  | public.tenants(id) |
| updated_at | timestamp with time zone | NO | now() |  |  |  |

Indexes:
- cases_pkey: CREATE UNIQUE INDEX cases_pkey ON public.cases USING btree (id)
- idx_cases_closed_at: CREATE INDEX idx_cases_closed_at ON public.cases USING btree (closed_at) WHERE (closed_at IS NOT NULL)
- idx_cases_conduct_category: CREATE INDEX idx_cases_conduct_category ON public.cases USING btree (conduct_category)
- idx_cases_conduct_type: CREATE INDEX idx_cases_conduct_type ON public.cases USING btree (conduct_type)
- idx_cases_incident_date: CREATE INDEX idx_cases_incident_date ON public.cases USING btree (incident_date DESC)
- idx_cases_indagacion_due_date: CREATE INDEX idx_cases_indagacion_due_date ON public.cases USING btree (indagacion_due_date) WHERE (indagacion_due_date IS NOT NULL)
- idx_cases_seguimiento_started_at: CREATE INDEX idx_cases_seguimiento_started_at ON public.cases USING btree (seguimiento_started_at) WHERE (seguimiento_started_at IS NOT NULL)
- idx_cases_status: CREATE INDEX idx_cases_status ON public.cases USING btree (status)
- idx_cases_student_id: CREATE INDEX idx_cases_student_id ON public.cases USING btree (student_id)
- idx_cases_tenant_id: CREATE INDEX idx_cases_tenant_id ON public.cases USING btree (tenant_id)

Policies (RLS):
- Tenant delete access (cmd=DELETE, permissive=true): USING (tenant_id = (current_setting('request.jwt.claim.tenant_id'::text, true))::uuid) WITH CHECK 
- Tenant insert access (cmd=INSERT, permissive=true): USING  WITH CHECK (tenant_id = (current_setting('request.jwt.claim.tenant_id'::text, true))::uuid)
- Tenant read access (cmd=SELECT, permissive=true): USING (tenant_id = (current_setting('request.jwt.claim.tenant_id'::text, true))::uuid) WITH CHECK 
- Tenant update access (cmd=UPDATE, permissive=true): USING (tenant_id = (current_setting('request.jwt.claim.tenant_id'::text, true))::uuid) WITH CHECK 
- tenant_isolation_cases (cmd=*, permissive=true): USING true WITH CHECK 

Triggers:
- update_cases_updated_at: CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

#### public.catalog_staging_batches
Row count: 2

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| applied_at | timestamp with time zone | YES |  |  |  |  |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| id | uuid | NO | gen_random_uuid() | YES |  |  |
| source_name | text | YES |  |  |  |  |
| status | text | NO | 'draft'::text |  |  |  |
| tenant_id | uuid | NO |  |  |  | public.tenants(id) |
| uploaded_by | uuid | YES |  |  |  |  |

Indexes:
- catalog_staging_batches_pkey: CREATE UNIQUE INDEX catalog_staging_batches_pkey ON public.catalog_staging_batches USING btree (id)

#### public.conduct_catalog
Row count: 38

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| active | boolean | NO | true |  |  |  |
| conduct_category | text | NO |  |  |  |  |
| conduct_type | text | NO |  |  |  |  |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| id | uuid | NO | gen_random_uuid() | YES |  |  |
| sort_order | integer | NO | 0 |  |  |  |

Indexes:
- conduct_catalog_pkey: CREATE UNIQUE INDEX conduct_catalog_pkey ON public.conduct_catalog USING btree (id)
- idx_conduct_catalog_type_active: CREATE INDEX idx_conduct_catalog_type_active ON public.conduct_catalog USING btree (conduct_type, active)
- ux_conduct_catalog_type_category: CREATE UNIQUE INDEX ux_conduct_catalog_type_category ON public.conduct_catalog USING btree (conduct_type, conduct_category)

#### public.conduct_types
Row count: 4

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| active | boolean | NO | true |  |  |  |
| color | text | NO |  |  |  |  |
| created_at | timestamp with time zone | YES | now() |  |  |  |
| id | uuid | NO | gen_random_uuid() | YES |  |  |
| key | text | NO |  |  | YES |  |
| label | text | NO |  |  |  |  |
| sort_order | integer | NO |  |  |  |  |

Indexes:
- conduct_types_key_key: CREATE UNIQUE INDEX conduct_types_key_key ON public.conduct_types USING btree (key)
- conduct_types_pkey: CREATE UNIQUE INDEX conduct_types_pkey ON public.conduct_types USING btree (id)

#### public.followup_evidence
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| case_id | uuid | YES |  |  |  | public.cases(id) |
| content_type | text | YES |  |  |  |  |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| file_name | text | NO |  |  |  |  |
| file_size | bigint | YES |  |  |  |  |
| followup_id | uuid | YES |  |  |  | public.case_followups(id) |
| id | uuid | NO | uuid_generate_v4() | YES |  |  |
| storage_bucket | text | NO | 'evidencias'::text |  |  |  |
| storage_path | text | NO |  |  |  |  |
| tenant_id | uuid | YES |  |  |  | public.tenants(id) |
| updated_at | timestamp with time zone | NO | now() |  |  |  |

Indexes:
- followup_evidence_pkey: CREATE UNIQUE INDEX followup_evidence_pkey ON public.followup_evidence USING btree (id)
- idx_evidence_case_id: CREATE INDEX idx_evidence_case_id ON public.followup_evidence USING btree (case_id)
- idx_evidence_followup_id: CREATE INDEX idx_evidence_followup_id ON public.followup_evidence USING btree (followup_id)

Policies (RLS):
- tenant_isolation_evidence (cmd=*, permissive=true): USING true WITH CHECK 

Triggers:
- update_followup_evidence_updated_at: CREATE TRIGGER update_followup_evidence_updated_at BEFORE UPDATE ON public.followup_evidence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

#### public.involucrados
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| case_id | uuid | YES |  |  |  | public.cases(id) |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| curso | text | YES | ''::text |  |  |  |
| id | uuid | NO | uuid_generate_v4() | YES |  |  |
| nombre | text | NO | ''::text |  |  |  |
| rol | text | NO | 'Testigo'::text |  |  |  |
| tenant_id | uuid | YES |  |  |  | public.tenants(id) |

Indexes:
- idx_involucrados_case_id: CREATE INDEX idx_involucrados_case_id ON public.involucrados USING btree (case_id)
- idx_involucrados_rol: CREATE INDEX idx_involucrados_rol ON public.involucrados USING btree (rol)
- involucrados_pkey: CREATE UNIQUE INDEX involucrados_pkey ON public.involucrados USING btree (id)

Policies (RLS):
- tenant_isolation_involved (cmd=*, permissive=true): USING true WITH CHECK 

#### public.platform_versions
Row count: 1

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| breaking_changes | jsonb | YES | '[]'::jsonb |  |  |  |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| features | jsonb | YES | '[]'::jsonb |  |  |  |
| id | uuid | NO | uuid_generate_v4() | YES |  |  |
| is_active | boolean | YES | true |  |  |  |
| is_mandatory | boolean | YES | false |  |  |  |
| min_plan | text | YES | 'basic'::text |  |  |  |
| release_notes | text | YES |  |  |  |  |
| released_at | timestamp with time zone | NO | now() |  |  |  |
| version | text | NO |  |  | YES |  |

Indexes:
- platform_versions_pkey: CREATE UNIQUE INDEX platform_versions_pkey ON public.platform_versions USING btree (id)
- platform_versions_version_key: CREATE UNIQUE INDEX platform_versions_version_key ON public.platform_versions USING btree (version)

Policies (RLS):
- versions_manage (cmd=*, permissive=true): USING true WITH CHECK 
- versions_select (cmd=SELECT, permissive=true): USING true WITH CHECK 

#### public.process_stages
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| description | text | YES |  |  |  |  |
| id | uuid | NO | uuid_generate_v4() | YES |  |  |
| stage_name | text | NO |  |  |  |  |
| stage_order | integer | NO |  |  |  |  |
| tenant_id | uuid | YES |  |  |  | public.tenants(id) |

Indexes:
- process_stages_pkey: CREATE UNIQUE INDEX process_stages_pkey ON public.process_stages USING btree (id)

Policies (RLS):
- tenant_isolation_stages (cmd=*, permissive=true): USING true WITH CHECK 

#### public.stage_sla
Row count: 7

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| days_to_due | integer | YES |  |  |  |  |
| stage_key | text | NO |  | YES |  |  |

Indexes:
- stage_sla_pkey: CREATE UNIQUE INDEX stage_sla_pkey ON public.stage_sla USING btree (stage_key)

#### public.stg_action_types
Row count: 12

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| batch_id | uuid | NO |  |  |  | public.catalog_staging_batches(id) |
| description | text | YES |  |  |  |  |
| id | bigint | NO | nextval('stg_action_types_id_seq'::regclass) | YES |  |  |
| is_active | boolean | YES | true |  |  |  |
| key | text | NO |  |  |  |  |
| label | text | NO |  |  |  |  |
| sort_order | integer | YES | 0 |  |  |  |
| tenant_id | uuid | NO |  |  |  | public.tenants(id) |

Indexes:
- stg_action_types_pkey: CREATE UNIQUE INDEX stg_action_types_pkey ON public.stg_action_types USING btree (id)

#### public.stg_conduct_catalog
Row count: 26

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| batch_id | uuid | NO |  |  |  | public.catalog_staging_batches(id) |
| conduct_category | text | NO |  |  |  |  |
| conduct_type | text | NO |  |  |  |  |
| id | bigint | NO | nextval('stg_conduct_catalog_id_seq'::regclass) | YES |  |  |
| is_active | boolean | YES | true |  |  |  |
| sort_order | integer | YES | 0 |  |  |  |
| tenant_id | uuid | NO |  |  |  | public.tenants(id) |

Indexes:
- stg_conduct_catalog_pkey: CREATE UNIQUE INDEX stg_conduct_catalog_pkey ON public.stg_conduct_catalog USING btree (id)

#### public.stg_conduct_types
Row count: 18

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| batch_id | uuid | NO |  |  |  | public.catalog_staging_batches(id) |
| id | bigint | NO | nextval('stg_conduct_types_id_seq'::regclass) | YES |  |  |
| is_active | boolean | YES | true |  |  |  |
| sort_order | integer | YES | 0 |  |  |  |
| tenant_id | uuid | NO |  |  |  | public.tenants(id) |
| type_category | text | NO |  |  |  |  |
| type_name | text | NO |  |  |  |  |

Indexes:
- stg_conduct_types_pkey: CREATE UNIQUE INDEX stg_conduct_types_pkey ON public.stg_conduct_types USING btree (id)

#### public.stg_stage_sla
Row count: 10

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| batch_id | uuid | NO |  |  |  | public.catalog_staging_batches(id) |
| days_to_due | integer | NO |  |  |  |  |
| id | bigint | NO | nextval('stg_stage_sla_id_seq'::regclass) | YES |  |  |
| is_active | boolean | YES | true |  |  |  |
| stage_key | text | NO |  |  |  |  |
| tenant_id | uuid | NO |  |  |  | public.tenants(id) |

Indexes:
- stg_stage_sla_pkey: CREATE UNIQUE INDEX stg_stage_sla_pkey ON public.stg_stage_sla USING btree (id)

#### public.students
Row count: 41

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| course | text | YES |  |  |  |  |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| first_name | text | NO | ''::text |  |  |  |
| id | uuid | NO | uuid_generate_v4() | YES |  |  |
| last_name | text | NO | ''::text |  |  |  |
| level | text | YES |  |  |  |  |
| rut | text | YES |  |  |  |  |
| tenant_id | uuid | YES |  |  |  | public.tenants(id) |
| updated_at | timestamp with time zone | NO | now() |  |  |  |

Indexes:
- idx_students_course: CREATE INDEX idx_students_course ON public.students USING btree (course)
- idx_students_full_name: CREATE INDEX idx_students_full_name ON public.students USING gin (to_tsvector('spanish'::regconfig, ((COALESCE(first_name, ''::text) || ' '::text) || COALESCE(last_name, ''::text))))
- idx_students_level: CREATE INDEX idx_students_level ON public.students USING btree (level)
- idx_students_tenant_id: CREATE INDEX idx_students_tenant_id ON public.students USING btree (tenant_id)
- students_pkey: CREATE UNIQUE INDEX students_pkey ON public.students USING btree (id)

Policies (RLS):
- Users can only access students from their tenant (cmd=*, permissive=true): USING ((auth.jwt() ->> 'tenant_id'::text) = (tenant_id)::text) WITH CHECK 
- tenant_isolation_students (cmd=*, permissive=true): USING true WITH CHECK 

Triggers:
- update_students_updated_at: CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

#### public.tenant_catalogs
Row count: 16

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| catalog_type | text | NO |  |  | YES |  |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| description | text | YES |  |  |  |  |
| display_order | integer | YES | 0 |  |  |  |
| id | uuid | NO | uuid_generate_v4() | YES |  |  |
| is_active | boolean | YES | true |  |  |  |
| key | text | NO |  |  | YES |  |
| label | text | NO |  |  |  |  |
| metadata | jsonb | YES | '{}'::jsonb |  |  |  |
| tenant_id | uuid | NO |  |  | YES | public.tenants(id) |
| updated_at | timestamp with time zone | NO | now() |  |  |  |

Indexes:
- idx_tenant_catalogs_tenant_type: CREATE INDEX idx_tenant_catalogs_tenant_type ON public.tenant_catalogs USING btree (tenant_id, catalog_type)
- tenant_catalogs_pkey: CREATE UNIQUE INDEX tenant_catalogs_pkey ON public.tenant_catalogs USING btree (id)
- tenant_catalogs_tenant_id_catalog_type_key_key: CREATE UNIQUE INDEX tenant_catalogs_tenant_id_catalog_type_key_key ON public.tenant_catalogs USING btree (tenant_id, catalog_type, key)

Policies (RLS):
- catalogs_manage (cmd=*, permissive=true): USING true WITH CHECK 
- catalogs_select (cmd=SELECT, permissive=true): USING true WITH CHECK 

#### public.tenant_profiles
Row count: 1

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| avatar_url | text | YES |  |  |  |  |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| department | text | YES |  |  |  |  |
| email | text | NO |  |  |  |  |
| full_name | text | YES |  |  |  |  |
| id | uuid | NO |  | YES | YES |  |
| is_active | boolean | YES | true |  |  |  |
| last_login_at | timestamp with time zone | YES |  |  |  |  |
| phone | text | YES |  |  |  |  |
| role | text | NO | 'user'::text |  |  |  |
| tenant_id | uuid | NO |  |  | YES | public.tenants(id) |
| updated_at | timestamp with time zone | NO | now() |  |  |  |

Indexes:
- idx_tenant_profiles_tenant: CREATE INDEX idx_tenant_profiles_tenant ON public.tenant_profiles USING btree (tenant_id, email)
- idx_tenant_profiles_user: CREATE INDEX idx_tenant_profiles_user ON public.tenant_profiles USING btree (id)
- tenant_profiles_id_tenant_id_key: CREATE UNIQUE INDEX tenant_profiles_id_tenant_id_key ON public.tenant_profiles USING btree (id, tenant_id)
- tenant_profiles_pkey: CREATE UNIQUE INDEX tenant_profiles_pkey ON public.tenant_profiles USING btree (id)

Policies (RLS):
- tenant_profiles_insert_platform (cmd=INSERT, permissive=true): USING  WITH CHECK (is_platform_admin() = true)
- tenant_profiles_select_own (cmd=SELECT, permissive=true): USING (id = auth.uid()) WITH CHECK 
- tenant_profiles_select_platform (cmd=SELECT, permissive=true): USING (is_platform_admin() = true) WITH CHECK 
- tenant_profiles_select_tenant_admin (cmd=SELECT, permissive=true): USING ((tenant_id = current_tenant_id()) AND (is_tenant_admin() = true)) WITH CHECK 
- tenant_profiles_update_own_safe (cmd=UPDATE, permissive=true): USING (id = auth.uid()) WITH CHECK ((id = auth.uid()) AND (tenant_id = current_tenant_id()) AND (role = ( SELECT tp.role
   FROM tenant_profiles tp
  WHERE (tp.id = auth.uid())
 LIMIT 1)))
- tenant_profiles_update_tenant_admin (cmd=UPDATE, permissive=true): USING ((tenant_id = current_tenant_id()) AND (is_tenant_admin() = true)) WITH CHECK ((tenant_id = current_tenant_id()) AND (is_tenant_admin() = true))

Triggers:
- update_tenant_profiles_updated_at: CREATE TRIGGER update_tenant_profiles_updated_at BEFORE UPDATE ON public.tenant_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

#### public.tenant_settings
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| id | uuid | NO | uuid_generate_v4() | YES |  |  |
| setting_key | text | NO |  |  | YES |  |
| setting_value | jsonb | NO |  |  |  |  |
| tenant_id | uuid | NO |  |  | YES | public.tenants(id) |
| updated_at | timestamp with time zone | NO | now() |  |  |  |

Indexes:
- tenant_settings_pkey: CREATE UNIQUE INDEX tenant_settings_pkey ON public.tenant_settings USING btree (id)
- tenant_settings_tenant_id_setting_key_key: CREATE UNIQUE INDEX tenant_settings_tenant_id_setting_key_key ON public.tenant_settings USING btree (tenant_id, setting_key)
- ux_tenant_settings_tenant_key: CREATE UNIQUE INDEX ux_tenant_settings_tenant_key ON public.tenant_settings USING btree (tenant_id, setting_key)

Policies (RLS):
- tenant_settings_manage (cmd=*, permissive=true): USING ((is_platform_admin() = true) OR ((tenant_id = current_tenant_id()) AND (is_tenant_admin() = true))) WITH CHECK ((is_platform_admin() = true) OR ((tenant_id = current_tenant_id()) AND (is_tenant_admin() = true)))
- tenant_settings_select (cmd=SELECT, permissive=true): USING ((tenant_id = current_tenant_id()) OR (is_platform_admin() = true)) WITH CHECK 

Triggers:
- trigger_tenant_settings_updated_at: CREATE TRIGGER trigger_tenant_settings_updated_at BEFORE UPDATE ON public.tenant_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

#### public.tenant_versions
Row count: 1

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| applied_at | timestamp with time zone | NO | now() |  |  |  |
| auto_update_enabled | boolean | YES | true |  |  |  |
| id | uuid | NO | uuid_generate_v4() | YES |  |  |
| tenant_id | uuid | NO |  |  | YES | public.tenants(id) |
| version_id | uuid | NO |  |  |  | public.platform_versions(id) |

Indexes:
- tenant_versions_pkey: CREATE UNIQUE INDEX tenant_versions_pkey ON public.tenant_versions USING btree (id)
- tenant_versions_tenant_id_key: CREATE UNIQUE INDEX tenant_versions_tenant_id_key ON public.tenant_versions USING btree (tenant_id)

Policies (RLS):
- tenant_versions_select (cmd=SELECT, permissive=true): USING true WITH CHECK 

#### public.tenants
Row count: 3

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| address | text | YES |  |  |  |  |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| date_format | text | YES | 'DD/MM/YYYY'::text |  |  |  |
| deleted_at | timestamp with time zone | YES |  |  |  |  |
| descripcion | text | YES |  |  |  |  |
| email | text | YES |  |  |  |  |
| favicon_url | text | YES |  |  |  |  |
| features | jsonb | YES | '{}'::jsonb |  |  |  |
| id | uuid | NO | uuid_generate_v4() | YES |  |  |
| is_active | boolean | YES | true |  |  |  |
| locale | text | YES | 'es-CL'::text |  |  |  |
| logo_url | text | YES |  |  |  |  |
| max_cases_per_month | integer | YES | 100 |  |  |  |
| max_students | integer | YES | 500 |  |  |  |
| max_users | integer | YES | 10 |  |  |  |
| name | text | NO |  |  |  |  |
| phone | text | YES |  |  |  |  |
| primary_color | text | YES | '#2563eb'::text |  |  |  |
| rut | text | YES |  |  |  |  |
| secondary_color | text | YES | '#1e40af'::text |  |  |  |
| slug | text | NO |  |  | YES |  |
| storage_mb | integer | YES | 1000 |  |  |  |
| stripe_customer_id | text | YES |  |  |  |  |
| stripe_subscription_id | text | YES |  |  |  |  |
| subscription_plan | text | YES | 'basic'::text |  |  |  |
| subscription_status | text | YES | 'trial'::text |  |  |  |
| timezone | text | YES | 'America/Santiago'::text |  |  |  |
| trial_end_date | timestamp with time zone | YES |  |  |  |  |
| updated_at | timestamp with time zone | NO | now() |  |  |  |

Indexes:
- idx_tenants_slug: CREATE INDEX idx_tenants_slug ON public.tenants USING btree (slug) WHERE (deleted_at IS NULL)
- idx_tenants_status: CREATE INDEX idx_tenants_status ON public.tenants USING btree (subscription_status) WHERE (deleted_at IS NULL)
- tenants_pkey: CREATE UNIQUE INDEX tenants_pkey ON public.tenants USING btree (id)
- tenants_slug_key: CREATE UNIQUE INDEX tenants_slug_key ON public.tenants USING btree (slug)

Policies (RLS):
- tenants_delete_platform (cmd=DELETE, permissive=true): USING (is_platform_admin() = true) WITH CHECK 
- tenants_insert_platform (cmd=INSERT, permissive=true): USING  WITH CHECK (is_platform_admin() = true)
- tenants_select_own_or_platform (cmd=SELECT, permissive=true): USING ((is_platform_admin() = true) OR (id = current_tenant_id())) WITH CHECK 
- tenants_update_platform (cmd=UPDATE, permissive=true): USING (is_platform_admin() = true) WITH CHECK (is_platform_admin() = true)

Triggers:
- update_tenants_updated_at: CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

#### public.v_control_alertas

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| alerta_urgencia | text | YES |  |  |  |  |
| case_id | uuid | YES |  |  |  |  |
| course | text | YES |  |  |  |  |
| curso_incidente | text | YES |  |  |  |  |
| dias_restantes | integer | YES |  |  |  |  |
| estado_caso | text | YES |  |  |  |  |
| estudiante | text | YES |  |  |  |  |
| estudiante_rut | text | YES |  |  |  |  |
| fecha | date | YES |  |  |  |  |
| fecha_incidente | date | YES |  |  |  |  |
| fecha_plazo | date | YES |  |  |  |  |
| id | text | YES |  |  |  |  |
| legacy_case_number | text | YES |  |  |  |  |
| tipificacion_conducta | text | YES |  |  |  |  |
| tipo | text | YES |  |  |  |  |

#### public.v_control_unificado

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| alerta_urgencia | text | YES |  |  |  |  |
| case_id | uuid | YES |  |  |  |  |
| course | text | YES |  |  |  |  |
| curso_incidente | text | YES |  |  |  |  |
| days_to_due | integer | YES |  |  |  |  |
| descripcion | text | YES |  |  |  |  |
| detalle | text | YES |  |  |  |  |
| dias_restantes | integer | YES |  |  |  |  |
| estado_caso | text | YES |  |  |  |  |
| estado_etapa | text | YES |  |  |  |  |
| estudiante | text | YES |  |  |  |  |
| estudiante_rut | text | YES |  |  |  |  |
| etapa_debido_proceso | text | YES |  |  |  |  |
| fecha | date | YES |  |  |  |  |
| fecha_incidente | date | YES |  |  |  |  |
| fecha_plazo | date | YES |  |  |  |  |
| followup_id | uuid | YES |  |  |  |  |
| legacy_case_number | text | YES |  |  |  |  |
| level | text | YES |  |  |  |  |
| responsable | text | YES |  |  |  |  |
| stage_num_from | integer | YES |  |  |  |  |
| student_id | uuid | YES |  |  |  |  |
| tipificacion_conducta | text | YES |  |  |  |  |
| tipo | text | YES |  |  |  |  |
| tipo_accion | text | YES |  |  |  |  |

### Views

#### public.v_control_alertas
```sql
WITH last_followup AS (
         SELECT DISTINCT ON (f.case_id) f.id AS followup_id,
            f.case_id,
            f.process_stage,
            f.action_date,
            f.due_date
           FROM case_followups f
          ORDER BY f.case_id, f.action_date DESC NULLS LAST, f.created_at DESC
        )
 SELECT 'alerta_plazo'::text AS tipo,
    (c.id || '_plazo'::text) AS id,
    c.id AS case_id,
    c.legacy_case_number,
    c.status AS estado_caso,
    c.conduct_type AS tipificacion_conducta,
    c.incident_date AS fecha_incidente,
    c.course_incident AS curso_incidente,
    lf.action_date AS fecha,
    lf.due_date AS fecha_plazo,
        CASE
            WHEN (lf.due_date IS NULL) THEN NULL::integer
            ELSE (lf.due_date - CURRENT_DATE)
        END AS dias_restantes,
        CASE
            WHEN (lf.due_date IS NULL) THEN 'Sin plazo'::text
            WHEN ((lf.due_date - CURRENT_DATE) < 0) THEN 'Vencido'::text
            WHEN ((lf.due_date - CURRENT_DATE) <= 1) THEN 'Urgente'::text
            WHEN ((lf.due_date - CURRENT_DATE) <= 3) THEN 'Proximo'::text
            ELSE 'OK'::text
        END AS alerta_urgencia,
    ((s.first_name || ' '::text) || s.last_name) AS estudiante,
    s.rut AS estudiante_rut,
    s.course
   FROM ((cases c
     LEFT JOIN students s ON ((s.id = c.student_id)))
     LEFT JOIN last_followup lf ON ((lf.case_id = c.id)))
  WHERE ((c.status <> 'Cerrado'::text) AND (lf.due_date IS NOT NULL));
```

#### public.v_control_unificado
```sql
WITH student_info AS (
         SELECT c.id AS case_id,
            c.student_id,
            TRIM(BOTH FROM ((COALESCE(s.first_name, ''::text) || ' '::text) || COALESCE(s.last_name, ''::text))) AS estudiante,
            s.rut AS estudiante_rut,
            s.course,
            s.level
           FROM (cases c
             LEFT JOIN students s ON ((s.id = c.student_id)))
        ), last_followup AS (
         SELECT DISTINCT ON (f.case_id) f.id AS followup_id,
            f.case_id,
            f.action_date,
            f.action_type,
            f.responsible,
            f.detail,
            f.process_stage,
            f.description,
            f.due_date,
            f.created_at
           FROM case_followups f
          ORDER BY f.case_id, f.action_date DESC NULLS LAST, f.created_at DESC
        ), seguimiento AS (
         SELECT 'seguimiento'::text AS tipo,
            lf.followup_id,
            c.id AS case_id,
            c.legacy_case_number,
            c.status AS estado_caso,
            c.conduct_type AS tipificacion_conducta,
            c.incident_date AS fecha_incidente,
            c.course_incident AS curso_incidente,
            COALESCE(lf.action_date, (c.created_at)::date) AS fecha,
            lf.action_type AS tipo_accion,
            'Completada'::text AS estado_etapa,
            lf.responsible AS responsable,
            lf.detail AS detalle,
            lf.process_stage AS etapa_debido_proceso,
            lf.description AS descripcion,
            lf.due_date AS fecha_plazo,
                CASE
                    WHEN (lf.due_date IS NULL) THEN NULL::integer
                    ELSE business_days_between(CURRENT_DATE, lf.due_date)
                END AS dias_restantes,
                CASE
                    WHEN (lf.due_date IS NULL) THEN 'Sin plazo'::text
                    WHEN (business_days_between(CURRENT_DATE, lf.due_date) < 0) THEN 'Vencido'::text
                    WHEN (business_days_between(CURRENT_DATE, lf.due_date) <= 1) THEN 'Urgente'::text
                    WHEN (business_days_between(CURRENT_DATE, lf.due_date) <= 3) THEN 'Proximo'::text
                    ELSE 'OK'::text
                END AS alerta_urgencia,
            (NULLIF((regexp_match(COALESCE(lf.process_stage, ''::text), '^([0-9]+)\.'::text))[1], ''::text))::integer AS stage_num_from,
            ss.days_to_due,
            si.student_id,
            NULLIF(si.estudiante, ''::text) AS estudiante,
            si.estudiante_rut,
            si.course,
            si.level
           FROM (((cases c
             LEFT JOIN last_followup lf ON ((lf.case_id = c.id)))
             LEFT JOIN stage_sla ss ON ((ss.stage_key = lf.process_stage)))
             LEFT JOIN student_info si ON ((si.case_id = c.id)))
        ), indagacion AS (
         SELECT 'indagacion'::text AS tipo,
            lf.followup_id,
            c.id AS case_id,
            c.legacy_case_number,
            c.status AS estado_caso,
            c.conduct_type AS tipificacion_conducta,
            c.incident_date AS fecha_incidente,
            c.course_incident AS curso_incidente,
            c.indagacion_start_date AS fecha,
            NULL::text AS tipo_accion,
            NULL::text AS estado_etapa,
            NULL::text AS responsable,
            NULL::text AS detalle,
            lf.process_stage AS etapa_debido_proceso,
            NULL::text AS descripcion,
            c.indagacion_due_date AS fecha_plazo,
                CASE
                    WHEN (c.indagacion_due_date IS NULL) THEN NULL::integer
                    ELSE business_days_between(CURRENT_DATE, c.indagacion_due_date)
                END AS dias_restantes,
                CASE
                    WHEN (c.indagacion_due_date IS NULL) THEN 'Sin plazo'::text
                    WHEN (business_days_between(CURRENT_DATE, c.indagacion_due_date) < 0) THEN 'Vencido'::text
                    WHEN (business_days_between(CURRENT_DATE, c.indagacion_due_date) <= 1) THEN 'Urgente'::text
                    WHEN (business_days_between(CURRENT_DATE, c.indagacion_due_date) <= 3) THEN 'Proximo'::text
                    ELSE 'OK'::text
                END AS alerta_urgencia,
            NULL::integer AS stage_num_from,
            NULL::integer AS days_to_due,
            si.student_id,
            NULLIF(si.estudiante, ''::text) AS estudiante,
            si.estudiante_rut,
            si.course,
            si.level
           FROM ((cases c
             LEFT JOIN last_followup lf ON ((lf.case_id = c.id)))
             LEFT JOIN student_info si ON ((si.case_id = c.id)))
          WHERE ((c.seguimiento_started_at IS NOT NULL) AND (c.indagacion_due_date IS NOT NULL) AND (COALESCE(c.status, ''::text) <> 'Cerrado'::text))
        ), resumen AS (
         SELECT DISTINCT ON (c.id) 'resumen'::text AS tipo,
            lf.followup_id,
            c.id AS case_id,
            NULL::text AS legacy_case_number,
            NULL::text AS estado_caso,
            NULL::text AS tipificacion_conducta,
            NULL::date AS fecha_incidente,
            NULL::text AS curso_incidente,
            NULL::date AS fecha,
            NULL::text AS tipo_accion,
            NULL::text AS estado_etapa,
            NULL::text AS responsable,
            NULL::text AS detalle,
            NULL::text AS etapa_debido_proceso,
            NULL::text AS descripcion,
            COALESCE(lf.due_date, c.indagacion_due_date) AS fecha_plazo,
                CASE
                    WHEN (COALESCE(lf.due_date, c.indagacion_due_date) IS NULL) THEN NULL::integer
                    ELSE business_days_between(CURRENT_DATE, COALESCE(lf.due_date, c.indagacion_due_date))
                END AS dias_restantes,
                CASE
                    WHEN (COALESCE(lf.due_date, c.indagacion_due_date) IS NULL) THEN 'Sin plazo'::text
                    WHEN (business_days_between(CURRENT_DATE, COALESCE(lf.due_date, c.indagacion_due_date)) < 0) THEN 'Vencido'::text
                    WHEN (business_days_between(CURRENT_DATE, COALESCE(lf.due_date, c.indagacion_due_date)) <= 1) THEN 'Urgente'::text
                    WHEN (business_days_between(CURRENT_DATE, COALESCE(lf.due_date, c.indagacion_due_date)) <= 3) THEN 'Proximo'::text
                    ELSE 'OK'::text
                END AS alerta_urgencia,
            NULL::integer AS stage_num_from,
            NULL::integer AS days_to_due,
            si.student_id,
            NULLIF(si.estudiante, ''::text) AS estudiante,
            si.estudiante_rut,
            si.course,
            si.level
           FROM ((cases c
             LEFT JOIN last_followup lf ON ((lf.case_id = c.id)))
             LEFT JOIN student_info si ON ((si.case_id = c.id)))
          WHERE (COALESCE(c.status, ''::text) <> 'Cerrado'::text)
          ORDER BY c.id, COALESCE(lf.due_date, c.indagacion_due_date)
        )
 SELECT seguimiento.tipo,
    seguimiento.followup_id,
    seguimiento.case_id,
    seguimiento.legacy_case_number,
    seguimiento.estado_caso,
    seguimiento.tipificacion_conducta,
    seguimiento.fecha_incidente,
    seguimiento.curso_incidente,
    seguimiento.fecha,
    seguimiento.tipo_accion,
    seguimiento.estado_etapa,
    seguimiento.responsable,
    seguimiento.detalle,
    seguimiento.etapa_debido_proceso,
    seguimiento.descripcion,
    seguimiento.fecha_plazo,
    seguimiento.dias_restantes,
    seguimiento.alerta_urgencia,
    seguimiento.stage_num_from,
    seguimiento.days_to_due,
    seguimiento.student_id,
    seguimiento.estudiante,
    seguimiento.estudiante_rut,
    seguimiento.course,
    seguimiento.level
   FROM seguimiento
UNION ALL
 SELECT indagacion.tipo,
    indagacion.followup_id,
    indagacion.case_id,
    indagacion.legacy_case_number,
    indagacion.estado_caso,
    indagacion.tipificacion_conducta,
    indagacion.fecha_incidente,
    indagacion.curso_incidente,
    indagacion.fecha,
    indagacion.tipo_accion,
    indagacion.estado_etapa,
    indagacion.responsable,
    indagacion.detalle,
    indagacion.etapa_debido_proceso,
    indagacion.descripcion,
    indagacion.fecha_plazo,
    indagacion.dias_restantes,
    indagacion.alerta_urgencia,
    indagacion.stage_num_from,
    indagacion.days_to_due,
    indagacion.student_id,
    indagacion.estudiante,
    indagacion.estudiante_rut,
    indagacion.course,
    indagacion.level
   FROM indagacion
UNION ALL
 SELECT resumen.tipo,
    resumen.followup_id,
    resumen.case_id,
    resumen.legacy_case_number,
    resumen.estado_caso,
    resumen.tipificacion_conducta,
    resumen.fecha_incidente,
    resumen.curso_incidente,
    resumen.fecha,
    resumen.tipo_accion,
    resumen.estado_etapa,
    resumen.responsable,
    resumen.detalle,
    resumen.etapa_debido_proceso,
    resumen.descripcion,
    resumen.fecha_plazo,
    resumen.dias_restantes,
    resumen.alerta_urgencia,
    resumen.stage_num_from,
    resumen.days_to_due,
    resumen.student_id,
    resumen.estudiante,
    resumen.estudiante_rut,
    resumen.course,
    resumen.level
   FROM resumen;
```

### Functions

#### public.admin_create_audit_log
```sql
CREATE OR REPLACE FUNCTION public.admin_create_audit_log(p_tenant_id uuid, p_action text, p_table_name text DEFAULT NULL::text, p_record_id uuid DEFAULT NULL::uuid, p_note text DEFAULT NULL::text, p_new_values jsonb DEFAULT NULL::jsonb)
 RETURNS audit_logs
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.audit_logs;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (
    public.is_platform_admin()
    OR (public.is_tenant_admin() AND p_tenant_id = public.current_tenant_id())
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  INSERT INTO public.audit_logs (
    tenant_id,
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    admin_note
  )
  VALUES (
    p_tenant_id,
    auth.uid(),
    upper(coalesce(nullif(trim(p_action), ''), 'MANUAL')),
    coalesce(nullif(trim(p_table_name), ''), 'manual'),
    p_record_id,
    NULL,
    coalesce(p_new_values, '{}'::jsonb),
    p_note
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$
```

#### public.admin_delete_audit_log
```sql
CREATE OR REPLACE FUNCTION public.admin_delete_audit_log(p_audit_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT tenant_id INTO v_tenant_id
  FROM public.audit_logs
  WHERE id = p_audit_id;

  IF v_tenant_id IS NULL THEN
    RETURN false;
  END IF;

  IF NOT (
    public.is_platform_admin()
    OR (public.is_tenant_admin() AND v_tenant_id = public.current_tenant_id())
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  DELETE FROM public.audit_logs
  WHERE id = p_audit_id;

  RETURN true;
END;
$function$
```

#### public.admin_purge_audit_logs
```sql
CREATE OR REPLACE FUNCTION public.admin_purge_audit_logs(p_tenant_id uuid, p_before timestamp with time zone)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count bigint;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (
    public.is_platform_admin()
    OR (public.is_tenant_admin() AND p_tenant_id = public.current_tenant_id())
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  DELETE FROM public.audit_logs
  WHERE tenant_id = p_tenant_id
    AND created_at < p_before;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$
```

#### public.admin_update_audit_log_note
```sql
CREATE OR REPLACE FUNCTION public.admin_update_audit_log_note(p_audit_id uuid, p_note text)
 RETURNS audit_logs
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id uuid;
  v_row public.audit_logs;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT tenant_id INTO v_tenant_id
  FROM public.audit_logs
  WHERE id = p_audit_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Audit log no encontrado';
  END IF;

  IF NOT (
    public.is_platform_admin()
    OR (public.is_tenant_admin() AND v_tenant_id = public.current_tenant_id())
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  UPDATE public.audit_logs
  SET admin_note = p_note
  WHERE id = p_audit_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$
```

#### public.admin_update_tenant_profile
```sql
CREATE OR REPLACE FUNCTION public.admin_update_tenant_profile(p_profile_id uuid, p_full_name text DEFAULT NULL::text, p_role text DEFAULT NULL::text, p_is_active boolean DEFAULT NULL::boolean, p_phone text DEFAULT NULL::text, p_department text DEFAULT NULL::text)
 RETURNS tenant_profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_actor_is_platform boolean;
  v_actor_tenant uuid;
  v_target public.tenant_profiles;
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_actor_is_platform := public.is_platform_admin();
  v_actor_tenant := public.current_tenant_id();

  SELECT *
  INTO v_target
  FROM public.tenant_profiles
  WHERE id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil no encontrado';
  END IF;

  IF NOT v_actor_is_platform THEN
    IF NOT public.is_tenant_admin() THEN
      RAISE EXCEPTION 'No autorizado';
    END IF;
    IF v_target.tenant_id <> v_actor_tenant THEN
      RAISE EXCEPTION 'No autorizado para otro tenant';
    END IF;
    IF v_target.role = 'platform_admin' THEN
      RAISE EXCEPTION 'No autorizado para modificar platform_admin';
    END IF;
  END IF;

  v_role := COALESCE(p_role, v_target.role);
  IF v_role NOT IN ('platform_admin', 'tenant_admin', 'user', 'readonly') THEN
    RAISE EXCEPTION 'Rol inválido: %', v_role;
  END IF;

  UPDATE public.tenant_profiles
  SET
    full_name = COALESCE(p_full_name, full_name),
    role = v_role,
    is_active = COALESCE(p_is_active, is_active),
    phone = COALESCE(p_phone, phone),
    department = COALESCE(p_department, department),
    updated_at = now()
  WHERE id = p_profile_id
  RETURNING * INTO v_target;

  RETURN v_target;
END;
$function$
```

#### public.apply_college_catalogs
```sql
CREATE OR REPLACE FUNCTION public.apply_college_catalogs(p_tenant_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE t.id = p_tenant_id
      AND t.is_active = true
  ) THEN
    RAISE EXCEPTION 'Tenant no encontrado o inactivo: %', p_tenant_id;
  END IF;

  INSERT INTO public.conduct_types (key, label, color, sort_order, active)
  VALUES
    ('agresion_fisica', 'Agresión Física', '#ef4444', 1, true),
    ('agresion_verbal', 'Agresión Verbal', '#f97316', 2, true),
    ('bullying', 'Bullying', '#dc2626', 3, true),
    ('ciberbullying', 'Ciberbullying', '#b91c1c', 4, true),
    ('robo', 'Robo', '#d97706', 5, true),
    ('vandalismo', 'Vandalismo', '#ea580c', 6, true),
    ('consumo_sustancias', 'Consumo de Sustancias', '#7c2d12', 7, true),
    ('falta_respeto', 'Falta de Respeto', '#0ea5e9', 8, true),
    ('otro', 'Otro', '#64748b', 99, true)
  ON CONFLICT (key) DO UPDATE
  SET label = EXCLUDED.label,
      color = EXCLUDED.color,
      sort_order = EXCLUDED.sort_order,
      active = EXCLUDED.active;

  INSERT INTO public.conduct_catalog (conduct_type, conduct_category, sort_order, active)
  VALUES
    ('agresion_fisica', 'Golpear', 1, true),
    ('agresion_fisica', 'Empujar', 2, true),
    ('agresion_fisica', 'Patear', 3, true),
    ('agresion_verbal', 'Insultar', 1, true),
    ('agresion_verbal', 'Humillar', 2, true),
    ('agresion_verbal', 'Amenazar', 3, true),
    ('bullying', 'Acoso continuo', 1, true),
    ('bullying', 'Exclusión social', 2, true),
    ('robo', 'Hurto', 1, true),
    ('robo', 'Extorsión', 2, true),
    ('falta_respeto', 'Interrupción', 1, true),
    ('falta_respeto', 'Desobediencia', 2, true),
    ('otro', 'Otro', 99, true)
  ON CONFLICT (conduct_type, conduct_category) DO UPDATE
  SET sort_order = EXCLUDED.sort_order,
      active = EXCLUDED.active;

  INSERT INTO public.stage_sla (stage_key, days_to_due)
  VALUES
    ('recepcion', 1),
    ('analisis', 2),
    ('investigacion', 3),
    ('resolucion', 2),
    ('seguimiento', 7)
  ON CONFLICT (stage_key) DO UPDATE
  SET days_to_due = EXCLUDED.days_to_due;

  INSERT INTO public.action_types (tenant_id, key, label, description, sort_order, is_active)
  VALUES
    (p_tenant_id, 'seguimiento', 'Seguimiento', 'Seguimiento general', 1, true),
    (p_tenant_id, 'entrevista', 'Entrevista', 'Entrevista con involucrados', 2, true),
    (p_tenant_id, 'citacion', 'Citación', 'Citación formal', 3, true),
    (p_tenant_id, 'derivacion', 'Derivación', 'Derivación a especialista', 4, true),
    (p_tenant_id, 'medida_disciplinaria', 'Medida Disciplinaria', 'Aplicación de medida', 5, true),
    (p_tenant_id, 'cierre', 'Cierre', 'Cierre del caso', 6, true)
  ON CONFLICT (tenant_id, key) DO UPDATE
  SET label = EXCLUDED.label,
      description = EXCLUDED.description,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active;

  RETURN jsonb_build_object(
    'ok', true,
    'tenant_id', p_tenant_id,
    'applied_at', now()
  );
END;
$function$
```

#### public.business_days_between
```sql
CREATE OR REPLACE FUNCTION public.business_days_between(start_date date, end_date date)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
  days INTEGER := 0;
  curr_date DATE;
BEGIN
  IF start_date IS NULL OR end_date IS NULL THEN
    RETURN NULL;
  END IF;

  IF end_date < start_date THEN
    RETURN -business_days_between(end_date, start_date);
  END IF;

  curr_date := start_date;
  WHILE curr_date < end_date LOOP
    curr_date := curr_date + 1;
    IF EXTRACT(DOW FROM curr_date) NOT IN (0, 6) THEN
      days := days + 1;
    END IF;
  END LOOP;

  RETURN days;
END;
$function$
```

#### public.current_tenant_id
```sql
CREATE OR REPLACE FUNCTION public.current_tenant_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT tp.tenant_id
  FROM public.tenant_profiles tp
  WHERE tp.id = auth.uid()
    AND tp.is_active = true
  LIMIT 1;
$function$
```

#### public.get_demo_colegio
```sql
CREATE OR REPLACE FUNCTION public.get_demo_colegio()
 RETURNS TABLE(id uuid, slug text, name text, address text, phone text, email text, logo_url text, descripcion text, primary_color text, secondary_color text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    t.id,
    t.slug,
    t.name,
    t.address,
    t.phone,
    t.email,
    t.logo_url,
    t.descripcion,
    t.primary_color,
    t.secondary_color
  FROM tenants t
  WHERE t.slug = 'demo' AND t.is_active = TRUE;
$function$
```

#### public.is_platform_admin
```sql
CREATE OR REPLACE FUNCTION public.is_platform_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_profiles tp
    WHERE tp.id = auth.uid()
      AND tp.role = 'platform_admin'
      AND tp.is_active = true
  );
$function$
```

#### public.is_tenant_admin
```sql
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_profiles tp
    WHERE tp.id = auth.uid()
      AND tp.role IN ('tenant_admin', 'platform_admin')
      AND tp.is_active = true
  );
$function$
```

#### public.onboard_college
```sql
CREATE OR REPLACE FUNCTION public.onboard_college(p_slug text, p_name text, p_email text, p_admin_user_id uuid DEFAULT NULL::uuid, p_subscription_plan text DEFAULT 'basic'::text, p_trial_days integer DEFAULT 14)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id uuid;
BEGIN
  INSERT INTO public.tenants (
    slug, name, email, subscription_status, subscription_plan, trial_end_date, is_active
  )
  VALUES (
    lower(p_slug),
    p_name,
    p_email,
    'trial',
    COALESCE(NULLIF(p_subscription_plan, ''), 'basic'),
    now() + (COALESCE(p_trial_days, 14) || ' days')::interval,
    true
  )
  ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      email = EXCLUDED.email,
      subscription_plan = EXCLUDED.subscription_plan
  RETURNING id INTO v_tenant_id;

  IF p_admin_user_id IS NOT NULL THEN
    UPDATE public.tenant_profiles
    SET tenant_id = v_tenant_id,
        role = 'tenant_admin',
        is_active = true,
        updated_at = now()
    WHERE id = p_admin_user_id;
  END IF;

  PERFORM public.apply_college_catalogs(v_tenant_id);

  RETURN jsonb_build_object(
    'ok', true,
    'tenant_id', v_tenant_id,
    'slug', lower(p_slug)
  );
END;
$function$
```

#### public.platform_switch_tenant
```sql
CREATE OR REPLACE FUNCTION public.platform_switch_tenant(p_tenant_id uuid)
 RETURNS tenant_profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_profile public.tenant_profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE t.id = p_tenant_id
      AND t.is_active = true
  ) THEN
    RAISE EXCEPTION 'Tenant no encontrado o inactivo';
  END IF;

  UPDATE public.tenant_profiles
  SET tenant_id = p_tenant_id,
      updated_at = now()
  WHERE id = auth.uid()
  RETURNING * INTO v_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil no encontrado para el usuario actual';
  END IF;

  RETURN v_profile;
END;
$function$
```

#### public.set_case_message_attachment_tenant_id
```sql
CREATE OR REPLACE FUNCTION public.set_case_message_attachment_tenant_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.tenant_id IS NULL AND NEW.message_id IS NOT NULL THEN
    SELECT m.tenant_id INTO NEW.tenant_id
    FROM public.case_messages m
    WHERE m.id = NEW.message_id
    LIMIT 1;
  END IF;

  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.current_tenant_id();
  END IF;

  RETURN NEW;
END;
$function$
```

#### public.set_case_message_tenant_id
```sql
CREATE OR REPLACE FUNCTION public.set_case_message_tenant_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.tenant_id IS NULL AND NEW.case_id IS NOT NULL THEN
    SELECT c.tenant_id INTO NEW.tenant_id
    FROM public.cases c
    WHERE c.id = NEW.case_id
    LIMIT 1;
  END IF;

  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.current_tenant_id();
  END IF;

  RETURN NEW;
END;
$function$
```

#### public.stats_casos_por_curso
```sql
CREATE OR REPLACE FUNCTION public.stats_casos_por_curso(desde date, hasta date)
 RETURNS TABLE(curso text, total bigint)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(NULLIF(c.course_incident, ''), 'Sin curso') AS curso,
    COUNT(*)::BIGINT AS total
  FROM public.cases c
  WHERE c.tenant_id = public.current_tenant_id()
    AND c.incident_date BETWEEN desde AND hasta
  GROUP BY c.course_incident
  ORDER BY COUNT(*) DESC;
END;
$function$
```

#### public.stats_casos_por_mes
```sql
CREATE OR REPLACE FUNCTION public.stats_casos_por_mes(desde date, hasta date)
 RETURNS TABLE(mes text, total bigint)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(c.incident_date, 'YYYY-MM') AS mes,
    COUNT(*)::BIGINT AS total
  FROM public.cases c
  WHERE c.tenant_id = public.current_tenant_id()
    AND c.incident_date BETWEEN desde AND hasta
  GROUP BY TO_CHAR(c.incident_date, 'YYYY-MM')
  ORDER BY mes;
END;
$function$
```

#### public.stats_casos_por_tipificacion
```sql
CREATE OR REPLACE FUNCTION public.stats_casos_por_tipificacion(desde date, hasta date)
 RETURNS TABLE(tipo text, total bigint)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(NULLIF(c.conduct_type, ''), 'Sin tipificación') AS tipo,
    COUNT(*)::BIGINT AS total
  FROM public.cases c
  WHERE c.tenant_id = public.current_tenant_id()
    AND c.incident_date BETWEEN desde AND hasta
  GROUP BY c.conduct_type
  ORDER BY COUNT(*) DESC
  LIMIT 10;
END;
$function$
```

#### public.stats_cumplimiento_plazos
```sql
CREATE OR REPLACE FUNCTION public.stats_cumplimiento_plazos(desde date, hasta date)
 RETURNS TABLE(total_plazos bigint, fuera_plazo bigint, dentro_plazo bigint, cumplimiento_pct numeric)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  WITH plazos AS (
    SELECT
      cf.id,
      cf.due_date,
      cf.action_date,
      CASE
        WHEN cf.due_date IS NOT NULL AND cf.action_date > cf.due_date THEN 1
        ELSE 0
      END AS fuera
    FROM public.case_followups cf
    INNER JOIN public.cases c ON c.id = cf.case_id
    WHERE c.tenant_id = public.current_tenant_id()
      AND c.incident_date BETWEEN desde AND hasta
      AND cf.due_date IS NOT NULL
  )
  SELECT
    COUNT(*)::BIGINT AS total_plazos,
    COALESCE(SUM(fuera), 0)::BIGINT AS fuera_plazo,
    (COUNT(*) - COALESCE(SUM(fuera), 0))::BIGINT AS dentro_plazo,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND(((COUNT(*) - COALESCE(SUM(fuera), 0))::NUMERIC / COUNT(*)) * 100, 1)
      ELSE 0
    END AS cumplimiento_pct
  FROM plazos;
END;
$function$
```

#### public.stats_kpis
```sql
CREATE OR REPLACE FUNCTION public.stats_kpis(desde date, hasta date)
 RETURNS TABLE(casos_total bigint, abiertos bigint, cerrados bigint, promedio_cierre_dias numeric)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS casos_total,
    COUNT(*) FILTER (WHERE c.status <> 'Cerrado')::BIGINT AS abiertos,
    COUNT(*) FILTER (WHERE c.status = 'Cerrado')::BIGINT AS cerrados,
    COALESCE(
      ROUND(AVG(EXTRACT(EPOCH FROM (c.closed_at - c.created_at)) / 86400)::NUMERIC, 1),
      0
    )::NUMERIC(10,1) AS promedio_cierre_dias
  FROM public.cases c
  WHERE c.tenant_id = public.current_tenant_id()
    AND c.incident_date BETWEEN desde AND hasta;
END;
$function$
```

#### public.stats_mayor_carga
```sql
CREATE OR REPLACE FUNCTION public.stats_mayor_carga(desde date, hasta date)
 RETURNS TABLE(responsable text, total bigint)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(NULLIF(cf.responsible, ''), 'Sin responsable') AS responsable,
    COUNT(*)::BIGINT AS total
  FROM public.case_followups cf
  INNER JOIN public.cases c ON c.id = cf.case_id
  WHERE c.tenant_id = public.current_tenant_id()
    AND c.incident_date BETWEEN desde AND hasta
  GROUP BY cf.responsible
  ORDER BY COUNT(*) DESC
  LIMIT 1;
END;
$function$
```

#### public.stats_mayor_nivel
```sql
CREATE OR REPLACE FUNCTION public.stats_mayor_nivel(desde date, hasta date)
 RETURNS TABLE(level text, total bigint)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(NULLIF(c.conduct_category, ''), 'Desconocido') AS level,
    COUNT(*)::BIGINT AS total
  FROM public.cases c
  WHERE c.tenant_id = public.current_tenant_id()
    AND c.incident_date BETWEEN desde AND hasta
  GROUP BY c.conduct_category
  ORDER BY COUNT(*) DESC
  LIMIT 1;
END;
$function$
```

#### public.stats_promedio_seguimientos_por_caso
```sql
CREATE OR REPLACE FUNCTION public.stats_promedio_seguimientos_por_caso(desde date, hasta date)
 RETURNS TABLE(promedio numeric)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT COALESCE(ROUND(AVG(cnt)::NUMERIC, 1), 0)::NUMERIC(10,1)
  FROM (
    SELECT COUNT(*) AS cnt
    FROM public.case_followups cf
    INNER JOIN public.cases c ON c.id = cf.case_id
    WHERE c.tenant_id = public.current_tenant_id()
      AND c.incident_date BETWEEN desde AND hasta
    GROUP BY c.id
  ) sub;
END;
$function$
```

#### public.stats_reincidencia
```sql
CREATE OR REPLACE FUNCTION public.stats_reincidencia(desde date, hasta date)
 RETURNS TABLE(estudiantes_reincidentes bigint)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT
  FROM (
    SELECT c.student_id
    FROM public.cases c
    WHERE c.tenant_id = public.current_tenant_id()
      AND c.incident_date BETWEEN desde AND hasta
      AND c.student_id IS NOT NULL
    GROUP BY c.student_id
    HAVING COUNT(*) >= 2
  ) sub;
END;
$function$
```

#### public.stats_tiempo_primer_seguimiento
```sql
CREATE OR REPLACE FUNCTION public.stats_tiempo_primer_seguimiento(desde date, hasta date)
 RETURNS TABLE(promedio_dias numeric)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT COALESCE(
    ROUND(AVG(EXTRACT(EPOCH FROM (primer.action_date::TIMESTAMPTZ - c.created_at)) / 86400)::NUMERIC, 1),
    0
  )::NUMERIC(10,1)
  FROM public.cases c
  INNER JOIN LATERAL (
    SELECT cf.action_date
    FROM public.case_followups cf
    WHERE cf.case_id = c.id
    ORDER BY cf.action_date ASC
    LIMIT 1
  ) primer ON TRUE
  WHERE c.tenant_id = public.current_tenant_id()
    AND c.incident_date BETWEEN desde AND hasta;
END;
$function$
```

#### public.update_updated_at_column
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
```

#### public.validate_college_catalogs
```sql
CREATE OR REPLACE FUNCTION public.validate_college_catalogs(p_tenant_id uuid, p_batch_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(section text, row_ref text, error_code text, error_detail text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE t.id = p_tenant_id
      AND t.is_active = true
  ) THEN
    RETURN QUERY
    SELECT 'tenant'::text, '-'::text, 'NOT_FOUND'::text, 'Tenant no encontrado o inactivo'::text;
    RETURN;
  END IF;

  RETURN;
END;
$function$
```

### Types

- action_types [composite]
- audit_logs [composite]
- case_followups [composite]
- case_message_attachments [composite]
- case_messages [composite]
- cases [composite]
- catalog_staging_batches [composite]
- conduct_catalog [composite]
- conduct_types [composite]
- followup_evidence [composite]
- involucrados [composite]
- platform_versions [composite]
- process_stages [composite]
- stage_sla [composite]
- stg_action_types [composite]
- stg_conduct_catalog [composite]
- stg_conduct_types [composite]
- stg_stage_sla [composite]
- students [composite]
- tenant_catalogs [composite]
- tenant_profiles [composite]
- tenant_settings [composite]
- tenant_versions [composite]
- tenants [composite]
- v_control_alertas [composite]
- v_control_unificado [composite]

### Sequences

- stg_action_types_id_seq: type=bigint, start=1, min=1, max=9223372036854775807, inc=1, cycle=NO
- stg_conduct_catalog_id_seq: type=bigint, start=1, min=1, max=9223372036854775807, inc=1, cycle=NO
- stg_conduct_types_id_seq: type=bigint, start=1, min=1, max=9223372036854775807, inc=1, cycle=NO
- stg_stage_sla_id_seq: type=bigint, start=1, min=1, max=9223372036854775807, inc=1, cycle=NO

## Schema: realtime

### Tables

#### realtime.messages

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| event | text | YES |  |  |  |  |
| extension | text | NO |  |  |  |  |
| id | uuid | NO | gen_random_uuid() | YES |  |  |
| inserted_at | timestamp without time zone | NO | now() | YES |  |  |
| payload | jsonb | YES |  |  |  |  |
| private | boolean | YES | false |  |  |  |
| topic | text | NO |  |  |  |  |
| updated_at | timestamp without time zone | NO | now() |  |  |  |

Indexes:
- messages_inserted_at_topic_index: CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
- messages_pkey: CREATE UNIQUE INDEX messages_pkey ON ONLY realtime.messages USING btree (id, inserted_at)

#### realtime.messages_2026_02_13
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| event | text | YES |  |  |  |  |
| extension | text | NO |  |  |  |  |
| id | uuid | NO | gen_random_uuid() | YES |  |  |
| inserted_at | timestamp without time zone | NO | now() | YES |  |  |
| payload | jsonb | YES |  |  |  |  |
| private | boolean | YES | false |  |  |  |
| topic | text | NO |  |  |  |  |
| updated_at | timestamp without time zone | NO | now() |  |  |  |

Indexes:
- messages_2026_02_13_inserted_at_topic_idx: CREATE INDEX messages_2026_02_13_inserted_at_topic_idx ON realtime.messages_2026_02_13 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
- messages_2026_02_13_pkey: CREATE UNIQUE INDEX messages_2026_02_13_pkey ON realtime.messages_2026_02_13 USING btree (id, inserted_at)

#### realtime.messages_2026_02_14
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| event | text | YES |  |  |  |  |
| extension | text | NO |  |  |  |  |
| id | uuid | NO | gen_random_uuid() | YES |  |  |
| inserted_at | timestamp without time zone | NO | now() | YES |  |  |
| payload | jsonb | YES |  |  |  |  |
| private | boolean | YES | false |  |  |  |
| topic | text | NO |  |  |  |  |
| updated_at | timestamp without time zone | NO | now() |  |  |  |

Indexes:
- messages_2026_02_14_inserted_at_topic_idx: CREATE INDEX messages_2026_02_14_inserted_at_topic_idx ON realtime.messages_2026_02_14 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
- messages_2026_02_14_pkey: CREATE UNIQUE INDEX messages_2026_02_14_pkey ON realtime.messages_2026_02_14 USING btree (id, inserted_at)

#### realtime.messages_2026_02_15
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| event | text | YES |  |  |  |  |
| extension | text | NO |  |  |  |  |
| id | uuid | NO | gen_random_uuid() | YES |  |  |
| inserted_at | timestamp without time zone | NO | now() | YES |  |  |
| payload | jsonb | YES |  |  |  |  |
| private | boolean | YES | false |  |  |  |
| topic | text | NO |  |  |  |  |
| updated_at | timestamp without time zone | NO | now() |  |  |  |

Indexes:
- messages_2026_02_15_inserted_at_topic_idx: CREATE INDEX messages_2026_02_15_inserted_at_topic_idx ON realtime.messages_2026_02_15 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
- messages_2026_02_15_pkey: CREATE UNIQUE INDEX messages_2026_02_15_pkey ON realtime.messages_2026_02_15 USING btree (id, inserted_at)

#### realtime.messages_2026_02_16
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| event | text | YES |  |  |  |  |
| extension | text | NO |  |  |  |  |
| id | uuid | NO | gen_random_uuid() | YES |  |  |
| inserted_at | timestamp without time zone | NO | now() | YES |  |  |
| payload | jsonb | YES |  |  |  |  |
| private | boolean | YES | false |  |  |  |
| topic | text | NO |  |  |  |  |
| updated_at | timestamp without time zone | NO | now() |  |  |  |

Indexes:
- messages_2026_02_16_inserted_at_topic_idx: CREATE INDEX messages_2026_02_16_inserted_at_topic_idx ON realtime.messages_2026_02_16 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
- messages_2026_02_16_pkey: CREATE UNIQUE INDEX messages_2026_02_16_pkey ON realtime.messages_2026_02_16 USING btree (id, inserted_at)

#### realtime.messages_2026_02_17
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| event | text | YES |  |  |  |  |
| extension | text | NO |  |  |  |  |
| id | uuid | NO | gen_random_uuid() | YES |  |  |
| inserted_at | timestamp without time zone | NO | now() | YES |  |  |
| payload | jsonb | YES |  |  |  |  |
| private | boolean | YES | false |  |  |  |
| topic | text | NO |  |  |  |  |
| updated_at | timestamp without time zone | NO | now() |  |  |  |

Indexes:
- messages_2026_02_17_inserted_at_topic_idx: CREATE INDEX messages_2026_02_17_inserted_at_topic_idx ON realtime.messages_2026_02_17 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
- messages_2026_02_17_pkey: CREATE UNIQUE INDEX messages_2026_02_17_pkey ON realtime.messages_2026_02_17 USING btree (id, inserted_at)

#### realtime.messages_2026_02_18
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| event | text | YES |  |  |  |  |
| extension | text | NO |  |  |  |  |
| id | uuid | NO | gen_random_uuid() | YES |  |  |
| inserted_at | timestamp without time zone | NO | now() | YES |  |  |
| payload | jsonb | YES |  |  |  |  |
| private | boolean | YES | false |  |  |  |
| topic | text | NO |  |  |  |  |
| updated_at | timestamp without time zone | NO | now() |  |  |  |

Indexes:
- messages_2026_02_18_inserted_at_topic_idx: CREATE INDEX messages_2026_02_18_inserted_at_topic_idx ON realtime.messages_2026_02_18 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
- messages_2026_02_18_pkey: CREATE UNIQUE INDEX messages_2026_02_18_pkey ON realtime.messages_2026_02_18 USING btree (id, inserted_at)

#### realtime.messages_2026_02_19
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| event | text | YES |  |  |  |  |
| extension | text | NO |  |  |  |  |
| id | uuid | NO | gen_random_uuid() | YES |  |  |
| inserted_at | timestamp without time zone | NO | now() | YES |  |  |
| payload | jsonb | YES |  |  |  |  |
| private | boolean | YES | false |  |  |  |
| topic | text | NO |  |  |  |  |
| updated_at | timestamp without time zone | NO | now() |  |  |  |

Indexes:
- messages_2026_02_19_inserted_at_topic_idx: CREATE INDEX messages_2026_02_19_inserted_at_topic_idx ON realtime.messages_2026_02_19 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
- messages_2026_02_19_pkey: CREATE UNIQUE INDEX messages_2026_02_19_pkey ON realtime.messages_2026_02_19 USING btree (id, inserted_at)

#### realtime.schema_migrations
Row count: 67

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| inserted_at | timestamp without time zone | YES |  |  |  |  |
| version | bigint | NO |  | YES |  |  |

Indexes:
- schema_migrations_pkey: CREATE UNIQUE INDEX schema_migrations_pkey ON realtime.schema_migrations USING btree (version)

#### realtime.subscription
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| action_filter | text | YES | '*'::text |  |  |  |
| claims | jsonb | NO |  |  |  |  |
| claims_role | regrole | NO |  |  |  |  |
| created_at | timestamp without time zone | NO | timezone('utc'::text, now()) |  |  |  |
| entity | regclass | NO |  |  |  |  |
| filters | ARRAY | NO | '{}'::realtime.user_defined_filter[] |  |  |  |
| id | bigint | NO |  | YES |  |  |
| subscription_id | uuid | NO |  |  |  |  |

Indexes:
- ix_realtime_subscription_entity: CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity)
- pk_subscription: CREATE UNIQUE INDEX pk_subscription ON realtime.subscription USING btree (id)
- subscription_subscription_id_entity_filters_action_filter_key: CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter)

Triggers:
- tr_check_filters: CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters()

### Functions

#### realtime.apply_rls
```sql
CREATE OR REPLACE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024))
 RETURNS SETOF realtime.wal_rls
 LANGUAGE plpgsql
AS $function$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$function$
```

#### realtime.broadcast_changes
```sql
CREATE OR REPLACE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$function$
```

#### realtime.build_prepared_statement_sql
```sql
CREATE OR REPLACE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[])
 RETURNS text
 LANGUAGE sql
AS $function$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $function$
```

#### realtime.cast
```sql
CREATE OR REPLACE FUNCTION realtime."cast"(val text, type_ regtype)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $function$
```

#### realtime.check_equality_op
```sql
CREATE OR REPLACE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $function$
```

#### realtime.is_visible_through_filters
```sql
CREATE OR REPLACE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[])
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $function$
```

#### realtime.list_changes
```sql
CREATE OR REPLACE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer)
 RETURNS SETOF realtime.wal_rls
 LANGUAGE sql
 SET log_min_messages TO 'fatal'
AS $function$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $function$
```

#### realtime.quote_wal2json
```sql
CREATE OR REPLACE FUNCTION realtime.quote_wal2json(entity regclass)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $function$
```

#### realtime.send
```sql
CREATE OR REPLACE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$function$
```

#### realtime.subscription_check_filters
```sql
CREATE OR REPLACE FUNCTION realtime.subscription_check_filters()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $function$
```

#### realtime.to_regrole
```sql
CREATE OR REPLACE FUNCTION realtime.to_regrole(role_name text)
 RETURNS regrole
 LANGUAGE sql
 IMMUTABLE
AS $function$ select role_name::regrole $function$
```

#### realtime.topic
```sql
CREATE OR REPLACE FUNCTION realtime.topic()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
select nullif(current_setting('realtime.topic', true), '')::text;
$function$
```

### Types

- action [enum] (INSERT, UPDATE, DELETE, TRUNCATE, ERROR)
- equality_op [enum] (eq, neq, lt, lte, gt, gte, in)
- messages [composite]
- messages_2026_02_13 [composite]
- messages_2026_02_14 [composite]
- messages_2026_02_15 [composite]
- messages_2026_02_16 [composite]
- messages_2026_02_17 [composite]
- messages_2026_02_18 [composite]
- messages_2026_02_19 [composite]
- schema_migrations [composite]
- subscription [composite]
- user_defined_filter [composite]
- wal_column [composite]
- wal_rls [composite]

## Schema: storage

### Tables

#### storage.buckets
Row count: 2

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| allowed_mime_types | ARRAY | YES |  |  |  |  |
| avif_autodetection | boolean | YES | false |  |  |  |
| created_at | timestamp with time zone | YES | now() |  |  |  |
| file_size_limit | bigint | YES |  |  |  |  |
| id | text | NO |  | YES |  |  |
| name | text | NO |  |  |  |  |
| owner | uuid | YES |  |  |  |  |
| owner_id | text | YES |  |  |  |  |
| public | boolean | YES | false |  |  |  |
| type | buckettype | NO | 'STANDARD'::storage.buckettype |  |  |  |
| updated_at | timestamp with time zone | YES | now() |  |  |  |

Indexes:
- bname: CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name)
- buckets_pkey: CREATE UNIQUE INDEX buckets_pkey ON storage.buckets USING btree (id)

Triggers:
- enforce_bucket_name_length_trigger: CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length()
- protect_buckets_delete: CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete()

#### storage.buckets_analytics
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| deleted_at | timestamp with time zone | YES |  |  |  |  |
| format | text | NO | 'ICEBERG'::text |  |  |  |
| id | uuid | NO | gen_random_uuid() | YES |  |  |
| name | text | NO |  |  |  |  |
| type | buckettype | NO | 'ANALYTICS'::storage.buckettype |  |  |  |
| updated_at | timestamp with time zone | NO | now() |  |  |  |

Indexes:
- buckets_analytics_pkey: CREATE UNIQUE INDEX buckets_analytics_pkey ON storage.buckets_analytics USING btree (id)
- buckets_analytics_unique_name_idx: CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL)

#### storage.buckets_vectors
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| id | text | NO |  |  |  |  |
| type | buckettype | NO | 'VECTOR'::storage.buckettype |  |  |  |
| updated_at | timestamp with time zone | NO | now() |  |  |  |

Indexes:
- buckets_vectors_pkey: CREATE UNIQUE INDEX buckets_vectors_pkey ON storage.buckets_vectors USING btree (id)

#### storage.migrations
Row count: 57

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| executed_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |  |  |  |
| hash | character varying | NO |  |  |  |  |
| id | integer | NO |  |  |  |  |
| name | character varying | NO |  |  |  |  |

Indexes:
- migrations_name_key: CREATE UNIQUE INDEX migrations_name_key ON storage.migrations USING btree (name)
- migrations_pkey: CREATE UNIQUE INDEX migrations_pkey ON storage.migrations USING btree (id)

#### storage.objects
Row count: 6

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| bucket_id | text | YES |  |  |  |  |
| created_at | timestamp with time zone | YES | now() |  |  |  |
| id | uuid | NO | gen_random_uuid() | YES |  |  |
| last_accessed_at | timestamp with time zone | YES | now() |  |  |  |
| metadata | jsonb | YES |  |  |  |  |
| name | text | YES |  |  |  |  |
| owner | uuid | YES |  |  |  |  |
| owner_id | text | YES |  |  |  |  |
| path_tokens | ARRAY | YES |  |  |  |  |
| updated_at | timestamp with time zone | YES | now() |  |  |  |
| user_metadata | jsonb | YES |  |  |  |  |
| version | text | YES |  |  |  |  |

Indexes:
- bucketid_objname: CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name)
- idx_objects_bucket_id_name: CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C")
- idx_objects_bucket_id_name_lower: CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C")
- name_prefix_search: CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops)
- objects_pkey: CREATE UNIQUE INDEX objects_pkey ON storage.objects USING btree (id)

Policies (RLS):
- storage_branding_delete_auth (cmd=DELETE, permissive=true): USING (bucket_id = 'branding'::text) WITH CHECK 
- storage_branding_insert_auth (cmd=INSERT, permissive=true): USING  WITH CHECK (bucket_id = 'branding'::text)
- storage_branding_select_public (cmd=SELECT, permissive=true): USING (bucket_id = 'branding'::text) WITH CHECK 
- storage_branding_update_auth (cmd=UPDATE, permissive=true): USING (bucket_id = 'branding'::text) WITH CHECK (bucket_id = 'branding'::text)
- storage_evidencias_delete_auth (cmd=DELETE, permissive=true): USING (bucket_id = 'evidencias'::text) WITH CHECK 
- storage_evidencias_insert_auth (cmd=INSERT, permissive=true): USING  WITH CHECK (bucket_id = 'evidencias'::text)
- storage_evidencias_select_public (cmd=SELECT, permissive=true): USING (bucket_id = 'evidencias'::text) WITH CHECK 
- storage_evidencias_update_auth (cmd=UPDATE, permissive=true): USING (bucket_id = 'evidencias'::text) WITH CHECK (bucket_id = 'evidencias'::text)

Triggers:
- protect_objects_delete: CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete()
- update_objects_updated_at: CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column()

#### storage.s3_multipart_uploads
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| bucket_id | text | NO |  |  |  |  |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| id | text | NO |  | YES |  |  |
| in_progress_size | bigint | NO | 0 |  |  |  |
| key | text | NO |  |  |  |  |
| owner_id | text | YES |  |  |  |  |
| upload_signature | text | NO |  |  |  |  |
| user_metadata | jsonb | YES |  |  |  |  |
| version | text | NO |  |  |  |  |

Indexes:
- idx_multipart_uploads_list: CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at)
- s3_multipart_uploads_pkey: CREATE UNIQUE INDEX s3_multipart_uploads_pkey ON storage.s3_multipart_uploads USING btree (id)

#### storage.s3_multipart_uploads_parts
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| bucket_id | text | NO |  |  |  |  |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| etag | text | NO |  |  |  |  |
| id | uuid | NO | gen_random_uuid() | YES |  |  |
| key | text | NO |  |  |  |  |
| owner_id | text | YES |  |  |  |  |
| part_number | integer | NO |  |  |  |  |
| size | bigint | NO | 0 |  |  |  |
| upload_id | text | NO |  |  |  |  |
| version | text | NO |  |  |  |  |

Indexes:
- s3_multipart_uploads_parts_pkey: CREATE UNIQUE INDEX s3_multipart_uploads_parts_pkey ON storage.s3_multipart_uploads_parts USING btree (id)

#### storage.vector_indexes
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| bucket_id | text | NO |  |  |  |  |
| created_at | timestamp with time zone | NO | now() |  |  |  |
| data_type | text | NO |  |  |  |  |
| dimension | integer | NO |  |  |  |  |
| distance_metric | text | NO |  |  |  |  |
| id | text | NO | gen_random_uuid() |  |  |  |
| metadata_configuration | jsonb | YES |  |  |  |  |
| name | text | NO |  |  |  |  |
| updated_at | timestamp with time zone | NO | now() |  |  |  |

Indexes:
- vector_indexes_name_bucket_id_idx: CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id)
- vector_indexes_pkey: CREATE UNIQUE INDEX vector_indexes_pkey ON storage.vector_indexes USING btree (id)

### Functions

#### storage.can_insert_object
```sql
CREATE OR REPLACE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$function$
```

#### storage.enforce_bucket_name_length
```sql
CREATE OR REPLACE FUNCTION storage.enforce_bucket_name_length()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$function$
```

#### storage.extension
```sql
CREATE OR REPLACE FUNCTION storage.extension(name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$function$
```

#### storage.filename
```sql
CREATE OR REPLACE FUNCTION storage.filename(name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$function$
```

#### storage.foldername
```sql
CREATE OR REPLACE FUNCTION storage.foldername(name text)
 RETURNS text[]
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$function$
```

#### storage.get_common_prefix
```sql
CREATE OR REPLACE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$function$
```

#### storage.get_size_by_bucket
```sql
CREATE OR REPLACE FUNCTION storage.get_size_by_bucket()
 RETURNS TABLE(size bigint, bucket_id text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$function$
```

#### storage.list_multipart_uploads_with_delimiter
```sql
CREATE OR REPLACE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text)
 RETURNS TABLE(key text, id text, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$function$
```

#### storage.list_objects_with_delimiter
```sql
CREATE OR REPLACE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text)
 RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$function$
```

#### storage.operation
```sql
CREATE OR REPLACE FUNCTION storage.operation()
 RETURNS text
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$function$
```

#### storage.protect_delete
```sql
CREATE OR REPLACE FUNCTION storage.protect_delete()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$function$
```

#### storage.search
```sql
CREATE OR REPLACE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)
 RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$function$
```

#### storage.search_by_timestamp
```sql
CREATE OR REPLACE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text)
 RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$function$
```

#### storage.search_v2
```sql
CREATE OR REPLACE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text)
 RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$function$
```

#### storage.update_updated_at_column
```sql
CREATE OR REPLACE FUNCTION storage.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$function$
```

### Types

- buckets [composite]
- buckets_analytics [composite]
- buckets_vectors [composite]
- buckettype [enum] (STANDARD, ANALYTICS, VECTOR)
- migrations [composite]
- objects [composite]
- s3_multipart_uploads [composite]
- s3_multipart_uploads_parts [composite]
- vector_indexes [composite]

## Schema: vault

### Tables

#### vault.decrypted_secrets

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp with time zone | YES |  |  |  |  |
| decrypted_secret | text | YES |  |  |  |  |
| description | text | YES |  |  |  |  |
| id | uuid | YES |  |  |  |  |
| key_id | uuid | YES |  |  |  |  |
| name | text | YES |  |  |  |  |
| nonce | bytea | YES |  |  |  |  |
| secret | text | YES |  |  |  |  |
| updated_at | timestamp with time zone | YES |  |  |  |  |

#### vault.secrets
Row count: 0

Columns:

| Column | Type | Nullable | Default | PK | Unique | FK |
| --- | --- | --- | --- | --- | --- | --- |
| created_at | timestamp with time zone | NO | CURRENT_TIMESTAMP |  |  |  |
| description | text | NO | ''::text |  |  |  |
| id | uuid | NO | gen_random_uuid() | YES |  |  |
| key_id | uuid | YES |  |  |  |  |
| name | text | YES |  |  |  |  |
| nonce | bytea | YES | vault._crypto_aead_det_noncegen() |  |  |  |
| secret | text | NO |  |  |  |  |
| updated_at | timestamp with time zone | NO | CURRENT_TIMESTAMP |  |  |  |

Indexes:
- secrets_name_idx: CREATE UNIQUE INDEX secrets_name_idx ON vault.secrets USING btree (name) WHERE (name IS NOT NULL)
- secrets_pkey: CREATE UNIQUE INDEX secrets_pkey ON vault.secrets USING btree (id)

### Views

#### vault.decrypted_secrets
```sql
SELECT id,
    name,
    description,
    secret,
    convert_from(vault._crypto_aead_det_decrypt(message => decode(secret, 'base64'::text), additional => convert_to((id)::text, 'utf8'::name), key_id => (0)::bigint, context => '\x7067736f6469756d'::bytea, nonce => nonce), 'utf8'::name) AS decrypted_secret,
    key_id,
    nonce,
    created_at,
    updated_at
   FROM vault.secrets s;
```

### Functions

#### vault._crypto_aead_det_decrypt
```sql
CREATE OR REPLACE FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea DEFAULT '\x7067736f6469756d'::bytea, nonce bytea DEFAULT NULL::bytea)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE
AS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_decrypt_by_id$function$
```

#### vault._crypto_aead_det_encrypt
```sql
CREATE OR REPLACE FUNCTION vault._crypto_aead_det_encrypt(message bytea, additional bytea, key_id bigint, context bytea DEFAULT '\x7067736f6469756d'::bytea, nonce bytea DEFAULT NULL::bytea)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE
AS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_encrypt_by_id$function$
```

#### vault._crypto_aead_det_noncegen
```sql
CREATE OR REPLACE FUNCTION vault._crypto_aead_det_noncegen()
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE
AS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_noncegen$function$
```

#### vault.create_secret
```sql
CREATE OR REPLACE FUNCTION vault.create_secret(new_secret text, new_name text DEFAULT NULL::text, new_description text DEFAULT ''::text, new_key_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  rec record;
BEGIN
  INSERT INTO vault.secrets (secret, name, description)
  VALUES (
    new_secret,
    new_name,
    new_description
  )
  RETURNING * INTO rec;
  UPDATE vault.secrets s
  SET secret = encode(vault._crypto_aead_det_encrypt(
    message := convert_to(rec.secret, 'utf8'),
    additional := convert_to(s.id::text, 'utf8'),
    key_id := 0,
    context := 'pgsodium'::bytea,
    nonce := rec.nonce
  ), 'base64')
  WHERE id = rec.id;
  RETURN rec.id;
END
$function$
```

#### vault.update_secret
```sql
CREATE OR REPLACE FUNCTION vault.update_secret(secret_id uuid, new_secret text DEFAULT NULL::text, new_name text DEFAULT NULL::text, new_description text DEFAULT NULL::text, new_key_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  decrypted_secret text := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = secret_id);
BEGIN
  UPDATE vault.secrets s
  SET
    secret = CASE WHEN new_secret IS NULL THEN s.secret
                  ELSE encode(vault._crypto_aead_det_encrypt(
                    message := convert_to(new_secret, 'utf8'),
                    additional := convert_to(s.id::text, 'utf8'),
                    key_id := 0,
                    context := 'pgsodium'::bytea,
                    nonce := s.nonce
                  ), 'base64') END,
    name = coalesce(new_name, s.name),
    description = coalesce(new_description, s.description),
    updated_at = now()
  WHERE s.id = secret_id;
END
$function$
```

### Types

- decrypted_secrets [composite]
- secrets [composite]
