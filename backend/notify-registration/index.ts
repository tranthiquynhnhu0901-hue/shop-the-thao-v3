// Supabase Edge Function - database webhook for INSERT on public.profiles.
// Deploy with: supabase functions deploy notify-registration --no-verify-jwt
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL, SPORTHUB_WEBHOOK_SECRET
const ADMIN_TO = 'tranthiquynhnhu0901@gmail.com';
function htmlEscape(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] || c));
}
Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', {status:405});
  const secret = Deno.env.get('SPORTHUB_WEBHOOK_SECRET');
  const received = request.headers.get('x-sporthub-webhook-secret');
  if (!secret || !received || secret !== received) return new Response('Unauthorized',{status:401});
  const key = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('RESEND_FROM_EMAIL');
  if (!key || !from) return new Response('Missing email secrets',{status:500});
  let event: Record<string, any>;
  try { event = await request.json(); } catch { return new Response('Bad JSON',{status:400}); }
  if (event.type !== 'INSERT' || event.schema !== 'public' || event.table !== 'profiles' || !event.record?.id) {
    return new Response('Ignored event',{status:200});
  }
  const record = event.record;
  const rows = [
    ['Họ và tên',record.full_name], ['Email',record.email], ['Số điện thoại',record.phone],
    ['Nguồn đăng ký',record.source], ['Đồng ý marketing',record.marketing_consent ? 'Có':'Không'],
    ['Thời điểm',record.created_at], ['Mã khách hàng',record.id]
  ];
  const body = `<h2>SportHub V3 | Đăng ký tài khoản mới</h2><p>Bạn vừa có một tài khoản khách hàng mới.</p><table style="border-collapse:collapse">${rows.map(([k,v])=>`<tr><th style="text-align:left;padding:8px;border-bottom:1px solid #eee">${htmlEscape(k)}</th><td style="padding:8px;border-bottom:1px solid #eee">${htmlEscape(v)}</td></tr>`).join('')}</table><p>Truy cập CRM quản trị để quản lý khách hàng. Không bao giờ gửi mật khẩu qua email.</p>`;
  const res = await fetch('https://api.resend.com/emails',{
    method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':`sporthub-v3-registration-${record.id}`},
    body:JSON.stringify({from,to:[ADMIN_TO],subject:`[SportHub V3] Đăng ký mới: ${String(record.full_name||record.email||'Khách hàng').slice(0,80)}`,html:body})
  });
  const info=await res.text();
  if (!res.ok) {console.error('Resend:',res.status,info);return new Response('Email provider error',{status:502});}
  return new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json'}});
});
