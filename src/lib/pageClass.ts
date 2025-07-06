// 🟡🟡🟡 - [PAGE CLASS UTIL] 2024-12-19 - Utility to generate page class names for templates
// src/lib/pageClass.ts - Generate consistent page class names from template paths

/**
 * Generates a page class name from a template path
 * Examples:
 * - 'wizard/location-finder' -> 'page-location-finder'
 * - 'wizard/event-details' -> 'page-event-details'
 * - 'landing' -> 'page-landing'
 */
export function generatePageClass(templatePath: string): string {
  console.log('🟡🟡🟡 - [PAGE CLASS] Generating page class for template:', templatePath);
  
  // Remove file extension if present
  const cleanPath = templatePath.replace(/\.(hbs|handlebars)$/i, '');
  
  // Replace directory separators and convert to kebab-case, then remove 'wizard-' prefix
  const pageClass = `${cleanPath.replace(/[\/\\]/g, '-').toLowerCase()}`.replace(/^wizard-/, '');
  
  // console.log('✅✅✅ - [PAGE CLASS] Generated page class:', pageClass);
  return pageClass;
} 