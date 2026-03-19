import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "./PostDetail.css";

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function formatDate(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const open = safeParse(localStorage.getItem("openPosts"), {});
    const group = safeParse(localStorage.getItem("groupPosts"), {});
    const closed = safeParse(localStorage.getItem("closedPosts"), {});

    const merged = [
      ...Object.values(open).flat(),
      ...Object.values(group).flat(),
      ...Object.values(closed).flat(),
    ];

    const found = merged.find((p) => String(p.id) === String(postId));
    setPost(found || null);
  }, [postId]);

  useEffect(() => {
  if (!post) return;

  const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "[]");
  const savedPosts = JSON.parse(localStorage.getItem("savedPosts") || "[]");

  setLiked(likedPosts.some(p => p.id === post.id));
  setSaved(savedPosts.some(p => p.id === post.id));

}, [post]);

  const spaceLabel = useMemo(() => {
    if (!post?.space) return "シグナル";
    if (post.space === "open") return "オープンスペース";
    if (post.space === "group") return "グループスペース";
    if (post.space === "closed") return "クローズドスペース";
    return post.space;
  }, [post]);

  if (!post) {
    return (
      <div className="postDetail-page">
        <div className="postDetail-topbar">
          <button
            type="button"
            className="postDetail-back"
            onClick={() => navigate(-1)}
          >
            ← 戻る
          </button>

          <h2 className="postDetail-title">シグナル</h2>

          <div className="postDetail-right" />
        </div>

        <div className="postDetail-content">
          <div className="postDetail-empty">
            <p>投稿が見つかりません。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="postDetail-page">
      <div className="postDetail-topbar">
        <button
          type="button"
          className="postDetail-back"
          onClick={() => navigate(-1)}
        >
          ← 戻る
        </button>

        <h2 className="postDetail-title">シグナル</h2>

        <div className="postDetail-right" />
      </div>

      <div className="postDetail-content">
        <article className="postDetail-card">
          <div className="postDetail-head">
            <div className="postDetail-avatar">
              {(post.author || "?").charAt(0)}
            </div>

            <div className="postDetail-meta">
              <strong>{post.author || "名前未設定"}</strong>
              <span>{post.handle || "@---"}</span>
            </div>

            <div className="postDetail-time">{formatDate(post.timestamp)}</div>
          </div>

          <div className="postDetail-body">
            <p>{post.text || "本文なし"}</p>

            {post.image && (
              <div className="postDetail-imageBox">
                <img
                  src={post.image}
                  alt="投稿画像"
                  className="postDetail-image"
                />
              </div>
            )}
          </div>

          <div className="postDetail-footer">
            <button
              type="button"
              className="postDetail-action"
              onClick={() => alert("返信機能はこれから実装していくよ。")}
            >
              💬 返信
            </button>

            <button
  type="button"
  className="postDetail-action"
  onClick={() => {

    const likedPosts =
      JSON.parse(localStorage.getItem("likedPosts") || "[]");

    if (liked) {

      const updated =
        likedPosts.filter(p => p.id !== post.id);

      localStorage.setItem(
        "likedPosts",
        JSON.stringify(updated)
      );

      setLiked(false);

    } else {

      likedPosts.push(post);

      localStorage.setItem(
        "likedPosts",
        JSON.stringify(likedPosts)
      );

      setLiked(true);
    }
  }}
>
  {liked ? "❤️ いいね済み" : "♡ いいね"}
</button>

            <button
  type="button"
  className="postDetail-action"
  onClick={() => {

    const savedPosts =
      JSON.parse(localStorage.getItem("savedPosts") || "[]");

    if (saved) {

      const updated =
        savedPosts.filter(p => p.id !== post.id);

      localStorage.setItem(
        "savedPosts",
        JSON.stringify(updated)
      );

      setSaved(false);

    } else {

      savedPosts.push(post);

      localStorage.setItem(
        "savedPosts",
        JSON.stringify(savedPosts)
      );

      setSaved(true);
    }
  }}
>
  {saved ? "🔖 保存済み" : "🔖 保存"}
</button>

            <button
              type="button"
              className="postDetail-action"
              onClick={() => alert("共有機能はこれから実装していくよ。")}
            >
              ⤴ 共有
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}