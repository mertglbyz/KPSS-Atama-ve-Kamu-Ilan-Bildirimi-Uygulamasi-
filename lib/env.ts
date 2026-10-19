export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
};

export const isSupabaseConfigured =
  env.supabaseUrl.startsWith('https://') &&
  !env.supabaseUrl.includes('YOUR_PROJECT') &&
  env.supabaseAnonKey.length > 20 &&
  !env.supabaseAnonKey.includes('your-anon');
