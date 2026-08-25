export function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const el = target
  const tag = el.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (el.isContentEditable === true) return true
  // Target might be inside an editable (e.g. React wrapper)
  if (el.closest?.("input, textarea, select, [contenteditable='true']")) return true
  return false
}
