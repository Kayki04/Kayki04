import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { usePublicProfile } from '../lib/profile';
import { useFeed, useUrls } from '../lib/feed';
import { num } from '../lib/format';
import { Avatar } from '../components/Avatar';
import { Grid } from '../components/Grid';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';

export function ProfileHeader({ handle, back = true }: { handle: string; back?: boolean }) {
  const q = usePublicProfile(handle);
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const p = q.data;
  const feed = useFeed({ author: p?.id });
  const items = p ? feed.data?.pages.flat() ?? [] : [];
  const urls = useUrls(items);
  const avatarUrl = useUrls(p?.avatar_path ? [{ media_path: p.avatar_path } as never] : [])[p?.avatar_path ?? ''];
  if (q.isLoading) return <div className="vazio">Carregando…</div>;
  if (!p) return <div className="vazio">Perfil não encontrado.</div>;
  const follow = async () => {
    const { data } = await supabase.rpc('toggle_follow', { p_user: p.id });
    await qc.invalidateQueries({ queryKey: ['profile', handle] });
    if (data) toast(`Você está seguindo ${p.name}.`);
  };
  return (
    <>
      {back && <header className="cab"><button className="voltar" aria-label="Voltar" onClick={() => nav(-1)}><Icon.back /></button><h1>{p.handle}</h1></header>}
      <div className="capa" />
      <div className="perfil-topo">
        <Avatar id={p.id} name={p.name} url={avatarUrl} size={88} />
        <h1>{p.name} {p.is_creator && <span className="selo">criador</span>}</h1>
        <p className="handle">@{p.handle}</p>
        {p.bio && <p className="bio">{p.bio}</p>}
        <div className="numeros"><div><b>{num(p.posts)}</b>posts</div><div><b>{num(p.followers)}</b>seguidores</div><div><b>{num(p.following)}</b>seguindo</div></div>
        {!p.is_me && <div className="botoes-perfil"><button className={'btn ' + (p.i_follow ? 'btn-linha' : 'btn-marca')} onClick={follow}>{p.i_follow ? 'Seguindo' : 'Seguir'}</button></div>}
        {p.is_me && back && <div className="botoes-perfil"><Link className="btn btn-linha" to="/perfil">Editar perfil</Link></div>}
      </div>
      <div className="secao" style={{ paddingBottom: 6 }}><p className="rotulo">Postagens</p></div>
      <Grid items={items} urls={urls} />
    </>
  );
}

export default function Profile() {
  const { handle } = useParams();
  return <ProfileHeader handle={handle!} />;
}
