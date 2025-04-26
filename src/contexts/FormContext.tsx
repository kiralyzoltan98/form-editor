import { createContext, useContext, ReactNode, useState } from 'react';
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';

interface FormField {
  id: string;
  type: string;
  title: string;
  category?: 'layout' | 'field';
  elements?: FormField[];
}

interface FormContextType {
  schema: Record<string, any>;
  uiSchema: Record<string, any>;
  formData: Record<string, any>;
  fields: FormField[];
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  updateSchema: (schema: Record<string, any>) => void;
  updateUiSchema: (uiSchema: Record<string, any>) => void;
  updateFormData: (formData: Record<string, any>) => void;
  updateFields: (fields: FormField[]) => void;
  activeId: string | null;
  selectedElement: FormField | null;
  setSelectedElement: (element: FormField | null) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

const ROOT_LAYOUT_ID = 'root_vertical_layout';

export function FormProvider({ children }: { children: ReactNode }) {
  const [schema, setSchema] = useState<Record<string, any>>({
    type: 'object',
    properties: {},
    required: []
  });
  const [uiSchema, setUiSchema] = useState<Record<string, any>>({
    type: 'VerticalLayout',
    elements: []
  });
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fields, setFields] = useState<FormField[]>([
    {
      id: ROOT_LAYOUT_ID,
      type: 'VerticalLayout',
      title: 'Form',
      category: 'layout',
      elements: []
    }
  ]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<FormField | null>(null);

  // Helper function to convert fields to UI schema elements
  const fieldsToUiSchema = (fields: FormField[]): any[] => {
    return fields
      .filter(f => f.type !== 'empty')
      .map(field => {
        if (field.category === 'layout') {
          return {
            type: field.type,
            elements: field.elements ? fieldsToUiSchema(field.elements) : []
          };
        }
        return {
          type: 'Control',
          scope: `#/properties/${field.id}`,
          ...(field.type === 'string' && {
            options: {
              format: 'string'
            }
          })
        };
      });
  };

  // Helper function to update schema properties
  const updateSchemaProperties = (fields: FormField[]) => {
    const properties: Record<string, any> = {};
    const processField = (field: FormField) => {
      if (field.category === 'layout' && field.elements) {
        field.elements.forEach(processField);
      } else if (field.type !== 'empty') {
        properties[field.id] = {
          type: field.type,
          title: field.title
        };
      }
    };
    fields.forEach(processField);
    return properties;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // This will be handled by the FormEditor component
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over) {
      const isNewComponent = active.data.current?.isNewComponent === true;
      const category = active.data.current?.category;
      const fieldType = active.data.current?.type;
      const fieldId = `field_${Date.now()}`;
      const overId = over.id as string;

      // Helper function to find a field by ID in the entire field tree
      const findFieldById = (fields: FormField[], id: string): { field: FormField | null, parent: FormField | null } => {
        for (const field of fields) {
          if (field.id === id) {
            return { field, parent: null };
          }
          if (field.category === 'layout' && field.elements) {
            const result = findFieldById(field.elements, id);
            if (result.field) {
              return { field: result.field, parent: result.parent || field };
            }
          }
        }
        return { field: null, parent: null };
      };

      // Helper function to update fields recursively
      const updateFieldsRecursively = (fields: FormField[]): FormField[] => {
        return fields.map(field => {
          if (field.category === 'layout' && field.elements) {
            return {
              ...field,
              elements: updateFieldsRecursively(field.elements)
            };
          }
          return field;
        });
      };

      if (isNewComponent) {
        // Create new field definition
        const newField: FormField = {
          id: fieldId,
          type: fieldType,
          title: `New ${fieldType}`,
          category,
          ...(category === 'layout' && { elements: [] })
        };

        // Find the target container (layout or root)
        let targetElements: FormField[] = [];
        let targetParentField: FormField | null = null;
        let dropIndex = 0;

        // Check if we're dropping into a layout directly
        if (overId.startsWith('dropzone-')) {
          // Parse the dropzone ID to get parent and index
          const parts = overId.split('-');
          const dropzoneIndex = parseInt(parts[1], 10);
          const parentId = parts[2];
          
          // Find the parent field
          const { field: parentField } = findFieldById(fields, parentId);
          
          if (parentField?.category === 'layout') {
            // Dropping into a layout's dropzone
            targetElements = parentField.elements || [];
            targetParentField = parentField;
            dropIndex = dropzoneIndex;
          } else if (parentId === ROOT_LAYOUT_ID) {
            // Dropping into root layout's dropzone
            targetElements = fields[0].elements || [];
            targetParentField = fields[0];
            dropIndex = dropzoneIndex;
          }
        } else {
          // Dropping directly onto a layout
          const { field: targetField } = findFieldById(fields, overId);
          if (targetField?.category === 'layout') {
            targetElements = targetField.elements || [];
            targetParentField = targetField;
            dropIndex = targetElements.length; // Append to the end
          } else {
            // Default to root layout if target is not a layout
            targetElements = fields[0].elements || [];
            targetParentField = fields[0];
            dropIndex = targetElements.length;
          }
        }

        // Insert the new field
        targetElements.splice(dropIndex, 0, newField);

        // Update the fields tree
        const updateFieldElements = (fields: FormField[]): FormField[] => {
          return fields.map(field => {
            if (field.id === targetParentField?.id) {
              return {
                ...field,
                elements: targetElements
              };
            }
            if (field.category === 'layout' && field.elements) {
              return {
                ...field,
                elements: updateFieldElements(field.elements)
              };
            }
            return field;
          });
        };

        const newFields = updateFieldElements(fields);
        setFields(newFields);

        // Update schema
        const newSchema = { ...schema };
        newSchema.properties = updateSchemaProperties(newFields);
        setSchema(newSchema);

        // Update UI schema
        const newUiSchema = {
          type: 'VerticalLayout',
          elements: fieldsToUiSchema(fields[0].elements || [])
        };
        setUiSchema(newUiSchema);

        // Initialize form data for the new field if it's not a layout
        if (category !== 'layout') {
          const newFormData = { ...formData };
          newFormData[fieldId] = undefined;
          setFormData(newFormData);
        }
      } else {
        // Handle reordering
        const { field: activeField, parent: activeParent } = findFieldById(fields, active.id as string);
        const { field: overField, parent: overParent } = findFieldById(fields, over.id as string);

        if (activeField) {
          let sourceElements: FormField[] = [];
          let targetElements: FormField[] = [];
          let sourceParent: FormField | null = activeParent;
          let targetParent: FormField | null = overParent;

          // Determine source elements
          if (activeParent?.category === 'layout') {
            sourceElements = activeParent.elements || [];
          } else {
            sourceElements = fields[0].elements || [];
            sourceParent = fields[0];
          }

          // Determine target elements
          if (overId.startsWith('dropzone-')) {
            // Parse the dropzone ID to get parent and index
            const parts = overId.split('-');
            const dropzoneIndex = parseInt(parts[1], 10);
            const parentId = parts[2];
            
            // Find the parent field
            const { field: parentField } = findFieldById(fields, parentId);
            
            if (parentField?.category === 'layout') {
              // Dropping into a layout's dropzone
              targetElements = parentField.elements || [];
              targetParent = parentField;
            } else if (parentId === ROOT_LAYOUT_ID) {
              // Dropping into root layout's dropzone
              targetElements = fields[0].elements || [];
              targetParent = fields[0];
            }
          } else if (overField?.category === 'layout') {
            // Dropping directly onto a layout
            targetElements = overField.elements || [];
            targetParent = overField;
          } else {
            // Default to root layout if target is not a layout
            targetElements = fields[0].elements || [];
            targetParent = fields[0];
          }

          // Find indices
          const sourceIndex = sourceElements.findIndex(f => f.id === active.id);
          let targetIndex = targetElements.length; // Default to append
          
          if (overId.startsWith('dropzone-')) {
            const parts = overId.split('-');
            const dropzoneIndex = parseInt(parts[1], 10);
            if (!isNaN(dropzoneIndex)) {
              targetIndex = dropzoneIndex;
            }
          } else if (overField) {
            targetIndex = targetElements.findIndex(f => f.id === over.id);
            if (targetIndex === -1) targetIndex = targetElements.length;
          }

          if (sourceIndex !== -1) {
            // Remove from source
            const [movedField] = sourceElements.splice(sourceIndex, 1);

            // Add to target
            targetElements.splice(targetIndex, 0, movedField);

            // Update the fields tree
            const updateFieldElements = (fields: FormField[]): FormField[] => {
              return fields.map(field => {
                if (field.id === sourceParent?.id) {
                  return {
                    ...field,
                    elements: sourceElements
                  };
                }
                if (field.id === targetParent?.id) {
                  return {
                    ...field,
                    elements: targetElements
                  };
                }
                if (field.category === 'layout' && field.elements) {
                  return {
                    ...field,
                    elements: updateFieldElements(field.elements)
                  };
                }
                return field;
              });
            };

            const newFields = updateFieldElements(fields);
            setFields(newFields);

            // Update schema
            const newSchema = { ...schema };
            newSchema.properties = updateSchemaProperties(newFields);
            setSchema(newSchema);

            // Update UI schema
            const newUiSchema = {
              type: 'VerticalLayout',
              elements: fieldsToUiSchema(fields[0].elements || [])
            };
            setUiSchema(newUiSchema);
          }
        }
      }
    }
    setActiveId(null);
  };

  const updateSchema = (newSchema: Record<string, any>) => {
    setSchema(newSchema);
  };

  const updateUiSchema = (newUiSchema: Record<string, any>) => {
    setUiSchema(newUiSchema);
  };

  const updateFormData = (newFormData: Record<string, any>) => {
    setFormData(newFormData);
  };

  const updateFields = (newFields: FormField[]) => {
    setFields(newFields);
  };

  const value = {
    schema,
    uiSchema,
    formData,
    fields,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    updateSchema,
    updateUiSchema,
    updateFormData,
    updateFields,
    activeId,
    selectedElement,
    setSelectedElement
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export function useForm() {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
} 