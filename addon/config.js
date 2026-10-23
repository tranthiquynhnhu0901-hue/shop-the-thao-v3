/* Public config only. Never place passwords, service_role or SMTP/API secrets here. */
window.SPORTHUB_V3 = Object.assign({
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY',
  signupPromptSeconds: 60,
  personalPlanUrl: 'https://tranthiquynhnhu0901-hue.github.io/shop-the-thao-v2/'
}, window.SPORTHUB_V3 || {});
