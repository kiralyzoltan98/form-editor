import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { ComponentCollection } from './components/ComponentCollection';
import { FormCanvas } from './components/FormCanvas';
import { FormEditor } from './components/FormEditor';
import * as Tabs from '@radix-ui/react-tabs';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import { CodePreview } from './components/CodePreview';
import { FormProvider, useForm } from './contexts/FormContext';
import { useState } from 'react';
import { InspectorPanel } from './components/InspectorPanel';

const ROOT_LAYOUT_ID = 'root_vertical_layout';

interface FormField {
  id: string;
  type: string;
  title: string;
  category?: 'layout' | 'field';
  elements?: FormField[];
}

function AppContent() {
  const { 
    handleDragStart, 
    handleDragOver, 
    handleDragEnd, 
    schema, 
    uiSchema, 
    formData,
    fields,
    updateFields,
    updateSchema,
    updateUiSchema,
    updateFormData
  } = useForm();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const onDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
    handleDragStart(event);
  };

  const onDragOver = (event: any) => {
    handleDragOver(event);
  };

  const onDragEnd = (event: any) => {
    handleDragEnd(event);
    setActiveId(null);
  };

  const handleClearForm = () => {
    // Reset to initial state with empty root layout
    const emptyFields: FormField[] = [{
      id: ROOT_LAYOUT_ID,
      type: 'VerticalLayout',
      title: 'Form',
      category: 'layout',
      elements: []
    }];
    
    updateFields(emptyFields);
    updateSchema({
      type: 'object',
      properties: {},
      required: []
    });
    updateUiSchema({
      type: 'VerticalLayout',
      elements: []
    });
    updateFormData({});
  };

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-screen bg-gray-100">
        {/* Left sidebar with collapse functionality */}
        <div className={`relative transition-all duration-300 ease-in-out ${isLeftPanelOpen ? 'w-64' : 'w-12'}`}>
          <div className="absolute inset-y-0 left-0 w-full bg-white border-r border-gray-200">
            <div className="flex items-center justify-between p-4 h-12 border-b border-gray-200">
              <h2 className={`font-semibold text-gray-900 transition-opacity duration-300 ${!isLeftPanelOpen && 'hidden'}`}>
                Components
              </h2>
              <button
                onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label={isLeftPanelOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                <ChevronRightIcon 
                  className={`w-5 h-5 text-gray-500 transition-transform duration-300 origin-center ${
                    isLeftPanelOpen ? 'rotate-90' : 'rotate-0'
                  }`}
                />
              </button>
            </div>
            <div className={`${isLeftPanelOpen ? 'p-4' : 'p-2'}`}>
              <ComponentCollection isLeftPanelOpen={isLeftPanelOpen} />
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          <Tabs.Root defaultValue="editor" className="flex-1 flex flex-col">
            {/* Top toolbar with tabs */}
            <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4">
              <AlertDialog.Root>
                <AlertDialog.Trigger asChild>
                  <button
                    className="mr-4 px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    aria-label="Clear entire form"
                  >
                    Clear Form
                  </button>
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
                  <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-lg w-[400px] space-y-4">
                    <AlertDialog.Title className="text-lg font-semibold text-gray-900">
                      Clear Form
                    </AlertDialog.Title>
                    <AlertDialog.Description className="text-sm text-gray-600">
                      Are you sure you want to clear the entire form? This action cannot be undone and will remove all fields and layouts.
                    </AlertDialog.Description>
                    <div className="flex justify-end gap-3 mt-6">
                      <AlertDialog.Cancel asChild>
                        <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                          Cancel
                        </button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action asChild onClick={handleClearForm}>
                        <button className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors">
                          Yes, clear form
                        </button>
                      </AlertDialog.Action>
                    </div>
                  </AlertDialog.Content>
                </AlertDialog.Portal>
              </AlertDialog.Root>
              <Tabs.List
                className="h-full flex justify-center gap-4 flex-1"
                aria-label="View mode"
              >
                <Tabs.Trigger
                  value="editor"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors"
                >
                  Edit Form
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="preview"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors"
                >
                  Preview
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="code"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors"
                >
                  View Code
                </Tabs.Trigger>
              </Tabs.List>
            </div>

            {/* Canvas area */}
            <div className="flex-1 overflow-auto p-6">
              <Tabs.Content value="editor" className="h-full">
                <FormEditor fields={fields} onFieldsChange={updateFields} />
              </Tabs.Content>
              <Tabs.Content value="preview" className="h-full">
                <FormCanvas />
              </Tabs.Content>
              <Tabs.Content value="code" className="grow p-4 bg-white rounded-lg shadow">
                <div className="space-y-8">
                  <CodePreview title="Form Schema" code={schema} />
                  <CodePreview title="UI Schema" code={uiSchema} />
                  <CodePreview title="Form Data" code={formData} />
                </div>
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </div>

        {/* Right panel with inspector and collapse functionality */}
        <div className={`relative transition-all duration-300 ease-in-out ${isRightPanelOpen ? 'w-64' : 'w-12'}`}>
          <div className="absolute inset-y-0 right-0 w-full bg-white border-l border-gray-200">
            <div className="flex items-center justify-between p-4 h-12 border-b border-gray-200">
              <button
                onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label={isRightPanelOpen ? "Collapse inspector" : "Expand inspector"}
              >
                <ChevronRightIcon 
                  className={`w-5 h-5 text-gray-500 transition-transform duration-300 origin-center ${
                    isRightPanelOpen ? 'rotate-0' : 'rotate-90'
                  }`}
                />
              </button>
              <h2 className={`font-semibold text-gray-900 transition-opacity duration-300 ${!isRightPanelOpen && 'hidden'}`}>
                Inspector
              </h2>
            </div>
            <div className={`${isRightPanelOpen ? 'p-4' : 'p-2'}`}>
              <InspectorPanel isRightPanelOpen={isRightPanelOpen} />
            </div>
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeId ? (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">New Field</h3>
                <p className="text-sm text-gray-500">Type: {activeId}</p>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function App() {
  return (
    <FormProvider>
      <AppContent />
    </FormProvider>
  );
}

export default App;
