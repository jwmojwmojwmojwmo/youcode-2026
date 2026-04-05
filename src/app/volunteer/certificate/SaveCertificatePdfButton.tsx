"use client";

type SaveCertificatePdfButtonProps = {
  targetId?: string;
};

export default function SaveCertificatePdfButton({ targetId }: SaveCertificatePdfButtonProps) {
  const handleSaveAsPdf = () => {
    if (!targetId) {
      window.print();
      return;
    }

    const target = document.getElementById(targetId);
    if (!target) {
      window.print();
      return;
    }

    const cleanup = () => {
      document.body.classList.remove("print-target-only");
      delete document.body.dataset.printTarget;
      target.removeAttribute("data-print-active");
    };

    document.body.classList.add("print-target-only");
    document.body.dataset.printTarget = targetId;
    target.setAttribute("data-print-active", "true");

    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
  };

  return (
    <button
      type="button"
      onClick={handleSaveAsPdf}
      className="primary-action rounded-full px-4 py-2 text-sm font-semibold"
    >
      Save as PDF
    </button>
  );
}
