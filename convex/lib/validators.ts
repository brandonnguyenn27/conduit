import { v } from 'convex/values'

export const datePart = v.object({
  year: v.number(),
  month: v.optional(v.number()),
  day: v.optional(v.number()),
})

export const educationEntry = v.object({
  schoolName: v.string(),
  fieldOfStudy: v.string(),
  degree: v.string(),
  startYear: v.optional(v.number()),
  endYear: v.optional(v.number()),
})

export const experienceEntry = v.object({
  companyName: v.string(),
  title: v.string(),
  start: v.optional(datePart),
  end: v.optional(datePart),
  location: v.optional(v.string()),
  employmentType: v.optional(v.string()),
  companyUrl: v.optional(v.string()),
  companyIndustry: v.optional(v.string()),
})
