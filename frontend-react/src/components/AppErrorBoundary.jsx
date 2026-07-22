import { Component } from 'react'

class AppErrorBoundary extends Component {
  state = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('RecruitSense page crashed:', error)
  }

  reloadPage = () => {
    window.location.reload()
  }

  goToDashboard = () => {
    window.location.href = '/dashboard'
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 h-11 w-11 rounded-full border-[3px] border-gray-300 border-t-gray-700 animate-spin" />
          <h1 className="text-xl font-bold text-gray-900">Page could not open</h1>
          <p className="mt-2 text-sm text-gray-500">
            Something failed while loading this page. Refresh usually fixes a stale browser chunk.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={this.reloadPage}
              className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={this.goToDashboard}
              className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default AppErrorBoundary
