"use client";

export default function SaveCertificatePdfButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="primary-action rounded-full px-4 py-2 text-sm font-semibold"
    >
      Save as PDF
    </button>
  );
}
