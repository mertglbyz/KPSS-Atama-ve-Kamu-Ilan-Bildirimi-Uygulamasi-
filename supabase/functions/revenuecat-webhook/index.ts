import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.118.0';

const ACTIVE = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE', 'PRODUCT_CHANGE']);

function planFromProduct(productId: string | undefined) {
  if (!productId) return 'free';
  if (productId.includes('yearly')) return 'yearly';
  if (productId.includes('quarterly')) return 'quarterly';
  if (productId.includes('monthly')) return 'monthly';
  return 'free';
}

Deno.serve(async (request) => {
  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (!secret || request.headers.get('Authorization') !== `Bearer ${secret}`) {
    return new Response('forbidden', { status: 401 });
  }
  const payload = await request.json();
  const event = payload.event ?? {};
  const userId = event.app_user_id as string | undefined;
  if (!userId) return new Response('app_user_id yok', { status: 400 });

  const type = String(event.type ?? '');
  const expired = type === 'EXPIRATION';
  const active = ACTIVE.has(type) && !expired;
  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const { error } = await admin
    .from('profiles')
    .update({
      is_premium: active,
      subscription_plan: active ? planFromProduct(event.product_id) : 'free',
      subscription_expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ ok: true });
});
