"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./ProcessReceiptModal.module.scss";

export default function ProcessReceiptModal({ receipt, onClose, onSuccess }) {
  const supabase = createClient();

  const isCompleted =
    receipt.status === "issued" || receipt.status === "unissued";

  const [processType, setProcessType] = useState(
    isCompleted ? receipt.status : "issued"
  );

  const [processedBy, setProcessedBy] = useState(
    isCompleted ? receipt.processed_by ?? "" : ""
  );

  const [unissuedReason, setUnissuedReason] = useState(
    isCompleted && receipt.status === "unissued"
      ? receipt.unissued_reason ?? ""
      : ""
  );

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!processedBy.trim()) {
      alert("담당자 이름을 입력해주세요.");
      return;
    }

    if (processType === "unissued" && !unissuedReason.trim()) {
      alert("미발행 사유를 입력해주세요.");
      return;
    }

    const confirmMessage = isCompleted
      ? "현금영수증 처리 내용을 수정하시겠습니까?"
      : processType === "issued"
      ? "현금영수증 발행 처리를 완료하시겠습니까?"
      : "현금영수증 미발행 처리를 완료하시겠습니까?";

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) return;

    try {
      setIsProcessing(true);

      const { error } = await supabase
        .from("cash_receipts")
        .update({
          status: processType,
          processed_at: new Date().toISOString(),
          processed_by: processedBy.trim(),
          unissued_reason:
            processType === "unissued" ? unissuedReason.trim() : null,
        })
        .eq("id", receipt.id);

      if (error) {
        console.error("cash_receipts process error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        alert("처리 중 오류가 발생했습니다.");
        return;
      }

      alert(
        isCompleted ? "처리 내용이 수정되었습니다." : "처리가 완료되었습니다."
      );

      await onSuccess();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount) => {
    return Number(amount).toLocaleString("ko-KR");
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2>{isCompleted ? "현금영수증 처리 수정" : "현금영수증 처리"}</h2>

            <p>
              {isCompleted
                ? "처리 결과와 담당자 정보를 수정해주세요."
                : "처리 결과를 선택하고 담당자 정보를 입력해주세요."}
            </p>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className={styles.receiptSummary}>
          <div>
            <span className={styles.summaryLabel}>입금자명(학생이름)</span>
            <strong>{receipt.student_name}</strong>
          </div>

          <div>
            <span className={styles.summaryLabel}>금액</span>
            <strong>₩{formatAmount(receipt.amount)}</strong>
          </div>

          <div className={styles.receiptNumber}>
            <span className={styles.summaryLabel}>현금영수증 처리번호</span>
            <strong>{receipt.receipt_number ?? "-"}</strong>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>처리 유형</span>

            <div className={styles.radioGroup}>
              <label
                className={`${styles.radioCard} ${
                  processType === "issued" ? styles.selected : ""
                }`}
              >
                <input
                  type="radio"
                  name="processType"
                  value="issued"
                  checked={processType === "issued"}
                  onChange={(e) => setProcessType(e.target.value)}
                />

                <div>
                  <strong>발행 완료</strong>
                  <span>현금영수증 발행이 완료된 경우</span>
                </div>
              </label>

              <label
                className={`${styles.radioCard} ${
                  processType === "unissued" ? styles.selected : ""
                }`}
              >
                <input
                  type="radio"
                  name="processType"
                  value="unissued"
                  checked={processType === "unissued"}
                  onChange={(e) => setProcessType(e.target.value)}
                />

                <div>
                  <strong>미발행 처리</strong>
                  <span>현금영수증을 발행하지 않는 경우</span>
                </div>
              </label>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="processedBy">
              담당자 <span>*</span>
            </label>

            <input
              id="processedBy"
              type="text"
              value={processedBy}
              onChange={(e) => setProcessedBy(e.target.value)}
              placeholder="담당자 이름을 입력해주세요."
            />
          </div>

          {processType === "unissued" && (
            <div className={styles.field}>
              <label htmlFor="unissuedReason">
                미발행 사유 <span>*</span>
              </label>

              <input
                id="unissuedReason"
                type="text"
                value={unissuedReason}
                onChange={(e) => setUnissuedReason(e.target.value)}
                placeholder="미발행 사유를 입력해주세요."
              />
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isProcessing}
            >
              취소
            </button>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isProcessing}
            >
              {isProcessing
                ? "처리 중..."
                : isCompleted
                ? "수정하기"
                : "처리하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
