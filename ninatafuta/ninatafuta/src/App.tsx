import { useEffect } from 'react';
import type { Route } from './types';
import { StoreProvider, useStore } from './store/store';
import { Header, BottomNav, OfflineBar } from './components/Chrome';
import { Onboarding } from './screens/Onboarding';
import { Home } from './screens/Home';
import { Search } from './screens/Search';
import { ListingDetail } from './screens/ListingDetail';
import { Messages, ChatView } from './screens/Messages';
import { Sell } from './screens/Sell';
import { WantedForm } from './screens/Wanted';
import { Profile } from './screens/Profile';
import { SellerProfile } from './screens/SellerProfile';
import { OrderView } from './screens/Order';
import { Notifications } from './screens/Notifications';
import { Moderation } from './screens/Moderation';
import { SheetHost } from './sheets/Sheets';

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'home': return <Home />;
    case 'search': return <Search />;
    case 'sell': return <Sell key={route.editId ?? 'new'} editId={route.editId} />;
    case 'messages': return <Messages />;
    case 'profile': return <Profile />;
    case 'listing': return <ListingDetail id={route.id} />;
    case 'chat': return <ChatView key={route.id} id={route.id} draft={route.draft} />;
    case 'wanted': return <WantedForm />;
    case 'seller': return <SellerProfile id={route.id} />;
    case 'order': return <OrderView id={route.id} />;
    case 'notifications': return <Notifications />;
    case 'moderation': return <Moderation />;
  }
}

function Shell() {
  const { state, route, lang, toast } = useStore();
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  if (!state.user) return <div className="app"><Onboarding /></div>;
  return (
    <div className="app">
      <Header />
      <OfflineBar />
      <main className="content"><Screen route={route} /></main>
      {toast && <div key={toast.id} className="toast" role="status">{toast.text}</div>}
      <BottomNav />
      <SheetHost />
    </div>
  );
}

export default function App() {
  return <StoreProvider><Shell /></StoreProvider>;
}
