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
import type { ProductType } from '@/hooks/useProductTypes'
import { supabase } from '@/lib/supabaseClient'
import { notifyWithUndo } from '@/lib/toastActions'

const attributeSchema = z.object({
  key: z.string().min(1, 'Required'),
  label: z.string().min(1, 'Required'),
  type: z.enum(['text', 'select']),
  options: z.string().optional(),
})

const formSchema = z.object({
  label: z.string().min(1, 'Required'),
  attributes: z.array(attributeSchema),
})

type FormValues = z.infer<typeof formSchema>

function slugify(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function ProductTypeForm({
  productTypes,
  onCreated,
  onDeleted,
}: {
  productTypes: ProductType[]
  onCreated?: () => void
  onDeleted?: () => void
}) {
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
    defaultValues: { label: '', attributes: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'attributes' })

  async function onSubmit(values: FormValues) {
    setError(null)
    const name = slugify(values.label)
    if (!name) {
      setError('Product type needs at least one letter or number.')
      return
    }

    const attributeSchemaJson = values.attributes.map((a) => ({
      key: a.key,
      label: a.label,
      type: a.type,
      ...(a.type === 'select'
        ? { options: (a.options ?? '').split(',').map((o) => o.trim()).filter(Boolean) }
        : {}),
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('product_types')
      .insert({ name, label: values.label, attribute_schema: attributeSchemaJson })
      .select('id')
      .single()

    if (insertError || !inserted) {
      setError(
        insertError?.code === '23505' ? 'A product type with this name already exists.' : (insertError?.message ?? 'Something went wrong'),
      )
      return
    }

    reset()
    onCreated?.()
    notifyWithUndo(`${values.label} added`, async () => {
      await supabase.from('product_types').delete().eq('id', inserted.id)
      onDeleted?.()
    })
  }

  async function handleDeleteType(type: ProductType) {
    await supabase.from('product_types').update({ deleted_at: new Date().toISOString() }).eq('id', type.id)
    onDeleted?.()
    notifyWithUndo(`${type.label} removed`, async () => {
      await supabase.from('product_types').update({ deleted_at: null }).eq('id', type.id)
      onDeleted?.()
    })
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
          <DialogTitle>Product types</DialogTitle>
          <DialogDescription>e.g. cycle, powerbank. Attributes are optional and drive filters/forms.</DialogDescription>
        </DialogHeader>

        {productTypes.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>Existing types</Label>
            <div className="flex flex-col gap-1.5">
              {productTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between rounded-md border border-border px-3 py-1.5">
                  <span className="text-sm">{type.label}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteType(type)}>
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type-label">Add a new type</Label>
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
