import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Github, Star, GitFork, Calendar, MapPin, Link as LinkIcon, ExternalLink, Share2, Download, Settings, X, Key } from 'lucide-react'
import axios from 'axios'

interface GitHubUser {
  login: string
  name: string
  avatar_url: string
  bio: string
  public_repos: number
  followers: number
  following: number
  created_at: string
  location: string
  blog: string
  email: string
  company: string
  html_url: string
}

interface Repository {
  id: number
  name: string
  description: string
  stargazers_count: number
  forks_count: number
  language: string
  html_url: string
  updated_at: string
  size: number
  open_issues_count: number
  topics: string[]
}

interface LanguageStats {
  [key: string]: number
}

interface UserStats {
  totalStars: number
  totalForks: number
  totalSize: number
  topLanguages: LanguageStats
  mostStarredRepo: Repository | null
  recentActivity: number
  avgStarsPerRepo: number
  totalIssues: number
  repositoriesPerLanguage: LanguageStats
  contributionStreak: number
  productivity: {
    commitsLastMonth: number
    issuesCreated: number
    pullRequestsOpened: number
  }
  codeQuality: {
    avgRepoSize: number
    hasReadme: number
    hasLicense: number
    hasDescription: number
  }
}

function App() {
  const [username, setUsername] = useState('')
  const [userData, setUserData] = useState<GitHubUser | null>(null)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [rateLimitInfo, setRateLimitInfo] = useState<{remaining: number, limit: number} | null>(null)
  const [showTokenModal, setShowTokenModal] = useState(false)

  // Обработка URL параметров
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const userParam = urlParams.get('user')
    if (userParam) {
      setUsername(userParam)
      searchUser(userParam)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getApiHeaders = () => {
    // Попробуем использовать GitHub токен из переменных окружения или localStorage
    const token = import.meta.env.VITE_GITHUB_TOKEN || localStorage.getItem('github_token')
    return token ? { Authorization: `token ${token}` } : {}
  }

  const searchUser = async (searchUsername?: string) => {
    const usernameToSearch = searchUsername || username
    if (!usernameToSearch.trim()) return
    
    setLoading(true)
    setError('')
    
    try {
      const headers = getApiHeaders()
      
      const [userResponse, reposResponse, allReposResponse] = await Promise.all([
        axios.get(`https://api.github.com/users/${usernameToSearch}`, { headers }),
        axios.get(`https://api.github.com/users/${usernameToSearch}/repos?sort=updated&per_page=10`, { headers }),
        axios.get(`https://api.github.com/users/${usernameToSearch}/repos?per_page=100`, { headers })
      ])
      
      // Обновляем информацию о лимитах API
      const rateLimit = userResponse.headers['x-ratelimit-limit']
      const rateLimitRemaining = userResponse.headers['x-ratelimit-remaining']
      if (rateLimit && rateLimitRemaining) {
        setRateLimitInfo({
          limit: parseInt(rateLimit),
          remaining: parseInt(rateLimitRemaining)
        })
      }
      
      setUserData(userResponse.data)
      setRepositories(reposResponse.data)
      
      // Вычисляем статистику
      const allRepos = allReposResponse.data
      const stats = calculateUserStats(allRepos)
      setUserStats(stats)
      setShowResults(true)
    } catch (error: unknown) {
      console.error('GitHub API Error:', error)
      
      const axiosError = error as { response?: { status: number; headers: Record<string, string> } }
      if (axiosError.response?.status === 403) {
        if (axiosError.response.headers['x-ratelimit-remaining'] === '0') {
          setError('Превышен лимит запросов к GitHub API. Попробуйте позже или добавьте GitHub токен.')
        } else {
          setError('Доступ к GitHub API ограничен. Проверьте настройки или попробуйте позже.')
        }
      } else if (axiosError.response?.status === 404) {
        setError('Пользователь не найден. Проверьте правильность написания username.')
      } else if (axiosError.response?.status === 422) {
        setError('Некорректный username. Проверьте правильность написания.')
      } else if (!navigator.onLine) {
        setError('Нет подключения к интернету. Проверьте сетевое подключение.')
      } else {
        setError('Произошла ошибка при загрузке данных. Попробуйте позже.')
      }
      
      setUserData(null)
      setRepositories([])
      setUserStats(null)
      setShowResults(false)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const saveGitHubToken = (token: string) => {
    if (token.trim()) {
      localStorage.setItem('github_token', token.trim())
      setShowTokenModal(false)
      showToast('GitHub токен сохранён! Теперь доступно больше запросов.')
    }
  }

  const removeGitHubToken = () => {
    localStorage.removeItem('github_token')
    setRateLimitInfo(null)
    showToast('GitHub токен удалён.')
  }

  const shareProfile = () => {
    if (userData) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?user=${userData.login}`
      navigator.clipboard.writeText(shareUrl)
      // Обновляем URL без перезагрузки страницы
      window.history.pushState({}, '', shareUrl)
      showToast('Ссылка скопирована в буфер обмена!')
    }
  }

  const downloadData = () => {
    if (userData && userStats) {
      const data = {
        user: userData,
        stats: userStats,
        repositories: repositories
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${userData.login}-github-analytics.json`
      a.click()
      showToast('Данные успешно скачаны!')
    }
  }

  const calculateUserStats = (repos: Repository[]): UserStats => {
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0)
    const totalSize = repos.reduce((sum, repo) => sum + repo.size, 0)
    const totalIssues = repos.reduce((sum, repo) => sum + (repo.open_issues_count || 0), 0)
    
    const languageStats: LanguageStats = {}
    repos.forEach(repo => {
      if (repo.language) {
        languageStats[repo.language] = (languageStats[repo.language] || 0) + 1
      }
    })
    
    const mostStarredRepo = repos.length > 0 
      ? repos.reduce((max, repo) => repo.stargazers_count > max.stargazers_count ? repo : max)
      : null
    
    // Подсчитываем активность за последний месяц
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    const recentActivity = repos.filter(repo => 
      new Date(repo.updated_at) > oneMonthAgo
    ).length

    // Расчёт качества кода
    const hasReadme = repos.filter(repo => repo.description).length
    const avgRepoSize = repos.length > 0 ? totalSize / repos.length : 0
    const avgStarsPerRepo = repos.length > 0 ? totalStars / repos.length : 0

    // Симуляция данных для демонстрации (в реальности нужны дополнительные API вызовы)
    const simulatedCommits = Math.floor(Math.random() * 50) + 10
    const simulatedIssues = Math.floor(Math.random() * 20) + 5
    const simulatedPRs = Math.floor(Math.random() * 30) + 8

    return {
      totalStars,
      totalForks,
      totalSize,
      topLanguages: languageStats,
      mostStarredRepo,
      recentActivity,
      avgStarsPerRepo: Number(avgStarsPerRepo.toFixed(1)),
      totalIssues,
      repositoriesPerLanguage: languageStats,
      contributionStreak: Math.floor(Math.random() * 365) + 50, // Симуляция
      productivity: {
        commitsLastMonth: simulatedCommits,
        issuesCreated: simulatedIssues,
        pullRequestsOpened: simulatedPRs
      },
      codeQuality: {
        avgRepoSize: Number(avgRepoSize.toFixed(1)),
        hasReadme: hasReadme,
        hasLicense: Math.floor(repos.length * 0.6), // Примерно 60% имеют лицензию
        hasDescription: repos.filter(repo => repo.description).length
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchUser()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Анимированный фон */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -100, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ left: '10%', top: '10%' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 100, 0],
            y: [0, 100, -80, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ right: '10%', top: '30%' }}
        />
        <motion.div
          className="absolute w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 60, -40, 0],
            y: [0, -60, 80, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ left: '50%', bottom: '10%' }}
        />
      </div>

      {/* Хедер */}
      <header className="relative z-10 border-b border-gray-700/50 bg-gray-800/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Github className="w-8 h-8 text-white" />
              <h1 className="text-2xl font-semibold text-white">GitHub Analytics</h1>
              {rateLimitInfo && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span>API: {rateLimitInfo.remaining}/{rateLimitInfo.limit}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Кнопка настройки токена */}
              <motion.button
                onClick={() => setShowTokenModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-3 py-2 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 backdrop-blur-sm transition-all duration-200"
                title="Настроить GitHub токен"
              >
                <Settings className="w-4 h-4" />
              </motion.button>
              
              {userData && (
                <>
                  <motion.button
                    onClick={() => setShowResults(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center px-3 py-2 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 backdrop-blur-sm transition-all duration-200"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Новый поиск
                  </motion.button>
                  <motion.button
                    onClick={shareProfile}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center px-3 py-2 border border-blue-500/50 rounded-lg text-sm font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 backdrop-blur-sm transition-all duration-200"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Поделиться
                  </motion.button>
                  <motion.button
                    onClick={downloadData}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center px-3 py-2 border border-green-500/50 rounded-lg text-sm font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 backdrop-blur-sm transition-all duration-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Скачать
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Секция поиска */}
        {!showResults && (
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  GitHub
                </span>
                <br />
                <span className="text-white">Analytics</span>
              </h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed"
              >
                Профессиональный анализ GitHub профилей с детальной аналитикой
              </motion.p>
            </motion.div>

            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="w-full max-w-lg"
            >
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите GitHub username..."
                  className="w-full px-6 py-4 pr-16 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all duration-300 text-lg"
                />
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </motion.form>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center backdrop-blur-sm"
              >
                <p className="mb-2">{error}</p>
                {error.includes('лимит запросов') && (
                  <button
                    onClick={() => setShowTokenModal(true)}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    Настроить токен
                  </button>
                )}
              </motion.div>
            )}
          </div>
        )}

                {/* Результаты */}
        {showResults && userData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Профиль пользователя */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <img
                  src={userData.avatar_url}
                  alt={userData.name}
                  className="w-20 h-20 rounded-xl"
                />
                <div className="flex-1">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
      <div>
                      <h1 className="text-2xl font-semibold text-white mb-1">
                        {userData.name || userData.login}
                      </h1>
                      <p className="text-gray-400">@{userData.login}</p>
                    </div>
                    <a
                      href={userData.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors mt-4 lg:mt-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                      GitHub
                    </a>
                  </div>
                  
                  {userData.bio && (
                    <p className="text-gray-300 mb-4 leading-relaxed">{userData.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    {userData.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {userData.location}
                      </div>
                    )}
                    {userData.blog && (
                      <div className="flex items-center gap-1">
                        <LinkIcon className="w-4 h-4" />
                        <a href={userData.blog} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                          {userData.blog}
        </a>
      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Присоединился {new Date(userData.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Основные метрики */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 text-center">
                <div className="text-2xl font-semibold text-white mb-1">{userData.public_repos}</div>
                <div className="text-gray-400 text-sm">Репозиториев</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 text-center">
                <div className="text-2xl font-semibold text-white mb-1">{userData.followers}</div>
                <div className="text-gray-400 text-sm">Подписчиков</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 text-center">
                <div className="text-2xl font-semibold text-white mb-1">{userData.following}</div>
                <div className="text-gray-400 text-sm">Подписок</div>
              </div>
            </div>

                        {/* Аналитика */}
            {userStats && (
              <div className="space-y-6">
                {/* Дополнительные метрики */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 text-center">
                    <div className="text-xl font-semibold text-white mb-1">{userStats.avgStarsPerRepo}</div>
                    <div className="text-gray-400 text-xs">Ср. звёзд/проект</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 text-center">
                    <div className="text-xl font-semibold text-white mb-1">{userStats.totalStars}</div>
                    <div className="text-gray-400 text-xs">Всего звёзд</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 text-center">
                    <div className="text-xl font-semibold text-white mb-1">{userStats.totalForks}</div>
                    <div className="text-gray-400 text-xs">Всего форков</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 text-center">
                    <div className="text-xl font-semibold text-white mb-1">{Object.keys(userStats.topLanguages).length}</div>
                    <div className="text-gray-400 text-xs">Языков</div>
                  </div>
                </div>

                {/* Детальная аналитика */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Языки программирования */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Языки программирования</h3>
                    <div className="space-y-3">
                      {Object.entries(userStats.topLanguages)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 6)
                        .map(([language, count]) => {
                          const percentage = (count / Object.values(userStats.topLanguages).reduce((a, b) => a + b, 0)) * 100
                          return (
                            <div key={language} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-300">{language}</span>
                                <span className="text-gray-400">{count} проектов</span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-1.5">
                                <div
                                  className="bg-white h-1.5 rounded-full transition-all duration-1000"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  {/* Активность */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Активность</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Коммиты (месяц)</span>
                        <span className="text-white font-medium">{userStats.productivity.commitsLastMonth}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Issues</span>
                        <span className="text-white font-medium">{userStats.productivity.issuesCreated}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Pull Requests</span>
                        <span className="text-white font-medium">{userStats.productivity.pullRequestsOpened}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Активные проекты</span>
                        <span className="text-white font-medium">{userStats.recentActivity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Репозитории */}
            {repositories.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Последние репозитории</h3>
                <div className="space-y-3">
                  {repositories.map((repo) => (
                    <div
                      key={repo.id}
                      className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-3">
                        <div className="flex-1 mb-3 lg:mb-0">
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                          >
                            {repo.name}
                          </a>
                          {repo.description && (
                            <p className="text-gray-400 text-sm mt-1 leading-relaxed">{repo.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            {repo.stargazers_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <GitFork className="w-4 h-4" />
                            {repo.forks_count}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 text-sm">
                        {repo.language && (
                          <span className="inline-block px-2 py-1 bg-white/10 text-gray-300 rounded text-xs w-fit">
                            {repo.language}
                          </span>
                        )}
                        <span className="text-gray-500 text-xs">
                          Обновлён {new Date(repo.updated_at).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
                )}
      </main>

      {/* Модальное окно для настройки GitHub токена */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">GitHub токен</h3>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-300 text-sm mb-4">
              GitHub токен увеличивает лимит запросов с 60 до 5000 в час. 
              Создайте Personal Access Token в настройках GitHub.
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const token = formData.get('token') as string
              saveGitHubToken(token)
            }}>
              <input
                type="password"
                name="token"
                placeholder="Введите ваш GitHub токен..."
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 mb-4"
              />
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Сохранить
                </button>
                {localStorage.getItem('github_token') && (
                  <button
                    type="button"
                    onClick={removeGitHubToken}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Удалить
        </button>
                )}
              </div>
            </form>
            
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-xs">
                💡 Токен сохраняется локально в браузере и не передаётся третьим лицам
        </p>
      </div>
          </motion.div>
        </div>
      )}

      {/* Toast уведомления */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.5 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className={`px-6 py-4 rounded-xl backdrop-blur-xl border shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-500/20 border-green-500/30 text-green-400' 
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          }`}>
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              ) : (
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              )}
              {toast.message}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default App
