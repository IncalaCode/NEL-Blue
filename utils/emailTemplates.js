const fs = require('fs');
const path = require('path');

const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
  return fs.readFileSync(templatePath, 'utf8');
};

const renderTemplate = (template, data) => {
  let rendered = template;
  Object.keys(data).forEach(key => {
    const placeholder = `{{${key}}}`;
    rendered = rendered.replace(new RegExp(placeholder, 'g'), data[key]);
  });
  return rendered;
};

module.exports = { loadTemplate, renderTemplate };