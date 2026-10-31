export const EQUIPMENT_CATEGORIES = [
  { id: '3d_printing_makerspace', label: '3D Printing and Makerspace', aliases: ['3D Printing & Makerspace'] },
  { id: 'camera_media', label: 'Camera and Media', aliases: ['Cameras & Media'] },
  { id: 'drones_robotics', label: 'Drones and Robotics', aliases: ['Drones & Robotics'] },
  { id: 'lab_instruments', label: 'Lab Instruments', aliases: [] },
  { id: 'electronics_electrical', label: 'Electronics and Electrical', aliases: [] },
  { id: 'mechanical_workshop_tools', label: 'Mechanical and Workshop Tools', aliases: [] },
  { id: 'computing_emerging_technology', label: 'Computing and Emerging Technology', aliases: [] },
  { id: 'scientific_environmental_equipment', label: 'Scientific and Environmental Equipment', aliases: [] },
  { id: 'safety_protective_equipment', label: 'Safety and Protective Equipment', aliases: [] },
  { id: 'other_miscellaneous', label: 'Other / Miscellaneous', aliases: [] }
];

const categoryById = new Map(EQUIPMENT_CATEGORIES.map(category => [category.id, category]));
const categoryIdByAlias = new Map(
  EQUIPMENT_CATEGORIES.flatMap(category => [
    [category.id.toLowerCase(), category.id],
    [category.label.toLowerCase(), category.id],
    ...category.aliases.map(alias => [alias.toLowerCase(), category.id])
  ])
);

export function getEquipmentCategoryId(value) {
  return categoryIdByAlias.get(String(value || '').trim().toLowerCase()) || 'other_miscellaneous';
}

export function getEquipmentCategoryLabel(value) {
  return categoryById.get(getEquipmentCategoryId(value)).label;
}

export const QUALIFICATION_TYPES = [
  { id: 'official_certificate', label: 'Official certificate required' },
  { id: 'training_proof', label: 'Training proof required' },
  { id: 'practical_assessment', label: 'Previous experience / practical assessment' },
  { id: 'none', label: 'No document required' }
];

export function getQualificationTypeLabel(type) {
  return QUALIFICATION_TYPES.find(option => option.id === type)?.label || 'No document required';
}

export function getEffectiveQualificationType(resource) {
  if (!resource) return 'none';
  if (!resource.qualificationType && resource.requirements?.length) return 'training_proof';
  return resource.qualificationType === 'none' && resource.trainingRequired
    ? 'training_proof'
    : resource.qualificationType || 'none';
}
