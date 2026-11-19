const base = (props) => ({
  width: props.size || 24, height: props.size || 24, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: props.stroke || 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  className: props.className, style: props.style,
});
export const Home = (p) => <svg {...base(p)}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" fill={p.filled ? 'currentColor' : 'none'} /></svg>;
export const Search = (p) => <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
export const Reels = (p) => <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="5" fill={p.filled ? 'currentColor' : 'none'} /><path d="M3 8h18M8.5 3l3 5M14.5 3l3 5" stroke={p.filled ? '#fff' : 'currentColor'} /><path d="m10 11.5 4.5 2.6-4.5 2.6z" fill={p.filled ? '#fff' : 'currentColor'} stroke="none" /></svg>;
export const Flame = (p) => <svg {...base(p)}><path d="M12 22c4 0 7-2.7 7-7 0-3.5-2.2-6-4.2-8.2-.4 2-1.4 3.2-2.8 3.7C12.6 7 11 4.4 8.5 2.5 8.6 6 5 8.5 5 14c0 4.3 3 8 7 8z" fill={p.filled ? 'currentColor' : 'none'} /></svg>;
export const User = (p) => <svg {...base(p)}><circle cx="12" cy="8" r="4" fill={p.filled ? 'currentColor' : 'none'} /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></svg>;
export const Heart = (p) => <svg {...base(p)}><path d="M12 20.5S3 15 3 8.8C3 6 5.1 4 7.6 4c1.8 0 3.3 1 4.4 2.5C13.1 5 14.6 4 16.4 4 18.9 4 21 6 21 8.8 21 15 12 20.5 12 20.5z" fill={p.filled ? 'currentColor' : 'none'} /></svg>;
export const Comment = (p) => <svg {...base(p)}><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.6A8.5 8.5 0 1 1 20.5 11.5z" /></svg>;
export const Bookmark = (p) => <svg {...base(p)}><path d="M6 3h12v18l-6-5-6 5z" fill={p.filled ? 'currentColor' : 'none'} /></svg>;
export const Send = (p) => <svg {...base(p)}><path d="M21 3 10 14M21 3l-7 18-4-7-7-4z" /></svg>;
export const Plus = (p) => <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>;
export const PlusSquare = (p) => <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M12 8v8M8 12h8" /></svg>;
export const Pin = (p) => <svg {...base(p)}><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>;
export const Back = (p) => <svg {...base(p)}><path d="M15 5l-7 7 7 7" /></svg>;
export const Close = (p) => <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const Star = (p) => <svg {...base(p)}><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1L3.2 9.4l6.1-.8z" fill={p.filled ? 'currentColor' : 'none'} /></svg>;
export const Lock = (p) => <svg {...base(p)}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
export const Crown = (p) => <svg {...base(p)}><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z" fill={p.filled ? 'currentColor' : 'none'} /></svg>;
export const Grid = (p) => <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /></svg>;
export const Map = (p) => <svg {...base(p)}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></svg>;
export const Check = (p) => <svg {...base(p)}><path d="m5 12 5 5L20 7" /></svg>;
export const Camera = (p) => <svg {...base(p)}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>;
export const Users = (p) => <svg {...base(p)}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 2.9-5.5 6.5-5.5s6.5 2 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.7c2 .7 3.5 2.4 3.5 5.3" /></svg>;
export const Clock = (p) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
export const Ticket = (p) => <svg {...base(p)}><path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V4H3z" transform="translate(0 2)" /></svg>;
export const Logout = (p) => <svg {...base(p)}><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" /></svg>;
export const Chat = (p) => <svg {...base(p)}><path d="M4 5h16v11H8l-4 4z" /></svg>;
export const Location = (p) => <svg {...base(p)}><path d="M3 11 21 3l-8 18-2-8z" /></svg>;
export const More = (p) => <svg {...base(p)}><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></svg>;
export const Google = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
);
