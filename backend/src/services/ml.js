const LABELS = [
  "overflowing_bin",
  "garbage_dump",
  "plastic_waste",
  "construction_debris",
  "organic_waste",
  "e_waste",
  "hazardous_waste",
  "drain_blockage",
  "other",
];

function classifyIssue(comment) {
  const lower = (comment || "").toLowerCase();
  if (lower.includes("drain") || lower.includes("block")) {
    return { label: "drain_blockage", confidence: 0.93 };
  }
  if (lower.includes("hazard") || lower.includes("chemical") || lower.includes("bio")) {
    return { label: "hazardous_waste", confidence: 0.92 };
  }
  if (lower.includes("elect") || lower.includes("ewaste") || lower.includes("e-waste") || lower.includes("battery")) {
    return { label: "e_waste", confidence: 0.91 };
  }
  if (lower.includes("plastic") || lower.includes("bottle") || lower.includes("wrapper")) {
    return { label: "plastic_waste", confidence: 0.88 };
  }
  if (lower.includes("construction") || lower.includes("debris") || lower.includes("cement")) {
    return { label: "construction_debris", confidence: 0.88 };
  }
  if (lower.includes("overflow") || lower.includes("bin")) {
    return { label: "overflowing_bin", confidence: 0.84 };
  }
  if (lower.includes("organic") || lower.includes("food") || lower.includes("vegetable")) {
    return { label: "organic_waste", confidence: 0.82 };
  }
  return { label: "garbage_dump", confidence: 0.78 };
}

function estimateVolumeBin(photoCount, comment) {
  const lower = (comment || "").toLowerCase();
  const hasLarge = ["large", "huge", "truck", "tons", "bulk"].some((keyword) => lower.includes(keyword));
  if (photoCount >= 4 || hasLarge) {
    return "very_large";
  }
  if (photoCount === 3) {
    return "large";
  }
  if (photoCount === 2) {
    return "medium";
  }
  return "small";
}

function scorePriority(label, volumeBin) {
  const weights = { small: 1, medium: 3, large: 6, very_large: 9 };
  let score = weights[volumeBin] || 3;
  if (label === "hazardous_waste" || label === "e_waste") {
    score += 4;
  }
  if (label === "drain_blockage") {
    score += 4;
  }
  return score;
}

function computePriority(label, volumeBin) {
  const score = scorePriority(label, volumeBin);
  if (score >= 8) {
    return "urgent";
  }
  if (score >= 5) {
    return "high";
  }
  if (score >= 3) {
    return "medium";
  }
  return "low";
}

function findDuplicate(report, reports = []) {
  if (!report?.gps) {
    return null;
  }

  const reportId = report.report_id || report._id?.toString();
  const candidates = Array.isArray(reports) ? reports : Object.values(reports || {});
  const sameLocation = candidates.find((existing) => {
    if (!existing?.gps) {
      return false;
    }
    const existingId = existing.report_id || existing._id?.toString();
    return existingId !== reportId && existing.gps.lat === report.gps.lat && existing.gps.lon === report.gps.lon;
  });

  return sameLocation?.report_id || sameLocation?._id?.toString() || null;
}

function processReport(report, reports = []) {
  const safeReport = report || {};
  const comment = safeReport.comment || "";
  const photoCount = Array.isArray(safeReport.photos) ? safeReport.photos.length : 0;
  const classification = classifyIssue(comment);
  const volumeBin = estimateVolumeBin(photoCount, comment);
  const priority = computePriority(classification.label, volumeBin);

  return {
    classification: [classification],
    volume_bin: volumeBin,
    priority,
    triage_score: scorePriority(classification.label, volumeBin),
    suggested_team_id: null,
    suggested_vehicle_type: null,
    duplicate_of: findDuplicate(safeReport, reports),
  };
}

function predict({ image_uri, gps }) {
  return {
    classification: [ { label: "garbage_dump", confidence: 0.8 } ],
    volume_bin: "medium",
    priority: "medium",
    triage_score: 4,
    suggested_team_id: null,
    suggested_vehicle_type: null,
    duplicate_of: null,
  };
}

module.exports = {
  LABELS,
  classifyIssue,
  estimateVolumeBin,
  computePriority,
  processReport,
  predict,
};
