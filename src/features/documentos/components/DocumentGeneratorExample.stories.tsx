import type { Meta, StoryObj } from '@storybook/react';
import DocumentGeneratorExample from './DocumentGeneratorExample';

const meta: Meta<typeof DocumentGeneratorExample> = {
  title: 'Features/Documentos/DocumentGeneratorExample',
  component: DocumentGeneratorExample,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCustomBranding: Story = {
  render: () => (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Generador de Documentos PDF</h2>
      <p className="text-sm text-gray-600 mb-4">
        Este componente demuestra la generación de documentos PDF con branding institucional.
        Haz clic en el botón para generar y descargar un PDF de prueba.
      </p>
      <DocumentGeneratorExample />
    </div>
  ),
};
