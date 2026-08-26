export const DEFAULT_COLOR = '#1f6d5a';
export function readPersonalization(search = window.location.search) {
  try {
    const params = new URLSearchParams(search);
    const rawName = (params.get('empresa') ?? '').trim();
    const company = rawName ? rawName.slice(0,80) : null;
    const rawColor = (params.get('cor') ?? '').replace('#','').trim();
    const color = /^[0-9a-fA-F]{6}$/.test(rawColor) ? `#${rawColor.toLowerCase()}` : null;
    return { company, color };
  } catch { return { company:null, color:null }; }
}
