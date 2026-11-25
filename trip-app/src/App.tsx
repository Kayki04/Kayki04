import { Route, Routes, useLocation } from 'react-router-dom';
import { AgeGate } from './components/AgeGate';
import { BottomNav } from './components/BottomNav';
import { RequireProfile } from './lib/auth';
import Login from './pages/Login';
import Invite from './pages/Invite';

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
  const bare = pathname.startsWith('/entrar') || pathname.startsWith('/convite');
  return (
    <div className={'app' + (dark ? ' escuro' : '')}>
      <AgeGate />
      <main className={'view' + (dark ? ' escura' : '')}>
        <Routes>
          <Route path="/entrar" element={<Login />} />
          <Route path="/convite" element={<Invite />} />
          <Route path="/" element={p(<><header className="cab"><p className="logo">trip</p></header><div className="vazio">Em construção.</div></>)} />
          <Route path="/videos" element={p(<Placeholder title="Vídeos" />)} />
          <Route path="/novo" element={p(<Placeholder title="Nova postagem" />)} />
          <Route path="/assinaturas" element={p(<Placeholder title="Minhas assinaturas" />)} />
          <Route path="/perfil" element={p(<Placeholder title="Meu perfil" />)} />
        </Routes>
      </main>
      {!bare && <BottomNav />}
    </div>
  );
}
