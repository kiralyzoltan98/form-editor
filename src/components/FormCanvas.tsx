import { useForm } from '../contexts/FormContext';
import { JsonForms } from '@jsonforms/react';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import { UISchemaElement } from '@jsonforms/core';

export function FormCanvas() {
  const { schema, uiSchema, formData, updateFormData } = useForm();

  return (
    <div className="h-full w-full p-6 bg-white rounded-lg shadow-sm">
      <JsonForms
        schema={schema}
        uischema={uiSchema as UISchemaElement}
        data={formData}
        renderers={materialRenderers}
        cells={materialCells}
        onChange={({ data }) => updateFormData(data)}
      />
    </div>
  );
} 