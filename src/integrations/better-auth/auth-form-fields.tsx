import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const inputClassName =
  'flex h-9 w-full border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 text-sm focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 disabled:cursor-not-allowed disabled:opacity-50'

type FieldLike = {
  name: string
  state: { value: string; meta: { errors: unknown[]; isTouched: boolean } }
  handleBlur: () => void
  handleChange: (value: string) => void
}

function formatErrors(errors: unknown[]): string {
  return errors
    .map((e) => (typeof e === 'string' ? e : (e as { message?: string })?.message ?? ''))
    .filter(Boolean)
    .join(', ')
}

export function AuthTextField({
  field,
  label,
  type = 'text',
  placeholder,
  required,
}: {
  field: FieldLike
  label: string
  type?: 'text' | 'email'
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={field.name} className="text-sm font-medium leading-none">
        {label}
      </Label>
      <Input
        id={field.name}
        name={field.name}
        type={type}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        className={inputClassName}
        placeholder={placeholder}
        required={required}
        aria-invalid={field.state.meta.errors.length > 0}
      />
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <div className="text-sm text-red-600 dark:text-red-400 mt-1">
          {formatErrors(field.state.meta.errors)}
        </div>
      )}
    </div>
  )
}

export function AuthPasswordField({
  field,
  label,
  required,
}: {
  field: FieldLike
  label: string
  required?: boolean
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={field.name} className="text-sm font-medium leading-none">
        {label}
      </Label>
      <Input
        id={field.name}
        name={field.name}
        type="password"
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        className={inputClassName}
        required={required}
        minLength={8}
        aria-invalid={field.state.meta.errors.length > 0}
      />
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <div className="text-sm text-red-600 dark:text-red-400 mt-1">
          {formatErrors(field.state.meta.errors)}
        </div>
      )}
    </div>
  )
}
