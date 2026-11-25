import { colorFor, initial } from '../lib/format';

export function Avatar({ id, name, url, size }: { id: string; name: string; url?: string | null; size?: number }) {
  const style: React.CSSProperties = { background: colorFor(id), ...(size ? { width: size, height: size, fontSize: Math.round(size / 2.6) } : {}) };
  return url
    ? <img className="av" src={url} alt="" style={{ ...style, objectFit: 'cover' }} />
    : <span className="av" style={style} aria-hidden="true">{initial(name)}</span>;
}
