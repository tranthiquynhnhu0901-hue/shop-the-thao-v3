-- STEP: First sign in on SportHub V3 with Google using this exact verified email.
-- THEN run this file in Supabase SQL Editor. NEVER expose this as a client API.
insert into public.admins(user_id)
select id from auth.users
where lower(email)='tranthiquynhnhu0901@gmail.com'
  and email_confirmed_at is not null
  and (raw_app_meta_data ->> 'provider')='google'
on conflict (user_id) do nothing;

-- Must return exactly ONE row to grant access successfully:
select a.user_id, u.email, a.added_at
from public.admins a join auth.users u on u.id=a.user_id
where lower(u.email)='tranthiquynhnhu0901@gmail.com';
