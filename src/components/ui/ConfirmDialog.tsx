import { AlertTriangle, X } from 'lucide-react'

interface Props {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title, description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm, onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            variant === 'danger' ? 'bg-red-100' : 'bg-amber-100'
          }`}>
            <AlertTriangle size={20} className={variant === 'danger' ? 'text-red-600' : 'text-amber-600'} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 shrink-0">
            <X size={18} />
          </button>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
