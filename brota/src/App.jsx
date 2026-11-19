import { useApp } from './AppContext';
import BottomNav from './components/BottomNav';
import { StoryViewer } from './components/Stories';
import VipModal from './components/VipModal';
import { Onboarding, Welcome } from './screens/Login';
import Home from './screens/Home';
import Explore from './screens/Explore';
import RolePage from './screens/RolePage';
import Reels from './screens/Reels';
import NewPost from './screens/NewPost';
import Comments from './screens/Comments';
import Match, { AdmirersList, ItsAMatch } from './screens/Match';
import Chat from './screens/Chat';
import Profile from './screens/Profile';

const TAB_SCREENS = { home: Home, explore: Explore, reels: Reels, match: Match, profile: Profile };
const OVERLAYS = {
  role: RolePage, newpost: NewPost, comments: Comments, chat: Chat, user: (p) => <Profile userId={p.id} />,
  story: StoryViewer, vip: VipModal, itsamatch: ItsAMatch, admirers: AdmirersList,
};

export default function App() {
  const { authUser, me, profileLoaded, route, overlay, toast } = useApp();

  let content;
  if (authUser === undefined || (authUser && !profileLoaded)) content = <div className="splash"><div className="logo big">BROTA</div></div>;
  else if (!authUser) content = <Welcome />;
  else if (!me) content = <Onboarding />;
  else {
    const Tab = TAB_SCREENS[route.name] || Home;
    const Over = overlay && OVERLAYS[overlay.name];
    const modal = overlay && ['vip', 'itsamatch'].includes(overlay.name);
    content = (
      <>
        <div style={{ display: Over && !modal ? 'none' : 'block' }}>
          <Tab key={route.name + JSON.stringify(route.params || {})} {...(route.params || {})} />
          <BottomNav />
        </div>
        {Over && <Over key={JSON.stringify(overlay)} {...overlay.params} />}
      </>
    );
  }
  return (
    <div className="app">
      {content}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
