import { useEffect, useMemo, useState } from 'react'
import {
  Brain,
  CheckCircle2,
  Edit3,
  Eye,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import CompanyLayout from '../../components/company/CompanyLayout'
import api from '../../services/api'

const emptyForm = {
  category: 'Communication',
  question_text: '',
  options: ['', '', '', ''],
  correct_answer: '',
}

const defaultCategories = [
  'Communication',
  'Teamwork',
  'Problem solving',
  'Leadership',
  'Adaptability',
]

const cleanOptions = (options) => options
  .map((option) => option.trim())
  .filter(Boolean)

const formatDate = (value) => {
  if (!value) return 'Recently'

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const CompanyQuiz = () => {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [form, setForm] = useState(emptyForm)
  const [generator, setGenerator] = useState({
    category: 'Communication',
    count: 5,
  })
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [deleteQuestion, setDeleteQuestion] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    let active = true

    api.get('/my-quiz-questions')
      .then((res) => {
        if (active) setQuestions(res.data || [])
      })
      .catch((err) => {
        if (active) toast.error(err.response?.data?.message || 'Failed to load quiz questions')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const categories = useMemo(() => {
    const existing = questions.map((question) => question.category).filter(Boolean)
    return ['all', ...Array.from(new Set([...defaultCategories, ...existing]))]
  }, [questions])

  const formCategories = useMemo(() => categories.filter((category) => category !== 'all'), [categories])

  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase()

    return questions.filter((question) => {
      const matchesCategory = categoryFilter === 'all' || question.category === categoryFilter
      const matchesSearch = !query || [
        question.category,
        question.question_text,
        ...(Array.isArray(question.options) ? question.options : []),
      ].some((value) => String(value || '').toLowerCase().includes(query))

      return matchesCategory && matchesSearch
    })
  }, [categoryFilter, questions, search])

  const stats = useMemo(() => {
    const categoryCount = new Set(questions.map((question) => question.category).filter(Boolean)).size
    const responseCount = questions.reduce((sum, question) => sum + Number(question.responses_count || 0), 0)

    return {
      total: questions.length,
      categories: categoryCount,
      responses: responseCount,
      visible: filteredQuestions.length,
    }
  }, [filteredQuestions.length, questions])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingQuestion(null)
  }

  const openEdit = (question) => {
    const options = Array.isArray(question.options) ? question.options : []
    setEditingQuestion(question)
    setForm({
      category: question.category || 'Communication',
      question_text: question.question_text || '',
      options: [...options, '', '', '', ''].slice(0, Math.max(4, options.length)),
      correct_answer: question.correct_answer || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleGeneratorChange = (event) => {
    const { name, value } = event.target
    setGenerator((current) => ({
      ...current,
      [name]: name === 'count' ? Number(value) : value,
    }))
  }

  const updateOption = (index, value) => {
    setForm((current) => {
      const options = [...current.options]
      const previousValue = options[index]
      options[index] = value

      return {
        ...current,
        options,
        correct_answer: current.correct_answer === previousValue ? value : current.correct_answer,
      }
    })
  }

  const addOption = () => {
    setForm((current) => ({
      ...current,
      options: current.options.length >= 6 ? current.options : [...current.options, ''],
    }))
  }

  const removeOption = (index) => {
    setForm((current) => {
      const removed = current.options[index]
      const options = current.options.filter((_, optionIndex) => optionIndex !== index)

      return {
        ...current,
        options: options.length >= 2 ? options : current.options,
        correct_answer: current.correct_answer === removed ? '' : current.correct_answer,
      }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const options = cleanOptions(form.options)
    const payload = {
      category: form.category.trim(),
      question_text: form.question_text.trim(),
      options,
      correct_answer: form.correct_answer.trim(),
    }

    if (!payload.category || !payload.question_text) {
      toast.error('Add category and question text')
      return
    }

    if (payload.options.length < 2) {
      toast.error('Add at least two options')
      return
    }

    if (!payload.options.includes(payload.correct_answer)) {
      toast.error('Select the correct answer from the options')
      return
    }

    setSaving(true)
    try {
      if (editingQuestion) {
        const res = await api.put(`/quiz-questions/${editingQuestion.id}`, payload)
        setQuestions((current) => current.map((question) => (
          question.id === editingQuestion.id ? res.data.question : question
        )))
        toast.success('Quiz question updated')
      } else {
        const res = await api.post('/quiz-questions', payload)
        setQuestions((current) => [res.data.question, ...current])
        toast.success('Quiz question added')
      }

      resetForm()
    } catch (err) {
      const errors = err.response?.data?.errors
      const firstError = errors ? Object.values(errors).flat()[0] : null
      toast.error(firstError || err.response?.data?.message || 'Failed to save quiz question')
    } finally {
      setSaving(false)
    }
  }

  const generateQuestions = async () => {
    setGenerating(true)
    try {
      const res = await api.post('/quiz-questions/generate', generator)
      const generatedQuestions = res.data.questions || []

      setQuestions((current) => {
        const existingIds = new Set(current.map((question) => question.id))
        return [
          ...generatedQuestions.filter((question) => !existingIds.has(question.id)),
          ...current,
        ]
      })
      setCategoryFilter(generator.category)
      const sourceLabel = res.data.source === 'openai' ? 'OpenAI' : 'fallback bank'
      toast.success(res.data.message || `${generatedQuestions.length} questions generated from ${sourceLabel}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate quiz questions')
    } finally {
      setGenerating(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteQuestion) return

    setDeleting(true)
    try {
      await api.delete(`/quiz-questions/${deleteQuestion.id}`)
      setQuestions((current) => current.filter((question) => question.id !== deleteQuestion.id))
      setDeleteQuestion(null)
      if (editingQuestion?.id === deleteQuestion.id) resetForm()
      toast.success('Quiz question deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete question')
    } finally {
      setDeleting(false)
    }
  }

  const previewQuestions = categoryFilter === 'all' ? questions : filteredQuestions

  return (
    <CompanyLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quiz Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage soft-skill questions used in application scoring.</p>
          </div>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            disabled={questions.length === 0}
            className="h-11 px-4 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview quiz
          </button>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase text-gray-400">Questions</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '-' : stats.total}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase text-indigo-600">Categories</p>
            <p className="text-2xl font-bold text-indigo-600 mt-2">{loading ? '-' : stats.categories}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase text-emerald-600">Responses</p>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{loading ? '-' : stats.responses}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase text-amber-600">Visible</p>
            <p className="text-2xl font-bold text-amber-600 mt-2">{loading ? '-' : stats.visible}</p>
          </div>
        </div>

        <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 mb-5">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Auto-generate quiz</h2>
                <p className="text-sm text-gray-500 mt-1">Create a ready MCQ batch for one category.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-[minmax(180px,1fr)_120px_auto] gap-2 xl:w-[620px]">
              <select
                name="category"
                value={generator.category}
                onChange={handleGeneratorChange}
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {formCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                name="count"
                value={generator.count}
                onChange={handleGeneratorChange}
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
              <button
                type="button"
                disabled={generating}
                onClick={generateQuestions}
                className="h-11 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate
              </button>
            </div>
          </div>
        </section>

        <div className="grid xl:grid-cols-5 gap-5">
          <section className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-bold text-gray-900">{editingQuestion ? 'Edit question' : 'Add question'}</h2>
                <p className="text-sm text-gray-500 mt-1">Questions are grouped by category.</p>
              </div>
              {editingQuestion && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Cancel editing"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleFieldChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  {formCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Question</label>
                <textarea
                  name="question_text"
                  value={form.question_text}
                  onChange={handleFieldChange}
                  rows={4}
                  placeholder="How would you handle a conflict with a teammate?"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-y"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className="text-sm font-semibold text-gray-700">Options</label>
                  <button
                    type="button"
                    onClick={addOption}
                    disabled={form.options.length >= 6}
                    className="text-xs font-semibold text-indigo-600 disabled:text-gray-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add option
                  </button>
                </div>

                <div className="space-y-2">
                  {form.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        value={option}
                        onChange={(event) => updateOption(index, event.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, correct_answer: option }))}
                        disabled={!option.trim()}
                        className={`h-10 px-3 rounded-xl border text-xs font-semibold disabled:opacity-40 ${
                          form.correct_answer === option && option.trim()
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-200'
                        }`}
                      >
                        Correct
                      </button>
                      {form.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="w-10 h-10 rounded-xl border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center"
                          aria-label="Remove option"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full h-11 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingQuestion ? 'Save changes' : 'Add question'}
              </button>
            </form>
          </section>

          <section className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search questions, categories, options..."
                    className="w-full rounded-xl border border-gray-200 pl-12 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All categories' : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-10 text-center">
                <Brain className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                <h2 className="font-bold text-gray-900">No quiz questions found</h2>
                <p className="text-sm text-gray-500 mt-1">Add questions for candidates to complete after applying.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredQuestions.map((question, index) => (
                  <article key={question.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold">
                            {question.category || 'General'}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100 text-xs font-semibold">
                            {question.responses_count || 0} responses
                          </span>
                          <span className="text-xs text-gray-400">Updated {formatDate(question.updated_at)}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 leading-snug">
                          {index + 1}. {question.question_text}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(question)}
                          className="w-10 h-10 rounded-full border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center"
                          aria-label="Edit question"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteQuestion(question)}
                          className="w-10 h-10 rounded-full border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 flex items-center justify-center"
                          aria-label="Delete question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid sm:grid-cols-2 gap-2">
                      {(Array.isArray(question.options) ? question.options : []).map((option) => {
                        const correct = option === question.correct_answer

                        return (
                          <div
                            key={option}
                            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold flex items-center justify-between gap-2 ${
                              correct
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-white text-gray-600 border-gray-200'
                            }`}
                          >
                            <span>{option}</span>
                            {correct && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                          </div>
                        )
                      })}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/45 flex items-center justify-center px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl max-h-[88vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Quiz Preview</h2>
                <p className="text-sm text-gray-500 mt-1">{previewQuestions.length} questions</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              {previewQuestions.length === 0 ? (
                <div className="py-12 text-center">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900">No questions to preview</p>
                </div>
              ) : (
                previewQuestions.map((question, index) => (
                  <div key={question.id} className="rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase text-indigo-600">{question.category}</span>
                        <h3 className="font-bold text-gray-900 mt-1">{question.question_text}</h3>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {(Array.isArray(question.options) ? question.options : []).map((option) => (
                        <div
                          key={option}
                          className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                            option === question.correct_answer
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-50 text-gray-600 border-gray-100'
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {deleteQuestion && (
        <div className="fixed inset-0 z-50 bg-gray-900/45 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Delete question?</h2>
                <p className="text-sm text-gray-500 mt-1">{deleteQuestion.category}</p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteQuestion(null)}
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center"
                aria-label="Close delete confirmation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 leading-relaxed">
                Deleting this question also removes saved responses linked to it.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteQuestion(null)}
                  className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={confirmDelete}
                  className="h-10 px-4 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CompanyLayout>
  )
}

export default CompanyQuiz
