import { resourceConfig } from './resourceConfig';

const resources = new Map();
let initialized = false;
const configuredUrls = {
  VITE_CLASSES_API_URL: import.meta.env.VITE_CLASSES_API_URL,
  VITE_SCHOOL_YEARS_API_URL: import.meta.env.VITE_SCHOOL_YEARS_API_URL,
};

export class ResourceApiError extends Error {
  constructor(message, { status, resource, cause } = {}) {
    super(message, { cause });
    this.name = 'ResourceApiError';
    this.status = status;
    this.resource = resource;
  }
}

const configuredResourceUrl = (resource) => {
  const config = resourceConfig[resource];
  if (!config) throw new ResourceApiError(`Unknown API resource: ${resource}`);

  const variableUrl = config.urlVariable ? configuredUrls[config.urlVariable] : null;
  const baseUrl = variableUrl || configuredUrls.VITE_CLASSES_API_URL || configuredUrls.VITE_SCHOOL_YEARS_API_URL;
  if (!baseUrl) throw new ResourceApiError(`API URL is not configured for ${config.name}`, { resource });

  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch (error) {
    throw new ResourceApiError(`API URL is invalid for ${config.name}`, { resource, cause: error });
  }

  const resourceSegment = parsed.pathname.match(/\/api\/resources(?:\/[^/]+)?\/?$/);
  if (!resourceSegment) {
    throw new ResourceApiError(`API URL must point to /api/resources for ${config.name}`, { resource });
  }
  parsed.pathname = `${parsed.pathname.slice(0, resourceSegment.index)}/api/resources/${encodeURIComponent(config.name)}`;
  parsed.search = new URLSearchParams(parsed.search).toString();
  parsed.hash = '';
  return parsed;
};

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload.flatMap(normalizeCollection);
  if (!payload || typeof payload !== 'object') return [];
  if ('data' in payload && (Array.isArray(payload.data) || payload.name)) {
    return normalizeCollection(payload.data);
  }
  if ('items' in payload) return normalizeCollection(payload.items);
  if (payload._id != null || payload.id != null) return [payload];
  if ('data' in payload) return normalizeCollection(payload.data);
  return Object.values(payload).flatMap(normalizeCollection);
};

const responseRecord = (payload) => {
  let value = payload;
  for (let depth = 0; depth < 5; depth += 1) {
    if (Array.isArray(value)) return value[0] ?? null;
    if (!value || typeof value !== 'object') return null;
    if ('data' in value && (Array.isArray(value.data) || value.name)) {
      value = value.data;
      continue;
    }
    if ('item' in value) {
      value = value.item;
      continue;
    }
    if (value._id != null || value.id != null) return value;
    if ('data' in value) {
      value = value.data;
      continue;
    }
    return null;
  }
  return null;
};

const request = async (resource, method = 'GET', id, body) => {
  const url = configuredResourceUrl(resource);
  if (id != null) url.pathname = `${url.pathname}/${encodeURIComponent(id)}`;
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new ResourceApiError(`Network error while accessing ${resourceConfig[resource].name}`, {
      resource,
      cause: error,
    });
  }

  let text;
  try {
    text = await response.text();
  } catch (error) {
    throw new ResourceApiError(`Could not read the ${resourceConfig[resource].name} API response`, {
      status: response.status,
      resource,
      cause: error,
    });
  }
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  if (!response.ok) {
    throw new ResourceApiError(
      `API ${method} ${resourceConfig[resource].name} failed (${response.status})`,
      { status: response.status, resource },
    );
  }
  if (payload?.success === false || payload?.ok === false) {
    throw new ResourceApiError(`API ${method} ${resourceConfig[resource].name} did not complete successfully`, {
      status: response.status,
      resource,
    });
  }
  return payload;
};

const collection = (resource) => {
  if (!resources.has(resource)) resources.set(resource, []);
  return resources.get(resource);
};

const identify = (record) => String(record?._id ?? record?.id ?? '');
const normalizeRecord = (resource, record) => {
  const keyField = resourceConfig[resource].keyField;
  return {
    ...record,
    id: String(record?.[keyField] ?? record?.id ?? record?._id ?? ''),
    _id: record?._id ?? record?.id,
  };
};
const ensureInitialized = (resource) => {
  if (!initialized) {
    throw new ResourceApiError('API resources have not been initialized', { resource });
  }
};

export const initializeResources = async () => {
  const entries = Object.keys(resourceConfig);
  const results = await Promise.allSettled(entries.map(async (resource) => {
    const records = normalizeCollection(await request(resource));
    return [resource, records.map((record) => ({
      ...record,
      _id: record?._id ?? record?.id,
    }))];
  }));
  const failures = results.flatMap((result, index) => (
    result.status === 'rejected'
      ? [{ resource: entries[index], error: result.reason }]
      : []
  ));
  if (failures.length) {
    throw new ResourceApiError(
      `Unable to load API resources: ${failures.map(({ resource, error }) => `${resourceConfig[resource].name} (${error.message})`).join('; ')}`,
      { resource: failures[0].resource, cause: failures[0].error },
    );
  }
  const loaded = results.map((result) => result.value);
  loaded.forEach(([resource, records]) => (
    resources.set(resource, records.map((record) => normalizeRecord(resource, record)))
  ));
  initialized = true;
};

export const areResourcesInitialized = () => initialized;

export const getResourceRecords = (resource) => {
  ensureInitialized(resource);
  return [...collection(resource)];
};

export const createResourceRecord = async (resource, record) => {
  ensureInitialized(resource);
  const { id: recordId, ...body } = record;
  const keyField = resourceConfig[resource].keyField;
  if (recordId && keyField && !body[keyField]) body[keyField] = recordId;
  const payload = await request(resource, 'POST', undefined, body);
  const returned = responseRecord(payload);
  const apiId = returned?._id ?? returned?.id;
  if (!apiId) {
    throw new ResourceApiError(`API did not return an identifier for the created ${resourceConfig[resource].name} record`, { resource });
  }
  const created = normalizeRecord(resource, {
    ...body,
    ...(returned && typeof returned === 'object' ? returned : {}),
    _id: String(apiId),
  });
  resources.set(resource, [...collection(resource), created]);
  return created;
};

export const updateResourceRecord = async (resource, record) => {
  ensureInitialized(resource);
  const id = identify(record);
  if (!id) throw new ResourceApiError(`Cannot update ${resourceConfig[resource].name} without an API identifier`, { resource });
  const body = { ...record, _id: id };
  delete body.id;
  const updated = await request(resource, 'PUT', id, body);
  const returned = responseRecord(updated) ?? {};
  const next = normalizeRecord(resource, { ...record, ...returned, _id: id });
  resources.set(resource, collection(resource).map((item) => (identify(item) === id ? next : item)));
  return next;
};

export const deleteResourceRecord = async (resource, recordOrId) => {
  ensureInitialized(resource);
  const id = typeof recordOrId === 'object' ? identify(recordOrId) : String(recordOrId ?? '');
  if (!id) throw new ResourceApiError(`Cannot delete ${resourceConfig[resource].name} without an API identifier`, { resource });
  await request(resource, 'DELETE', id);
  resources.set(resource, collection(resource).filter((item) => identify(item) !== id));
};
