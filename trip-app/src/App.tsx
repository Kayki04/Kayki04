import { Route, Routes, useLocation } from 'react-router-dom';
import { AgeGate } from './components/AgeGate';
import { BottomNav } from './components/BottomNav';
import { RequireProfile } from './lib/auth';
import { DEMO } from './lib/supabase';
import Login from './pages/Login';
import Invite from './pages/Invite';
import Feed from './pages/Feed';
import NewPost from './pages/NewPost';
import Profile from './pages/Profile';
import Me from './pages/Me';
import Videos from './pages/Videos';

function Placeholder({ title }: { title: string }) {
  return (
    <>
      <header className="cab"><h1>{title}</h1></header>
      <div className="vazio">Em construção.</div>
    </>
  );
}

const p = (el: React.ReactNode) => <RequireProfile>{el}</RequireProfile>;

export default function App() {
  const { pathname } = useLocation();
  const dark = pathname.startsWith('/videos');
  const gray = pathname === '/';
  const bare = pathname.startsWith('/entrar') || pathname.startsWith('/convite');
  return (
    <div className={'app' + (dark ? ' escuro' : '')}>
      <AgeGate />
      {DEMO && <div className="demo-faixa">Demonstração · nada do que você fizer aqui é salvo</div>}
      <main className={'view' + (dark ? ' escura' : gray ? ' cinza' : '')}>
        <Routes>
          <Route path="/entrar" element={<Login />} />
          <Route path="/convite" element={<Invite />} />
          <Route path="/" element={p(<Feed />)} />
          <Route path="/videos" element={p(<Videos />)} />
          <Route path="/novo" element={p(<NewPost />)} />
          <Route path="/assinaturas" element={p(<Placeholder title="Minhas assinaturas" />)} />
          <Route path="/perfil" element={p(<Me />)} />
          <Route path="/u/:handle" element={p(<Profile />)} />
        </Routes>
      </main>
      {!bare && <BottomNav />}
    </div>
  );
}
