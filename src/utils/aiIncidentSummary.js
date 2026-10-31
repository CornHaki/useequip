export function generateAiIncidentSummary(text) {
  const lower = text.toLowerCase();
  let severity = 'Medium Severity';
  let issue = 'Equipment issue reported';
  let action = 'Needs manager inspection';

  if (lower.match(/(broken|shattered|crack|smoke|dead)/)) severity = 'High Severity';
  else if (lower.match(/(minor|slightly|loose|scratch|dust)/)) severity = 'Low Severity';

  if (lower.match(/(lens|scratch|camera)/)) { issue = 'Minor surface scratch'; action = 'Check optics'; }
  else if (lower.match(/(probe|cable|clip)/)) { issue = 'Loose accessory clip'; action = 'Replace clip'; }

  return `${severity} • ${issue} • ${action}`;
}