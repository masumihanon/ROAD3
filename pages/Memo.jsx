import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Memo.css";

function now() {
  return Date.now();
}

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function createEmptyNote() {
  const t = now();
  return {
    id: String(t),
    title: "新しいメモ",
    body: "",
    pinned: false,
    trashed: false, // ✅ ゴミ箱
    createdAt: t,
    updatedAt: t,
  };
}

// ✅ 並び順：通常一覧（非ゴミ箱）用：pinned → updatedAt
function sortActiveNotes(list) {
  return [...list].sort((a, b) => {
    const ap = a.pinned ? 1 : 0;
    const bp = b.pinned ? 1 : 0;
    if (bp !== ap) return bp - ap;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
}

// ✅ ゴミ箱一覧用：updatedAt（新しい順）
function sortTrashedNotes(list) {
  return [...list].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export default function Memo({ currentAccount }) {
  const navigate = useNavigate();
  const accountId = currentAccount?.id ? String(currentAccount.id) : "guest";

  const STORAGE_KEY = `memoNotes:${accountId}`;
  const SELECTED_KEY = `memoSelected:${accountId}`;

  const [query, setQuery] = useState("");

  const [notes, setNotes] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [createEmptyNote()];

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return [createEmptyNote()];

      // ✅ 互換：pinned/trashed がない古いデータにも対応
      const normalized = parsed.map((n) => ({
        ...n,
        pinned: Boolean(n.pinned),
        trashed: Boolean(n.trashed),
      }));

      return normalized;
    } catch {
      return [createEmptyNote()];
    }
  });

  const [selectedId, setSelectedId] = useState(() => {
    const saved = localStorage.getItem(SELECTED_KEY);
    return saved || null;
  });

  const [isTrashOpen, setIsTrashOpen] = useState(true); // ✅ ゴミ箱の折りたたみ

  // ===== 検索（タイトル/本文） =====
  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;

    return notes.filter((n) => {
      const t = (n.title || "").toLowerCase();
      const b = (n.body || "").toLowerCase();
      return t.includes(q) || b.includes(q);
    });
  }, [notes, query]);

  // ✅ ゴミ箱と通常を分離
  const activeNotes = useMemo(
    () => sortActiveNotes(filteredNotes.filter((n) => !n.trashed)),
    [filteredNotes]
  );

  const trashedNotes = useMemo(
    () => sortTrashedNotes(filteredNotes.filter((n) => n.trashed)),
    [filteredNotes]
  );

  // ✅ selectedNote：まず active から探し、なければ trash から探す
  const selectedNote = useMemo(() => {
    const found = notes.find((n) => n.id === selectedId);
    if (found) return found;

    // 何も選ばれてない/消えた場合：active先頭→trash先頭
    return activeNotes[0] || trashedNotes[0] || null;
  }, [notes, selectedId, activeNotes, trashedNotes]);

  // selectedId が無効なら適切なものを選ぶ
  useEffect(() => {
    if (!selectedNote) return;
    if (selectedId !== selectedNote.id) setSelectedId(selectedNote.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNote?.id]);

  // ===== 自動保存（デバウンス） =====
  const saveTimerRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const scheduleSave = (nextNotes) => {
    setSaving(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextNotes));
      setSaving(false);
    }, 400);
  };

  useEffect(() => {
    scheduleSave(notes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  useEffect(() => {
    if (!selectedId) return;
    localStorage.setItem(SELECTED_KEY, selectedId);
  }, [selectedId]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // ===== 操作 =====
  const createNote = () => {
    const n = createEmptyNote();
    const next = [n, ...notes];
    setNotes(next);
    setSelectedId(n.id);
  };

  const updateSelected = (patch) => {
    if (!selectedNote) return;

    const next = notes.map((n) => {
      if (n.id !== selectedNote.id) return n;
      return {
        ...n,
        ...patch,
        pinned: patch.pinned !== undefined ? Boolean(patch.pinned) : Boolean(n.pinned),
        trashed:
          patch.trashed !== undefined ? Boolean(patch.trashed) : Boolean(n.trashed),
        updatedAt: now(),
      };
    });

    setNotes(next);
  };

  const togglePinSelected = () => {
    if (!selectedNote) return;
    if (selectedNote.trashed) return; // ✅ ゴミ箱内は固定しない
    updateSelected({ pinned: !selectedNote.pinned });
  };

  // ✅ ゴミ箱へ移動（ソフト削除）
  const moveToTrashSelected = () => {
    if (!selectedNote) return;

    // すでにゴミ箱なら「完全削除」に誘導
    if (selectedNote.trashed) {
      permanentlyDeleteSelected();
      return;
    }

    // ゴミ箱を空にする
const emptyTrash = () => {
  const ok = window.confirm("ゴミ箱をすべて空にしますか？（元に戻せません）");
  if (!ok) return;

  const next = notes.filter((n) => !n.trashed);

  if (next.length === 0) {
    const n = createEmptyNote();
    setNotes([n]);
    setSelectedId(n.id);
    return;
  }

  setNotes(next);

  const nextActive = sortActiveNotes(next.filter((n) => !n.trashed));
  if (nextActive[0]) setSelectedId(nextActive[0].id);
};

    const ok = window.confirm("このメモをゴミ箱に移動する？（後で復元できます）");
    if (!ok) return;

    updateSelected({ trashed: true, pinned: false });

    // 選択を active の先頭に移す（なければ trash 先頭）
    const nextActive = sortActiveNotes(
      notes
        .map((n) => (n.id === selectedNote.id ? { ...n, trashed: true } : n))
        .filter((n) => !n.trashed)
    );
    const nextTrash = sortTrashedNotes(
      notes
        .map((n) => (n.id === selectedNote.id ? { ...n, trashed: true } : n))
        .filter((n) => n.trashed)
    );

    const nextSelected = nextActive[0] || nextTrash[0] || null;
    if (nextSelected) setSelectedId(nextSelected.id);
  };

  // ✅ 復元
  const restoreSelected = () => {
    if (!selectedNote) return;
    if (!selectedNote.trashed) return;
    updateSelected({ trashed: false });
  };

  // ✅ 完全削除（ハード削除）
  const permanentlyDeleteSelected = () => {
    if (!selectedNote) return;
    const ok = window.confirm("このメモを完全に削除する？（元に戻せません）");
    if (!ok) return;

    const next = notes.filter((n) => n.id !== selectedNote.id);
    if (next.length === 0) {
      const n = createEmptyNote();
      setNotes([n]);
      setSelectedId(n.id);
      return;
    }

    // 次の選択：active先頭→trash先頭
    const nextActive = sortActiveNotes(next.filter((n) => !n.trashed));
    const nextTrash = sortTrashedNotes(next.filter((n) => n.trashed));
    const nextSelected = nextActive[0] || nextTrash[0] || next[0];
    setNotes(next);
    setSelectedId(nextSelected.id);
  };

  // ショートカット
  useEffect(() => {
    const onKeyDown = (e) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const meta = isMac ? e.metaKey : e.ctrlKey;

      if (meta && e.key.toLowerCase() === "n") {
        e.preventDefault();
        createNote();
      }

      if (meta && e.key.toLowerCase() === "p") {
        e.preventDefault();
        togglePinSelected();
      }

      if (meta && e.key === "Backspace") {
        e.preventDefault();
        // active→ゴミ箱 / trash→完全削除
        moveToTrashSelected();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, selectedNote]);

  const renderItem = (n) => {
    const isActive = n.id === selectedNote?.id;
    const preview = (n.body || "").trim().length > 0 ? (n.body || "").trim() : "本文なし";

    return (
      <button
        key={n.id}
        type="button"
        className={`memo-item ${isActive ? "active" : ""}`}
        onClick={() => setSelectedId(n.id)}
      >
        <div className="memo-item-head">
          <div className="memo-item-titleRow">
            {!n.trashed && n.pinned && <span className="memo-pinBadge">📌</span>}
            {n.trashed && <span className="memo-trashBadge">🗑️</span>}
            <div className="memo-item-title">{n.title || "無題"}</div>
          </div>
          <div className="memo-item-date">{formatDate(n.updatedAt)}</div>
        </div>
        <div className="memo-item-preview">{preview}</div>
      </button>
    );
  };

  const pinnedNotes = activeNotes.filter((n) => n.pinned);
  const normalNotes = activeNotes.filter((n) => !n.pinned);

  return (
    <div className="memo-page">
      <div className="memo-topbar">
        <button className="memo-back" type="button" onClick={() => navigate(-1)}>
          ← 戻る
        </button>

        <h2 className="memo-title">メモ</h2>

        <button className="memo-new" type="button" onClick={createNote}>
          ＋ 新規
        </button>
      </div>

      <div className="memo-body">
        {/* 左：一覧 */}
        <aside className="memo-list">
          <input
            className="memo-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="検索（タイトル/本文）"
          />

          <div className="memo-items">
            {/* 📌固定 */}
            {pinnedNotes.length > 0 && (
              <>
                <div className="memo-sectionLabel">📌 固定</div>
                {pinnedNotes.map(renderItem)}
              </>
            )}

            {/* 通常 */}
            {normalNotes.length > 0 && (
              <>
                <div className="memo-sectionLabel">通常</div>
                {normalNotes.map(renderItem)}
              </>
            )}

            {/* 🗑️ゴミ箱（折りたたみ） */}
           <div className="memo-trashHeader">
  <button
    type="button"
    className="memo-trashToggle"
    onClick={() => setIsTrashOpen((v) => !v)}
  >
    <span>🗑️ ゴミ箱</span>
    <span className="memo-trashCount">{trashedNotes.length}</span>
    <span className="memo-trashArrow">{isTrashOpen ? "▾" : "▸"}</span>
  </button>

  {trashedNotes.length > 0 && (
    <button
      className="memo-emptyTrash"
      type="button"
      onClick={emptyTrash}
    >
      空にする
    </button>
  )}
</div>

            {isTrashOpen && trashedNotes.length > 0 && (
              <div className="memo-trashList">{trashedNotes.map(renderItem)}</div>
            )}

            {isTrashOpen && trashedNotes.length === 0 && (
              <div className="memo-emptyList">ゴミ箱は空です</div>
            )}

            {/* 全体0（検索で全部消えることも） */}
            {activeNotes.length === 0 && trashedNotes.length === 0 && (
              <div className="memo-emptyList">該当するメモがありません</div>
            )}
          </div>
        </aside>

        {/* 右：編集 */}
        <section className="memo-editor">
          {selectedNote ? (
            <>
              <div className="memo-editor-head">
                <input
                  className="memo-editor-title"
                  value={selectedNote.title}
                  onChange={(e) => updateSelected({ title: e.target.value })}
                  placeholder="タイトル"
                />

                <div className="memo-editor-actions">
                  {!selectedNote.trashed ? (
                    <>
                      <button
                        className={`memo-pin ${selectedNote.pinned ? "on" : ""}`}
                        type="button"
                        onClick={togglePinSelected}
                        title="Cmd/Ctrl + P"
                      >
                        {selectedNote.pinned ? "📌 固定中" : "📌 固定"}
                      </button>

                      <button
                        className="memo-trashBtn"
                        type="button"
                        onClick={moveToTrashSelected}
                        title="Cmd/Ctrl + Backspace"
                      >
                        ゴミ箱へ
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="memo-restore" type="button" onClick={restoreSelected}>
                        復元
                      </button>

                      <button
                        className="memo-delete"
                        type="button"
                        onClick={permanentlyDeleteSelected}
                      >
                        完全削除
                      </button>
                    </>
                  )}
                </div>
              </div>

              <textarea
                className="memo-editor-body"
                value={selectedNote.body}
                onChange={(e) => updateSelected({ body: e.target.value })}
                placeholder="ここにメモを書く…"
              />

              <div className="memo-footer">
                <div className="memo-meta">
                  作成: {formatDate(selectedNote.createdAt)}　更新: {formatDate(selectedNote.updatedAt)}
                  {selectedNote.trashed ? "　（ゴミ箱）" : ""}
                </div>
                <div className="memo-saving">{saving ? "保存中…" : "保存済み"}</div>
              </div>
            </>
          ) : (
            <div className="memo-empty">メモがありません。右上の「＋ 新規」から作ってね。</div>
          )}
        </section>
      </div>
    </div>
  );
}