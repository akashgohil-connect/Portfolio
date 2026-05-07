"use client";

type Props = {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  focused: boolean;
};

export function WindowControls({
  onClose,
  onMinimize,
  onMaximize,
  focused,
}: Props) {
  const baseBtn =
    "group h-3 w-3 rounded-full border border-black/15 transition-opacity";
  return (
    <div
      className="flex items-center gap-2"
      // Don't initiate window drag from controls.
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Close window"
        onClick={onClose}
        className={`${baseBtn} ${focused ? "bg-[#ff5f57]" : "bg-[#cccccc]"}`}
      />
      <button
        type="button"
        aria-label="Minimize window"
        onClick={onMinimize}
        className={`${baseBtn} ${focused ? "bg-[#febc2e]" : "bg-[#cccccc]"}`}
      />
      <button
        type="button"
        aria-label="Maximize window"
        onClick={onMaximize}
        className={`${baseBtn} ${focused ? "bg-[#28c840]" : "bg-[#cccccc]"}`}
      />
    </div>
  );
}
