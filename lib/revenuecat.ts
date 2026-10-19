import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type PurchasesPackage } from 'react-native-purchases';
import { ENTITLEMENT_ID, PRODUCT_IDS } from '@/constants/catalog';
import { env } from '@/lib/env';

let configuredFor: string | null = null;

export function purchasesAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  const key = Platform.OS === 'ios' ? env.revenueCatIosKey : env.revenueCatAndroidKey;
  return key.length > 8 && !key.includes('your_public');
}

async function ensureConfigured(userId: string) {
  if (!purchasesAvailable()) return false;
  if (configuredFor === userId) return true;
  const apiKey = Platform.OS === 'ios' ? env.revenueCatIosKey : env.revenueCatAndroidKey;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey, appUserID: userId });
  configuredFor = userId;
  return true;
}

export async function syncPremium(userId: string): Promise<boolean> {
  const ready = await ensureConfigured(userId);
  if (!ready) return false;
  const info = await Purchases.getCustomerInfo();
  return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
}

export async function loadOfferings(): Promise<PurchasesPackage[]> {
  if (!purchasesAvailable() || !configuredFor) return [];
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function purchaseProduct(productId: string): Promise<boolean> {
  if (!purchasesAvailable()) {
    throw new Error('Satın alma için App Store veya Google Play geliştirme derlemesi gerekir.');
  }
  const packages = await loadOfferings();
  const selected = packages.find((item) => item.product.identifier === productId);
  if (!selected) {
    throw new Error('Mağazada bu paket bulunamadı. RevenueCat offering içine ürünü ekle.');
  }
  const { customerInfo } = await Purchases.purchasePackage(selected);
  return Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
}

export async function restorePremium(): Promise<boolean> {
  if (!purchasesAvailable()) return false;
  const info = await Purchases.restorePurchases();
  return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
}

export async function presentStorePaywall(): Promise<void> {
  if (!purchasesAvailable()) return;
  const ui = await import('react-native-purchases-ui');
  await ui.default.presentPaywall();
}

export function planFromProduct(productId: string | null): 'free' | 'monthly' | 'quarterly' | 'yearly' {
  if (productId === PRODUCT_IDS.yearly) return 'yearly';
  if (productId === PRODUCT_IDS.quarterly) return 'quarterly';
  if (productId === PRODUCT_IDS.monthly) return 'monthly';
  return 'free';
}
