import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Posts.css";

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeTags(input) {
  return input
    .split(/[,\s、]+/)
    .map((tag) => tag.replace(/^#/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

export default function Posts() {
  const navigate = useNavigate();

  const currentAccount = useMemo(() => {
    return safeParse(localStorage.getItem("currentAccount"), null);
  }, []);

  const [text, setText] = useState("");
  const [tagInput, setTagInput] = useState("#Now");
  const [mediaName, setMediaName] = useState("");
  const [imageData, setImageData] = useState(null);
  const [recommendToOpen, setRecommendToOpen] = useState(true);

  const maxLength = 500;
  const textCount = text.length;
  const tags = normalizeTags(tagInput);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setMediaName("");
      setImageData(null);
      return;
    }

    setMediaName(file.name);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageData(reader.result);
      };
      reader.readAsDataURL(file);
      return;
    }

    setImageData(null);
  };

  const handleSubmit = () => {
    const trimmed = text.trim();

    if (!trimmed && !imageData) {
      alert("本文か画像を入れてね。");
      return;
    }

    if (!currentAccount) {
      alert("アカウント情報が見つかりません。");
      return;
    }

    const stored = safeParse(localStorage.getItem("openPosts"), {});
    const accountPosts = stored[currentAccount.id] || [];

    const newPost = {
      id: Date.now(),
      text: trimmed,
      timestamp: Date.now(),
      author: currentAccount.name || "名前未設定",
      accountId: currentAccount.id,
      handle: currentAccount.handle || `@${currentAccount.id}`,
      space: "open",
      tags,
      image: imageData || null,
      mediaName: mediaName || null,
      recommendToOpen,
      likeCount: 0,
      liked: false,
      saved: false,
      replyCount: 0,
      resignalCount: 0,
      resignaled: false,
    };

    const updated = {
      ...stored,
      [currentAccount.id]: [newPost, ...accountPosts],
    };

    localStorage.setItem("openPosts", JSON.stringify(updated));

    const currentNotifications = safeParse(
      localStorage.getItem("notifications"),
      []
    );

    const nextNotifications = [
      {
        id: Date.now() + 1,
        accountId: currentAccount.id,
        type: "signal",
        from: currentAccount.name,
        accountName: currentAccount.name,
        message: `${currentAccount.name}がSignalを投稿しました`,
        link: "/open",
        read: false,
        isRead: false,
        createdAt: Date.now(),
      },
      ...currentNotifications,
    ];

    localStorage.setItem("notifications", JSON.stringify(nextNotifications));

    navigate("/open");
  };

  return (
    <div className="posts-page">
      <div className="posts-topbar">
        <button
          type="button"
          className="posts-back"
          onClick={() => navigate(-1)}
        >
          ← 戻る
        </button>

        <button
          type="button"
          className="posts-submit"
          onClick={handleSubmit}
          disabled={!text.trim() && !imageData}
        >
          シグナル発信
        </button>
      </div>

      <div className="posts-content">
        <div className="posts-card">
          <div className="posts-head">
            <div className="posts-avatar">
              {(currentAccount?.name || "?").charAt(0)}
            </div>

            <div className="posts-account">
              <strong>{currentAccount?.name || "名前未設定"}</strong>
              <span>{currentAccount?.handle || "@---"}</span>
            </div>
          </div>

          <div className="posts-body">
            <textarea
              className="posts-textarea"
              value={text}
              onChange={(e) => {
                if (e.target.value.length <= maxLength) {
                  setText(e.target.value);
                }
              }}
              placeholder="あなたの声を聞かせて"
            />

            <div className="posts-metaRow">
              <span
                className={`posts-count ${
                  textCount > maxLength - 50 ? "warn" : ""
                }`}
              >
                {textCount}/{maxLength}
              </span>
            </div>

            <div className="posts-field">
              <label className="posts-label">タグ</label>
              <input
                className="posts-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="#Now #音楽 #日常"
              />
              {tags.length > 0 && (
                <div className="posts-tagsPreview">
                  {tags.map((tag) => (
                    <span key={tag} className="posts-tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="posts-field">
              <label className="posts-label">メディア</label>

              <label className="posts-mediaPicker">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  hidden
                />
                画像を選択
              </label>

              {mediaName && <div className="posts-mediaName">{mediaName}</div>}

              {imageData && (
                <div className="posts-imagePreviewWrap">
                  <img
                    src={imageData}
                    alt="選択した画像"
                    className="posts-imagePreview"
                  />
                </div>
              )}
            </div>

            <div className="posts-checkRow">
              <label className="posts-checkLabel">
                <input
                  type="checkbox"
                  checked={recommendToOpen}
                  onChange={(e) => setRecommendToOpen(e.target.checked)}
                />
                おすすめに流す
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}