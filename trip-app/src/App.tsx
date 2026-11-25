import { Route, Routes, useLocation } from 'react-router-dom';
import { AgeGate } from './components/AgeGate';
import { BottomNav } from './components/BottomNav';

function Placeholder({ title }: { title: string }) {
  return (
    <>
      <header className="cab"><h1>{title}</h1></header>
      <div className="vazio">Em construção.</div>
    </>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const dark = pathname.startsWith('/videos');
  return (
    <div className={'app' + (dark ? ' escuro' : '')}>
      <AgeGate />
      <main className={'view' + (dark ? ' escura' : '')}>
        <Routes>
          <Route path="/" element={<><header className="cab"><p className="logo">trip</p></header><div className="vazio">Em construção.</div></>} />
          <Route path="/videos" element={<Placeholder title="Vídeos" />} />
          <Route path="/novo" element={<Placeholder title="Nova postagem" />} />
          <Route path="/assinaturas" element={<Placeholder title="Minhas assinaturas" />} />
          <Route path="/perfil" element={<Placeholder title="Meu perfil" />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
