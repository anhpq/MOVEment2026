import { useEffect, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import { Circle, Ellipse, Group, Layer, Path, Rect, Stage, Text } from 'react-konva';
import type { Station, StationStatus } from './types';

const COLORS = {
  cyan: '#76efff',
  blue: '#25a9ff',
  violet: '#9d55ff',
  magenta: '#ff43cf',
  green: '#64f29a',
  gold: '#ffd45b',
  goldDeep: '#ffad2f',
  white: '#f4fbff',
  completed: '#edf2f9',
  locked: '#81788f',
  bg: '#010205',
} as const;

const STATIONS: Station[] = [
  { id: '10', label: '10', points: 10, status: 'unplayed', x: 0.19, y: 0.17 },
  { id: '15-top', label: '15', points: 10, status: 'unplayed', x: 0.61, y: 0.15 },
  { id: 'ST15A', label: 'ST15A', points: 10, status: 'unplayed', x: 0.86, y: 0.22 },
  { id: '02', label: '02', points: 10, status: 'completed', x: 0.10, y: 0.43 },
  { id: '16', label: '16', points: 10, status: 'unplayed', x: 0.31, y: 0.42 },
  { id: '07', label: '07', points: 10, status: 'unplayed', x: 0.70, y: 0.42 },
  { id: 'ST047', label: 'ST047', points: 10, status: 'unplayed', x: 0.24, y: 0.66 },
  { id: '15-current', label: '15', points: 10, status: 'playing', x: 0.50, y: 0.56 },
  { id: '12', label: '12', points: 10, status: 'unplayed', x: 0.87, y: 0.56 },
  { id: '23', label: '23', points: 10, status: 'unplayed', x: 0.15, y: 0.84 },
  { id: 'ST052', label: 'ST052', points: 10, status: 'locked', x: 0.55, y: 0.84 },
  { id: 'ST031', label: 'ST031', points: 10, status: 'completed', x: 0.84, y: 0.77 },
];

const LANDSCAPE_STATIONS: Station[] = [
  { id: '10', label: '10', points: 10, status: 'unplayed', x: 0.10, y: 0.22 },
  { id: '15-top', label: '15', points: 10, status: 'unplayed', x: 0.29, y: 0.19 },
  { id: 'ST15A', label: 'ST15A', points: 10, status: 'unplayed', x: 0.49, y: 0.20 },
  { id: '02', label: '02', points: 10, status: 'completed', x: 0.68, y: 0.21 },
  { id: '16', label: '16', points: 10, status: 'unplayed', x: 0.87, y: 0.20 },
  { id: '07', label: '07', points: 10, status: 'unplayed', x: 0.17, y: 0.55 },
  { id: 'ST047', label: 'ST047', points: 10, status: 'unplayed', x: 0.35, y: 0.53 },
  { id: '15-current', label: '15', points: 10, status: 'playing', x: 0.51, y: 0.53 },
  { id: '12', label: '12', points: 10, status: 'unplayed', x: 0.68, y: 0.53 },
  { id: '23', label: '23', points: 10, status: 'unplayed', x: 0.84, y: 0.52 },
  { id: 'ST052', label: 'ST052', points: 10, status: 'locked', x: 0.35, y: 0.85 },
  { id: 'ST031', label: 'ST031', points: 10, status: 'completed', x: 0.69, y: 0.85 },
];

type Props = {
  totalPoints?: number;
  onStationClick?: (station: Station) => void;
  onSettings?: () => void;
  onLeaderboard?: () => void;
  onScan?: () => void;
  onMyTeam?: () => void;
};

type Size = { width: number; height: number };

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<Size>({ width: 1, height: 1 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      setSize((current) =>
        current.width === width && current.height === height ? current : { width, height },
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return [ref, size] as const;
}

function statusStyle(status: StationStatus) {
  switch (status) {
    case 'playing':
      return {
        edgeA: '#fff7ad',
        edgeB: COLORS.gold,
        glow: COLORS.gold,
        text: '#fffbe9',
        opacity: 1,
      };
    case 'completed':
      return {
        edgeA: '#ffffff',
        edgeB: '#abb5c7',
        glow: '#ffffff',
        text: '#eef2f7',
        opacity: 0.62,
      };
    case 'locked':
      return {
        edgeA: '#8a91a0',
        edgeB: '#665c79',
        glow: '#725d8a',
        text: '#a9a6b1',
        opacity: 0.44,
      };
    default:
      return {
        edgeA: COLORS.cyan,
        edgeB: COLORS.violet,
        glow: COLORS.cyan,
        text: COLORS.white,
        opacity: 1,
      };
  }
}

function heartbeatScale(t: number) {
  const p = (t % 1400) / 1400;
  const pulse = (start: number, duration: number, amp: number) => {
    const local = (p - start) / duration;
    if (local <= 0 || local >= 1) return 0;
    return Math.sin(Math.PI * local) * amp;
  };
  return 1 + pulse(0.02, 0.12, 0.10) + pulse(0.18, 0.10, 0.065);
}

function Marker({
  station,
  stageWidth,
  stageHeight,
  onClick,
}: {
  station: Station;
  stageWidth: number;
  stageHeight: number;
  onClick?: (station: Station) => void;
}) {
  const groupRef = useRef<Konva.Group | null>(null);
  const auraRef = useRef<Konva.Circle | null>(null);
  const ring1Ref = useRef<Konva.Ellipse | null>(null);
  const ring2Ref = useRef<Konva.Ellipse | null>(null);
  const ring3Ref = useRef<Konva.Ellipse | null>(null);
  const style = statusStyle(station.status);

  const portrait = stageHeight >= stageWidth;
  const base = Math.max(0.72, Math.min(1.15, Math.min(stageWidth / 682, stageHeight / 760)));
  const pinW = (portrait ? 46 : 42) * base;
  const pinH = (portrait ? 62 : 56) * base;
  const labelSize = (station.label.length > 3 ? 12 : 19) * base;
  const metaW = 58 * base;
  const metaH = 21 * base;
  const x = station.x * stageWidth;
  const y = station.y * stageHeight;

  useEffect(() => {
    if (station.status !== 'playing' || !groupRef.current) return;
    const group = groupRef.current;
    const layer = group.getLayer();
    if (!layer) return;

    const animation = new Konva.Animation((frame) => {
      const time = frame?.time ?? 0;
      const scale = heartbeatScale(time);
      group.scale({ x: scale, y: scale });

      const p = (time % 1400) / 1400;
      const ringPulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 2 - Math.PI / 2);
      auraRef.current?.opacity(0.16 + ringPulse * 0.20);
      ring1Ref.current?.scale({ x: 0.94 + ringPulse * 0.08, y: 0.94 + ringPulse * 0.08 });
      ring2Ref.current?.scale({ x: 0.96 + ringPulse * 0.10, y: 0.96 + ringPulse * 0.10 });
      ring3Ref.current?.scale({ x: 0.98 + ringPulse * 0.12, y: 0.98 + ringPulse * 0.12 });
      ring1Ref.current?.opacity(0.74 - ringPulse * 0.18);
      ring2Ref.current?.opacity(0.50 - ringPulse * 0.16);
      ring3Ref.current?.opacity(0.32 - ringPulse * 0.12);
    }, layer);

    animation.start();
    return () => {
      animation.stop();
      group.scale({ x: 1, y: 1 });
      layer.batchDraw();
    };
  }, [station.status]);

  const pathData = 'M 0 -30 C -19 -30 -29 -17 -29 1 C -29 19 -12 38 0 54 C 12 38 29 19 29 1 C 29 -17 19 -30 0 -30 Z';
  const pathScaleX = pinW / 58;
  const pathScaleY = pinH / 84;

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      opacity={style.opacity}
      listening={true}
      onClick={() => onClick?.(station)}
      onTap={() => onClick?.(station)}
    >
      {station.status === 'playing' && (
        <>
          <Circle
            ref={auraRef}
            radius={41 * base}
            y={-4 * base}
            stroke={COLORS.gold}
            strokeWidth={1}
            opacity={0.22}
            shadowColor={COLORS.gold}
            shadowBlur={18 * base}
          />
          <Ellipse ref={ring3Ref} x={0} y={32 * base} radiusX={58 * base} radiusY={18 * base} stroke={COLORS.goldDeep} strokeWidth={1} opacity={0.32} />
          <Ellipse ref={ring2Ref} x={0} y={32 * base} radiusX={43 * base} radiusY={13 * base} stroke={COLORS.gold} strokeWidth={1.1} opacity={0.50} />
          <Ellipse ref={ring1Ref} x={0} y={32 * base} radiusX={28 * base} radiusY={8 * base} stroke={'#fff0a6'} strokeWidth={1.2} opacity={0.74} />
        </>
      )}

      <Path
        data={pathData}
        scaleX={pathScaleX}
        scaleY={pathScaleY}
        fillLinearGradientStartPoint={{ x: 0, y: -30 }}
        fillLinearGradientEndPoint={{ x: 0, y: 54 }}
        fillLinearGradientColorStops={[0, '#07131d', 0.55, '#02070c', 1, '#010307']}
        stroke={style.edgeA}
        strokeWidth={2.1 / Math.max(pathScaleX, pathScaleY)}
        shadowColor={style.glow}
        shadowBlur={(station.status === 'playing' ? 20 : 10) * base}
        shadowOpacity={station.status === 'completed' ? 0.35 : 0.8}
      />
      <Path
        data={pathData}
        scaleX={pathScaleX * 0.90}
        scaleY={pathScaleY * 0.91}
        fillEnabled={false}
        stroke={style.edgeB}
        strokeWidth={1.05 / Math.max(pathScaleX, pathScaleY)}
        opacity={0.78}
      />

      <Text
        text={station.label}
        x={-pinW / 2}
        y={-14 * base}
        width={pinW}
        align="center"
        fontFamily="Oxanium, Space Grotesk, sans-serif"
        fontSize={labelSize}
        fontStyle="bold"
        fill={style.text}
        shadowColor={style.glow}
        shadowBlur={station.status === 'playing' ? 7 * base : 3 * base}
      />

      {station.status === 'locked' && (
        <Group y={11 * base}>
          <Rect x={-5.5 * base} y={0} width={11 * base} height={8 * base} cornerRadius={1.5 * base} fill="#8d8a93" />
          <Path
            data="M -3 0 V -3 C -3 -7 3 -7 3 -3 V 0"
            stroke="#8d8a93"
            strokeWidth={1.8 * base}
            fillEnabled={false}
          />
        </Group>
      )}

      <Rect
        x={-metaW / 2}
        y={34 * base}
        width={metaW}
        height={metaH}
        cornerRadius={7 * base}
        fill="#02080e"
        stroke={station.status === 'playing' ? COLORS.gold : style.edgeA}
        strokeWidth={1}
        shadowColor={style.glow}
        shadowBlur={5 * base}
        shadowOpacity={0.35}
      />
      <Text
        text={`${station.points} PTS`}
        x={-metaW / 2}
        y={38.2 * base}
        width={metaW}
        align="center"
        fontFamily="Space Grotesk, sans-serif"
        fontSize={10.5 * base}
        fontStyle="700"
        fill={style.text}
      />
    </Group>
  );
}

function Score({ width, totalPoints }: { width: number; totalPoints: number }) {
  const w = Math.min(188, Math.max(154, width * 0.25));
  const h = 64;
  return (
    <Group x={width / 2} y={42}>
      <Rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        cornerRadius={10}
        fill="#07100c"
        stroke="#82d59d"
        strokeWidth={1.4}
        shadowColor="#66f29a"
        shadowBlur={10}
        shadowOpacity={0.18}
      />
      <Text
        text={String(totalPoints)}
        x={-66}
        y={-17}
        width={66}
        align="right"
        fontFamily="Oxanium, sans-serif"
        fontSize={34}
        fontStyle="700"
        fill={COLORS.green}
        shadowColor={COLORS.green}
        shadowBlur={7}
      />
      <Text
        text="PTS"
        x={6}
        y={-9}
        width={56}
        fontFamily="Oxanium, sans-serif"
        fontSize={20}
        fontStyle="700"
        fill="#88efaa"
      />
    </Group>
  );
}

function Legend({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const rows: Array<{ status: StationStatus; label: string }> = [
    { status: 'playing', label: 'ĐANG CHƠI' },
    { status: 'unplayed', label: 'CHƯA CHƠI' },
    { status: 'completed', label: 'HOÀN THÀNH' },
    { status: 'locked', label: 'ĐÃ KHÓA' },
  ];

  return (
    <div className={`legend-wrap ${open ? 'is-open' : ''}`}>
      <button className="legend-toggle" type="button" onClick={onToggle} aria-label="Chú thích" title="Chú thích" aria-expanded={open}>
        <span className="legend-i">i</span>
      </button>
      {open && (
        <div className="legend-popover" role="dialog" aria-label="Chú thích màu marker">
          {rows.map((row) => (
            <div className="legend-row" key={row.status}>
              <span className={`legend-marker legend-${row.status}`}>
                {row.status === 'locked' && <span className="legend-lock">▣</span>}
              </span>
              <strong>{row.label}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Header({ onSettings }: { onSettings?: () => void }) {
  return (
    <header className="app-header">
      <div className="header-title-frame"><h1>MOVEment 2026</h1></div>
      <button className="header-settings" type="button" aria-label="Cài đặt" onClick={onSettings}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19.14 12.94c.04-.31.06-.62.06-.94s-.02-.63-.06-.94l2.03-1.58-1.92-3.32-2.39.96a7.23 7.23 0 0 0-1.63-.94L14.87 3h-3.84l-.36 3.18c-.58.24-1.12.55-1.63.94l-2.39-.96-1.92 3.32 2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58 1.92 3.32 2.39-.96c.5.39 1.05.7 1.63.94l.36 3.18h3.84l.36-3.18c.58-.24 1.13-.55 1.63-.94l2.39.96 1.92-3.32-2.03-1.58ZM12 15.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Z" />
        </svg>
      </button>
    </header>
  );
}

function Footer({
  onLeaderboard,
  onScan,
  onMyTeam,
}: Pick<Props, 'onLeaderboard' | 'onScan' | 'onMyTeam'>) {
  return (
    <footer className="app-footer">
      <button className="footer-wing footer-left" type="button" onClick={onLeaderboard}>
        <span className="footer-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5v2a4 4 0 0 0 4 4m7-6h3v2a4 4 0 0 1-4 4M12 12v4m-3 3h6"/></svg>
        </span>
        <b>BXH</b>
      </button>

      <button className="footer-scan" type="button" onClick={onScan} aria-label="Quét mã">
        <span className="footer-scan-core">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V4h4M16 4h4v4M4 16v4h4M20 16v4h-4"/><path d="M8 8h4v4H8zM15 8h2v2h-2zM15 13h2v2h-2zM8 15h2v2H8zM12 15h2v2h-2zM17 17h2"/></svg>
          <span>QUÉT MÃ</span>
        </span>
      </button>

      <button className="footer-wing footer-right" type="button" onClick={onMyTeam}>
        <span className="footer-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="2.5"/><circle cx="16.5" cy="9" r="2"/><path d="M4 18c.5-3.4 2.4-5.2 5-5.2s4.5 1.8 5 5.2M14 14c2.8-.6 5 .9 5.6 3.8"/></svg>
        </span>
        <b>ĐỘI CỦA TÔI</b>
      </button>
    </footer>
  );
}

export default function Movement2026({
  totalPoints = 11,
  onStationClick,
  onSettings,
  onLeaderboard,
  onScan,
  onMyTeam,
}: Props) {
  const [mainRef, mainSize] = useElementSize<HTMLDivElement>();
  const [legendOpen, setLegendOpen] = useState(false);
  const stageRef = useRef<Konva.Stage | null>(null);
  const isLandscape = mainSize.width > mainSize.height * 1.18;

  useEffect(() => {
    void document.fonts?.ready.then(() => stageRef.current?.batchDraw()).catch(() => undefined);
  }, []);

  const stations = useMemo(() => (isLandscape ? LANDSCAPE_STATIONS : STATIONS), [isLandscape]);

  return (
    <div className="movement-shell">
      <Header onSettings={onSettings} />

      <main className="movement-main" ref={mainRef}>
        <div className="main-grid" aria-hidden="true" />
        <Legend open={legendOpen} onToggle={() => setLegendOpen((v) => !v)} />

        <Stage ref={stageRef} width={mainSize.width} height={mainSize.height}>
          <Layer listening={false}>
            <Rect x={0} y={0} width={mainSize.width} height={mainSize.height} fill="rgba(0,0,0,0)" />
            <Score width={mainSize.width} totalPoints={totalPoints} />
          </Layer>
          <Layer>
            {stations.map((station) => (
              <Marker
                key={station.id}
                station={station}
                stageWidth={mainSize.width}
                stageHeight={mainSize.height}
                onClick={onStationClick}
              />
            ))}
          </Layer>
        </Stage>
      </main>

      <Footer onLeaderboard={onLeaderboard} onScan={onScan} onMyTeam={onMyTeam} />
    </div>
  );
}
