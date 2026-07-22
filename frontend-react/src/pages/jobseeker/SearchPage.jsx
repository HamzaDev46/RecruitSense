import { useEffect, useMemo, useState } from 'react'
import { Briefcase, Eye, FileText, MessageCircle, Search, Users } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/jobseeker/DashboardLayout'
import api from '../../services/api'

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'people', label: 'People' },
  { id: 'posts', label: 'Posts' },
]

const emptyResults = {
  jobs: [],
  people: [],
  posts: [],
  counts: { jobs: 0, people: 0, posts: 0 },
}

const initials = (name = 'User') => name
  .split(' ')
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

const skillList = (skills = '') => skills
  .split(',')
  .map((skill) => skill.trim())
  .filter(Boolean)
  .slice(0, 4)

const EmptyState = ({ query }) => (
  <div className="bg-white border border-dashed border-gray-200 rounded-lg p-10 text-center">
    <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
    <h2 className="font-bold text-gray-900">{query ? 'No results found' : 'Search RecruitSense'}</h2>
    <p className="text-sm text-gray-500 mt-1">
      {query ? 'Try another keyword, skill, company, or person name.' : 'Find jobs, people, profiles, and posts from one place.'}
    </p>
  </div>
)

const SearchPageContent = ({ initialQuery }) => {
  const navigate = useNavigate()
  const [, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(() => initialQuery.trim().length >= 2)
  const [results, setResults] = useState(emptyResults)

  useEffect(() => {
    const trimmed = initialQuery.trim()

    if (trimmed.length < 2) {
      return undefined
    }

    let active = true

    api.get('/search/global', { params: { query: trimmed } })
      .then((res) => {
        if (!active) return
        setResults({
          jobs: res.data.jobs || [],
          people: res.data.people || [],
          posts: res.data.posts || [],
          counts: res.data.counts || { jobs: 0, people: 0, posts: 0 },
        })
      })
      .catch((err) => {
        if (active) toast.error(err.response?.data?.message || 'Failed to search')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [initialQuery])

  const totalCount = useMemo(
    () => Number(results.counts.jobs || 0) + Number(results.counts.people || 0) + Number(results.counts.posts || 0),
    [results.counts]
  )

  const submitSearch = (event) => {
    event.preventDefault()
    const trimmed = query.trim()

    if (!trimmed) {
      setSearchParams({})
      return
    }

    setSearchParams({ q: trimmed })
  }

  const shouldShow = (section) => activeTab === 'all' || activeTab === section

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Search</h1>
          <p className="text-sm text-gray-500 mt-1">Find jobs, people, and posts across RecruitSense.</p>
        </div>

        <form onSubmit={submitSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search jobs, people, skills, companies, posts..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-32 bg-white border border-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : totalCount === 0 ? (
          <EmptyState query={initialQuery.trim()} />
        ) : (
          <div className="space-y-6">
            {shouldShow('jobs') && results.jobs.length > 0 && (
              <section className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-bold text-gray-900">Jobs</h2>
                  <span className="text-sm text-gray-400">({results.jobs.length})</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.jobs.map((job) => (
                    <div key={job.id} className="p-5 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{job.company?.name || 'Company'} {job.company?.industry ? `- ${job.company.industry}` : ''}</p>
                        <p className="text-sm text-gray-600 mt-3 line-clamp-2">{job.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {skillList(job.required_skills).map((skill) => (
                            <span key={skill} className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="shrink-0 px-4 py-2 rounded-full border border-indigo-200 text-indigo-700 text-sm font-semibold hover:bg-indigo-50"
                      >
                        View job
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {shouldShow('people') && results.people.length > 0 && (
              <section className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-bold text-gray-900">People</h2>
                  <span className="text-sm text-gray-400">({results.people.length})</span>
                </div>
                <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                  {results.people.map((person) => (
                    <div key={person.id} className="p-5 flex items-start gap-3">
                      {person.profile_image_url ? (
                        <img src={person.profile_image_url} alt={person.name} className="w-12 h-12 rounded-full object-cover object-top border border-gray-100" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold">
                          {initials(person.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 truncate">{person.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{person.headline || person.company || 'RecruitSense member'}</p>
                        <button
                          type="button"
                          onClick={() => navigate(`/profile/${person.id}`)}
                          className="mt-3 px-3 py-1.5 rounded-full border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-50"
                        >
                          View profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {shouldShow('posts') && results.posts.length > 0 && (
              <section className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-bold text-gray-900">Posts</h2>
                  <span className="text-sm text-gray-400">({results.posts.length})</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.posts.map((post) => (
                    <div key={post.id} className="p-5">
                      <button
                        type="button"
                        onClick={() => post.author?.id && navigate(`/profile/${post.author.id}`)}
                        className="flex items-center gap-3 text-left"
                      >
                        {post.author?.profile_image_url ? (
                          <img
                            src={post.author.profile_image_url}
                            alt={post.author.name || 'Post author'}
                            className="w-10 h-10 rounded-full object-cover object-top border border-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                            {initials(post.author?.name)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900">{post.author?.name || 'RecruitSense member'}</p>
                          <p className="text-xs text-gray-500">{post.author?.headline || post.author?.company || 'Post author'}</p>
                        </div>
                      </button>
                      <p className="text-sm text-gray-700 mt-4 whitespace-pre-wrap">{post.body}</p>
                      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.impressions_count}</span>
                        <span>{post.likes_count} likes</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {post.comments_count}</span>
                        {post.media_count > 0 && <span>{post.media_count} media</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

const SearchPage = () => {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  return <SearchPageContent key={initialQuery} initialQuery={initialQuery} />
}

export default SearchPage
