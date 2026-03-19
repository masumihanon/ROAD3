import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-topcopy">ROAD3はいつでも帰ってこられる場所</p>

        <h1 className="auth-logo">ROAD3</h1>

        <p className="auth-comment">はじめての方へ</p>
        <button
         className="auth-secondary"
         type="button"
         onClick={() => navigate("/signup")}
         >
         新規登録
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <p className="auth-comment">おかえりなさい</p>
        <button
          className="auth-primary"
          type="button"
          onClick={() => navigate("/login")}
        >
          ログイン
        </button>
      </div>
    </div>
  );
}