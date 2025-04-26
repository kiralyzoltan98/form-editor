import { useDraggable } from '@dnd-kit/core';
import { 
  ViewHorizontalIcon, 
  ViewVerticalIcon,
  TextIcon,
  InputIcon,
  CheckboxIcon
} from '@radix-ui/react-icons';

interface DraggableComponentProps {
  id: string;
  type: string;
  label: string;
  category: 'layout' | 'field';
  isLeftPanelOpen: boolean;
}

function DraggableComponent({ id, type, label, category, isLeftPanelOpen }: DraggableComponentProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data: {
      type,
      category,
      isNewComponent: true,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`p-2 mb-2 rounded-lg shadow-sm border cursor-move hover:border-blue-500 transition-colors ${
        category === 'layout' 
          ? 'bg-gray-50 border-gray-300' 
          : 'bg-white border-gray-200'
      } ${!isLeftPanelOpen ? 'flex justify-center' : ''}`}
    >
      <div className={`flex items-center gap-2 ${!isLeftPanelOpen ? 'justify-center' : ''}`}>
        {category === 'layout' ? (
          type === 'VerticalLayout' ? (
            <ViewHorizontalIcon className="w-4 h-4 text-gray-500" />
          ) : (
            <ViewVerticalIcon className="w-4 h-4 text-gray-500" />
          )
        ) : (
          type === 'string' ? (
            <TextIcon className="w-4 h-4 text-gray-500" />
          ) : type === 'number' ? (
            <InputIcon className="w-4 h-4 text-gray-500" />
          ) : (
            <CheckboxIcon className="w-4 h-4 text-gray-500" />
          )
        )}
        {isLeftPanelOpen && <span>{label}</span>}
      </div>
    </div>
  );
}

interface ComponentCollectionProps {
  isLeftPanelOpen: boolean;
}

export function ComponentCollection({ isLeftPanelOpen }: ComponentCollectionProps) {
  const fields = [
    { id: 'text', type: 'string', label: 'Text Input', category: 'field' as const },
    { id: 'number', type: 'number', label: 'Number Input', category: 'field' as const },
    { id: 'checkbox', type: 'boolean', label: 'Checkbox', category: 'field' as const },
  ];

  const layouts = [
    { id: 'vertical', type: 'VerticalLayout', label: 'Vertical Layout', category: 'layout' as const },
    { id: 'horizontal', type: 'HorizontalLayout', label: 'Horizontal Layout', category: 'layout' as const },
  ];

  return (
    <div className={`space-y-6 ${!isLeftPanelOpen ? 'space-y-4' : ''}`}>
      <div>
        {isLeftPanelOpen ? (
          <h2 className="text-lg font-semibold mb-4">Layouts</h2>
        ) : (
          <div className="h-px bg-gray-200 mb-2" />
        )}
        <div className={`space-y-2 ${!isLeftPanelOpen ? 'space-y-1' : ''}`}>
          {layouts.map((layout) => (
            <DraggableComponent
              key={layout.id}
              id={layout.id}
              type={layout.type}
              label={layout.label}
              category={layout.category}
              isLeftPanelOpen={isLeftPanelOpen}
            />
          ))}
        </div>
      </div>
      <div>
        {isLeftPanelOpen ? (
          <h2 className="text-lg font-semibold mb-4">Form Fields</h2>
        ) : (
          <div className="h-px bg-gray-200 mb-2" />
        )}
        <div className={`space-y-2 ${!isLeftPanelOpen ? 'space-y-1' : ''}`}>
          {fields.map((field) => (
            <DraggableComponent
              key={field.id}
              id={field.id}
              type={field.type}
              label={field.label}
              category={field.category}
              isLeftPanelOpen={isLeftPanelOpen}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 