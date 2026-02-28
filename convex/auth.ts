import { betterAuth } from 'better-auth/minimal'
import {
  createClient,
  type AuthFunctions,
  type GenericCtx,
} from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import authConfig from './auth.config'
import { components, internal } from './_generated/api'
import { query } from './_generated/server'
import type { DataModel } from './_generated/dataModel'

const siteUrl = process.env.SITE_URL!

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions: {
    get onCreate() {
      return internal.auth.onCreate
    },
    get onUpdate() {
      return internal.auth.onUpdate
    },
    get onDelete() {
      return internal.auth.onDelete
    },
  } as AuthFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, user) => {
        const existing = await ctx.db
          .query('organizations')
          .withIndex('by_slug', (q) => q.eq('slug', 'default'))
          .unique()
        let orgId = existing?._id
        if (!orgId) {
          orgId = await ctx.db.insert('organizations', {
            name: 'Default',
            slug: 'default',
            createdAt: Date.now(),
          })
        }
        await ctx.db.insert('appUsers', {
          betterAuthUserId: user._id,
          organizationId: orgId,
          email: user.email,
          name: user.name ?? user.email,
          createdAt: Date.now(),
        })
      },
    },
  },
})

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi()

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [convex({ authConfig })],
  })
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(ctx)
  },
})
