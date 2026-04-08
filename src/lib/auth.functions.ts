import { createServerFn } from '@tanstack/react-start'
import { getToken } from '@/lib/auth.server'

export const getAuthFn = createServerFn({ method: 'GET' }).handler(async () => {
  return await getToken()
})
