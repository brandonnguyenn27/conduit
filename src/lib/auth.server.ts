import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'

export const {
  handler,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthReactStart({
  convexUrl: process.env.VITE_CONVEX_URL!,
  convexSiteUrl: process.env.VITE_CONVEX_SITE_URL!,
  jwtCache: {
    enabled: true,
    expirationToleranceSeconds: 60,
    isAuthError: (error) => error instanceof Error && error.message.includes('401'),
  }
})
