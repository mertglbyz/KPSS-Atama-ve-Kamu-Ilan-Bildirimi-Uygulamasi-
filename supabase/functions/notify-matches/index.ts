import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.118.0';

type Candidate = { user_id: string; expo_push_token: string; nickname: string | null };

Deno.serve(async (request) => {
  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const body = await request.json().catch(() => ({}));
  const positionId = body.position_id ?? body.record?.id;
  if (!positionId) return new Response('position_id yok', { status: 400 });

  const { data: users, error } = await admin.rpc('users_to_notify_for_position', {
    p_position_id: positionId,
    p_kind: 'new_job',
  });
  if (error) return new Response(error.message, { status: 500 });

  const { data: position } = await admin
    .from('job_positions')
    .select('position_title, announcements(title, institution_name)')
    .eq('id', positionId)
    .maybeSingle();
  const announcement = Array.isArray(position?.announcements) ? position?.announcements[0] : position?.announcements;
  const title = announcement?.institution_name ? `${announcement.institution_name} yeni ilan` : 'Yeni uygun ilan';
  const text = position?.position_title ?? 'Profiline uyan bir kadro yayınlandı';

  const candidates = (users ?? []) as Candidate[];
  if (candidates.length) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidates.map((candidate) => ({ to: candidate.expo_push_token, title, body: text, data: { positionId } }))),
    });
    await admin.from('notifications').upsert(
      candidates.map((candidate) => ({
        user_id: candidate.user_id,
        title,
        body: text,
        kind: 'new_job',
        dedupe_key: `new:${positionId}:${candidate.user_id}`,
      })),
      { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true },
    );
  }

  return Response.json({ sent: candidates.length });
});
