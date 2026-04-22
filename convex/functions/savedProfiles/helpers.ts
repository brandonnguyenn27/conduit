import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx } from '../../_generated/server'

export function toSavedProfilePreview(profile: Pick<
  Doc<'profiles'>,
  'name' | 'linkedInUrl' | 'currentCompany' | 'currentExperience'
>) {
  return {
    previewName: profile.name,
    previewHeadline: profile.currentExperience?.title ?? '',
    previewCurrentCompany:
      profile.currentExperience?.companyName ?? profile.currentCompany ?? '',
    previewLinkedInUrl: profile.linkedInUrl,
  }
}

export async function syncSavedProfilePreviewsForProfile(
  ctx: MutationCtx,
  args: {
    profileId: Id<'profiles'>
    preview: ReturnType<typeof toSavedProfilePreview>
  }
) {
  const BATCH = 200
  while (true) {
    const batch = await ctx.db
      .query('savedProfiles')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .take(BATCH)
    if (batch.length === 0) return
    for (const saved of batch) {
      await ctx.db.patch(saved._id, args.preview)
    }
  }
}

export async function deleteSavedProfilesForProfile(ctx: MutationCtx, profileId: Id<'profiles'>) {
  const BATCH = 200
  while (true) {
    const batch = await ctx.db
      .query('savedProfiles')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .take(BATCH)
    if (batch.length === 0) return
    for (const saved of batch) {
      await ctx.db.delete(saved._id)
    }
  }
}

