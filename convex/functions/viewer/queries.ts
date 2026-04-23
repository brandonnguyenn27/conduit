import { query } from '../../_generated/server'
import { v } from 'convex/values'
import { authComponent } from '../../auth'
import type { Id } from '../../_generated/dataModel'

type AuthenticatedLayoutData =
  | { state: 'unauthenticated' }
  | {
      state: 'needsOnboarding'
      email: string | null
    }
  | {
      state: 'ok'
      organizationId: Id<'organizations'>
      isAdmin: boolean
      email: string | null
    }

export const getAuthenticatedLayoutData = query({
  args: {},
  returns: v.union(
    v.object({ state: v.literal('unauthenticated') }),
    v.object({
      state: v.literal('needsOnboarding'),
      email: v.union(v.string(), v.null()),
    }),
    v.object({
      state: v.literal('ok'),
      organizationId: v.id('organizations'),
      isAdmin: v.boolean(),
      email: v.union(v.string(), v.null()),
    })
  ),
  handler: async (ctx): Promise<AuthenticatedLayoutData> => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) return { state: 'unauthenticated' }

    const appUser = await ctx.db
      .query('appUsers')
      .withIndex('by_better_auth_user', (q) => q.eq('betterAuthUserId', user._id))
      .unique()

    if (!appUser) {
      return {
        state: 'needsOnboarding',
        email: user.email ?? null,
      }
    }

    const defaultOrganization = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', 'default'))
      .unique()

    const hasProfile = !!appUser.profileId
    const isOnboarded = defaultOrganization
      ? hasProfile && appUser.organizationId !== defaultOrganization._id
      : hasProfile

    if (!isOnboarded) {
      return {
        state: 'needsOnboarding',
        email: user.email ?? appUser.email ?? null,
      }
    }

    return {
      state: 'ok',
      organizationId: appUser.organizationId,
      isAdmin: appUser.isAdmin === true,
      email: user.email ?? appUser.email ?? null,
    }
  },
})

