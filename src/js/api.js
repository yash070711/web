const request = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body && JSON.stringify(options.body),
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
};

export const api = (collection) => ({
  list: () => request(`/api/${collection}`),
  get: (id) => request(`/api/${collection}/${id}`),
  create: (data) => request(`/api/${collection}`, { method: 'POST', body: data }),
  update: (id, data) => request(`/api/${collection}/${id}`, { method: 'PATCH', body: data }),
  remove: (id) => request(`/api/${collection}/${id}`, { method: 'DELETE' }),
});
