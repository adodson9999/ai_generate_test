import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const docsCache: Record<string, any> = {};
const validatorCache: Record<string, any> = {};

export function getValidator(specFileName: string, pathName: string, method: string, status: string) {
  const cacheKey = `${specFileName}::${pathName}::${method}::${status}`;
  if (validatorCache[cacheKey]) {
    return validatorCache[cacheKey];
  }

  if (!docsCache[specFileName]) {
    const filePath = path.resolve(__dirname, '../../specs', specFileName);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const doc = yaml.load(fileContents) as any;
    docsCache[specFileName] = doc;
    
    try {
      ajv.addSchema(doc, specFileName);
    } catch (e) {
      // Ignore if schema already added
    }
  }

  const schemaToCompile = {
    $ref: `${specFileName}#/paths/${pathName.replace(/\//g, '~1')}/${method.toLowerCase()}/responses/${status}/content/application~1json/schema`
  };

  let validate;
  try {
    validate = ajv.compile(schemaToCompile);
  } catch (err) {
    throw new Error(`Failed to compile schema for ${cacheKey}: ${err}`);
  }

  const validatorFn = (body: any) => {
    const valid = validate(body);
    const errors = validate.errors ? validate.errors.map(e => `${e.instancePath} ${e.message} (expected ${e.params?.type || e.params?.format || 'match'}, got ${JSON.stringify(e.data)})`) : [];
    return { valid, errors };
  };

  validatorCache[cacheKey] = validatorFn;
  return validatorFn;
}
