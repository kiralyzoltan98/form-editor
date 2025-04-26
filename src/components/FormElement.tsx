import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { useForm } from '../contexts/FormContext';

interface FormElementProps {
  id: string;
  field: {
    id: string;
    type: string;
    title: string;
    category?: 'layout' | 'field';
    elements?: any[];
  };
}

function DropZone({ id, isOver, isHorizontal }: { id: string; isOver: boolean; isHorizontal?: boolean }) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({ id });
  const isActive = isOver || isDroppableOver;
  
  return (
    <div
      ref={setNodeRef}
      className={`rounded transition-colors border-2 border-dashed flex items-center justify-center ${
        isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
      } ${isHorizontal ? 'w-6 mx-2 min-h-[100px] self-stretch' : 'h-6 my-2 w-full'}`}
    >
      {isActive ? 'Release to drop here' : ''}
    </div>
  );
}

export const FormElement = ({
  id,
  field,
}: FormElementProps) => {
  const { activeId, fields, updateFields, schema, updateSchema, uiSchema, updateUiSchema, formData, updateFormData, selectedElement, setSelectedElement } = useForm();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Helper function to collect all field IDs recursively
  const collectFieldIds = (field: FormElementProps['field']): string[] => {
    let ids = [field.id];
    if (field.category === 'layout' && field.elements) {
      field.elements.forEach(element => {
        ids = [...ids, ...collectFieldIds(element)];
      });
    }
    return ids;
  };

  // Helper function to remove field from fields array recursively
  const removeFieldFromArray = (fields: FormElementProps['field'][], fieldId: string): FormElementProps['field'][] => {
    return fields.filter(f => f.id !== fieldId).map(f => {
      if (f.category === 'layout' && f.elements) {
        return {
          ...f,
          elements: removeFieldFromArray(f.elements, fieldId)
        };
      }
      return f;
    });
  };

  const handleDelete = () => {
    // Collect all field IDs that need to be removed
    const idsToRemove = collectFieldIds(field);

    // Update fields state
    const newFields = fields.map(f => {
      if (f.category === 'layout' && f.elements) {
        return {
          ...f,
          elements: removeFieldFromArray(f.elements, field.id)
        };
      }
      return f;
    });
    updateFields(newFields);

    // Update schema by removing all properties for deleted fields
    const newSchema = { ...schema };
    idsToRemove.forEach(id => {
      if (newSchema.properties && newSchema.properties[id]) {
        delete newSchema.properties[id];
      }
      if (newSchema.required) {
        newSchema.required = newSchema.required.filter((reqId: string) => reqId !== id);
      }
    });
    updateSchema(newSchema);

    // Update UI schema by rebuilding it without the deleted fields
    const fieldsToUiSchema = (fields: FormElementProps['field'][]): any[] => {
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
            scope: `#/properties/${field.id}`
          };
        });
    };

    const newUiSchema = {
      type: 'VerticalLayout',
      elements: fieldsToUiSchema(newFields[0].elements || [])
    };
    updateUiSchema(newUiSchema);

    // Update form data by removing all deleted field values
    const newFormData = { ...formData };
    idsToRemove.forEach(id => {
      delete newFormData[id];
    });
    updateFormData(newFormData);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement(field);
  };

  if (field.type === 'empty') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50"
      >
        <p className="text-gray-500">{field.title}</p>
      </div>
    );
  }

  const isLayout = field.category === 'layout';
  const isHorizontalLayout = field.type === 'HorizontalLayout';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${
        isLayout ? 'p-4' : 'p-4'
      } ${selectedElement?.id === field.id ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-medium text-gray-900">{field.title}</h3>
          <p className="text-sm text-gray-500">Type: {field.type}</p>
        </div>
        <div className="flex space-x-2">
          <button
            className="p-2 text-gray-500 hover:text-red-600"
            onClick={handleDelete}
            aria-label="Delete field"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {isLayout && (
        <div className="mt-4">
          <div className={`border-2 border-dashed border-gray-200 rounded-lg p-4 min-h-[100px] ${
            isHorizontalLayout ? 'flex flex-row items-stretch' : 'space-y-2'
          }`}>
            {field.elements && field.elements.length > 0 ? (
              <div className={`${isHorizontalLayout ? 'flex flex-row items-stretch flex-1' : 'space-y-2'}`}>
                {/* Initial drop zone for both horizontal and vertical layouts */}
                {!isHorizontalLayout && (
                  <DropZone
                    id={`dropzone-0-${field.id}`}
                    isOver={activeId === `dropzone-0-${field.id}`}
                  />
                )}
                {field.elements.map((element, index) => (
                  <div key={element.id} className={isHorizontalLayout ? 'flex flex-row items-stretch' : ''}>
                    {isHorizontalLayout && index === 0 && (
                      <DropZone
                        id={`dropzone-0-${field.id}`}
                        isOver={activeId === `dropzone-0-${field.id}`}
                        isHorizontal={true}
                      />
                    )}
                    <div className={isHorizontalLayout ? 'flex-1 min-w-[200px]' : ''}>
                      <FormElement id={element.id} field={element} />
                    </div>
                    {isHorizontalLayout && (
                      <DropZone
                        id={`dropzone-${index + 1}-${field.id}`}
                        isOver={activeId === `dropzone-${index + 1}-${field.id}`}
                        isHorizontal={true}
                      />
                    )}
                    {!isHorizontalLayout && (
                      <DropZone
                        id={`dropzone-${index + 1}-${field.id}`}
                        isOver={activeId === `dropzone-${index + 1}-${field.id}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={isHorizontalLayout ? 'flex flex-row items-stretch h-full' : ''}>
                <DropZone
                  id={`dropzone-0-${field.id}`}
                  isOver={activeId === `dropzone-0-${field.id}`}
                  isHorizontal={isHorizontalLayout}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 