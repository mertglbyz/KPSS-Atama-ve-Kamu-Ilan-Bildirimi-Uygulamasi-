import { Text, TextInput } from 'react-native';

type JsxFn = (type: unknown, props: Record<string, unknown> | null, ...rest: unknown[]) => unknown;

type JsxRuntime = {
  jsx?: JsxFn;
  jsxs?: JsxFn;
  jsxDEV?: JsxFn;
  __kpssFontLocked?: boolean;
};

function lockProps(type: unknown, props: Record<string, unknown> | null | undefined) {
  if (type !== Text && type !== TextInput) return props ?? null;
  return { ...(props ?? {}), allowFontScaling: false, maxFontSizeMultiplier: 1 };
}

function patch(runtime: JsxRuntime | null | undefined) {
  if (!runtime || runtime.__kpssFontLocked) return;
  const wrap = (original?: JsxFn): JsxFn | undefined => {
    if (!original) return original;
    return (type, props, ...rest) => original(type, lockProps(type, props), ...rest);
  };
  runtime.jsx = wrap(runtime.jsx);
  runtime.jsxs = wrap(runtime.jsxs);
  runtime.jsxDEV = wrap(runtime.jsxDEV);
  runtime.__kpssFontLocked = true;
}

patch(require('nativewind/jsx-runtime'));
patch(require('nativewind/jsx-dev-runtime'));
patch(require('react/jsx-runtime'));
patch(require('react/jsx-dev-runtime'));
