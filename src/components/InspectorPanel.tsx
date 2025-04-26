import { useForm } from '../contexts/FormContext';
import { useState, useEffect } from 'react';

export function InspectorPanel({ isRightPanelOpen }: { isRightPanelOpen: boolean }) {
  const { selectedElement, updateFields, fields, schema, updateSchema, uiSchema, updateUiSchema } = useForm();
  const [title, setTitle] = useState(selectedElement?.title || '');

  // Update local title state when selected element changes
  useEffect(() => {
    setTitle(selectedElement?.title || '');
  }, [selectedElement]);

  if (!selectedElement) {
    return (
      <div className="h-full w-full p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Select an element to inspect</p>
        </div>
      </div>
    );
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    
    // Update form fields
    const updateFieldTitle = (fields: any[]): any[] => {
      return fields.map(field => {
        if (field.id === selectedElement.id) {
          return { ...field, title: newTitle };
        }
        if (field.category === 'layout' && field.elements) {
          return {
            ...field,
            elements: updateFieldTitle(field.elements)
          };
        }
        return field;
      });
    };

    const newFields = updateFieldTitle(fields);
    updateFields(newFields);

    // Update JSON Forms schema
    const updateSchemaProperties = (schema: any): any => {
      if (schema.properties) {
        const newProperties = { ...schema.properties };
        if (newProperties[selectedElement.id]) {
          newProperties[selectedElement.id] = {
            ...newProperties[selectedElement.id],
            title: newTitle
          };
        }
        return {
          ...schema,
          properties: newProperties
        };
      }
      return schema;
    };

    const newSchema = updateSchemaProperties(schema);
    updateSchema(newSchema);

    // Update UI schema
    const updateUiSchemaElements = (uiSchema: any): any => {
      if (uiSchema.elements) {
        return {
          ...uiSchema,
          elements: uiSchema.elements.map((element: any) => {
            if (element.scope === `#/properties/${selectedElement.id}`) {
              return {
                ...element,
                label: newTitle
              };
            }
            if (element.elements) {
              return {
                ...element,
                elements: updateUiSchemaElements({ elements: element.elements }).elements
              };
            }
            return element;
          })
        };
      }
      return uiSchema;
    };

    const newUiSchema = updateUiSchemaElements(uiSchema);
    updateUiSchema(newUiSchema);
  };

  if (!isRightPanelOpen) {
    return null;
  }

  return (
    <div className="h-full w-full p-6 bg-white rounded-lg shadow-sm">
      <div className="space-y-4">
        <div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-700">
                {selectedElement.type}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-700">
                {selectedElement.category || 'field'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 