import React from "react";

type CardField = {
  key: string;
  label: string;
  type?: "text" | "url" | "notes";
  linkText?: string;
};

type CardContentProps = {
  title: string;
  item: Record<string, any>;
  fields: CardField[];
};

export default function CardContent({ title, item, fields }: CardContentProps) {
  return (
    <>
      <h3 className="font-medium text-gray-800">{item[title]}</h3>

      {fields.map((field) => {
        if (!item[field.key]) return null;

        if (field.type === "url") {
          return (
            <a
              key={field.key}
              href={item[field.key]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline"
              onClick={(e) => e.stopPropagation()} // Prevent edit modal when clicking link
            >
              {field.linkText || field.label}
            </a>
          );
        } else if (field.type === "notes") {
          return (
            <div key={field.key} className="mt-2 text-sm text-gray-600">
              <p className="font-medium">{field.label}:</p>
              <p>{item[field.key]}</p>
            </div>
          );
        } else {
          return (
            <p key={field.key} className="text-sm text-gray-600">
              {field.label}: {item[field.key]}
            </p>
          );
        }
      })}
    </>
  );
}
