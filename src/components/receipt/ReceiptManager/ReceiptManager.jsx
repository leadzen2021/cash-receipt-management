"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./ReceiptManager.module.scss";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import ProcessReceiptModal from "@/components/receipt/ProcessReceiptModal/ProcessReceiptModal";
import * as XLSX from "xlsx";

const ITEMS_PER_PAGE = 20;

const initialReceipt = {
  depositDate: "",
  seatNumber: "",
  studentName: "",
  amount: "",
  paymentReason: "",
  receiptNumber: "",
  pendingReason: "no_receipt_number",
  customPendingReason: "",
};

const pendingReasonLabels = {
  no_receipt_number: "현금영수증처리번호 받지 않음",
  not_processed: "미처리",
  academy_hold: "학원 사정으로 보류",
};

export default function ReceiptManager({ category, title, description }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const supabase = createClient();
  const tableAreaRef = useRef(null);

  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState(
    tabParam === "completed" ? "completed" : "pending"
  );

  const [sortOrder, setSortOrder] = useState("latest");

  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newReceipt, setNewReceipt] = useState(initialReceipt);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedReceiptId, setSelectedReceiptId] = useState(null);

  // 수정 관련
  const [editingReceiptId, setEditingReceiptId] = useState(null);
  const [editReceipt, setEditReceipt] = useState(initialReceipt);
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal
  const [processingReceipt, setProcessingReceipt] = useState(null);

  const fetchReceipts = async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from("cash_receipts")
        .select("*")
        .eq("category", category)
        .is("deleted_at", null);

      if (activeTab === "pending") {
        query = query.eq("status", "pending");
      } else {
        query = query.in("status", ["issued", "unissued"]);
      }

      query = query.order("deposit_date", {
        ascending: sortOrder === "oldest",
      });

      const { data, error } = await query;

      if (error) {
        console.error("cash_receipts fetch error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        return;
      }

      setReceipts(data ?? []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [category, activeTab, sortOrder]);

  useEffect(() => {
    const nextTab =
      searchParams.get("tab") === "completed" ? "completed" : "pending";

    setActiveTab(nextTab);
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedYear, selectedMonth, sortOrder, searchTerm]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        selectedReceiptId &&
        !editingReceiptId &&
        tableAreaRef.current &&
        !tableAreaRef.current.contains(e.target)
      ) {
        setSelectedReceiptId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [selectedReceiptId, editingReceiptId]);

  const handleNewReceiptChange = (e) => {
    const { name, value } = e.target;

    setNewReceipt((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");

    setNewReceipt((prev) => ({
      ...prev,
      amount: value,
    }));
  };

  const handleEditReceiptChange = (e) => {
    const { name, value } = e.target;

    setEditReceipt((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");

    setEditReceipt((prev) => ({
      ...prev,
      amount: value,
    }));
  };

  const handleAddReceipt = () => {
    setSelectedReceiptId(null);
    setNewReceipt(initialReceipt);
    setIsAdding(true);
  };

  const handleCancelAdd = () => {
    const confirmed = window.confirm("작성 중인 내역을 취소하시겠습니까?");

    if (!confirmed) return;

    setIsAdding(false);
    setNewReceipt(initialReceipt);
  };

  const handleSaveReceipt = async () => {
    if (!newReceipt.depositDate) {
      alert("입금일을 선택해주세요.");
      return;
    }

    if (!newReceipt.studentName.trim()) {
      alert("입금자명을 입력해주세요.");
      return;
    }

    if (!newReceipt.amount || Number(newReceipt.amount) <= 0) {
      alert("금액을 올바르게 입력해주세요.");
      return;
    }

    if (
      newReceipt.pendingReason === "etc" &&
      !newReceipt.customPendingReason.trim()
    ) {
      alert("기타 미완 사유를 입력해주세요.");
      return;
    }

    try {
      setIsSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("로그인 정보를 확인할 수 없습니다.");
        return;
      }

      const pendingReason =
        newReceipt.pendingReason === "etc"
          ? newReceipt.customPendingReason.trim()
          : newReceipt.pendingReason;

      const { error } = await supabase.from("cash_receipts").insert({
        category,
        deposit_date: newReceipt.depositDate,
        seat_number: newReceipt.seatNumber.trim() || null,
        student_name: newReceipt.studentName.trim(),
        amount: Number(newReceipt.amount),
        payment_reason: newReceipt.paymentReason.trim() || null,
        receipt_number: newReceipt.receiptNumber.trim() || null,
        status: "pending",
        pending_reason: pendingReason,
        created_by: user.id,
      });

      if (error) {
        console.error("cash_receipts insert error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        alert("내역을 저장하는 중 오류가 발생했습니다.");
        return;
      }

      setIsAdding(false);
      setNewReceipt(initialReceipt);

      await fetchReceipts();
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (receipt) => {
    let pendingReason = receipt.pending_reason ?? "no_receipt_number";
    let customPendingReason = "";

    const isPresetReason = [
      "no_receipt_number",
      "not_processed",
      "academy_hold",
    ].includes(pendingReason);

    if (!isPresetReason) {
      customPendingReason = pendingReason;
      pendingReason = "etc";
    }

    setEditReceipt({
      depositDate: receipt.deposit_date ?? "",
      seatNumber: receipt.seat_number ?? "",
      studentName: receipt.student_name ?? "",
      amount: receipt.amount ? String(receipt.amount) : "",
      paymentReason: receipt.payment_reason ?? "",
      receiptNumber: receipt.receipt_number ?? "",
      pendingReason,
      customPendingReason,
    });

    setEditingReceiptId(receipt.id);
    setSelectedReceiptId(receipt.id);
  };

  const handleCancelEdit = () => {
    const confirmed = window.confirm("수정 중인 내용을 취소하시겠습니까?");

    if (!confirmed) return;

    setEditingReceiptId(null);
    setEditReceipt(initialReceipt);
    setSelectedReceiptId(null);
  };

  const handleUpdateReceipt = async (receiptId) => {
    if (!editReceipt.depositDate) {
      alert("입금일을 선택해주세요.");
      return;
    }

    if (!editReceipt.studentName.trim()) {
      alert("입금자명을 입력해주세요.");
      return;
    }

    if (!editReceipt.amount || Number(editReceipt.amount) <= 0) {
      alert("금액을 올바르게 입력해주세요.");
      return;
    }

    if (
      editReceipt.pendingReason === "etc" &&
      !editReceipt.customPendingReason.trim()
    ) {
      alert("기타 미완 사유를 입력해주세요.");
      return;
    }

    const pendingReason =
      editReceipt.pendingReason === "etc"
        ? editReceipt.customPendingReason.trim()
        : editReceipt.pendingReason;

    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from("cash_receipts")
        .update({
          deposit_date: editReceipt.depositDate,
          seat_number: editReceipt.seatNumber.trim() || null,
          student_name: editReceipt.studentName.trim(),
          amount: Number(editReceipt.amount),
          payment_reason: editReceipt.paymentReason.trim() || null,
          receipt_number: editReceipt.receiptNumber.trim() || null,
          pending_reason: pendingReason,
        })
        .eq("id", receiptId)
        .eq("status", "pending");

      if (error) {
        console.error("cash_receipts update error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        alert("내역을 수정하는 중 오류가 발생했습니다.");
        return;
      }

      setEditingReceiptId(null);
      setEditReceipt(initialReceipt);
      setSelectedReceiptId(null);

      await fetchReceipts();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteReceipt = async (receipt) => {
    const confirmed = window.confirm(
      `${receipt.student_name}님의 내역을 삭제하시겠습니까?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("cash_receipts")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", receipt.id)
      .eq("status", "pending");

    if (error) {
      console.error(error);
      alert("삭제 중 오류가 발생했습니다.");
      return;
    }

    setSelectedReceiptId(null);

    await fetchReceipts();
  };

  const formatAmount = (amount) => {
    return Number(amount).toLocaleString("ko-KR");
  };

  const formatProcessedDate = (dateString) => {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getPendingReasonLabel = (reason) => {
    return pendingReasonLabels[reason] ?? reason ?? "-";
  };

  const normalizedSearchTerm = searchTerm.trim().replace(/\s/g, "");

  const filteredPendingReceipts =
    activeTab === "pending"
      ? receipts.filter((receipt) => {
          if (!receipt.deposit_date) return false;

          const [year, month] = receipt.deposit_date.split("-");

          const yearMatches = year === selectedYear;

          const monthMatches =
            selectedMonth === "" || Number(month) === Number(selectedMonth);

          const studentName = (receipt.student_name ?? "").replace(/\s/g, "");

          const searchMatches =
            normalizedSearchTerm === "" ||
            studentName.includes(normalizedSearchTerm);

          return yearMatches && monthMatches && searchMatches;
        })
      : receipts;

  const filteredCompletedReceipts =
    activeTab === "completed"
      ? receipts.filter((receipt) => {
          if (!receipt.processed_at) return false;

          const processedDate = new Date(receipt.processed_at);

          const yearMatches =
            processedDate.getFullYear() === Number(selectedYear);

          const monthMatches =
            selectedMonth === "" ||
            processedDate.getMonth() + 1 === Number(selectedMonth);

          const studentName = (receipt.student_name ?? "").replace(/\s/g, "");

          const searchMatches =
            normalizedSearchTerm === "" ||
            studentName.includes(normalizedSearchTerm);

          return yearMatches && monthMatches && searchMatches;
        })
      : receipts;

  const currentReceipts =
    activeTab === "pending"
      ? filteredPendingReceipts
      : filteredCompletedReceipts;

  const totalPages = Math.ceil(currentReceipts.length / ITEMS_PER_PAGE);

  const paginatedReceipts = currentReceipts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleExcelDownload = () => {
    const downloadReceipts =
      activeTab === "pending"
        ? filteredPendingReceipts
        : filteredCompletedReceipts;

    if (downloadReceipts.length === 0) {
      alert("다운로드할 내역이 없습니다.");
      return;
    }

    let excelData;

    if (activeTab === "pending") {
      excelData = downloadReceipts.map((receipt) => ({
        입금일: receipt.deposit_date,
        좌석번호: receipt.seat_number ?? "",
        "입금자명(학생이름)": receipt.student_name,
        "금액(₩)": Number(receipt.amount),
        사유: receipt.payment_reason ?? "",
        현금영수증처리번호: receipt.receipt_number ?? "",
        처리여부: "미완",
        "미완 사유": getPendingReasonLabel(receipt.pending_reason),
      }));
    } else {
      excelData = downloadReceipts.map((receipt) => ({
        입금일: receipt.deposit_date,
        좌석번호: receipt.seat_number ?? "",
        "입금자명(학생이름)": receipt.student_name,
        "금액(₩)": Number(receipt.amount),
        사유: receipt.payment_reason ?? "",
        현금영수증처리번호: receipt.receipt_number ?? "",
        처리여부: receipt.status === "issued" ? "발행" : "미발행",
        "미발행 사유": receipt.unissued_reason ?? "",
        처리일자: formatProcessedDate(receipt.processed_at),
        담당자: receipt.processed_by ?? "",
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] =
      activeTab === "pending"
        ? [
            { wch: 14 },
            { wch: 12 },
            { wch: 20 },
            { wch: 16 },
            { wch: 22 },
            { wch: 24 },
            { wch: 12 },
            { wch: 32 },
          ]
        : [
            { wch: 14 },
            { wch: 12 },
            { wch: 20 },
            { wch: 16 },
            { wch: 22 },
            { wch: 24 },
            { wch: 12 },
            { wch: 24 },
            { wch: 16 },
            { wch: 14 },
          ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      activeTab === "pending" ? "처리 예정" : "처리 완료"
    );

    const today = new Date();

    const dateString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const categoryName = category === "academy" ? "학원비" : "모의고사비";

    const tabName = activeTab === "pending" ? "처리예정" : "처리완료";

    const periodName = `_${selectedYear}년${
      selectedMonth ? `_${selectedMonth}월` : "_전체"
    }`;

    const searchName =
      normalizedSearchTerm !== "" ? `_${normalizedSearchTerm}` : "";

    const fileName = `${categoryName}_현금영수증_${tabName}${periodName}${searchName}_${dateString}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const handlePendingTab = () => {
    setActiveTab("pending");
    setSelectedReceiptId(null);
    setProcessingReceipt(null);

    router.replace(pathname);
  };

  const handleCompletedTab = () => {
    setActiveTab("completed");
    setSelectedReceiptId(null);
    setIsAdding(false);
    setEditingReceiptId(null);
    setProcessingReceipt(null);

    router.replace(`${pathname}?tab=completed`);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className={styles.pagination}>
        <button
          type="button"
          onClick={() => setCurrentPage((prev) => prev - 1)}
          disabled={currentPage === 1}
        >
          이전
        </button>

        <div className={styles.pageNumbers}>
          {Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;

            return (
              <button
                key={page}
                type="button"
                className={currentPage === page ? styles.activePage : ""}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={currentPage === totalPages}
        >
          다음
        </button>
      </div>
    );
  };

  const renderFilters = (yearId) => {
    return (
      <div className={styles.completedFilters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="학생 이름 검색"
            aria-label="학생 이름 검색"
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor={yearId}>조회기간</label>

          <select
            id={yearId}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="2026">2026년</option>
            <option value="2025">2025년</option>
          </select>

          <select
            aria-label="조회 월"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">전체 월</option>
            <option value="1">1월</option>
            <option value="2">2월</option>
            <option value="3">3월</option>
            <option value="4">4월</option>
            <option value="5">5월</option>
            <option value="6">6월</option>
            <option value="7">7월</option>
            <option value="8">8월</option>
            <option value="9">9월</option>
            <option value="10">10월</option>
            <option value="11">11월</option>
            <option value="12">12월</option>
          </select>
        </div>
      </div>
    );
  };

  return (
    <>
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.pageHeader}>
            <p className={styles.category}>
              {category === "academy" ? "ACADEMY" : "MATERIALS"}
            </p>

            <h1>{title}</h1>
            <p className={styles.description}>{description}</p>
          </div>

          <div className={styles.content}>
            <div className={styles.tabBar}>
              <div className={styles.tabs}>
                <button
                  type="button"
                  className={`${styles.tab} ${
                    activeTab === "pending" ? styles.active : ""
                  }`}
                  onClick={handlePendingTab}
                >
                  처리 예정
                </button>

                <button
                  type="button"
                  className={`${styles.tab} ${
                    activeTab === "completed" ? styles.active : ""
                  }`}
                  onClick={handleCompletedTab}
                >
                  처리 완료
                </button>
              </div>

              <div className={styles.toolbar}>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className={styles.sortSelect}
                >
                  <option value="latest">최신순</option>
                  <option value="oldest">오래된순</option>
                </select>

                {activeTab === "pending" && (
                  <button
                    className={styles.addButton}
                    type="button"
                    onClick={handleAddReceipt}
                    disabled={isAdding || editingReceiptId}
                  >
                    + 내역 추가
                  </button>
                )}
              </div>
            </div>

            {activeTab === "pending" ? (
              <section className={styles.tableSection} ref={tableAreaRef}>
                {renderFilters("pendingYear")}

                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>입금일</th>
                        <th>좌석번호</th>
                        <th>입금자명(학생이름)</th>
                        <th>금액(₩)</th>
                        <th>사유</th>
                        <th>현금영수증처리번호</th>
                        <th>처리여부</th>
                        <th>미완 사유</th>
                        <th>처리하기</th>
                      </tr>
                    </thead>

                    <tbody>
                      {isAdding && (
                        <tr className={styles.inputRow}>
                          <td>
                            <input
                              type="date"
                              name="depositDate"
                              value={newReceipt.depositDate}
                              onChange={handleNewReceiptChange}
                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              name="seatNumber"
                              value={newReceipt.seatNumber}
                              onChange={handleNewReceiptChange}
                              placeholder="좌석"
                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              name="studentName"
                              value={newReceipt.studentName}
                              onChange={handleNewReceiptChange}
                              placeholder="학생 이름"
                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              name="amount"
                              inputMode="numeric"
                              value={
                                newReceipt.amount
                                  ? Number(newReceipt.amount).toLocaleString(
                                      "ko-KR"
                                    )
                                  : ""
                              }
                              onChange={handleAmountChange}
                              placeholder="금액"
                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              name="paymentReason"
                              value={newReceipt.paymentReason}
                              onChange={handleNewReceiptChange}
                              placeholder="사유"
                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              name="receiptNumber"
                              value={newReceipt.receiptNumber}
                              onChange={handleNewReceiptChange}
                              placeholder="처리번호"
                            />
                          </td>

                          <td>
                            <span className={styles.pendingBadge}>미완</span>
                          </td>

                          <td>
                            <div className={styles.pendingReasonField}>
                              <select
                                name="pendingReason"
                                value={newReceipt.pendingReason}
                                onChange={handleNewReceiptChange}
                              >
                                <option value="no_receipt_number">
                                  현금영수증처리번호 받지 않음
                                </option>
                                <option value="not_processed">미처리</option>
                                <option value="academy_hold">
                                  학원 사정으로 보류
                                </option>
                                <option value="etc">기타</option>
                              </select>

                              {newReceipt.pendingReason === "etc" && (
                                <input
                                  type="text"
                                  name="customPendingReason"
                                  value={newReceipt.customPendingReason}
                                  onChange={handleNewReceiptChange}
                                  placeholder="직접 입력"
                                />
                              )}
                            </div>
                          </td>

                          <td>
                            <div className={styles.writeActions}>
                              <button
                                type="button"
                                className={styles.saveButton}
                                onClick={handleSaveReceipt}
                                disabled={isSaving}
                              >
                                {isSaving ? "저장 중" : "저장"}
                              </button>

                              <button
                                type="button"
                                className={styles.cancelIconButton}
                                onClick={handleCancelAdd}
                                aria-label="작성 취소"
                                title="작성 취소"
                              >
                                ×
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}

                      {isLoading ? (
                        <tr>
                          <td colSpan="9" className={styles.empty}>
                            불러오는 중...
                          </td>
                        </tr>
                      ) : filteredPendingReceipts.length === 0 && !isAdding ? (
                        <tr>
                          <td colSpan="9" className={styles.empty}>
                            조회된 처리 예정 내역이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        paginatedReceipts.map((receipt) => {
                          const isSelected = selectedReceiptId === receipt.id;
                          const isEditing = editingReceiptId === receipt.id;

                          if (isEditing) {
                            return (
                              <tr key={receipt.id} className={styles.inputRow}>
                                <td>
                                  <input
                                    type="date"
                                    name="depositDate"
                                    value={editReceipt.depositDate}
                                    onChange={handleEditReceiptChange}
                                  />
                                </td>

                                <td>
                                  <input
                                    type="text"
                                    name="seatNumber"
                                    value={editReceipt.seatNumber}
                                    onChange={handleEditReceiptChange}
                                    placeholder="좌석"
                                  />
                                </td>

                                <td>
                                  <input
                                    type="text"
                                    name="studentName"
                                    value={editReceipt.studentName}
                                    onChange={handleEditReceiptChange}
                                    placeholder="학생 이름"
                                  />
                                </td>

                                <td>
                                  <input
                                    type="text"
                                    name="amount"
                                    inputMode="numeric"
                                    value={
                                      editReceipt.amount
                                        ? Number(
                                            editReceipt.amount
                                          ).toLocaleString("ko-KR")
                                        : ""
                                    }
                                    onChange={handleEditAmountChange}
                                    placeholder="금액"
                                  />
                                </td>

                                <td>
                                  <input
                                    type="text"
                                    name="paymentReason"
                                    value={editReceipt.paymentReason}
                                    onChange={handleEditReceiptChange}
                                    placeholder="사유"
                                  />
                                </td>

                                <td>
                                  <input
                                    type="text"
                                    name="receiptNumber"
                                    value={editReceipt.receiptNumber}
                                    onChange={handleEditReceiptChange}
                                    placeholder="처리번호"
                                  />
                                </td>

                                <td>
                                  <span className={styles.pendingBadge}>
                                    미완
                                  </span>
                                </td>

                                <td>
                                  <div className={styles.pendingReasonField}>
                                    <select
                                      name="pendingReason"
                                      value={editReceipt.pendingReason}
                                      onChange={handleEditReceiptChange}
                                    >
                                      <option value="no_receipt_number">
                                        현금영수증처리번호 받지 않음
                                      </option>

                                      <option value="not_processed">
                                        미처리
                                      </option>

                                      <option value="academy_hold">
                                        학원 사정으로 보류
                                      </option>

                                      <option value="etc">기타</option>
                                    </select>

                                    {editReceipt.pendingReason === "etc" && (
                                      <input
                                        type="text"
                                        name="customPendingReason"
                                        value={editReceipt.customPendingReason}
                                        onChange={handleEditReceiptChange}
                                        placeholder="직접 입력"
                                      />
                                    )}
                                  </div>
                                </td>

                                <td>
                                  <div className={styles.writeActions}>
                                    <button
                                      type="button"
                                      className={styles.saveButton}
                                      onClick={() =>
                                        handleUpdateReceipt(receipt.id)
                                      }
                                      disabled={isUpdating}
                                    >
                                      {isUpdating ? "저장 중" : "저장"}
                                    </button>

                                    <button
                                      type="button"
                                      className={styles.cancelIconButton}
                                      onClick={handleCancelEdit}
                                      aria-label="수정 취소"
                                      title="수정 취소"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr
                              key={receipt.id}
                              className={`${styles.dataRow} ${
                                isSelected ? styles.selectedRow : ""
                              }`}
                              onClick={() =>
                                setSelectedReceiptId((prev) =>
                                  prev === receipt.id ? null : receipt.id
                                )
                              }
                            >
                              <td>{receipt.deposit_date}</td>
                              <td>{receipt.seat_number ?? "-"}</td>
                              <td>{receipt.student_name}</td>
                              <td>₩{formatAmount(receipt.amount)}</td>
                              <td>{receipt.payment_reason ?? "-"}</td>
                              <td>{receipt.receipt_number ?? "-"}</td>

                              <td>
                                <span className={styles.pendingBadge}>
                                  미완
                                </span>
                              </td>

                              <td>
                                {getPendingReasonLabel(receipt.pending_reason)}
                              </td>

                              <td>
                                <div className={styles.rowActions}>
                                  {isSelected && (
                                    <>
                                      <button
                                        type="button"
                                        className={styles.iconButton}
                                        aria-label="수정"
                                        title="수정"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStartEdit(receipt);
                                        }}
                                      >
                                        <FiEdit3 />
                                      </button>

                                      <button
                                        type="button"
                                        className={`${styles.iconButton} ${styles.deleteButton}`}
                                        aria-label="삭제"
                                        title="삭제"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteReceipt(receipt);
                                        }}
                                      >
                                        <FiTrash2 />
                                      </button>
                                    </>
                                  )}

                                  <button
                                    type="button"
                                    className={styles.processButton}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setProcessingReceipt(receipt);
                                    }}
                                  >
                                    처리하기
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {renderPagination()}

                <div className={styles.tableFooter}>
                  <button
                    className={styles.excelButton}
                    type="button"
                    onClick={handleExcelDownload}
                  >
                    엑셀 다운로드
                  </button>
                </div>
              </section>
            ) : (
              <section className={styles.tableSection}>
                {renderFilters("completedYear")}

                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>입금일</th>
                        <th>좌석번호</th>
                        <th>입금자명(학생이름)</th>
                        <th>금액(₩)</th>
                        <th>사유</th>
                        <th>현금영수증처리번호</th>
                        <th>처리여부</th>
                        <th>사유</th>
                        <th>처리일자</th>
                        <th>담당자</th>
                      </tr>
                    </thead>

                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan="10" className={styles.empty}>
                            불러오는 중...
                          </td>
                        </tr>
                      ) : filteredCompletedReceipts.length === 0 ? (
                        <tr>
                          <td colSpan="10" className={styles.empty}>
                            조회된 처리 완료 내역이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        paginatedReceipts.map((receipt) => (
                          <tr
                            key={receipt.id}
                            className={styles.dataRow}
                            onClick={() => setProcessingReceipt(receipt)}
                          >
                            <td>{receipt.deposit_date}</td>
                            <td>{receipt.seat_number ?? "-"}</td>
                            <td>{receipt.student_name}</td>
                            <td>₩{formatAmount(receipt.amount)}</td>
                            <td>{receipt.payment_reason ?? "-"}</td>
                            <td>{receipt.receipt_number ?? "-"}</td>

                            <td>
                              <span
                                className={
                                  receipt.status === "issued"
                                    ? styles.issuedBadge
                                    : styles.unissuedBadge
                                }
                              >
                                {receipt.status === "issued"
                                  ? "발행"
                                  : "미발행"}
                              </span>
                            </td>

                            <td>{receipt.unissued_reason ?? "-"}</td>

                            <td>{formatProcessedDate(receipt.processed_at)}</td>

                            <td>{receipt.processed_by ?? "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {renderPagination()}

                <div className={styles.tableFooter}>
                  <button
                    className={styles.excelButton}
                    type="button"
                    onClick={handleExcelDownload}
                  >
                    엑셀 다운로드
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {processingReceipt && (
        <ProcessReceiptModal
          receipt={processingReceipt}
          onClose={() => setProcessingReceipt(null)}
          onSuccess={async () => {
            setSelectedReceiptId(null);
            await fetchReceipts();
          }}
        />
      )}
    </>
  );
}
