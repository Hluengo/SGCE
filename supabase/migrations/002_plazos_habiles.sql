-- Business day helpers using feriados_chile

create or replace function es_dia_habil(p_fecha date)
returns boolean
language sql
stable
as $$
  select
    extract(isodow from p_fecha) between 1 and 5
    and not exists (
      select 1 from feriados_chile f where f.fecha = p_fecha
    );
$$;

-- Adds N business days to a start date (excludes start date)
create or replace function sumar_dias_habiles(p_fecha_inicio date, p_dias integer)
returns date
language plpgsql
stable
as $$
declare
  v_fecha date := p_fecha_inicio;
  v_restantes integer := greatest(p_dias, 0);
begin
  while v_restantes > 0 loop
    v_fecha := v_fecha + interval '1 day';
    if es_dia_habil(v_fecha::date) then
      v_restantes := v_restantes - 1;
    end if;
  end loop;
  return v_fecha;
end;
$$;

-- Counts business days between two dates (excludes start date, includes end date)
create or replace function contar_dias_habiles(p_inicio date, p_fin date)
returns integer
language plpgsql
stable
as $$
declare
  v_count integer := 0;
  v_fecha date;
  v_start date := least(p_inicio, p_fin);
  v_end date := greatest(p_inicio, p_fin);
  v_sign integer := case when p_inicio <= p_fin then 1 else -1 end;
begin
  v_fecha := v_start + interval '1 day';
  while v_fecha <= v_end loop
    if es_dia_habil(v_fecha) then
      v_count := v_count + 1;
    end if;
    v_fecha := v_fecha + interval '1 day';
  end loop;
  return v_count * v_sign;
end;
$$;

-- Counts business days between two dates (includes start and end dates)
create or replace function contar_dias_habiles_incluyente(p_inicio date, p_fin date)
returns integer
language plpgsql
stable
as $$
declare
  v_count integer := 0;
  v_fecha date;
  v_start date := least(p_inicio, p_fin);
  v_end date := greatest(p_inicio, p_fin);
  v_sign integer := case when p_inicio <= p_fin then 1 else -1 end;
begin
  v_fecha := v_start;
  while v_fecha <= v_end loop
    if es_dia_habil(v_fecha) then
      v_count := v_count + 1;
    end if;
    v_fecha := v_fecha + interval '1 day';
  end loop;
  return v_count * v_sign;
end;
$$;
