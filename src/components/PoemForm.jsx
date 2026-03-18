import { Plus, X } from 'lucide-react'
import { useState } from 'react'

function PoemForm({ onAddPoem, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.excerpt.trim()) newErrors.excerpt = 'Excerpt is required'
    if (!formData.content.trim()) newErrors.content = 'Poem content is required'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    setSubmitError('')

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    const newPoem = {
      title: formData.title.trim(),
      excerpt: formData.excerpt.trim(),
      content: formData.content.trim(),
      author: 'Srijan Dwivedi',
      date: new Date().toISOString().split('T')[0],
    }

    try {
      await onAddPoem(newPoem)
      setFormData({ title: '', excerpt: '', content: '' })
      onClose()
    } catch {
      setSubmitError('Could not save poem to Firebase. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/10 bg-brand-bg shadow-soft">
        <button
          type="button"
          onClick={onClose}
          className="sticky top-4 right-4 float-right rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label="Close form"
        >
          <X size={20} />
        </button>

        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white">Create a New Poem</h2>
          <p className="mt-2 text-sm text-brand-muted">Share your poetry with SrijanVerse</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-white">
                Poem Title
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter poem title"
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-brand-muted/60 transition-colors focus:border-brand-accent focus:outline-none"
              />
              {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="excerpt" className="block text-sm font-medium text-white">
                Excerpt (Preview)
              </label>
              <input
                id="excerpt"
                type="text"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                placeholder="Add a short excerpt to show on the card"
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-brand-muted/60 transition-colors focus:border-brand-accent focus:outline-none"
              />
              {errors.excerpt && <p className="mt-1 text-xs text-red-400">{errors.excerpt}</p>}
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-white">
                Full Poem
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Write the full poem here..."
                rows={8}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-brand-muted/60 transition-colors focus:border-brand-accent focus:outline-none"
              />
              {errors.content && <p className="mt-1 text-xs text-red-400">{errors.content}</p>}
            </div>

            {submitError && <p className="text-sm text-red-400">{submitError}</p>}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-brand-accent px-4 py-2 font-medium text-black transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Poem'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-medium text-white transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PoemForm
