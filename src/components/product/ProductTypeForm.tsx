import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabaseClient'

const attributeSchema = z.object({
  key: z.string().min(1, 'Required'),
  label: z.string().min(1, 'Required'),
  type: z.enum(['text', 'select']),
  options: z.string().optional(),
})

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Required')
    .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, underscore only'),
  label: z.string().min(1, 'Required'),
  attributes: z.array(attributeSchema),
})

type FormValues = z.infer<typeof formSchema>

export function ProductTypeForm({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', label: '', attributes: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'attributes' })

  async function onSubmit(values: FormValues) {
    setError(null)
    const attributeSchemaJson = values.attributes.map((a) => ({
      key: a.key,
      label: a.label,
      type: a.type,
      ...(a.type === 'select'
        ? { options: (a.options ?? '').split(',').map((o) => o.trim()).filter(Boolean) }
        : {}),
    }))

    const { error: insertError } = await supabase.from('product_types').insert({
      name: values.name,
      label: values.label,
      attribute_schema: attributeSchemaJson,
    })

    if (insertError) {
      setError(insertError.message)
      return
    }

    reset()
    setOpen(false)
    onCreated?.()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus /> Add Type
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add product type</DialogTitle>
          <DialogDescription>e.g. cycle, powerbank. Attributes are optional and drive filters/forms.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type-name">Internal name (slug)</Label>
            <Input id="type-name" placeholder="cycle" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type-label">Display label</Label>
            <Input id="type-label" placeholder="Cycle" {...register('label')} />
            {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Attributes (optional)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => append({ key: '', label: '', type: 'text', options: '' })}
              >
                <Plus /> Add attribute
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col gap-2 rounded-md border border-border p-2">
                <div className="flex gap-2">
                  <Input placeholder="key (e.g. gender)" {...register(`attributes.${index}.key`)} />
                  <Input placeholder="label (e.g. Gender)" {...register(`attributes.${index}.label`)} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  {...register(`attributes.${index}.type`)}
                >
                  <option value="text">Free text</option>
                  <option value="select">Choice (options)</option>
                </select>
                <Input placeholder="options, comma separated (e.g. ladies, mens)" {...register(`attributes.${index}.options`)} />
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Create type'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Re-exported for the product form's type select.
export function ProductTypeSelectField({
  value,
  onChange,
  productTypes,
}: {
  value: string
  onChange: (v: string) => void
  productTypes: { id: string; label: string }[]
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a type" />
      </SelectTrigger>
      <SelectContent>
        {productTypes.map((pt) => (
          <SelectItem key={pt.id} value={pt.id}>
            {pt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
