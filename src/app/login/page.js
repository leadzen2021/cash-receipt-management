import styles from "./page.module.scss";

export const metadata = {
  title: "로그인",
};

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.loginBox}>
        <div className={styles.heading}>
          <span className={styles.brand}>LEADZEN</span>

          <h1>현금영수증 기록부</h1>

          <p>계정에 로그인하여 업무를 시작하세요.</p>
        </div>

        <form className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">이메일</label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="이메일을 입력해주세요."
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">비밀번호</label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="비밀번호를 입력해주세요."
            />
          </div>

          <button className={styles.loginButton} type="submit">
            로그인
          </button>
        </form>

        <div className={styles.signup}>
          <span>계정이 없으신가요?</span>
          <a href="/signup">회원가입</a>
        </div>
      </section>
    </main>
  );
}
