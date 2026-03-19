import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OpenPostCard from "../components/OpenPostCard";
import "./SearchTag.css";

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function SearchTag() {
  const navigate = useNavigate();
  const { tagName } = useParams();

  const decodedTag = `#${decodeURIComponent(tagName || "").replace(/^#/, "")}`;

  const openPosts = useMemo(() => {
    const stored = safeParse(localStorage.getItem("openPosts"), {});
    return Object.values(stored).flat().filter(Boolean);
  }, []);

  const tagPosts = useMemo(() => {
    return [...openPosts]
      .filter((post) =>
        (post.tags || []).some(
          (tag) => `#${String(tag).replace(/^#/, "")}` === decodedTag
        )
      )
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [openPosts, decodedTag]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    const diffMs = Date.now() - timestamp;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "たった今";
    if (diffMin < 60) return `${diffMin}分前`;
    if (diffHour < 24) return `${diffHour}時間前`;
    return `${diffDay}日前`;
  };

  const handleToggleLike = (postId) => {
    const stored = safeParse(localStorage.getItem("openPosts"), {});
    const updated = {};

    Object.keys(stored).forEach((accountId) => {
      updated[accountId] = (stored[accountId] || []).map((post) => {
        if (post.id !== postId) return post;

        const nextLiked = !post.liked;
        return {
          ...post,
          liked: nextLiked,
          likeCount: Math.max(
            0,
            (post.likeCount || 0) + (nextLiked ? 1 : -1)
          ),
        };
      });
    });

    localStorage.setItem("openPosts", JSON.stringify(updated));
    window.location.reload();
  };

  const handleToggleSave = (postId) => {
    const stored = safeParse(localStorage.getItem("openPosts"), {});
    const savedPosts = safeParse(localStorage.getItem("savedPosts"), []);
    let targetPost = null;
    const updated = {};

    Object.keys(stored).forEach((accountId) => {
      updated[accountId] = (stored[accountId] || []).map((post) => {
        if (post.id !== postId) return post;

        const nextSaved = !post.saved;
        targetPost = {
          ...post,
          saved: nextSaved,
        };

        return targetPost;
      });
    });

    localStorage.setItem("openPosts", JSON.stringify(updated));

    if (!targetPost) {
      window.location.reload();
      return;
    }

    const exists = savedPosts.some((p) => String(p.id) === String(postId));

    if (targetPost.saved && !exists) {
      localStorage.setItem(
        "savedPosts",
        JSON.stringify([targetPost, ...savedPosts])
      );
    }

    if (!targetPost.saved && exists) {
      localStorage.setItem(
        "savedPosts",
        JSON.stringify(savedPosts.filter((p) => String(p.id) !== String(postId)))
      );
    }

    window.location.reload();
  };

  const handleToggleResignal = (postId) => {
    const current = safeParse(localStorage.getItem("currentAccount"), null);
    if (!current) return;

    const ownerId = String(current.id);
    const stored = safeParse(localStorage.getItem("openPosts"), {});
    let targetPost = null;

    Object.values(stored)
      .flat()
      .forEach((post) => {
        if (String(post.id) === String(postId)) {
          targetPost = post;
        }
      });

    if (!targetPost) return;

    const myPosts = stored[ownerId] || [];

    const existingResignal = myPosts.find(
      (post) =>
        post.isResignal &&
        String(post.originalPost?.id) === String(postId)
    );

    let updated = { ...stored };

    if (existingResignal) {
      updated[ownerId] = myPosts.filter(
        (post) => String(post.id) !== String(existingResignal.id)
      );

      updated = Object.fromEntries(
        Object.entries(updated).map(([accountId, posts]) => [
          accountId,
          posts.map((post) => {
            if (String(post.id) !== String(postId)) return post;
            return {
              ...post,
              resignaled: false,
              resignalCount: Math.max(0, (post.resignalCount ?? 0) - 1),
            };
          }),
        ])
      );
    } else {
      const newResignal = {
        id: Date.now(),
        text: targetPost.text,
        timestamp: Date.now(),
        author: current.name || "名前未設定",
        accountId: current.id,
        handle: current.handle || `@${current.id}`,
        space: "open",
        tags: targetPost.tags || [],
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
        originalPost: {
          id: targetPost.id,
          author: targetPost.author,
          handle: targetPost.handle,
          text: targetPost.text,
          timestamp: targetPost.timestamp,
        },
      };

      updated[ownerId] = [newResignal, ...myPosts];

      updated = Object.fromEntries(
        Object.entries(updated).map(([accountId, posts]) => [
          accountId,
          posts.map((post) => {
            if (String(post.id) !== String(postId)) return post;
            return {
              ...post,
              resignaled: true,
              resignalCount: (post.resignalCount ?? 0) + 1,
            };
          }),
        ])
      );
    }

    localStorage.setItem("openPosts", JSON.stringify(updated));
    window.location.reload();
  };

  const handleDelete = (postId) => {
    const confirmed = window.confirm("このシグナルを削除しますか？");
    if (!confirmed) return;

    const stored = safeParse(localStorage.getItem("openPosts"), {});
    const updated = {};

    Object.keys(stored).forEach((accountId) => {
      updated[accountId] = (stored[accountId] || []).filter(
        (post) => post.id !== postId
      );
    });

    localStorage.setItem("openPosts", JSON.stringify(updated));
    window.location.reload();
  };

  return (
    <div className="search-tag-page">
      <div className="search-tag-header">
        <button
          type="button"
          className="search-tag-back"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <div className="search-tag-header-text">
          <h2>{decodedTag}</h2>
          <p>{tagPosts.length}件のシグナル</p>
        </div>
      </div>

      <div className="search-tag-content">
        {tagPosts.length > 0 ? (
          tagPosts.map((post) => (
            <OpenPostCard
              key={post.id}
              post={post}
              formatTime={formatTime}
              onToggleLike={handleToggleLike}
              onToggleSave={handleToggleSave}
              onToggleResignal={handleToggleResignal}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <p className="search-tag-empty">
            このタグのシグナルはまだありません
          </p>
        )}
      </div>
    </div>
  );
}

export default SearchTag;