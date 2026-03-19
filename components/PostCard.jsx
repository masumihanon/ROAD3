import "./PostCard.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function PostCard({ post, clickable = true }) {
  const navigate = useNavigate();
  const [expandedImage, setExpandedImage] = useState(null);

  const currentAccount = JSON.parse(
    localStorage.getItem("currentAccount") || "null"
  );
  const isMyPost =
    post.isMine ||
    String(currentAccount?.handle || "") === String(post.userId || "") ||
    String(currentAccount?.id || "") === String(post.accountId || "");

  const handleCardClick = () => {
    if (!clickable) return;

    navigate(`/signal/${post.id}`, {
      state: {
        post,
      },
    });
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();

    navigate(`/profile/user/${post.userId}`, {
      state: {
        user: {
          id: String(post.userId || "").replace(/^@/, ""),
          name: post.name,
          userId: post.userId,
          bio: post.bio || "自己紹介はまだありません。",
          following: post.following ?? 0,
          followers: post.followers ?? 0,
          place: post.place || "未設定",
          links: post.links || [],
          birthday: post.birthday || "非公開",
          joined: post.joined || "ROAD3開始日",
          tags: post.tags || [],
        },
      },
    });
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
      <div
        className={`post-card ${clickable ? "clickable" : ""}`}
        onClick={handleCardClick}
      >
        {post.pinned && <p className="pinned-label">📌 固定シグナル</p>}

        <div className="post-header">
          <div className="post-icon" onClick={handleProfileClick}>
            {(post.name || "?").charAt(0)}
          </div>

          <div className="post-user-info">
            <div className="post-user-top">
              <p className="post-name" onClick={handleProfileClick}>
                {post.name}
              </p>

              <p className="post-id-time">
                {post.userId} ・ {post.time}
              </p>
            </div>

            {post.replyToName && (
              <p className="reply-to-text">
                ↪ {post.replyToUserId} への返信
              </p>
            )}

            {post.isResignal && post.originalPost ? (
              <div className="resignal-box">
                <p className="resignal-label">
                  {post.isQuoteResignal ? "✍ 引用リシグナル" : "↻ リシグナル"}
                </p>

                {post.content && post.content !== post.originalPost.text && (
                  <p className="post-content">{post.content}</p>
                )}

                {post.tags && post.tags.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((tag) => {
                      const tagText = `#${String(tag).replace(/^#/, "")}`;
                      return (
                        <span
                          key={`${post.id}-quote-${tagText}`}
                          className="post-tag"
                        >
                          {tagText}
                        </span>
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

                  <p className="resignal-original-text">
                    {post.originalPost.text}
                  </p>

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

                  {post.originalPost.tags &&
                    post.originalPost.tags.length > 0 && (
                      <div className="post-tags">
                        {post.originalPost.tags.map((tag) => {
                          const tagText = `#${String(tag).replace(/^#/, "")}`;
                          return (
                            <span
                              key={`${post.id}-origin-${tagText}`}
                              className="post-tag"
                            >
                              {tagText}
                            </span>
                          );
                        })}
                      </div>
                    )}
                </div>
              </div>
            ) : (
              <>
                <p className="post-content">{post.content}</p>

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
                        <span key={tagText} className="post-tag">
                          {tagText}
                        </span>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            <div className="post-actions" onClick={(e) => e.stopPropagation()}>
              <button className="post-action-button">
                💬 {isMyPost ? post.comments ?? 0 : ""}
              </button>
              <button className="post-action-button">
                🔁 {isMyPost ? post.resignals ?? 0 : ""}
              </button>
              <button className="post-action-button">
                ❤️ {isMyPost ? post.likes ?? 0 : ""}
              </button>
              <button className="post-action-button">🏷</button>
              <button className="post-action-button">↗</button>
            </div>
          </div>
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

export default PostCard;