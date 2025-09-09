import React from "react";

type CardCreationModalProps = {
  title: string;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
  fields: {
    name: string;
    label: string;
    type: "text" | "date" | "url" | "textarea" | "number" | "checkbox";
    required?: boolean;
    rows?: number;
  }[];
  values: Record<string, any>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
};

export default function CardCreationModal({
  title,
  onSubmit,
  onClose,
  fields,
  values,
  onChange,
}: CardCreationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-md my-8">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={onSubmit}>
          {fields.map((field) => (
            <div className="mb-4" key={field.name}>
              <label className="block text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  value={values[field.name] || ""}
                  onChange={onChange}
                  className="w-full p-2 border rounded"
                  rows={field.rows || 3}
                  required={field.required}
                />
              ) : field.type === "checkbox" ? (
                <input
                  type="checkbox"
                  name={field.name}
                  checked={values[field.name] || false}
                  onChange={onChange}
                  className="h-5 w-5 text-blue-600"
                />
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  value={values[field.name] || ""}
                  onChange={onChange}
                  className="w-full p-2 border rounded"
                  required={field.required}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Save
            </button>
          </div>
          {fields.some((field) => field.required) && (
            <div className="mt-2 text-xs text-gray-500">
              <span className="text-red-500">*</span> Required field
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
