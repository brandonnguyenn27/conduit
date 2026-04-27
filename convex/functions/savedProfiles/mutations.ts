import { internalMutation, mutation } from '../../_generated/server'
import { v } from 'convex/values'
import { authComponent } from '../../auth'
import { toSavedProfilePreview } from './helpers'

/**
 * Backfill `previewMajor` on saved rows created before that field existed.
 * Run repeatedly until `isDone` is true (use `nextCursor` from the prior run).
 *
 * ```bash
 * npx convex run internal/functions/savedProfiles/mutations:backfillPreviewMajor \
 *   '{"organizationId":"<YOUR_ORG_ID>","dryRun":true}'
 * ```
 */
export const backfillPreviewMajor = internalMutation({
	args: {
		organizationId: v.id('organizations'),
		batchSize: v.optional(v.number()),
		cursor: v.optional(v.string()),
		dryRun: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const batchSize = Math.max(1, Math.min(args.batchSize ?? 100, 500))
		const result = await ctx.db
			.query('savedProfiles')
			.withIndex('by_organization_createdAt', (q) =>
				q.eq('organizationId', args.organizationId),
			)
			.order('desc')
			.paginate({ cursor: args.cursor ?? null, numItems: batchSize })

		let patched = 0
		let skippedAlreadyHasField = 0
		let skippedMissingProfile = 0

		for (const saved of result.page) {
			if (saved.previewMajor !== undefined) {
				skippedAlreadyHasField++
				continue
			}

			const profile = await ctx.db.get(saved.profileId)
			if (!profile) {
				skippedMissingProfile++
				continue
			}

			const previewMajor = profile.majors[0] ?? ''
			if (!args.dryRun) {
				await ctx.db.patch(saved._id, { previewMajor })
			}
			patched++
		}

		return {
			scanned: result.page.length,
			patched,
			skippedAlreadyHasField,
			skippedMissingProfile,
			dryRun: !!args.dryRun,
			isDone: result.isDone,
			nextCursor: result.isDone ? null : result.continueCursor,
		}
	},
})

export const add = mutation({
  args: {
    profileId: v.id('profiles'),
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      throw new Error('Unauthorized')
    }

    const profile = await ctx.db.get(args.profileId)
    if (!profile || profile.organizationId !== args.organizationId) {
      throw new Error('Profile not found')
    }

    const existing = await ctx.db
      .query('savedProfiles')
      .withIndex('by_user_org_profile', (q) =>
        q
          .eq('userId', user._id)
          .eq('organizationId', args.organizationId)
          .eq('profileId', args.profileId)
      )
      .first()
      
    if (existing) return existing._id
    
    return await ctx.db.insert('savedProfiles', {
      userId: user._id,
      profileId: args.profileId,
      organizationId: args.organizationId,
      ...toSavedProfilePreview(profile),
      createdAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      throw new Error('Unauthorized')
    }

    const saved = await ctx.db
      .query('savedProfiles')
      .withIndex('by_user_profile', (q) =>
        q.eq('userId', user._id).eq('profileId', args.profileId)
      )
      .first()
      
    if (saved) await ctx.db.delete(saved._id)
  },
})
