import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.118.0';

Deno.serve(async (request) => {
  const authorization = request.headers.get('Authorization');
  if (!authorization) return new Response('unauthorized', { status: 401 });
  const userClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return new Response('unauthorized', { status: 401 });
  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) return new Response(deleteError.message, { status: 500 });
  return Response.json({ ok: true });
});
