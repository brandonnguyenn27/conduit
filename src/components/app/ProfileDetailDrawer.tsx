import type { Id } from '@convex/_generated/dataModel'

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

type DatePart = {
  year: number
  month?: number
}

type ExperienceEntry = {
  companyName: string
  title: string
  start?: DatePart
  end?: DatePart
  location?: string
  employmentType?: string
}

type EducationEntry = {
  schoolName: string
  fieldOfStudy: string
  degree: string
  startYear?: number
  endYear?: number
}

export type ProfileDetails = {
  _id: Id<'profiles'>
  name: string
  headline: string
  summary?: string
  location?: string
  linkedInUrl: string
  experience: ExperienceEntry[]
  education: EducationEntry[]
  skills?: string[]
}

interface ProfileDetailDrawerProps {
  open: boolean
  onOpenChange: (nextOpen: boolean) => void
  profile: ProfileDetails | null | undefined
  isLoading: boolean
}

export function ProfileDetailDrawer({
  open,
  onOpenChange,
  profile,
  isLoading,
}: ProfileDetailDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-xl">
        <DrawerHeader className="bg-background/95 sticky top-0 z-10 border-b p-6 text-left backdrop-blur supports-backdrop-filter:bg-background/80">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <DrawerTitle className="font-(family-name:--font-editorial) text-2xl">
                {profile?.name ?? 'Profile details'}
              </DrawerTitle>
              <DrawerDescription>
                {profile
                  ? [profile.headline, profile.location].filter(Boolean).join(' · ')
                  : 'Loading profile details...'}
              </DrawerDescription>
            </div>
            {profile ? (
              <a
                href={profile.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${profile.name} on LinkedIn`}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border/70 hover:bg-muted"
              >
                <LinkedInIcon className="h-6 w-6" />
              </a>
            ) : null}
          </div>
        </DrawerHeader>
        <div className="space-y-6 overflow-y-auto px-6 pb-8">
          {isLoading ? (
            <ProfileDetailsSkeleton />
          ) : profile ? (
            <>
              <section className="space-y-2 pt-4">
                <h3 className="font-semibold">Summary</h3>
                {profile.summary ? (
                  <p className="text-sm leading-6 whitespace-pre-wrap">{profile.summary}</p>
                ) : (
                  <p className="text-muted-foreground text-sm">No summary listed.</p>
                )}
              </section>

              <Separator />

              <section className="space-y-3">
                <h3 className="font-semibold">Experience</h3>
                <div className="space-y-3">
                  {profile.experience.length > 0 ? (
                    profile.experience.map((item, index) => (
                      <article key={`${item.companyName}-${item.title}-${index}`} className="space-y-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm">{item.companyName}</p>
                        <p className="text-muted-foreground text-xs">
                          {[formatDateRange(item.start, item.end), item.location, item.employmentType]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No experience listed.</p>
                  )}
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <h3 className="font-semibold">Education</h3>
                <div className="space-y-3">
                  {profile.education.length > 0 ? (
                    profile.education.map((item, index) => (
                      <article
                        key={`${item.schoolName}-${item.fieldOfStudy}-${index}`}
                        className="space-y-1"
                      >
                        <p className="font-medium">{item.schoolName}</p>
                        <p className="text-sm">
                          {[item.degree, item.fieldOfStudy].filter(Boolean).join(', ')}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatYearRange(item.startYear, item.endYear)}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No education listed.</p>
                  )}
                </div>
              </section>

              {profile.skills && profile.skills.length > 0 ? (
                <>
                  <Separator />
                  <section className="space-y-2">
                    <h3 className="font-semibold">Skills</h3>
                    <p className="text-muted-foreground text-sm">{profile.skills.join(' · ')}</p>
                  </section>
                </>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              This profile is unavailable for the selected organization.
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path
        className="fill-current text-foreground"
        d="M19 3A2 2 0 0 1 21 5v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8.34 17.34V9.89H5.86v7.45h2.48Zm-1.24-8.47c.79 0 1.43-.65 1.43-1.43 0-.8-.64-1.43-1.43-1.43-.78 0-1.42.64-1.42 1.43 0 .79.64 1.43 1.42 1.43Zm11.24 8.47v-4.12c0-2.21-1.18-3.24-2.75-3.24-1.27 0-1.84.7-2.16 1.2v-1.03h-2.48v7.2h2.48v-4.02c0-.21.02-.42.08-.57.17-.42.56-.86 1.21-.86.85 0 1.19.65 1.19 1.6v3.85h2.43Z"
      />
    </svg>
  )
}

function ProfileDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Separator />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
      <Separator />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-14 w-full" />
    </div>
  )
}

function formatDatePart(value?: DatePart) {
  if (!value) return ''
  if (!value.month) return `${value.year}`
  const date = new Date(Date.UTC(value.year, value.month - 1, 1))
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
}

function formatDateRange(start?: DatePart, end?: DatePart) {
  const startLabel = formatDatePart(start)
  const endLabel = end ? formatDatePart(end) : 'Present'
  if (!startLabel && !endLabel) return ''
  if (!startLabel) return endLabel
  return `${startLabel} - ${endLabel}`
}

function formatYearRange(startYear?: number, endYear?: number) {
  if (!startYear && !endYear) return ''
  if (!startYear) return `${endYear}`
  return `${startYear} - ${endYear ?? 'Present'}`
}
