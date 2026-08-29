import { MessageCircle, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAuth } from '@/lib/auth'
import { notifyWithUndo } from '@/lib/toastActions'
import { createNote, restoreNote, softDeleteNote, useNotes } from '@/hooks/useNotes'

export function NotesBubble() {
  const { coordinator } = useAuth()
  const { notes, refresh } = useNotes()
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = coordinator?.role === 'admin'

  async function handleAdd() {
    if (!body.trim()) return
    setSubmitting(true)
    const { error } = await createNote(body.trim())
    setSubmitting(false)
    if (!error) setBody('')
  }

  async function handleDelete(noteId: string) {
    await softDeleteNote(noteId)
    refresh()
    notifyWithUndo('Note removed', async () => {
      await restoreNote(noteId)
      refresh()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-emerald-700 sm:bottom-4"
        title="Team notes"
      >
        <MessageCircle className="size-5" />
        {notes.length > 0 && (
          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white">
            {notes.length}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Team notes</SheetTitle>
            <SheetDescription>Visible to every coordinator. You can remove your own; admins can remove any.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
            {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
            {notes.map((note) => {
              const canDelete = isAdmin || note.coordinator_id === coordinator?.id
              return (
                <div key={note.id} className="flex flex-col gap-1 rounded-lg bg-muted p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        {note.author_name ?? 'Unknown'} · {new Date(note.created_at).toLocaleString()}
                      </p>
                      <p className="whitespace-pre-wrap">{note.body}</p>
                    </div>
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={() => handleDelete(note.id)}>
                        <Trash2 className="size-3.5 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-2 border-t border-border p-4">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleAdd()
                }
              }}
              placeholder="Leave a note for the team…"
              rows={2}
              className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button size="sm" disabled={submitting || !body.trim()} onClick={handleAdd} className="self-end">
              Post
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
