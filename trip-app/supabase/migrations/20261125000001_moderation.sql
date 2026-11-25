-- Filtro de termos ligados a menores de idade (regra autoritativa; o app repete em src/lib/moderation.ts).
create extension if not exists unaccent with schema extensions;

create or replace function public.blocked_term(t text)
returns text
language plpgsql
stable
set search_path = public, extensions
as $$
declare
  n text := lower(extensions.unaccent(coalesce(t, '')));
  term text;
  m text;
begin
  foreach term in array array['crianca', 'infantil', 'menor de idade', 'novinha', 'colegial', 'lolita'] loop
    if position(term in n) > 0 then return term; end if;
  end loop;
  m := substring(n from '\ypedo\w*');
  if m is not null then return m; end if;
  -- idade de menor só quando o texto fala da idade de alguém ("tenho 15 anos"), não de tempo ("3 anos de canal")
  return substring(n from '\y(?:tenho|tem|tinha|com|de|aos|fez|faz|fiz|idade)\s+(?:[1-9]|1[0-7])\s*anos\y(?!\s+de\s)');
end;
$$;
