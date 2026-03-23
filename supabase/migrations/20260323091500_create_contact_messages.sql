create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default timezone('utc', now()),
  status text not null default 'stored',
  objet text not null,
  nom text not null,
  courriel text not null,
  organisation text null,
  message text not null,
  source text not null default 'website',
  origin text null,
  user_agent text null,
  delivered_at timestamptz null,
  delivery_error text null,
  constraint contact_messages_status_check
    check (status in ('stored', 'delivered', 'delivery_failed'))
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

revoke all on table public.contact_messages from anon, authenticated;
grant select, insert, update on table public.contact_messages to service_role;
grant usage, select on sequence public.contact_messages_id_seq to service_role;
