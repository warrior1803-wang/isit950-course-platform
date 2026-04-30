export function SectionLabel({ children }) {
  return (
    <div className="text-[11px] text-[rgba(156,138,142,0.65)] uppercase tracking-[0.09em] mt-7 mb-2.5 pl-0.5">
      {children}
    </div>
  );
}

export function AssignmentItem({ iconClass, iconName, title, meta, preview, right, onClick }) {
  return (
    <div
      className="flex items-center gap-3.5 px-4 py-3 rounded-xl bg-[#faf5f3] border border-[#ddd0d4] cursor-pointer transition-all hover:shadow-md hover:border-[#c9b8c2]"
      onClick={onClick}
    >
      <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${iconClass}`}>
        <span className="material-symbols-rounded">{iconName}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] text-[#2e2028] mb-0.5">{title}</div>
        <div className="text-[12px] text-[#9c8a8e] mb-0.5">{meta}</div>
        <div className="text-[12px] text-[#b8a8ad] overflow-hidden text-ellipsis whitespace-nowrap">{preview}</div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">{right}</div>
    </div>
  );
}
