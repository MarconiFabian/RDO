
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
  // Substitua este link pelo link direto da logo da sua empresa hospedada na internet (Imgur, site da empresa, etc)
  // Usei um ícone de Capacete de Obra como padrão profissional.
  defaultLogo: "https://cdn-icons-png.flaticon.com/512/1598/1598196.png",
  appName: "RDO Online"
};
