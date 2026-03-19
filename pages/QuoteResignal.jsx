import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./QuoteResignal.css";

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

export default function QuoteResignal() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentAccount = useMemo(() => {
    return safeParse(localStorage.getItem("currentAccount"), null);
  }, []);

  const sourcePost = location.state?.post || null;

  const [text, setText] = useState("");
  const [tagInput, setTagInput] = useState(
    sourcePost?.tags
      ?.map((tag) => `#${String(tag).replace(/^#/, "")}`)
      .join(" ") || "#Now"
  );

  const maxLength = 300;
  const textCount = text.length;
  const tags = normalizeTags(tagInput);

  const handleSubmit = () => {
    if (!currentAccount) {
      alert("アカウント情報が見つかりません。");
      return;
    }

    if (!sourcePost) {
      alert("引用元のシグナルが見つかりません。");
      return;
    }

    const stored = safeParse(localStorage.getItem("openPosts"), {});
    const myPosts = stored[currentAccount.id] || [];

    const newQuoteResignal = {
      id: Date.now(),
      text: text.trim(),
      timestamp: Date.now(),
      author: currentAccount.name || "名前未設定",
      accountId: currentAccount.id,
      handle: currentAccount.handle || `@${currentAccount.id}`,
      space: "open",
      tags,
      image: null,
      mediaName: null,
      recommendToOpen: true,
      likeCount: 0,
      liked: false,
      saved: false,
      replyCount: 0,
      resignalCount: 0,
      resignaled: false,
      isResignal: true,
      isQuoteResignal: true,
      originalPost: {
        id: sourcePost.id,
        author: sourcePost.author,
        handle: sourcePost.handle,
        text: sourcePost.text,
        timestamp: sourcePost.timestamp,
        tags: sourcePost.tags || [],
        image: sourcePost.image || null,
      },
    };

    const updated = {
      ...stored,
      [currentAccount.id]: [newQuoteResignal, ...myPosts],
    };

    const sourcePostId = String(sourcePost.id);

    Object.keys(updated).forEach((accountId) => {
      updated[accountId] = (updated[accountId] || []).map((post) => {
        if (String(post.id) !== sourcePostId) return post;

        return {
          ...post,
          resignaled: true,
          resignalCount: (post.resignalCount || 0) + 1,
        };
      });
    });

    localStorage.setItem("openPosts", JSON.stringify(updated));

    // 引用リシグナル通知
    if (String(sourcePost.accountId) !== String(currentAccount.id)) {
      const currentNotifications = safeParse(
        localStorage.getItem("notifications"),
        []
      );

      const nextNotifications = [
        {
          id: Date.now() + 1,
          accountId: sourcePost.accountId,
          type: "quote-resignal",
          from: currentAccount.name || "ユーザー",
          fromUser: currentAccount.name || "ユーザー",
          fromUserId: currentAccount.handle || `@${currentAccount.id}`,
          postId: sourcePost.id,
          link: `/signal/${sourcePost.id}`,
          read: false,
          isRead: false,
          createdAt: Date.now(),
        },
        ...currentNotifications,
      ].slice(0, 250);

      localStorage.setItem("notifications", JSON.stringify(nextNotifications));
    }

    navigate("/open");
  };

  if (!sourcePost) {
    return (
      <div className="quote-page">
        <div className="quote-topbar">
          <button
            type="button"
            className="quote-back"
            onClick={() => navigate(-1)}
          >
            ← 戻る
          </button>
        </div>

        <div className="quote-content">
          <p className="quote-empty">引用元のシグナルが見つかりません。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quote-page">
      <div className="quote-topbar">
        <button
          type="button"
          className="quote-back"
          onClick={() => navigate(-1)}
        >
          ← 戻る
        </button>

        <button
          type="button"
          className="quote-submit"
          onClick={handleSubmit}
        >
          引用リシグナル
        </button>
      </div>

      <div className="quote-content">
        <div className="quote-card">
          <div className="quote-head">
            <div className="quote-avatar">
              {(currentAccount?.name || "?").charAt(0)}
            </div>

            <div className="quote-account">
              <strong>{currentAccount?.name || "名前未設定"}</strong>
              <span>{currentAccount?.handle || "@---"}</span>
            </div>
          </div>

          <div className="quote-body">
            <textarea
              className="quote-textarea"
              value={text}
              onChange={(e) => {
                if (e.target.value.length <= maxLength) {
                  setText(e.target.value);
                }
              }}
              placeholder="コメントを追加"
            />

            <div className="quote-metaRow">
              <span
                className={`quote-count ${
                  textCount > maxLength - 50 ? "warn" : ""
                }`}
              >
                {textCount}/{maxLength}
              </span>
            </div>

            <div className="quote-field">
              <label className="quote-label">タグ</label>
              <input
                className="quote-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="#Now #引用"
              />
              {tags.length > 0 && (
                <div className="quote-tagsPreview">
                  {tags.map((tag) => (
                    <span key={tag} className="quote-tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="quote-originalBox">
              <p className="quote-originalLabel">引用元</p>
              <div className="quote-originalCard">
                <strong>{sourcePost.author || "ユーザー名"}</strong>
                <span>{sourcePost.handle || `@${sourcePost.accountId}`}</span>
                <p>{sourcePost.text}</p>

                {sourcePost.image && (
                  <div className="quote-originalImageWrap">
                    <img
                      src={sourcePost.image}
                      alt="引用元画像"
                      className="quote-originalImage"
                    />
                  </div>
                )}

                {sourcePost.tags && sourcePost.tags.length > 0 && (
                  <div className="quote-originalTags">
                    {sourcePost.tags.map((tag) => (
                      <span key={tag}>#{String(tag).replace(/^#/, "")}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}