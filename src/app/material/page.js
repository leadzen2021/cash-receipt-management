import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header/Header";
import ReceiptManager from "@/components/receipt/ReceiptManager/ReceiptManager";

export const metadata = {
  title: "모의고사비 현금영수증",
};

export default async function MaterialPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <Header />

      <Suspense fallback={null}>
        <ReceiptManager
          category="material"
          title="모의고사비(청연에듀) 현금영수증"
          description="청연에듀 모의고사비 현금영수증 내역을 관리합니다."
        />
      </Suspense>
    </>
  );
}
