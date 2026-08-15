import Movement2026 from './Movement2026';

export default function App() {
  return (
    <Movement2026
      totalPoints={11}
      onStationClick={(station) => console.log('station:', station)}
      onSettings={() => console.log('settings')}
      onLeaderboard={() => console.log('leaderboard')}
      onScan={() => console.log('scan')}
      onMyTeam={() => console.log('my team')}
    />
  );
}
