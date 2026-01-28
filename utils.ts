
export const cn = (...inputs: any[]) => {
  return inputs.filter(Boolean).join(" ");
};

export const createPageUrl = (pageName: string, params: Record<string, string> = {}) => {
  const hash = `#/${pageName}`;
  const query = new URLSearchParams(params).toString();
  return query ? `${hash}?${query}` : hash;
};

export const getQueryParams = () => {
  const hash = window.location.hash;
  const index = hash.indexOf('?');
  if (index === -1) return new URLSearchParams();
  return new URLSearchParams(hash.substring(index));
};

// Configurações Globais do Sistema
export const SYSTEM_CONFIG = {
  // Agora aponta para o arquivo local na pasta public
  defaultLogo: "/logo.png",
  appName: "RDO Online"
};
