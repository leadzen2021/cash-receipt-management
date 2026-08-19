import { Suspense } from "react";
import Header from "@/components/layout/Header/Header";
import ReceiptManager from "@/components/receipt/ReceiptManager/ReceiptManager";

export const metadata = {
  title: "모의고사비 현금영수증",
};

export default function MaterialPage() {
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
