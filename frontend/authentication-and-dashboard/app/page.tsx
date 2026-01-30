"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Server,
  GraduationCap,
  User,
  Wifi,
  WifiOff,
  LogOut,
  Terminal,
  ChevronRight,
  Loader2,
  Lock,
  Trophy,
} from "lucide-react"
import { apiFetch } from "../lib/api"

type View = "login" | "register" | "dashboard"
type Tab = "dashboard" | "profile" | "leaderboard" | "machines" | "academics"

interface ActivityLog {
  id: number
  timestamp: string
  message: string
}

interface UserProfile {
  id: number
  username: string
  email: string
  role?: string
}

interface LeaderboardEntry {
  rank: number
  username: string
  score: number
  role: string
}

interface Machine {
  id: number
  name: string
  os: "Linux" | "Windows" | "Android"
  difficulty: "Easy" | "Medium" | "Hard" | "Insane"
  ip: string
  status: "Online" | "Offline"
}

interface Module {
  id: number
  title: string
  category: string
  progress: number
}

export default function TacticalSecurityApp() {
  const [view, setView] = useState<View>("login")
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [testResponse, setTestResponse] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])

  // Form states
  const [loginForm, setLoginForm] = useState({ username: "", password: "" })
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "" })

  // Mock data
  const [vpnConnected] = useState(false)
  const userIP = "192.168.1.105"
  const targetMachine = { name: "Lab-10-Box", ip: "10.10.10.15", progress: 65 }

  const machines: Machine[] = [
    { id: 1, name: "Lame", os: "Linux", difficulty: "Easy", ip: "10.10.10.3", status: "Online" },
    { id: 2, name: "Legacy", os: "Windows", difficulty: "Medium", ip: "10.10.10.4", status: "Online" },
    { id: 3, name: "Devel", os: "Windows", difficulty: "Easy", ip: "10.10.10.5", status: "Offline" },
    { id: 4, name: "Blue", os: "Windows", difficulty: "Hard", ip: "10.10.10.40", status: "Online" },
  ]

  const modules: Module[] = [
    { id: 1, title: "Intro to Python", category: "Scripting", progress: 40 },
    { id: 2, title: "SQL Injection", category: "Web Security", progress: 0 },
    { id: 3, title: "Linux Fundamentals", category: "Operating Systems", progress: 90 },
    { id: 4, title: "Active Directory Basics", category: "Network Security", progress: 15 },
  ]

  useEffect(() => {
    const token = localStorage.getItem("jwt_token")
    if (token) {
      setView("dashboard")
      setActivityLogs([
        { id: 1, timestamp: "14:32:01", message: "root@user: session_start --secure" },
        { id: 2, timestamp: "14:32:05", message: "root@user: connect Lab-10-Box" },
        { id: 3, timestamp: "14:33:12", message: "system: port_scan 10.10.10.15 -sV" },
        { id: 4, timestamp: "14:35:44", message: "root@user: exploit --target ssh" },
      ])
    }
  }, [])

  // Fetch Profile Data when switching to Profile tab
  useEffect(() => {
    if (activeTab === "profile" && view === "dashboard") {
      fetchUserProfile()
    } else if (activeTab === "leaderboard" && view === "dashboard") {
      fetchLeaderboard()
    }
  }, [activeTab, view])

  const fetchUserProfile = async () => {
    const token = localStorage.getItem("jwt_token")
    if (!token) return

    setIsLoading(true)
    try {
      const response = await apiFetch("/auth/me")

      if (response.ok) {
        const data = await response.json()
        setUserProfile({
          ...data,
          role: data.role || "User", // Default if not provided
        })
      } else {
        // Fallback for demo if backend isn't reachable
        console.warn("Failed to fetch profile, using mock data for demo")
         // Try to decode token for username if available, else use placeholder
         setUserProfile({
            id: 999,
            username: loginForm.username || "Operator",
            email: "operator@vizya.sec",
            role: "User"
         })
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
      // Fallback
       setUserProfile({
            id: 999,
            username: loginForm.username || "Operator",
            email: "operator@vizya.sec",
            role: "User"
         })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLeaderboard = async () => {
    const token = localStorage.getItem("jwt_token")
    if (!token) return
    
    setIsLoading(true)
    try {
        const response = await apiFetch("/leaderboard")
        
        if (response.ok) {
            const data = await response.json()
            setLeaderboardData(data)
        }
    } catch (err) {
        console.error("Failed to fetch leaderboard", err)
    } finally {
        setIsLoading(false)
    }
  }

  const addLog = (message: string) => {
    const now = new Date()
    const timestamp = now.toTimeString().slice(0, 8)
    setActivityLogs((prev) => [...prev, { id: Date.now(), timestamp, message }])
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
        const formData = new FormData()
        formData.append("username", loginForm.username)
        formData.append("password", loginForm.password)

        const response = await apiFetch("/auth/login", {
            method: "POST",
            body: formData,
        })

        if (!response.ok) {
             if (response.status === 429) {
                 throw new Error("Too many login attempts. Please try again later.")
             }
            throw new Error("Login failed")
        }

        const data = await response.json()
        localStorage.setItem("jwt_token", data.access_token)
        
        setSuccess("ACCESS GRANTED")
        setTimeout(() => {
          setView("dashboard")
          setActiveTab("dashboard")
          setActivityLogs([
            {
              id: 1,
              timestamp: new Date().toTimeString().slice(0, 8),
              message: `root@${loginForm.username}: session_init`,
            },
          ])
        }, 500)
    } catch (err: any) {
        setError(err.message || "AUTHENTICATION FAILED")
    } finally {
        setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
        const response = await apiFetch("/auth/register", {
            method: "POST",
            body: JSON.stringify(registerForm),
        })

        if (!response.ok) {
             const errorData = await response.json()
             throw new Error(errorData.detail || "Registration failed")
        }

        setSuccess("IDENTITY CREATED")
        setTimeout(() => {
          setView("login")
          setSuccess("")
        }, 1200)
    } catch (err: any) {
        setError(err.message || "REGISTRATION FAILED")
    } finally {
        setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsLoading(true)
    setTestResponse(null)
    addLog("root@user: curl -X GET /hello")
    
    try {
        const response = await apiFetch("/hello")
        
        const data = await response.json()
        
        setTestResponse(JSON.stringify(data, null, 2))
        addLog(`system: [${response.status}] response_received`)

    } catch (err) {
        setTestResponse(JSON.stringify({ error: "Connection Failed" }, null, 2))
        addLog(`system: [ERROR] connection_refused`)
    } finally {
        setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
        await apiFetch("/auth/logout", { method: "POST" })
    } catch (e) {
        console.error("Logout error", e)
    }
    
    localStorage.removeItem("jwt_token")
    setView("login")
    setActivityLogs([])
    setTestResponse(null)
    setLoginForm({ username: "", password: "" })
    setError("")
    setSuccess("")
    setActiveTab("dashboard")
    setUserProfile(null)
  }

  // Login Screen
  if (view === "login" || view === "register") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative bg-[#0f1219]">
        {/* Hex Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fillRule='evenodd'%3E%3Cg fill='%239fef00' fillOpacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="w-full max-w-md relative z-10">
          {/* Card */}
          <div className="bg-[#111111] border border-gray-800 rounded p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-[#9fef00]" />
                <span className="text-[#9fef00] font-mono text-xs tracking-widest">SYSTEM ACCESS</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {view === "login" ? "SYSTEM ACCESS // LAB 10" : "REGISTER // NEW OPERATOR"}
              </h1>
              <p className="text-gray-500 font-mono text-sm mt-1">
                {view === "login" ? "Enter credentials to authenticate" : "Create new operator identity"}
              </p>
            </div>

            <form onSubmit={view === "login" ? handleLogin : handleRegister} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-gray-500 font-mono text-xs mb-2 tracking-wider">USERNAME</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9fef00] font-mono text-sm">
                    {">"}
                  </span>
                  <input
                    type="text"
                    value={view === "login" ? loginForm.username : registerForm.username}
                    onChange={(e) =>
                      view === "login"
                        ? setLoginForm({ ...loginForm, username: e.target.value })
                        : setRegisterForm({ ...registerForm, username: e.target.value })
                    }
                    required
                    className="w-full pl-8 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded text-white font-mono text-sm focus:outline-none focus:border-[#9fef00] placeholder-gray-600 caret-[#9fef00]"
                    placeholder="operator_name"
                  />
                </div>
              </div>

              {/* Email Input (Register only) */}
              {view === "register" && (
                <div>
                  <label className="block text-gray-500 font-mono text-xs mb-2 tracking-wider">EMAIL</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9fef00] font-mono text-sm">
                      {">"}
                    </span>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                      className="w-full pl-8 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded text-white font-mono text-sm focus:outline-none focus:border-[#9fef00] placeholder-gray-600 caret-[#9fef00]"
                      placeholder="operator@domain.com"
                    />
                  </div>
                </div>
              )}

              {/* Password Input */}
              <div>
                <label className="block text-gray-500 font-mono text-xs mb-2 tracking-wider">PASSWORD</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9fef00] font-mono text-sm">
                    {">"}
                  </span>
                  <input
                    type="password"
                    value={view === "login" ? loginForm.password : registerForm.password}
                    onChange={(e) =>
                      view === "login"
                        ? setLoginForm({ ...loginForm, password: e.target.value })
                        : setRegisterForm({ ...registerForm, password: e.target.value })
                    }
                    required
                    className="w-full pl-8 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded text-white font-mono text-sm focus:outline-none focus:border-[#9fef00] placeholder-gray-600 caret-[#9fef00]"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded">
                  <div className="w-2 h-2 bg-red-500" />
                  <span className="text-red-400 font-mono text-sm">{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-[#9fef00]/10 border border-[#9fef00]/30 rounded">
                  <div className="w-2 h-2 bg-[#9fef00]" />
                  <span className="text-[#9fef00] font-mono text-sm">{success}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#9fef00] text-black font-bold font-mono tracking-wider rounded hover:bg-[#8bdb00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {view === "login" ? "INITIALIZE_SESSION" : "CREATE_IDENTITY"}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle View */}
            <p className="text-center mt-6 text-gray-500 font-mono text-sm">
              {view === "login" ? "No identity? " : "Have an identity? "}
              <button
                onClick={() => {
                  setView(view === "login" ? "register" : "login")
                  setError("")
                  setSuccess("")
                }}
                className="text-[#9fef00] hover:underline"
              >
                {view === "login" ? "REGISTER" : "LOGIN"}
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard View
  return (
    <div className="min-h-screen flex bg-[#0f1219]">
      {/* Hex Grid Background */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fillRule='evenodd'%3E%3Cg fill='%239fef00' fillOpacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Sidebar */}
      <aside className="w-16 bg-[#111111] border-r border-gray-800 flex flex-col items-center py-4 relative z-10">
        <div className="w-8 h-8 bg-[#9fef00] rounded flex items-center justify-center mb-8">
          <Terminal className="w-4 h-4 text-black" />
        </div>

        <nav className="flex flex-col items-center gap-2 flex-1">
          <SidebarIcon 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            active={activeTab === 'dashboard'} 
            label="Dashboard" 
            onClick={() => setActiveTab('dashboard')}
          />
          <SidebarIcon 
             icon={<Trophy className="w-5 h-5" />} 
             active={activeTab === 'leaderboard'}
             label="Leaderboard"
             onClick={() => setActiveTab('leaderboard')}
          />
          <SidebarIcon 
            icon={<Server className="w-5 h-5" />} 
            active={activeTab === 'machines'}
            label="Machines"
            onClick={() => setActiveTab('machines')}
          />
          <SidebarIcon 
            icon={<GraduationCap className="w-5 h-5" />} 
            active={activeTab === 'academics'}
            label="Academy"
            onClick={() => setActiveTab('academics')}
          />
          <SidebarIcon 
            icon={<User className="w-5 h-5" />} 
            active={activeTab === 'profile'}
            label="Profile"
            onClick={() => setActiveTab('profile')} 
          />
        </nav>

        <button
          onClick={handleLogout}
          className="p-3 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Top Bar */}
        <header className="h-14 bg-[#111111] border-b border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <h1 className="text-white font-bold tracking-wide">
                {activeTab === 'dashboard' ? 'MISSION CONTROL' : 
                 activeTab === 'leaderboard' ? 'GLOBAL RANKING' :
                 activeTab === 'machines' ? 'TARGET LIST' :
                 activeTab === 'academics' ? 'ACADEMY MODULES' : 'OPERATOR PROFILE'}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {vpnConnected ? (
                <Wifi className="w-4 h-4 text-[#9fef00]" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className={`font-mono text-sm ${vpnConnected ? "text-[#9fef00]" : "text-red-500"}`}>
                VPN: {vpnConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="h-4 w-px bg-gray-800" />
            <span className="text-gray-500 font-mono text-sm">IP: {userIP}</span>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'dashboard' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Target Card */}
                <div className="bg-[#111111] border border-gray-800 rounded p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Server className="w-4 h-4 text-[#9fef00]" />
                    <span className="text-[#9fef00] font-mono text-xs tracking-wider">ACTIVE TARGET</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold text-lg">{targetMachine.name}</span>
                      <span className="text-gray-500 font-mono text-sm">{targetMachine.ip}</span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 font-mono text-xs">PWN PROGRESS</span>
                        <span className="text-[#9fef00] font-mono text-xs">{targetMachine.progress}%</span>
                      </div>
                      <div className="h-2 bg-[#0a0a0a] rounded overflow-hidden">
                        <div
                          className="h-full bg-[#9fef00] transition-all duration-500"
                          style={{ width: `${targetMachine.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <span className="px-2 py-1 bg-[#9fef00]/10 text-[#9fef00] font-mono text-xs rounded">Linux</span>
                      <span className="px-2 py-1 bg-orange-500/10 text-orange-400 font-mono text-xs rounded">Medium</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Log */}
                <div className="bg-[#111111] border border-gray-800 rounded p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Terminal className="w-4 h-4 text-[#9fef00]" />
                    <span className="text-[#9fef00] font-mono text-xs tracking-wider">RECENT ACTIVITY</span>
                  </div>

                  <div className="bg-[#0a0a0a] rounded p-3 h-40 overflow-y-auto font-mono text-sm space-y-1">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex gap-3">
                        <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
                        <span className="text-gray-400">{log.message}</span>
                      </div>
                    ))}
                    <span className="text-[#9fef00] animate-pulse">_</span>
                  </div>
                </div>

                {/* Test Connection Module */}
                <div className="lg:col-span-2 bg-[#111111] border border-gray-800 rounded p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#9fef00]" />
                      <span className="text-[#9fef00] font-mono text-xs tracking-wider">TEST CONNECTION</span>
                    </div>
                    <button
                      onClick={handleTestConnection}
                      disabled={isLoading}
                      className="px-4 py-2 bg-[#9fef00] text-black font-bold font-mono text-sm rounded hover:bg-[#8bdb00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          SEND REQUEST
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-[#0a0a0a] rounded p-4 font-mono text-sm min-h-[120px]">
                    <div className="text-gray-500 mb-2">{'$ curl -H "Authorization: Bearer <token>" /api/hello'}</div>
                    {testResponse ? (
                      <pre className="text-[#9fef00] whitespace-pre-wrap">{testResponse}</pre>
                    ) : (
                      <span className="text-gray-600">// Response will appear here</span>
                    )}
                  </div>
                </div>
              </div>
          ) : activeTab === 'leaderboard' ? (
              /* Leaderboard Tab Content */
              <div className="max-w-5xl mx-auto">
                 <div className="bg-[#111111] border border-gray-800 rounded overflow-hidden">
                     <table className="w-full">
                         <thead>
                             <tr className="bg-[#0a0a0a] border-b border-gray-800">
                                 <th className="px-6 py-4 text-left text-gray-500 font-mono text-xs tracking-wider">RANK</th>
                                 <th className="px-6 py-4 text-left text-gray-500 font-mono text-xs tracking-wider">OPERATOR</th>
                                 <th className="px-6 py-4 text-left text-gray-500 font-mono text-xs tracking-wider">STATUS</th>
                                 <th className="px-6 py-4 text-right text-gray-500 font-mono text-xs tracking-wider">SCORE</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-800">
                             {leaderboardData.map((entry) => (
                                 <tr key={entry.username} className={`group hover:bg-[#0a0a0a] transition-colors ${entry.rank === 1 ? 'bg-[#9fef00]/5' : ''}`}>
                                     <td className="px-6 py-4">
                                         <div className="flex items-center gap-2">
                                            {entry.rank === 1 && <Trophy className="w-4 h-4 text-[#9fef00]" />}
                                            <span className={`font-mono font-bold ${
                                                entry.rank === 1 ? 'text-[#9fef00]' : 
                                                entry.rank === 2 ? 'text-gray-200' :
                                                entry.rank === 3 ? 'text-orange-400' : 'text-gray-500'
                                            }`}>
                                                #{entry.rank.toString().padStart(3, '0')}
                                            </span>
                                         </div>
                                     </td>
                                     <td className="px-6 py-4">
                                         <div className="flex items-center gap-3">
                                             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                                 entry.rank === 1 ? 'bg-[#9fef00] text-black' : 'bg-gray-800 text-gray-400'
                                             }`}>
                                                 {entry.username.substring(0, 2).toUpperCase()}
                                             </div>
                                             <span className={`font-mono ${entry.rank === 1 ? 'text-white' : 'text-gray-300'}`}>
                                                 {entry.username}
                                             </span>
                                         </div>
                                     </td>
                                     <td className="px-6 py-4">
                                         <span className={`px-2 py-1 text-xs font-mono rounded border ${
                                             entry.role === 'Admin' 
                                             ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                             : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                         }`}>
                                             {entry.role.toUpperCase()}
                                         </span>
                                     </td>
                                     <td className="px-6 py-4 text-right">
                                         <span className={`font-mono font-bold ${entry.rank === 1 ? 'text-[#9fef00]' : 'text-white'}`}>
                                             {entry.score.toLocaleString()} PTS
                                         </span>
                                     </td>
                                 </tr>
                             ))}
                             {leaderboardData.length === 0 && !isLoading && (
                                 <tr>
                                     <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-mono">
                                         NO DATA AVAILABLE
                                     </td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                 </div>
              </div>
          ) : activeTab === 'machines' ? (
              /* Machines Tab Content */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {machines.map((machine) => (
                      <div key={machine.id} className="bg-[#111111] border border-gray-800 rounded p-5 hover:border-[#9fef00]/50 transition-colors group">
                          <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#0a0a0a] rounded flex items-center justify-center border border-gray-800">
                                      {machine.os === 'Linux' ? <Terminal className="w-5 h-5 text-white" /> : <Server className="w-5 h-5 text-blue-400" />}
                                  </div>
                                  <div>
                                      <h3 className="text-white font-bold">{machine.name}</h3>
                                      <span className="text-gray-500 font-mono text-xs">{machine.os}</span>
                                  </div>
                              </div>
                              <div className={`w-2 h-2 rounded-full ${machine.status === 'Online' ? 'bg-[#9fef00]' : 'bg-red-500'}`} />
                          </div>
                          
                          <div className="space-y-3 mb-6">
                              <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500 font-mono text-xs">DIFFICULTY</span>
                                  <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                                      machine.difficulty === 'Easy' ? 'bg-[#9fef00]/10 text-[#9fef00]' :
                                      machine.difficulty === 'Medium' ? 'bg-orange-500/10 text-orange-400' :
                                      'bg-red-500/10 text-red-500'
                                  }`}>
                                      {machine.difficulty}
                                  </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500 font-mono text-xs">IP ADDRESS</span>
                                  <span className="text-gray-300 font-mono text-xs">{machine.ip}</span>
                              </div>
                          </div>
                          
                          <button className="w-full py-2 bg-[#0a0a0a] border border-gray-800 text-gray-300 font-mono text-xs hover:bg-[#9fef00] hover:text-black hover:border-[#9fef00] transition-all rounded flex items-center justify-center gap-2">
                              SPAWN MACHINE
                          </button>
                      </div>
                  ))}
              </div>
          ) : activeTab === 'academics' ? (
              /* Academics Tab Content */
              <div className="space-y-6">
                  {modules.map((module) => (
                      <div key={module.id} className="bg-[#111111] border border-gray-800 rounded p-6 flex flex-col md:flex-row items-center gap-6">
                          <div className="w-12 h-12 bg-[#0a0a0a] rounded flex items-center justify-center border border-gray-800 shrink-0">
                              <GraduationCap className="w-6 h-6 text-[#9fef00]" />
                          </div>
                          
                          <div className="flex-1 w-full">
                              <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-white font-bold text-lg">{module.title}</h3>
                                  <span className="text-gray-500 font-mono text-xs bg-[#0a0a0a] px-2 py-1 rounded border border-gray-800">
                                      {module.category.toUpperCase()}
                                  </span>
                              </div>
                              
                              <div className="relative h-2 bg-[#0a0a0a] rounded overflow-hidden">
                                  <div 
                                      className="absolute top-0 left-0 h-full bg-[#9fef00] transition-all duration-500"
                                      style={{ width: `${module.progress}%` }}
                                  />
                              </div>
                              <div className="flex justify-between mt-2">
                                  <span className="text-gray-500 font-mono text-xs">PROGRESS</span>
                                  <span className="text-[#9fef00] font-mono text-xs">{module.progress}%</span>
                              </div>
                          </div>
                          
                          <button className="px-6 py-2 bg-[#9fef00] text-black font-bold font-mono text-xs rounded hover:bg-[#8bdb00] transition-colors whitespace-nowrap">
                              {module.progress > 0 ? "CONTINUE" : "START MODULE"}
                          </button>
                      </div>
                  ))}
              </div>
          ) : (
            /* Profile Tab Content */
            <div className="max-w-4xl mx-auto">
                <div className="bg-[#111111] border border-gray-800 rounded p-8">
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-[#0a0a0a] border-2 border-[#9fef00] rounded-full flex items-center justify-center">
                                <User className="w-12 h-12 text-[#9fef00]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">{userProfile?.username || "Operator"}</h2>
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-1 bg-[#9fef00]/10 text-[#9fef00] font-mono text-xs rounded border border-[#9fef00]/20">
                                        RANK: SCRIPT KIDDIE
                                    </span>
                                    <span className="px-2 py-1 bg-gray-800 text-gray-400 font-mono text-xs rounded border border-gray-700">
                                        ROLE: {userProfile?.role?.toUpperCase() || "USER"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                             <span className="block text-gray-500 font-mono text-xs mb-1">MEMBER SINCE</span>
                             <span className="text-white font-mono">2024-03-15</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <label className="text-gray-500 font-mono text-xs">EMAIL ADDRESS</label>
                             <div className="p-3 bg-[#0a0a0a] border border-gray-800 rounded text-gray-300 font-mono text-sm">
                                {userProfile?.email || "loading..."}
                             </div>
                        </div>
                        <div className="space-y-2">
                             <label className="text-gray-500 font-mono text-xs">API KEY</label>
                             <div className="p-3 bg-[#0a0a0a] border border-gray-800 rounded text-gray-300 font-mono text-sm flex justify-between items-center">
                                <span>••••••••••••••••••••••••••••</span>
                                <Lock className="w-4 h-4 text-gray-500" />
                             </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-gray-800">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-[#0a0a0a] rounded border border-gray-800">
                                <div className="text-2xl font-bold text-white mb-1">12</div>
                                <div className="text-gray-500 font-mono text-xs">MACHINES PWNED</div>
                            </div>
                            <div className="text-center p-4 bg-[#0a0a0a] rounded border border-gray-800">
                                <div className="text-2xl font-bold text-[#9fef00] mb-1">450</div>
                                <div className="text-gray-500 font-mono text-xs">POINTS</div>
                            </div>
                            <div className="text-center p-4 bg-[#0a0a0a] rounded border border-gray-800">
                                <div className="text-2xl font-bold text-orange-400 mb-1">#1337</div>
                                <div className="text-gray-500 font-mono text-xs">GLOBAL RANK</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function SidebarIcon({ 
    icon, 
    active, 
    label, 
    onClick 
}: { 
    icon: React.ReactNode; 
    active?: boolean; 
    label: string; 
    onClick?: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded transition-colors ${
        active ? "bg-[#9fef00]/10 text-[#9fef00]" : "text-gray-500 hover:text-white hover:bg-gray-800"
      }`}
      title={label}
    >
      {icon}
    </button>
  )
}