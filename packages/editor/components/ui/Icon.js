import React from 'react';
import { 
  Home, Settings, Eye, Code, Smartphone, Tablet, Monitor,
  Plus, Trash2, Copy, Edit, Save, Undo, Redo, ZoomIn, ZoomOut,
  ChevronRight, ChevronDown, Folder, File, Image
} from 'lucide-react';

const iconMap = {
  home: Home,
  settings: Settings,
  eye: Eye,
  code: Code,
  smartphone: Smartphone,
  tablet: Tablet,
  monitor: Monitor,
  plus: Plus,
  trash: Trash2,
  copy: Copy,
  edit: Edit,
  save: Save,
  undo: Undo,
  redo: Redo,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  folder: Folder,
  file: File,
  image: Image
};

const Icon = ({ name, size = 16, className = '', ...props }) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <IconComponent 
      size={size} 
      className={className} 
      {...props} 
    />
  );
};

export default Icon;
