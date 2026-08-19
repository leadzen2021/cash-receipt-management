"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.scss";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (formData.password !== formData.passwordConfirm) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("비밀번호는 6자 이상 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      alert("회원가입이 완료되었습니다.");

      router.push("/login");
    } catch (error) {
      console.error(error);
      setErrorMessage("회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.signupBox}>
        <div className={styles.heading}>
          <Image
            src="/logo.png"
            alt="리드젠"
            width={150}
            height={50}
            className={styles.logo}
            priority
          />

          <h1>회원가입</h1>
          <p>현금영수증 기록부를 이용할 계정을 생성해주세요.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="name">이름</label>

            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력해주세요."
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">이메일</label>

            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="이메일을 입력해주세요."
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">비밀번호</label>

            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력해주세요."
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="passwordConfirm">비밀번호 확인</label>

            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              value={formData.passwordConfirm}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력해주세요."
              required
            />
          </div>

          {errorMessage && (
            <p className={styles.errorMessage}>{errorMessage}</p>
          )}

          <button
            className={styles.signupButton}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <div className={styles.login}>
          <span>이미 계정이 있으신가요?</span>
          <Link href="/login">로그인</Link>
        </div>
      </section>
    </main>
  );
}
