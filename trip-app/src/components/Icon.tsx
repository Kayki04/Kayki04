const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
export const Icon = {
  heart: () => <svg viewBox="0 0 24 24" {...P}><path d="M12 20s-7.5-4.6-9.2-9.3C1.7 7.5 3.8 4 7.4 4c2 0 3.6 1.1 4.6 2.7C13 5.1 14.6 4 16.6 4c3.6 0 5.7 3.5 4.6 6.7C19.5 15.4 12 20 12 20z" /></svg>,
  chat: () => <svg viewBox="0 0 24 24" {...P}><path d="M4 18.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8z" /></svg>,
  send: () => <svg viewBox="0 0 24 24" {...P}><path d="M21 3 10 14M21 3l-7 18-4-7-7-4z" /></svg>,
  dots: () => <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>,
  play: () => <svg viewBox="0 0 24 24" fill="#fff"><path d="M7 4.5v15l13-7.5z" /></svg>,
  bell: () => <svg viewBox="0 0 24 24" {...P}><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z" /><path d="M10 21h4" /></svg>,
  close: () => <svg viewBox="0 0 24 24" width="26" height="26" {...P} strokeWidth={2.4}><path d="M6 6l12 12M18 6 6 18" /></svg>,
  back: () => <svg viewBox="0 0 24 24" width="24" height="24" {...P} strokeWidth={2.4}><path d="M15 5l-7 7 7 7" /></svg>,
  search: () => <svg viewBox="0 0 24 24" {...P} strokeWidth={2.2}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>,
};
