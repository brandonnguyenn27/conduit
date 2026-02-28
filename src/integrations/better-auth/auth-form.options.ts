import { z } from 'zod'

export const authFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type AuthFormValues = z.infer<typeof authFormSchema>

export const signInSchema = authFormSchema.pick({ email: true, password: true })
export const signUpSchema = authFormSchema

export const authFormDefaultValues: AuthFormValues = {
  name: '',
  email: '',
  password: '',
}
