import { toast } from 'sonner'

export function notifyWithUndo(message: string, undo: () => Promise<void> | void) {
  toast(message, {
    action: {
      label: 'Undo',
      onClick: () => {
        void Promise.resolve(undo()).catch(() => toast.error("Couldn't undo that."))
      },
    },
  })
}
