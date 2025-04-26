import { SortableContext } from '@dnd-kit/sortable';
import { FormElement } from './FormElement';
import { useDndMonitor, useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import { useForm } from '../contexts/FormContext';

interface FormField {
  id: string;
  type: string;
  title: string;
  category?: 'layout' | 'field';
  elements?: FormField[];
}

interface FormEditorProps {
  fields: FormField[];
  onFieldsChange: (fields: FormField[]) => void;
}

function DropZone({ id, isOver }: { id: string; isOver: boolean }) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({ id });
  const isActive = isOver || isDroppableOver;
  
  return (
    <div
      ref={setNodeRef}
      className={`h-6 my-2 rounded transition-colors border-2 border-dashed flex items-center justify-center ${
        isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
      }`}
      style={{ minHeight: 24 }}
    >
      {isActive ? 'Release to drop here' : ''}
    </div>
  );
}

// Alternative approach: directly check if a field is in a layout
function getFieldLocation(fields: FormField[], fieldId: string): { inLayout: boolean, layoutId: string | null } {
  // Check each field
  for (const field of fields) {
    // If this is a layout, check its elements
    if (field.category === 'layout' && field.elements) {
      // Check if the field is directly in this layout
      if (field.elements.some(el => el.id === fieldId)) {
        return { inLayout: true, layoutId: field.id };
      }
      
      // Recursively check nested layouts
      const nestedResult = getFieldLocation(field.elements, fieldId);
      if (nestedResult.inLayout) {
        return nestedResult;
      }
    }
  }
  
  return { inLayout: false, layoutId: null };
}

function renderFieldsWithDropZones(fields: FormField[], overId: string | null, parentId: string) {
  const result: React.ReactNode[] = [];
  
  // Always add initial drop zone
  result.push(
    <DropZone
      key={`dropzone-0-${parentId}`}
      id={`dropzone-0-${parentId}`}
      isOver={overId === `dropzone-0-${parentId}`}
    />
  );

  // Add fields with drop zones between them
  fields.forEach((field, idx) => {
    // Add the field itself
    result.push(
      <div key={field.id} className="relative">
        <FormElement id={field.id} field={field} />
        
        {/* Add drop zone after the field */}
        <DropZone
          key={`dropzone-${idx + 1}-${parentId}`}
          id={`dropzone-${idx + 1}-${parentId}`}
          isOver={overId === `dropzone-${idx + 1}-${parentId}`}
        />
      </div>
    );
  });

  return result;
}

export const FormEditor = ({ fields, onFieldsChange }: FormEditorProps) => {
  const [overId, setOverId] = useState<string | null>(null);
  const { activeId } = useForm();

  // Listen to DnD context for currently hovered drop zone
  useDndMonitor({
    onDragOver: (event) => {
      setOverId(event.over?.id?.toString() ?? null);
    },
    onDragEnd: () => {
      setOverId(null);
    },
    onDragCancel: () => {
      setOverId(null);
    },
  });

  // Always render the root layout's elements
  const root = fields[0];
  const elements = root.elements || [];
  
  // Create a map of field IDs to their locations
  const fieldLocations = new Map<string, string | null>();
  elements.forEach(field => {
    const { inLayout, layoutId } = getFieldLocation(elements, field.id);
    fieldLocations.set(field.id, inLayout ? layoutId : null);
  });
  
  // Filter out fields that are already in layouts to prevent duplication
  const rootLevelElements = elements.filter(field => {
    const location = fieldLocations.get(field.id);
    return location === null; // Only include fields not in any layout
  });

  return (
    <div className="space-y-2">
      <SortableContext items={rootLevelElements.map((field) => field.id)}>
        {renderFieldsWithDropZones(rootLevelElements, overId, root.id)}
      </SortableContext>
    </div>
  );
}; 