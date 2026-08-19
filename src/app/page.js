import Link from "next/link";
import Header from "@/components/layout/Header/Header";
import styles from "./page.module.scss";

export default function HomePage() {
  return (
    <>
      <Header />

      <main className={styles.page}>
        <section className={styles.container}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>CASH RECEIPT MANAGEMENT</p>
            <h1>현금영수증 업무</h1>
            <p className={styles.description}>
              처리할 현금영수증 업무를 선택해주세요.
            </p>
          </div>

          <div className={styles.categoryGrid}>
            <Link href="/academy" className={styles.categoryCard}>
              <div className={styles.cardNumber}>01</div>

              <div className={styles.cardContent}>
                <span className={styles.cardLabel}>ACADEMY</span>

                <h2>
                  학원비
                  <br />
                  현금영수증
                </h2>

                <p>학원비 및 클리닉 비용 현금영수증 내역을 관리합니다.</p>
              </div>

              <div className={styles.cardBottom}>
                <span>바로가기</span>
                <span className={styles.arrow}>→</span>
              </div>
            </Link>

            <Link href="/material" className={styles.categoryCard}>
              <div className={styles.cardNumber}>02</div>

              <div className={styles.cardContent}>
                <span className={styles.cardLabel}>MATERIALS</span>

                <h2>
                  모의고사비
                  <br />
                  현금영수증
                </h2>

                <p>모의고사비(청연에듀) 현금영수증 내역을 관리합니다.</p>
              </div>

              <div className={styles.cardBottom}>
                <span>바로가기</span>
                <span className={styles.arrow}>→</span>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
