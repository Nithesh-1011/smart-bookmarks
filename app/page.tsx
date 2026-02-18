"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

export default function BookmarkManager() {

  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [newBookmark, setNewBookmark] = useState({ title: "", url: "", description: "" })
  const [adding, setAdding] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // create supabase ONLY once
  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return null
    return createClient(url, key)
  }, [])

  // ---------------- FETCH BOOKMARKS ----------------
  const fetchBookmarks = useCallback(async () => {
    if (!supabase || !userId) return

    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("id, title, url, description, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setBookmarks(data || [])
    } catch (err) {
      console.error("Fetch failed:", err)
    }
  }, [supabase, userId])

  // ---------------- GET SESSION ON MOUNT ----------------
  useEffect(() => {
    const init = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user?.id) {
        router.replace("/login")
        return
      }

      setUserId(session.user.id) // triggers next effect
    }

    init()
  }, [supabase, router])

  // ---------------- FETCH AFTER USER AVAILABLE ----------------
  useEffect(() => {
    if (!userId) return

    const load = async () => {
      setLoading(true)
      await fetchBookmarks()
      setLoading(false)
    }

    load()
  }, [userId, fetchBookmarks])

  // ---------------- ADD BOOKMARK ----------------
  const addBookmark = async () => {
    if (!newBookmark.title.trim() || !newBookmark.url.trim() || !userId || !supabase) return

    setAdding(true)

    try {
      const { error } = await supabase.from("bookmarks").insert([
        {
          title: newBookmark.title.trim(),
          url: newBookmark.url.trim(),
          description: newBookmark.description.trim() || null,
          user_id: userId,
        },
      ])

      if (error) throw error

      setNewBookmark({ title: "", url: "", description: "" })
      await fetchBookmarks()

    } catch (error: any) {
      alert("Failed to add: " + error.message)
    } finally {
      setAdding(false)
    }
  }

  // ---------------- DELETE BOOKMARK ----------------
  const deleteBookmark = async (id: string) => {
    if (!confirm("Delete this bookmark?") || !supabase || !userId) return

    try {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)

      if (error) throw error

      await fetchBookmarks()
    } catch (error: any) {
      alert("Failed to delete: " + error.message)
    }
  }

  // ---------------- LOGOUT ----------------
  const logout = async () => {
    if (supabase) await supabase.auth.signOut()
    router.replace("/login")
  }

  // ---------------- LOADER ----------------
  if (loading) {
    return (
      <div style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb"
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: "4px solid #e5e7eb",
          borderTop: "4px solid #374151",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
      </div>
    )
  }

  // ---------------- UI ----------------
  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "bold", color: "#1f2937" }}>
          📚 Smart Bookmarks ({bookmarks.length})
        </h1>
        <button onClick={logout} style={{
          padding: "12px 24px",
          background: "#dc2626",
          color: "white",
          fontWeight: "bold",
          borderRadius: "12px",
          border: "none",
          cursor: "pointer"
        }}>
          Logout
        </button>
      </div>

      {/* Add Form */}
      <div style={{ background: "white", padding: "24px", borderRadius: "16px", marginBottom: "32px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}>➕ Add Bookmark</h2>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 3fr auto", gap: "16px", alignItems: "end" }}>
          <input placeholder="Title"
            value={newBookmark.title}
            onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
            style={{ padding: "12px", border: "2px solid #e5e7eb", borderRadius: "8px" }} />

          <input placeholder="https://example.com"
            value={newBookmark.url}
            onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
            style={{ padding: "12px", border: "2px solid #e5e7eb", borderRadius: "8px" }} />

          <input placeholder="Description"
            value={newBookmark.description}
            onChange={(e) => setNewBookmark({ ...newBookmark, description: e.target.value })}
            style={{ padding: "12px", border: "2px solid #e5e7eb", borderRadius: "8px" }} />

          <button onClick={addBookmark}
            disabled={adding || !newBookmark.title.trim() || !newBookmark.url.trim()}
            style={{
              padding: "12px 24px",
              background: adding ? "#9ca3af" : "#10b981",
              color: "white",
              fontWeight: "bold",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer"
            }}>
            {adding ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      {/* Bookmarks */}
      <div style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>🔖 Your Bookmarks</h2>

        {bookmarks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#6b7280" }}>
            No bookmarks yet. Add one above!
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {bookmarks.map((b) => (
              <div key={b.id} style={{ display: "flex", gap: "16px", padding: "20px", border: "2px solid #e5e7eb", borderRadius: "12px" }}>
                <span style={{ fontSize: "24px" }}>🔗</span>

                <div style={{ flex: 1 }}>
                  <a href={b.url} target="_blank" style={{ fontSize: "20px", fontWeight: "bold", color: "#3b82f6" }}>
                    {b.title}
                  </a>
                  {b.description && <p style={{ color: "#6b7280", margin: "8px 0" }}>{b.description}</p>}
                  <div style={{ color: "#6b7280", fontSize: "14px" }}>{b.url}</div>
                </div>

                <button onClick={() => deleteBookmark(b.id)}
                  style={{ padding: "8px 16px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
