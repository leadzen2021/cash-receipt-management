"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./Header.module.scss";

export default function Header() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("로그아웃 중 오류가 발생했습니다.");
      return;
    }

    router.push("/login");
    router.refresh();
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <Image
            src="/logo.png"
            alt="리드젠"
            width={140}
            height={46}
            className={styles.logo}
          />

          <span className={styles.divider} />

          <span className={styles.title}>현금영수증 기록부</span>
        </Link>

        <button
          className={styles.logoutButton}
          type="button"
          onClick={handleLogout}
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
