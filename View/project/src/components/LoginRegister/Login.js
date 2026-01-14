import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../api";
import "./Login.css";

export default function Login() {
  const [input, setInput] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }

    // Load saved email if remember me was checked
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setInput((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!input.email || !input.password) {
        setError("Vui lòng nhập đầy đủ email và mật khẩu");
        setLoading(false);
        return;
      }

      const response = await login(input);

      if (response && (response.token || response.accessToken)) {
        const token = response.token || response.accessToken;
        const cleanToken = token.startsWith("Bearer ")
          ? token.substring(7)
          : token;

        localStorage.setItem("token", cleanToken);

        // Save email if remember me is checked
        if (rememberMe) {
          localStorage.setItem("savedEmail", input.email);
        } else {
          localStorage.removeItem("savedEmail");
        }

        window.dispatchEvent(new Event("storage"));

        setTimeout(() => {
          navigate("/");
        }, 100);
      } else {
        setError("Định dạng phản hồi không đúng. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      setError(
        err.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Continue your learning journey.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <div className="input-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <polyline points="3 7 12 13 21 7" />
              </svg>
            </div>
            <input
              type="email"
              placeholder="Email"
              value={input.email}
              onChange={(e) => setInput({ ...input, email: e.target.value })}
              className="login-input"
              required
            />
          </div>

          <div className="login-input-group">
            <div className="input-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={input.password}
              onChange={(e) => setInput({ ...input, password: e.target.value })}
              className="login-input"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? (
              <span className="login-loading-text">
                <span className="login-loading-spinner"></span>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="login-register-link">
            Don't have an account?{" "}
            <Link to="/register" className="login-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
