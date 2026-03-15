import { createFileRoute } from '@tanstack/react-router'
import { MapPin, Building2, GraduationCap, LinkIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { getOrganizationDataFn } from '@/lib/get-organization-data.functions'
import { getMyProfileFn } from '@/lib/profile.functions'
import { ProfilePageSkeleton } from '@/components/app/ProfilePageSkeleton'
import { groupExperiencesByCompany } from '@/lib/experience'
import { DotPattern } from '@/components/ui/dot-pattern'
import { AuroraText } from '@/components/ui/aurora-text'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/profile')({
  loader: async () => {
    const { organizationId } = await getOrganizationDataFn()
    if (!organizationId) throw new Error('No organization found')
    return getMyProfileFn({ data: { organizationId } })
  },
  pendingComponent: ProfilePageSkeleton,
  component: ProfilePage,
})

function ProfilePage() {
  const profile = Route.useLoaderData()

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground w-full">
        <h2 className="text-xl font-semibold text-foreground mb-2 font-editorial">No Profile Found</h2>
        <p className="mb-6">We couldn't find a linked profile for your account.</p>
        <Button
          variant="destructive"
          onClick={() => {
            void authClient.signOut({
              fetchOptions: {
                onSuccess: () => location.reload(),
              },
            })
          }}
        >
          Log out
        </Button>
      </div>
    )
  }

  return (
    <div className="relative min-h-[70vh] w-full flex flex-col items-center overflow-x-hidden font-secondary">
      <DotPattern
        width={32}
        height={32}
        cx={1}
        cy={1}
        cr={1.5}
        className={cn(
          'mask-[radial-gradient(800px_circle_at_center,white,transparent)]'
        )}
      />
      <div className="relative z-10 w-full max-w-4xl space-y-6 pt-10 pb-16 px-4">
        {/* Header Section */}
        <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {profile.profileImageUrl ? (
              <img 
                src={profile.profileImageUrl} 
                alt={profile.name} 
                className="h-24 w-24 rounded-full border-4 border-background shadow-sm object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-muted text-3xl font-semibold shadow-sm text-muted-foreground">
                {profile.name.charAt(0)}
              </div>
            )}
            
            <div className="flex-1 space-y-1">
              <h1 className="text-2xl font-bold font-editorial">
                <AuroraText
                  colors={['#0a0a0a', '#374151', '#0070F3', '#6b7280']}
                >
                  {profile.name}
                </AuroraText>
              </h1>
              <p className="text-lg text-muted-foreground">{profile.headline}</p>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
                {profile.industry && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {profile.industry}
                  </span>
                )}
                {profile.linkedInUrl && (
                  <a
                    href={profile.linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline hover:text-primary/80 transition-colors"
                  >
                    <LinkIcon className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="font-medium">Class:</span> {profile.class || '-'}
                </span>
                <span className="flex items-center gap-1 capitalize">
                  <span className="font-medium">Member Status:</span> {profile.profileType || '-'}
                </span>
              </div>
            </div>
            
            <Button
              variant="destructive"
              className="mt-4 sm:mt-0"
              onClick={() => {
                void authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => location.reload(),
                  },
                })
              }}
            >
              Log out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About Section */}
      {profile.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="font-editorial">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{profile.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Experience Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-editorial">Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.experience.length > 0 ? (
            groupExperiencesByCompany(profile.experience).map((group, groupIndex) => (
              <div key={groupIndex} className="flex gap-4">
                <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-4">
                   <h3 className="font-semibold text-base font-editorial">{group.companyName}</h3>
                   <div className="relative">
                     {group.roles.length > 1 && (
                       <div className="absolute left-[7px] top-2 bottom-6 w-px bg-border group-connector" />
                     )}
                     <div className="space-y-4">
                       {group.roles.map((exp, roleIndex) => (
                         <div key={roleIndex} className={`relative ${group.roles.length > 1 ? 'pl-6' : ''}`}>
                            {group.roles.length > 1 && (
                              <div className="absolute left-1 top-[10px] h-2 w-2 rounded-full bg-border" />
                            )}
                            <div>
                               <p className="font-semibold">{exp.title}</p>
                               <p className="text-sm text-muted-foreground">
                                 {exp.start ? `${exp.start.month}/${exp.start.year}` : 'Unknown'} -{' '}
                                 {exp.end ? `${exp.end.month}/${exp.end.year}` : 'Present'}
                               </p>
                               {exp.location && (
                                 <p className="text-sm text-muted-foreground mt-1">{exp.location}</p>
                               )}
                            </div>
                         </div>
                       ))}
                     </div>
                   </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No experience listed.</p>
          )}
        </CardContent>
      </Card>

      {/* Education Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-editorial">Education</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.education.length > 0 ? (
            profile.education.map((edu, i) => (
              <div key={i} className="flex gap-4">
                <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                  <GraduationCap className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold font-editorial">{edu.schoolName}</h3>
                  <p className="text-sm">
                    {edu.degree}
                    {edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {edu.startYear || 'Unknown'} - {edu.endYear || 'Present'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No education listed.</p>
          )}
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-editorial">Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, i) => (
                <div 
                  key={i} 
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground"
                >
                  {skill}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No skills listed.</p>
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  )
}
