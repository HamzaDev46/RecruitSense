import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  Camera,
  Globe2,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Upload,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import CompanyLayout from '../../components/company/CompanyLayout'
import { useAuth } from '../../context/useAuth'
import api from '../../services/api'

const emptyForm = {
  name: '',
  industry: '',
  description: '',
  website: '',
  location: '',
  phone: '',
  contact_email: '',
  company_size: '',
  founded_year: '',
}

const companySizes = [
  '',
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees',
]

const buildForm = (company = {}) => ({
  name: company.name || '',
  industry: company.industry || '',
  description: company.description || '',
  website: company.website || '',
  location: company.location || '',
  phone: company.phone || '',
  contact_email: company.contact_email || '',
  company_size: company.company_size || '',
  founded_year: company.founded_year || '',
})

const completionFields = [
  'name',
  'industry',
  'description',
  'website',
  'location',
  'contact_email',
  'company_size',
]

const CompanySettings = () => {
  const { updateUser } = useAuth()
  const [company, setCompany] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [files, setFiles] = useState({ logo: null, cover_image: null })
  const [previews, setPreviews] = useState({ logo: null, cover: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    api.get('/company/profile')
      .then((res) => {
        if (!active) return
        setCompany(res.data)
        setForm(buildForm(res.data))
        setPreviews({
          logo: res.data.logo_url || null,
          cover: res.data.cover_image_url || null,
        })
      })
      .catch((err) => {
        if (active) toast.error(err.response?.data?.message || 'Failed to load company profile')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const completion = useMemo(() => {
    const filled = completionFields.filter((field) => String(form[field] || '').trim()).length
    const media = previews.logo ? 1 : 0
    return Math.round(((filled + media) / (completionFields.length + 1)) * 100)
  }, [form, previews.logo])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleFile = (event, field) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setFiles((current) => ({ ...current, [field]: file }))
    setPreviews((current) => ({
      ...current,
      [field === 'logo' ? 'logo' : 'cover']: URL.createObjectURL(file),
    }))
  }

  const saveProfile = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error('Company name is required')
      return
    }

    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => formData.append(key, value || ''))
    if (files.logo) formData.append('logo', files.logo)
    if (files.cover_image) formData.append('cover_image', files.cover_image)

    setSaving(true)
    try {
      const res = await api.post('/company/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setCompany(res.data.company)
      setForm(buildForm(res.data.company))
      setFiles({ logo: null, cover_image: null })
      setPreviews({
        logo: res.data.company.logo_url || null,
        cover: res.data.company.cover_image_url || null,
      })
      updateUser?.({ name: res.data.user?.name || res.data.company.name })
      window.dispatchEvent(new CustomEvent('recruitsense-company-profile-updated', {
        detail: { company: res.data.company },
      }))
      toast.success('Company profile updated')
    } catch (err) {
      const errors = err.response?.data?.errors
      const firstError = errors ? Object.values(errors).flat()[0] : null
      toast.error(firstError || err.response?.data?.message || 'Failed to update company profile')
    } finally {
      setSaving(false)
    }
  }

  const initials = (form.name || company?.name || 'Company')
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <CompanyLayout>
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Keep your company identity and applicant contact details current.</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
            <p className="text-xs font-bold uppercase text-gray-400">Profile completion</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-2 w-36 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${completion}%` }} />
              </div>
              <span className="text-sm font-bold text-gray-900">{completion}%</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 flex items-center justify-center">
            <LoaderCircle className="w-7 h-7 animate-spin text-indigo-600" />
          </div>
        ) : (
          <form onSubmit={saveProfile} className="grid xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
            <aside className="space-y-4">
              <section className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                <div
                  className="h-32 bg-gradient-to-r from-indigo-50 to-sky-50 bg-cover bg-center"
                  style={previews.cover ? { backgroundImage: `url(${previews.cover})` } : undefined}
                />
                <div className="px-5 pb-5">
                  <div className="-mt-12 flex items-end justify-between gap-3">
                    <div className="w-24 h-24 rounded-2xl border-4 border-white bg-gradient-to-r from-indigo-500 to-purple-600 overflow-hidden flex items-center justify-center text-white text-2xl font-bold shadow-sm">
                      {previews.logo ? (
                        <img src={previews.logo} alt="Company logo" className="w-full h-full object-cover" />
                      ) : initials}
                    </div>
                    <label className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-indigo-200 flex items-center gap-2 cursor-pointer">
                      <Camera className="w-4 h-4" />
                      Logo
                      <input type="file" accept="image/*" className="hidden" onChange={(event) => handleFile(event, 'logo')} />
                    </label>
                  </div>

                  <h2 className="mt-4 text-xl font-bold text-gray-900">{form.name || 'Company name'}</h2>
                  <p className="text-sm text-gray-500">{form.industry || 'Add industry'}</p>

                  <label className="mt-4 h-11 w-full rounded-xl border border-dashed border-gray-300 text-sm font-semibold text-gray-600 hover:border-indigo-300 hover:text-indigo-700 flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Upload cover image
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => handleFile(event, 'cover_image')} />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-5">
                <h2 className="font-bold text-gray-900">Public Preview</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span>{form.industry || 'Industry not set'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{form.location || 'Location not set'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{form.contact_email || 'Contact email not set'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{form.company_size || 'Company size not set'}</span>
                  </div>
                </div>
              </section>
            </aside>

            <section className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-gray-900">Company profile</h2>
                  <p className="text-sm text-gray-500 mt-1">This information appears with jobs and applicants.</p>
                </div>
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>

              <div className="p-5 grid sm:grid-cols-2 gap-4">
                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold text-gray-700">Company name</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    placeholder="Bright Future Pvt Ltd"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-gray-700">Industry</span>
                  <input
                    name="industry"
                    value={form.industry}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    placeholder="Software, HR, Education..."
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-gray-700">Company size</span>
                  <select
                    name="company_size"
                    value={form.company_size}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    {companySizes.map((size) => (
                      <option key={size || 'empty'} value={size}>{size || 'Select size'}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="text-sm font-semibold text-gray-700">Contact email</span>
                  <div className="mt-2 relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="contact_email"
                      type="email"
                      value={form.contact_email}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-200 pl-11 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="hr@company.com"
                    />
                  </div>
                </label>

                <label>
                  <span className="text-sm font-semibold text-gray-700">Phone</span>
                  <div className="mt-2 relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-200 pl-11 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="+92 300 0000000"
                    />
                  </div>
                </label>

                <label>
                  <span className="text-sm font-semibold text-gray-700">Website</span>
                  <div className="mt-2 relative">
                    <Globe2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-200 pl-11 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="https://company.com"
                    />
                  </div>
                </label>

                <label>
                  <span className="text-sm font-semibold text-gray-700">Founded year</span>
                  <input
                    name="founded_year"
                    type="number"
                    min="1800"
                    max="2100"
                    value={form.founded_year}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    placeholder="2020"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold text-gray-700">Location</span>
                  <div className="mt-2 relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-200 pl-11 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Chakwal, Punjab"
                    />
                  </div>
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold text-gray-700">About company</span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={6}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                    placeholder="Write a short company overview, culture, hiring focus, and work environment."
                  />
                </label>
              </div>

              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:justify-end gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 px-5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save company profile
                </button>
              </div>
            </section>
          </form>
        )}
      </div>
    </CompanyLayout>
  )
}

export default CompanySettings
