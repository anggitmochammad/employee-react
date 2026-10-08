import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label: string;
};

function visiblePages(page: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  return [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((number) => number >= 1 && number <= totalPages)
    .sort((a, b) => a - b);
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  label,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = visiblePages(page, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <p className="text-slate-500">
        Halaman {page} dari {totalPages}
      </p>
      <nav aria-label={label} className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-slate-300 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft aria-hidden="true" className="mr-1 size-4" />
          Sebelumnya
        </button>
        {pages.map((number, index) => (
          <span key={number} className="inline-flex items-center gap-1">
            {index > 0 && number > pages[index - 1] + 1 && (
              <span aria-hidden="true" className="px-1 text-slate-400">
                …
              </span>
            )}
            <button
              type="button"
              aria-label={`Halaman ${number}`}
              aria-current={number === page ? "page" : undefined}
              onClick={() => {
                if (number !== page) onPageChange(number);
              }}
              className={`min-h-10 min-w-10 cursor-pointer rounded-lg border px-2 font-semibold focus-visible:outline-2 focus-visible:outline-indigo-600 ${number === page ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
            >
              {number}
            </button>
          </span>
        ))}
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-slate-300 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Berikutnya
          <ChevronRight aria-hidden="true" className="ml-1 size-4" />
        </button>
      </nav>
    </div>
  );
}
