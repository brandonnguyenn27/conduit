import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const datePart = v.object({
  year: v.number(),
  month: v.optional(v.number()),
  day: v.optional(v.number()),
})

const educationEntry = v.object({
  schoolName: v.string(),
  fieldOfStudy: v.string(),
  degree: v.string(),
  startYear: v.optional(v.number()),
  endYear: v.optional(v.number()),
})

const experienceEntry = v.object({
  companyName: v.string(),
  title: v.string(),
  start: v.optional(datePart),
  end: v.optional(datePart),
  location: v.optional(v.string()),
  employmentType: v.optional(v.string()),
  companyUrl: v.optional(v.string()),
  companyIndustry: v.optional(v.string()),
})

export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    logoUrl: v.optional(v.string()),
    adminEmail: v.optional(v.string()),
    joinPasswordHash: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_slug', ['slug']),

  profiles: defineTable({
    organizationId: v.id('organizations'),
    linkedInUrl: v.string(),
    linkedInUsername: v.optional(v.string()),
    name: v.string(),
    headline: v.string(),
    summary: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    location: v.optional(v.string()),
    industry: v.optional(v.string()),
    education: v.array(educationEntry),
    experience: v.array(experienceEntry),
    skills: v.optional(v.array(v.string())),
    majors: v.array(v.string()),
    schools: v.array(v.string()),
    companies: v.array(v.string()),
    jobTitles: v.array(v.string()),
    suggestSearchText: v.optional(v.string()),
    currentCompany: v.optional(v.string()),
    currentExperience: v.optional(experienceEntry),
    companiesSearchSlug: v.optional(v.string()),
    currentCompanySlug: v.optional(v.string()),
    educationSearchSlug: v.optional(v.string()),
    jobTitlesSearchSlug: v.optional(v.string()),
    currentJobTitlesSearchSlug: v.optional(v.string()),
    pastJobTitlesSearchSlug: v.optional(v.string()),
    class: v.optional(v.string()),
    family: v.optional(v.string()),
    profileType: v.optional(v.union(v.literal('alumni'), v.literal('member'))),
    claimedByUserId: v.optional(v.string()),
    email: v.optional(v.string()),
  })
    .index('by_organization_linkedin', ['organizationId', 'linkedInUrl'])
    .index('by_organization_claimed', ['organizationId', 'claimedByUserId'])
    .index('by_organization_email', ['organizationId', 'email'])
    .searchIndex('by_suggest_search', {
      searchField: 'suggestSearchText',
      filterFields: ['organizationId'],
    })
    .searchIndex('by_companies_slug_search', {
      searchField: 'companiesSearchSlug',
      filterFields: ['organizationId'],
    })
    .searchIndex('by_current_company_slug_search', {
      searchField: 'currentCompanySlug',
      filterFields: ['organizationId'],
    })
    .searchIndex('by_education_slug_search', {
      searchField: 'educationSearchSlug',
      filterFields: ['organizationId'],
    })
    .searchIndex('by_job_titles_slug_search', {
      searchField: 'jobTitlesSearchSlug',
      filterFields: ['organizationId'],
    })
    .searchIndex('by_current_job_titles_slug_search', {
      searchField: 'currentJobTitlesSearchSlug',
      filterFields: ['organizationId'],
    })
    .searchIndex('by_past_job_titles_slug_search', {
      searchField: 'pastJobTitlesSearchSlug',
      filterFields: ['organizationId'],
    }),

  onboardingTokens: defineTable({
    token: v.string(),
    organizationId: v.id('organizations'),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_organization', ['organizationId']),

  importQueue: defineTable({
    organizationId: v.id('organizations'),
    linkedInUrl: v.string(),
    email: v.optional(v.string()),
    class: v.optional(v.string()),
    family: v.optional(v.string()),
    profileType: v.optional(v.union(v.literal('alumni'), v.literal('member'))),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('done'),
      v.literal('failed')
    ),
    createdAt: v.number(),
    errorMessage: v.optional(v.string()),
  })
    .index('by_status', ['status'])
    .index('by_organization', ['organizationId']),

  organizationFacetValues: defineTable({
    organizationId: v.id('organizations'),
    facet: v.union(
      v.literal('companies'),
      v.literal('currentCompanies'),
      v.literal('majors'),
      v.literal('schools'),
      v.literal('currentRoles'),
      v.literal('pastRoles'),
      v.literal('classes'),
      v.literal('families')
    ),
    valueKey: v.string(),
    displayValue: v.string(),
    count: v.number(),
    updatedAt: v.number(),
  })
    .index('by_org_facet_valueKey', ['organizationId', 'facet', 'valueKey'])
    .index('by_org_facet_display', ['organizationId', 'facet', 'displayValue'])
    .searchIndex('by_facet_search', {
      searchField: 'displayValue',
      filterFields: ['organizationId', 'facet'],
    }),

  appUsers: defineTable({
    betterAuthUserId: v.string(),
    organizationId: v.id('organizations'),
    profileId: v.optional(v.id('profiles')),
    email: v.string(),
    name: v.string(),
    isAdmin: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index('by_better_auth_user', ['betterAuthUserId'])
    .index('by_organization', ['organizationId']),

  claimCodes: defineTable({
    profileId: v.id('profiles'),
    code: v.string(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index('by_profile', ['profileId'])
    .index('by_code', ['code']),

  favorites: defineTable({
    userId: v.string(),
    profileId: v.id('profiles'),
    organizationId: v.id('organizations'),
    createdAt: v.number(),
  })
    .index('by_user_org', ['userId', 'organizationId'])
    .index('by_profile', ['profileId']),

  savedProfiles: defineTable({
    userId: v.string(),
    profileId: v.id('profiles'),
    organizationId: v.id('organizations'),
    createdAt: v.number(),
  })
    .index('by_user_org', ['userId', 'organizationId'])
    .index('by_user_profile', ['userId', 'profileId'])
    .index('by_user_org_profile', ['userId', 'organizationId', 'profileId'])
    .index('by_profile', ['profileId']),
})
