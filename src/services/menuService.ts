// src/services/menuService.ts
// Service to fetch and process menu data from database
import { prisma } from '../lib/prisma';

// 🟡🟡🟡 - [MENU TYPES] Type definitions for menu structure
export interface MenuSection {
  order: number;
  'html-type': string;
  content?: any;
  popup?: Record<string, any>;
  // 🟡🟡🟡 - [IMAGE PROPERTIES] Properties for image type sections
  src?: string;
  alt?: string;
  caption?: string;
}

export interface MenuData {
  [key: string]: MenuSection;
}

export interface ProcessedMenuSection {
  id: string;
  order: number;
  htmlType: string;
  content: any;
  popup?: Record<string, any>;
  className: string;
}

// 🟡🟡🟡 - [MENU SERVICE] Main service class for menu operations
export class MenuService {
  
  // 🟡🟡🟡 - [FETCH MENU] Fetch menu data by theme from database
  static async getMenuByTheme(theme: string): Promise<MenuData | null> {
    console.log('🟡🟡🟡 - [MENU SERVICE] Fetching menu for theme:', theme);
    
    try {
      const menu = await prisma.menus.findFirst({
        where: {
          theme: theme
        },
        select: {
          id: true,
          name: true,
          theme: true,
          menuItems: true
        }
      });

      if (!menu) {
        console.log('⚠️⚠️⚠️ - [MENU SERVICE] No menu found for theme:', theme);
        return null;
      }

      console.log('✅✅✅ - [MENU SERVICE] Menu found for theme:', theme);
      console.log('🟡🟡🟡 - [MENU SERVICE] Menu name:', menu.name);
      
      return menu.menuItems as unknown as MenuData;
      
    } catch (error) {
      console.error('❗❗❗ - [MENU SERVICE] Error fetching menu for theme:', theme, error);
      throw new Error(`Failed to fetch menu for theme: ${theme}`);
    }
  }

  // 🟡🟡🟡 - [PROCESS MENU] Process menu data into ordered sections
  static processMenuData(menuData: MenuData): ProcessedMenuSection[] {
    console.log('🟡🟡🟡 - [MENU SERVICE] Processing menu data');
    
    try {
      const sections: ProcessedMenuSection[] = [];
      
      // 🟡🟡🟡 - [SECTION PROCESSING] Convert menu data to array and sort by order
      Object.entries(menuData).forEach(([sectionId, sectionData]) => {
        const section: ProcessedMenuSection = {
          id: sectionId,
          order: sectionData.order,
          htmlType: sectionData['html-type'],
          content: sectionData.content,
          popup: sectionData.popup,
          className: `${sectionId} ${sectionData['html-type']}`
        };
        
        // 🟡🟡🟡 - [IMAGE CONTENT] For image sections, create content object from image properties
        if (sectionData['html-type'] === 'image') {
          section.content = {
            src: sectionData.src,
            alt: sectionData.alt,
            caption: sectionData.caption
          };
        }
        
        sections.push(section);
      });

      // 🟡🟡🟡 - [SORTING] Sort sections by order value
      sections.sort((a, b) => a.order - b.order);
      
      console.log('✅✅✅ - [MENU SERVICE] Processed sections:', sections.length);
      console.log('🟡🟡🟡 - [MENU SERVICE] Section order:', sections.map(s => `${s.id}(${s.order})`));
      
      return sections;
      
    } catch (error) {
      console.error('❗❗❗ - [MENU SERVICE] Error processing menu data:', error);
      throw new Error('Failed to process menu data');
    }
  }

  // 🟡🟡🟡 - [VALIDATE MENU] Validate menu structure
  static validateMenuStructure(menuData: MenuData): boolean {
    console.log('🟡🟡🟡 - [MENU SERVICE] Validating menu structure');
    
    try {
      for (const [sectionId, section] of Object.entries(menuData)) {
        // Check required fields
        if (!section.order || typeof section.order !== 'number') {
          console.error('❗❗❗ - [MENU SERVICE] Invalid order in section:', sectionId);
          return false;
        }
        
        if (!section['html-type'] || typeof section['html-type'] !== 'string') {
          console.error('❗❗❗ - [MENU SERVICE] Invalid html-type in section:', sectionId);
          return false;
        }
        
        // 🟡🟡🟡 - [CONTENT VALIDATION] Validate content based on html-type
        if (section['html-type'] === 'image') {
          // For images, check for required image properties
          if (!section.src || !section.alt) {
            console.error('❗❗❗ - [MENU SERVICE] Missing required image properties (src, alt) in section:', sectionId);
            return false;
          }
        } else {
          // For other types, check for content field
          if (!section.content) {
            console.error('❗❗❗ - [MENU SERVICE] Missing content in section:', sectionId);
            return false;
          }
        }
      }
      
      console.log('✅✅✅ - [MENU SERVICE] Menu structure validation passed');
      return true;
      
    } catch (error) {
      console.error('❗❗❗ - [MENU SERVICE] Error validating menu structure:', error);
      return false;
    }
  }

  // 🟡🟡🟡 - [GET THEME MENU] Main method to get processed menu for theme
  static async getThemeMenu(theme: string): Promise<ProcessedMenuSection[] | null> {
    console.log('🟡🟡🟡 - [MENU SERVICE] Getting theme menu for:', theme);
    
    try {
      const menuData = await this.getMenuByTheme(theme);
      
      if (!menuData) {
        console.log('⚠️⚠️⚠️ - [MENU SERVICE] No menu data found for theme:', theme);
        return null;
      }

      // Validate menu structure
      if (!this.validateMenuStructure(menuData)) {
        console.error('❌❌❌ - [MENU SERVICE] Menu structure validation failed for theme:', theme);
        return null;
      }

      // Process menu data
      const processedSections = this.processMenuData(menuData);
      
      console.log('✅✅✅ - [MENU SERVICE] Successfully processed menu for theme:', theme);
      return processedSections;
      
    } catch (error) {
      console.error('❗❗❗ - [MENU SERVICE] Error getting theme menu:', error);
      throw error;
    }
  }
} 