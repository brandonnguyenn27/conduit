import { query } from '../../_generated/server'
import { v } from 'convex/values'

function toPublicOrganization(organization: {
  _id: unknown
  _creationTime: number
  name: string
  slug: string
  logoUrl?: string
  adminEmail?: string
  createdAt: number
}) {
  return {
    _id: organization._id,
    _creationTime: organization._creationTime,
    name: organization.name,
    slug: organization.slug,
    logoUrl: organization.logoUrl,
    adminEmail: organization.adminEmail,
    createdAt: organization.createdAt,
  }
}

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 500, 5000))
    const organizations = await ctx.db.query('organizations').order('desc').take(limit)
    return organizations.map(toPublicOrganization)
  },
})

export const get = query({
  args: { id: v.id('organizations') },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.id)
    return organization ? toPublicOrganization(organization) : null
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()
    return organization ? toPublicOrganization(organization) : null
  },
})
