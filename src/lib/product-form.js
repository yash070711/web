export const coverageOptions = ['Auto Liability','Motor Truck Cargo','Physical Damage','Medical Payments / PIP','Uninsured / Underinsured Motorist','Hired Auto Liability','Hired Auto Physical Damage','Non-Owned Auto Liability','Trailer Interchange','Garagekeepers Liability'];
export const classOptions = ['Light, Commercial, Local Truck','Truckers \u2014 Common Carriers','Heavy, Long Distance Truck','Business Auto','Public Auto','Contractor Vehicle','Specialized Truck','Trailer'];
export function validateProduct(values) {
  const errors = {};
  for (const [field,label] of [['carrier','Carrier'],['name','Product Name'],['lineOfBusiness','Line of Business']]) {
    if (typeof values[field] !== 'string' || !values[field].trim()) errors[field] = label + ' is required.';
  }
  if (!Array.isArray(values.coverages) || !values.coverages.length || values.coverages.some(value=>!coverageOptions.includes(value))) errors.coverages = 'Select at least one valid coverage.';
  if (!classOptions.includes(values.commonClass)) errors.commonClass = 'Select one common class.';
  if (!['Non-fronting','Fronting'].includes(values.arrangement)) errors.arrangement = 'Select an arrangement.';
  return errors;
}
