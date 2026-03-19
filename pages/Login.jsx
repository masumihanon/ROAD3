import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const DEV_CODE = "000000"; // ←開発用：固定コード

export default function Login() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1:電話番号 2:コード
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const normalizedPhone = useMemo(() => phone.replace(/[^\d]/g, ""), [phone]);

  useEffect(() => {
    setError("");
  }, [phone, code, step]);

  const sendCode = () => {
    if (normalizedPhone.length < 10) {
      setError("電話番号を正しく入力してね");
      return;
    }

    // 本来はここでSMS送信APIを呼ぶ
    // 開発中は送ったフリだけして次へ
    setStep(2);

    // 便利：consoleに出しておく（デバッグ用）
    console.log("[DEV] Login code is:", DEV_CODE);
  };

  const ensureDefaultAccount = () => {
    const saved = localStorage.getItem("currentAccount");
    if (!saved) {
      const defaultAccount = { id: 1, type: "personal", name: "namine" };
      localStorage.setItem("currentAccount", JSON.stringify(defaultAccount));
    }
  };

  const doLogin = () => {
    if (code.trim() !== DEV_CODE) {
      setError(`開発中はコード「${DEV_CODE}」でログインできるよ`);
      return;
    }

    // ログイン状態保存
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("lastLoginAt", String(Date.now()));

    ensureDefaultAccount();
    navigate("/personal");
  };

  const demoLogin = () => {
    // UI確認用のワンクリック
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("lastLoginAt", String(Date.now()));

    ensureDefaultAccount();
    navigate("/personal");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-topcopy">ROAD3はいつでも帰ってこられる場所</p>
        <h1 className="auth-logo">ROAD3</h1>

        <p className="auth-comment">おかえりなさい</p>

        {step === 1 && (
          <>
            <label className="auth-label">電話番号</label>
            <input
              className="auth-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="例：09012345678"
              inputMode="tel"
              autoComplete="tel"
            />

            {error && <p className="auth-error">{error}</p>}

            <button className="auth-primary" type="button" onClick={sendCode}>
              認証コードを送る（開発版）
            </button>

            <button className="auth-ghost" type="button" onClick={demoLogin}>
              デモログイン（ワンクリック）
            </button>

            <button
              className="auth-secondary"
              type="button"
              onClick={() => navigate("/")}
            >
              戻る
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="auth-help">
              SMSにメッセージを送信しました（開発版）
              <br />
              ※ 開発中は <b>{DEV_CODE}</b> を入力すると通るよ
            </p>

            <label className="auth-label">認証コード</label>
            <input
              className="auth-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6桁"
              inputMode="numeric"
              autoComplete="one-time-code"
            />

            {error && <p className="auth-error">{error}</p>}

            <div className="auth-row">
              <button
                className="auth-secondary"
                type="button"
                onClick={() => setStep(1)}
              >
                戻る
              </button>
              <button className="auth-primary" type="button" onClick={doLogin}>
                ログイン
              </button>
            </div>

            <button className="auth-ghost" type="button" onClick={sendCode}>
              コードを再送（開発版）
            </button>
          </>
        )}
      </div>
    </div>
  );
}