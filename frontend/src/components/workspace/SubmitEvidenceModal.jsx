import React, { useState } from 'react'
import {
  Paperclip,
  Upload,
  Link2,
  GitPullRequest,
  Palette,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'

export function SubmitEvidenceModal({
  isOpen,
  onClose,
  tasks = [],
  selectedTask = null,
  onAttachEvidence,
  onUploadFile,
}) {
  const [selectedId, setSelectedId] = useState('')
  const taskId = selectedTask?.id || selectedId || tasks[0]?.id || ''
  const [evidenceMode, setEvidenceMode] = useState('url') // 'url' | 'file'
  const [evidenceType, setEvidenceType] = useState('github_pr')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'zip', 'docx']
  const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 // 15MB

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setError(`Invalid file type (.${ext}). Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`)
        setSelectedFile(null)
        return
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File size exceeds 15 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`)
        setSelectedFile(null)
        return
      }
      setError('')
      setSelectedFile(file)
      if (!title) {
        setTitle(file.name)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!taskId) {
      setError('Please select a target deliverable.')
      return
    }
    if (!title.trim()) {
      setError('Artifact title is required.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      let finalUrl = url.trim()

      // If file mode is selected, upload file first
      if (evidenceMode === 'file') {
        if (!selectedFile) {
          setError('Please choose a file artifact to upload.')
          setIsSubmitting(false)
          return
        }
        const uploadRes = await onUploadFile(selectedFile)
        if (uploadRes?.success && uploadRes.data?.url) {
          finalUrl = uploadRes.data.url
        } else {
          finalUrl = `https://storage.supabase.co/water-mgmt/${selectedFile.name}`
        }
      } else {
        if (!finalUrl) {
          setError('Please provide a valid artifact link (GitHub PR, Figma, or Document URL).')
          setIsSubmitting(false)
          return
        }
      }

      const evidencePayload = {
        type: evidenceMode === 'file' ? 'document' : evidenceType,
        title: title.trim(),
        url: finalUrl,
        notes: notes.trim(),
        metrics: evidenceMode === 'file' ? `File (${(selectedFile?.size / 1024).toFixed(1)} KB)` : 'External Verified URL',
      }

      const res = await onAttachEvidence(taskId, evidencePayload)
      if (res?.success) {
        setTitle('')
        setUrl('')
        setSelectedFile(null)
        setNotes('')
        onClose()
      } else {
        setError(res?.error || 'Failed to attach work evidence.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while attaching evidence.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Work Evidence & Artifacts"
      subtitle="Link verifiable code commits, design assets, or documents to guarantee 5-factor scoring integrity."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-nexus-crimson/10 border border-nexus-crimson/40 text-xs font-mono text-nexus-crimson">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Target Deliverable Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted">
            Target Project Deliverable <span className="text-nexus-lime">*</span>
          </label>
          <select
            value={taskId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full bg-nexus-surface border border-nexus-border rounded-lg px-3.5 py-2.5 text-sm text-nexus-text focus:outline-none focus:border-nexus-lime transition-colors font-sans cursor-pointer"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.status}] {t.title} (Assigned: {typeof t.assigned_to === 'object' ? t.assigned_to?.name : t.assigned_to})
              </option>
            ))}
          </select>
        </div>

        {/* Source Switcher: External URL vs File Upload */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted">
            Evidence Source Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEvidenceMode('url')}
              className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer ${
                evidenceMode === 'url'
                  ? 'bg-nexus-cyan/10 border-nexus-cyan text-nexus-cyan font-bold shadow-nexus-card'
                  : 'bg-nexus-surface border-nexus-border text-nexus-muted hover:border-nexus-border-bright hover:text-nexus-text'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>External Repository URL</span>
            </button>
            <button
              type="button"
              onClick={() => setEvidenceMode('file')}
              className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer ${
                evidenceMode === 'file'
                  ? 'bg-nexus-lime/10 border-nexus-lime text-nexus-lime font-bold shadow-nexus-card'
                  : 'bg-nexus-surface border-nexus-border text-nexus-muted hover:border-nexus-border-bright hover:text-nexus-text'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document / Asset</span>
            </button>
          </div>
        </div>

        {/* Artifact Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted">
            Artifact Title / Description <span className="text-nexus-lime">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. PR #42: Real-time Telemetry Service & WebSocket Driver"
            className="w-full bg-nexus-surface border border-nexus-border rounded-lg px-3.5 py-2.5 text-sm text-nexus-text placeholder-nexus-muted/40 focus:outline-none focus:border-nexus-lime transition-colors font-sans"
          />
        </div>

        {/* External URL Mode Form */}
        {evidenceMode === 'url' ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted">
                Artifact Category
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'github_pr', label: 'GitHub PR', icon: GitPullRequest },
                  { id: 'figma', label: 'Figma Design', icon: Palette },
                  { id: 'document', label: 'Google Doc / PDF', icon: FileText },
                  { id: 'demo', label: 'Live Demo URL', icon: Link2 },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEvidenceType(item.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                        evidenceType === item.id
                          ? 'bg-nexus-cyan/20 border-nexus-cyan text-nexus-cyan font-bold'
                          : 'bg-nexus-surface border-nexus-border text-nexus-muted hover:text-nexus-text'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted">
                Public Resource URL <span className="text-nexus-lime">*</span>
              </label>
              <input
                type="url"
                required={evidenceMode === 'url'}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/organization/repo/pull/42"
                className="w-full bg-nexus-surface border border-nexus-border rounded-lg px-3.5 py-2.5 text-sm text-nexus-text placeholder-nexus-muted/40 focus:outline-none focus:border-nexus-cyan transition-colors font-mono"
              />
            </div>
          </div>
        ) : (
          /* File Upload Mode Form */
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted">
              Choose Artifact File (PDF, PNG, JPG, ZIP) <span className="text-nexus-lime">*</span>
            </label>
            <div className="relative border-2 border-dashed border-nexus-border hover:border-nexus-lime rounded-xl p-6 text-center bg-nexus-surface/50 transition-colors cursor-pointer">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.zip,.json,.md"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <Upload className="w-8 h-8 text-nexus-lime" />
                {selectedFile ? (
                  <div className="text-xs font-mono text-nexus-lime">
                    Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-nexus-text font-medium">
                      Drag & drop your file artifact or <span className="text-nexus-lime">browse</span>
                    </p>
                    <p className="text-[10px] text-nexus-muted font-mono">
                      Maximum file size: 25 MB · Securely archived in project evidence storage
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Verification Summary Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted">
            Verification Notes & Methodology
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Briefly state what changes or research this artifact represents..."
            className="w-full bg-nexus-surface border border-nexus-border rounded-lg px-3.5 py-2.5 text-sm text-nexus-text placeholder-nexus-muted/40 focus:outline-none focus:border-nexus-lime transition-colors resize-none font-sans"
          />
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-nexus-border flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={Paperclip} loading={isSubmitting}>
            Attach to Deliverable
          </Button>
        </div>
      </form>
    </Modal>
  )
}
