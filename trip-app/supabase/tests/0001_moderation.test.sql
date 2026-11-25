begin;
create extension if not exists pgtap with schema extensions;
select plan(16);
select isnt(public.blocked_term('olha isso ' || t || ' hoje'), null, 'bloqueia ' || t)
  from unnest(array['CRIANÇA','menor de idade','Menor De Idade','tenho 15 anos','ela tem 12 anos','garota de 16 anos','com 14 anos','novinha','pedofilia']) t;
select is(public.blocked_term(t), null, 'libera ' || t)
  from unnest(array['18 anos de carreira','comemorando 25 anos','10 anos de carreira','Moro aqui há 3 anos','Torpedo de chocolate','3 anos de canal','depois de 2 anos de namoro']) t;
select * from finish();
rollback;
