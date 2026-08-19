import Header from "@/components/layout/Header/Header";
import ReceiptManager from "@/components/receipt/ReceiptManager/ReceiptManager";

export const metadata = {
  title: "학원비 현금영수증",
};

export default function AcademyPage() {
  return (
    <>
      <Header />

      <ReceiptManager
        category="academy"
        title="학원비(클리닉 포함) 현금영수증"
        description="학원비 및 클리닉 비용 현금영수증 내역을 관리합니다."
      />
    </>
  );
}
