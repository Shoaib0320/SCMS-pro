/**
 * Academic Year Utilities
 * Centralized helpers to identify the current active academic year
 * and provide pre-selected defaults for dropdowns across the system.
 */

export function getActiveAcademicYear(academicYears = []) {
  if (!Array.isArray(academicYears) || academicYears.length === 0) return null;

  // 1. Explicit active/current flag
  const activeByFlag = academicYears.find(
    (y) =>
      y.is_current === true ||
      y.is_current === 1 ||
      y.is_current === "true" ||
      y.isCurrent === true ||
      y.is_active === true ||
      y.isActive === true ||
      y.status === "ACTIVE"
  );
  if (activeByFlag) return activeByFlag;

  // 2. Date range matching today
  const now = new Date();
  const activeByDate = academicYears.find((y) => {
    if (!y.start_date || !y.end_date) return false;
    const start = new Date(y.start_date);
    const end = new Date(y.end_date);
    return start <= now && end >= now;
  });
  if (activeByDate) return activeByDate;

  // 3. Fallback to the latest academic year (list is ordered by start_date DESC)
  return academicYears[0] || null;
}

export function getActiveAcademicYearId(academicYears = []) {
  const active = getActiveAcademicYear(academicYears);
  return active ? String(active.id || active._id || "") : "";
}

export function formatAcademicYearOptions(academicYears = [], { includeAll = false, allLabel = "All Years" } = {}) {
  if (!Array.isArray(academicYears)) return [];
  const options = academicYears.map((y) => ({
    value: String(y.id || y._id),
    label: y.name || "Unnamed Year",
    isCurrent: Boolean(y.is_current || y.isCurrent),
  }));

  if (includeAll) {
    return [{ value: "", label: allLabel }, ...options];
  }
  return options;
}
