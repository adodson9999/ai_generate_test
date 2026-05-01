import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

type SchemaProperty = {
  type?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  enum?: any[];
  properties?: Record<string, SchemaProperty>;
  required?: string[];
};

export function extractConstraints(specFileName: string, schemaName: string): Record<string, SchemaProperty> {
  const filePath = path.resolve(__dirname, '../../specs', specFileName);
  const doc = yaml.load(fs.readFileSync(filePath, 'utf8')) as any;
  const schema = doc.components?.schemas?.[schemaName];
  if (!schema) throw new Error(`Schema "${schemaName}" not found in ${specFileName}`);

  const result: Record<string, SchemaProperty> = {};
  const flatten = (props: Record<string, any>, prefix = '') => {
    for (const [key, val] of Object.entries(props)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      result[fullKey] = val as SchemaProperty;
      if ((val as any).properties) {
        flatten((val as any).properties, fullKey);
      }
    }
  };

  if (schema.properties) flatten(schema.properties);
  result['__required'] = { enum: schema.required || [] } as any;

  return result;
}
