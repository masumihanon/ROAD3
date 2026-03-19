import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function OpenPostCard({
  post,
  formatTime,
  onToggleLike,
  onToggleSave,
  onToggleResignal,
  onDelete,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResignalMenuOpen, setIsResignalMenuOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const navigate = useNavigate();
  const resignalMenuRef = useRef(null);

  const currentAccount = JSON.parse(
    localStorage.getItem("currentAccount") || "null"
  );
  const isMyPost =
    String(currentAccount?.id || "") === String(post?.accountId || "");

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        resignalMenuRef.current &&
        !resignalMenuRef.current.contains(e.target)
      ) {
        setIsResignalMenuOpen(false);
      }
    };

    if (isResignalMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isResignalMenuOpen]);

  const openUserProfile = (e) => {
    e.stopPropagation();

    if (!post?.accountId) return;

    const currentId = String(currentAccount?.id || "");
    const postAccountId = String(post.accountId);

    if (currentId && currentId === postAccountId) {
      navigate("/profile");
      return;
    }

    navigate(`/profile/user/${post.accountId}`, {
      state: {
        user: {
          id: post.accountId,
          name: post.author || "ユーザー名",
          userId: post.handle || `@${post.accountId}`,
          bio: post.bio || "自己紹介はまだありません。",
          following: post.following ?? 0,
          followers: post.followers ?? 0,
          place: post.place || "未設定",
          links: post.links || [],
          birthday: post.birthday || "非公開",
          joined: post.joined || "ROAD3利用開始日",
          tags: post.tags || [],
        },
        posts: {
          signal: [
            {
              id: post.id,
              pinned: false,
              name: post.author || "ユーザー名",
              userId: post.handle || `@${post.accountId}`,
              time: formatTime(post.timestamp),
              content: post.text,
              comments: post.commentCount ?? 0,
              resignals: isMyPost ? post.resignalCount ?? 0 : null,
              likes: isMyPost ? post.likeCount ?? 0 : null,
              bio: post.bio || "",
              following: post.following ?? 0,
              followers: post.followers ?? 0,
              place: post.place || "",
              links: post.links || [],
              birthday: post.birthday || "",
              joined: post.joined || "",
              tags: post.tags || [],
              image: post.image || null,
              isResignal: post.isResignal || false,
              isQuoteResignal: post.isQuoteResignal || false,
              originalPost: post.originalPost || null,
              accountId: post.accountId,
              likeCount: isMyPost ? post.likeCount ?? 0 : null,
            },
          ],
          reply: [],
          media: [],
          video: [],
        },
      },
    });
  };

  const openSignalThread = () => {
    navigate(`/signal/${post.id}`, {
      state: {
        post: {
          id: post.id,
          name: post.author || "ユーザー名",
          userId: post.handle || `@${post.accountId}`,
          time: formatTime(post.timestamp),
          content: post.text,
          comments: post.commentCount ?? 0,
          resignals: isMyPost ? post.resignalCount ?? 0 : null,
          likes: isMyPost ? post.likeCount ?? 0 : null,
          level: 0,
          isMine: isMyPost,
          bio: post.bio || "",
          following: post.following ?? 0,
          followers: post.followers ?? 0,
          place: post.place || "",
          links: post.links || [],
          birthday: post.birthday || "",
          joined: post.joined || "",
          tags: post.tags || [],
          image: post.image || null,
          isResignal: post.isResignal || false,
          isQuoteResignal: post.isQuoteResignal || false,
          originalPost: post.originalPost || null,
          accountId: post.accountId,
          likeCount: isMyPost ? post.likeCount ?? 0 : null,
        },
      },
    });
  };

  const openTagPage = (e, tag) => {
    e.stopPropagation();
    const normalizedTag = `#${String(tag).replace(/^#/, "")}`;
    navigate(
      `/search/tag/${encodeURIComponent(normalizedTag.replace(/^#/, ""))}`
    );
  };

  const openQuoteResignal = (e) => {
    e.stopPropagation();
    setIsResignalMenuOpen(false);

    navigate("/quote-resignal", {
      state: {
        post,
      },
    });
  };

  const handleResignalClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsResignalMenuOpen((prev) => !prev);
  };

  const handleNormalResignal = (e) => {
    e.stopPropagation();
    setIsResignalMenuOpen(false);
    onToggleResignal(post.id);
  };

  const handleImageClick = (e, imageSrc) => {
    e.stopPropagation();
    setExpandedImage(imageSrc);
  };

  const closeImageModal = (e) => {
    e.stopPropagation();
    setExpandedImage(null);
  };

  return (
    <>
      <div className="open-post" onClick={openSignalThread}>
        <div className="post-header">
          <div className="post-user">
            <button
              type="button"
              className="avatar-dot"
              onClick={openUserProfile}
              title="プロフィールを見る"
            >
              {(post.author || "?").charAt(0)}
            </button>

            <button
              type="button"
              className="name-line profile-linkBtn"
              onClick={openUserProfile}
              title="プロフィールを見る"
            >
              <strong className="author">{post.author}</strong>
              <span className="handle">
                {post.handle || `@${post.accountId}`}
              </span>
              <small className="time">・{formatTime(post.timestamp)}</small>
            </button>
          </div>

          <div className="post-menu">
            <button
              className="menu-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsResignalMenuOpen(false);
                setIsMenuOpen((v) => !v);
              }}
              aria-label="メニュー"
              type="button"
            >
              ⋯
            </button>

            {isMenuOpen && (
              <div
                className="menu-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                {isMyPost && (
                  <button
                    className="menu-item danger"
                    onClick={() => {
                      onDelete(post.id);
                      setIsMenuOpen(false);
                    }}
                    type="button"
                  >
                    削除
                  </button>
                )}

                <button
                  className="menu-item"
                  onClick={() => setIsMenuOpen(false)}
                  type="button"
                >
                  閉じる
                </button>
              </div>
            )}
          </div>
        </div>

        {post.isResignal && post.originalPost ? (
          <div className="resignal-box">
            <p className="resignal-label">
              {post.isQuoteResignal ? "✍ 引用リシグナル" : "↻ リシグナル"}
            </p>

            {post.text && post.text !== post.originalPost.text && (
              <p className="post-text">{post.text}</p>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="post-tags">
                {post.tags.map((tag) => {
                  const tagText = `#${String(tag).replace(/^#/, "")}`;

                  return (
                    <button
                      key={`${post.id}-quote-${tagText}`}
                      className="post-tag"
                      type="button"
                      onClick={(e) => openTagPage(e, tag)}
                    >
                      {tagText}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="resignal-original">
              <div className="resignal-original-top">
                <div className="resignal-original-avatar">
                  {(post.originalPost.author || "?").charAt(0)}
                </div>

                <div className="resignal-original-head">
                  <strong>{post.originalPost.author}</strong>
                  <span>{post.originalPost.handle}</span>
                </div>
              </div>

              <p className="resignal-original-text">{post.originalPost.text}</p>

              {post.originalPost.image && (
                <div className="post-imageWrap">
                  <img
                    src={post.originalPost.image}
                    alt="元シグナルの画像"
                    className="post-image"
                    onClick={(e) =>
                      handleImageClick(e, post.originalPost.image)
                    }
                  />
                </div>
              )}

              {post.originalPost.tags && post.originalPost.tags.length > 0 && (
                <div className="post-tags">
                  {post.originalPost.tags.map((tag) => {
                    const tagText = `#${String(tag).replace(/^#/, "")}`;

                    return (
                      <button
                        key={`${post.id}-origin-${tagText}`}
                        className="post-tag"
                        type="button"
                        onClick={(e) => openTagPage(e, tag)}
                      >
                        {tagText}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <p className="post-text">{post.text}</p>

            {post.image && (
              <div className="post-imageWrap">
                <img
                  src={post.image}
                  alt="投稿画像"
                  className="post-image"
                  onClick={(e) => handleImageClick(e, post.image)}
                />
              </div>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="post-tags">
                {post.tags.map((tag) => {
                  const tagText = `#${String(tag).replace(/^#/, "")}`;

                  return (
                    <button
                      key={`${post.id}-${tagText}`}
                      className="post-tag"
                      type="button"
                      onClick={(e) => openTagPage(e, tag)}
                    >
                      {tagText}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="post-actions" onClick={(e) => e.stopPropagation()}>
          <button className="action-btn" type="button" title="返信(予定)">
            💬
          </button>

          <div className="resignal-action-wrap" ref={resignalMenuRef}>
            <button
              className={`action-btn ${post.resignaled ? "active" : ""}`}
              onClick={handleResignalClick}
              type="button"
              title="リシグナル"
            >
              ↻
              {isMyPost && (
                <span className="count">{post.resignalCount ?? 0}</span>
              )}
            </button>

            {isResignalMenuOpen && (
              <div
                className="resignal-menu"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="resignal-menu-item"
                  onClick={handleNormalResignal}
                >
                  ↻ リシグナル
                </button>
                <button
                  type="button"
                  className="resignal-menu-item"
                  onClick={openQuoteResignal}
                >
                  ✍ 引用リシグナル
                </button>
              </div>
            )}
          </div>

          <button
            className={`action-btn ${post.liked ? "liked" : ""}`}
            onClick={() => onToggleLike(post.id)}
            type="button"
            title="いいね"
          >
            ♡
            {isMyPost && <span className="count">{post.likeCount ?? 0}</span>}
          </button>

          <button
            className={`action-btn ${post.saved ? "active" : ""}`}
            onClick={() => onToggleSave(post.id)}
            type="button"
            title="保存"
          >
            🔖
          </button>
        </div>
      </div>

      {expandedImage && (
        <div className="post-image-modal" onClick={closeImageModal}>
          <img
            src={expandedImage}
            alt="拡大画像"
            className="post-image-modal-img"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="post-image-modal-close"
            onClick={closeImageModal}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

export default OpenPostCard;