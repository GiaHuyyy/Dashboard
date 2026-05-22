import EmailTemplate from "../models/EmailTemplate.js";

const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*>/i;

const normalizeString = (value) => (value === null || value === undefined ? "" : String(value));

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const renderTemplateString = (template = "", variables = {}) => {
  let result = normalizeString(template);

  Object.entries(variables).forEach(([key, value]) => {
    const pattern = new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, "g");
    result = result.replace(pattern, normalizeString(value));
  });

  return result;
};

const normalizeBodyToHtml = (body = "") => {
  const normalizedBody = normalizeString(body);
  if (!normalizedBody) return "";

  if (HTML_TAG_REGEX.test(normalizedBody)) return normalizedBody;

  return normalizedBody.replace(/\n/g, "<br />");
};

export const getDefaultEmailTemplate = async (templateType) => {
  if (!templateType) return null;

  return EmailTemplate.findOne({
    templateType,
    status: "active",
    isDefault: true,
    isDeleted: false,
  }).lean();
};

export const renderDefaultEmailTemplate = async ({ templateType, variables = {}, htmlVariables = {}, fallback }) => {
  const template = await getDefaultEmailTemplate(templateType);

  if (!template) {
    return typeof fallback === "function" ? fallback() : fallback;
  }

  const subject = renderTemplateString(template.subject, variables);
  const html = normalizeBodyToHtml(renderTemplateString(template.body, { ...variables, ...htmlVariables }));

  return {
    subject,
    html,
    template,
  };
};
