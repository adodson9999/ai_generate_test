const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const yaml = require('js-yaml');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const validatorCache = {};
const docsCache = {};

Cypress.Commands.add('validateSchema', (specFileName, pathName, method, status, body) => {
  const cacheKey = `${specFileName}::${pathName}::${method}::${status}`;

  cy.then(() => {
    if (validatorCache[cacheKey]) {
      return validatorCache[cacheKey];
    }

    if (!docsCache[specFileName]) {
      return cy.readFile(`specs/${specFileName}`, 'utf8').then((fileContents) => {
        const doc = yaml.load(fileContents);
        docsCache[specFileName] = doc;
        try {
          ajv.addSchema(doc, specFileName);
        } catch(e) {}
        return doc;
      });
    }
    return docsCache[specFileName];
  }).then(() => {
    if (!validatorCache[cacheKey]) {
      const schemaToCompile = {
        $ref: `${specFileName}#/paths/${pathName.replace(/\//g, '~1')}/${method.toLowerCase()}/responses/${status}/content/application~1json/schema`
      };
      validatorCache[cacheKey] = ajv.compile(schemaToCompile);
    }

    const validate = validatorCache[cacheKey];
    const valid = validate(body);
    if (!valid) {
      const errors = validate.errors.map(e => `${e.instancePath} ${e.message} (expected ${e.params?.type || e.params?.format || 'match'})`).join(', ');
      throw new Error(`Schema validation failed: ${errors}`);
    }
    
    expect(valid).to.be.true;
  });
});
