export const TERMS_VERSION = "2026-07-27-beta";
export const PRIVACY_VERSION = "2026-07-27-beta";

export function getLegalAcceptance() {
  return {
    termsVersion: TERMS_VERSION,
    privacyVersion: PRIVACY_VERSION,
  };
}
