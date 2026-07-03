import { createRoot } from 'react-dom/client';
import { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, Tooltip,
} from 'recharts';

interface SystemMetrics {
  status: string;
  timestamp: string;
  metrics: {
    uptime: number;
    memory: { total: number; used: number; free: number };
    cpu: number;
    disk: { total: number; free: number; used: number };
  };
  system: {
    php_version: string;
    os: string;
    hostname: string;
    load_average: number[];
  };
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

const COLORS = { used: '#52A9FF', free: '#2D5A8A', bg: '#1E3A5A' };

function DonutChart({ value, label, unit }: { value: number; label: string; unit: string }) {
  const data = [
    { name: 'Used', value },
    { name: 'Free', value: 100 - value },
  ];

  return (
    <div style={{ textAlign: 'center' }}>
      <ResponsiveContainer width="100%" height={140}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={58}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={COLORS.used} />
            <Cell fill={COLORS.bg} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ marginTop: -90, fontSize: 22, fontWeight: 700, color: '#eee' }}>
        {value.toFixed(1)}<span style={{ fontSize: 14, color: '#999' }}>{unit}</span>
      </div>
      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function UsageBar({ used, total, label }: { used: number; total: number; label: string }) {
  const pct = total > 0 ? (used / total) * 100 : 0;
  const data = [{ name: label, used, free: total - used }];

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#ccc', marginBottom: 4 }}>
        <span>{label}</span>
        <span>{formatBytes(used)} / {formatBytes(total)}</span>
      </div>
      <ResponsiveContainer width="100%" height={30}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis type="number" hide domain={[0, total]} />
          <Tooltip
            contentStyle={{ background: '#222', border: '1px solid #444', borderRadius: 6, fontSize: 12 }}
            formatter={(v: number) => formatBytes(v)}
          />
          <Bar dataKey="used" fill={COLORS.used} radius={[4, 0, 0, 4]} stackId="a" maxBarSize={24} />
          <Bar dataKey="free" fill={COLORS.bg} radius={[0, 4, 4, 0]} stackId="a" maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 11, color: '#777', marginTop: 2 }}>{pct.toFixed(1)}% used</div>
    </div>
  );
}

function LoadGraph({ loads }: { loads: number[] }) {
  const data = loads.map((v, i) => ({ name: `${i + 1}m`, value: parseFloat(v.toFixed(2)) }));

  return (
    <div>
      <div style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>Load Average</div>
      <ResponsiveContainer width="100%" height={60}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#777' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#222', border: '1px solid #444', borderRadius: 6, fontSize: 12 }}
          />
          <Bar dataKey="value" fill={COLORS.used} radius={[3, 3, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AdminDashboard() {
  const [data, setData] = useState<SystemMetrics | null>(null);

  const fetchMetrics = useCallback(() => {
    fetch('/api/application/panel/status')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
        <i className="fa fa-spinner fa-spin" style={{ fontSize: 24 }}></i>
        <p style={{ marginTop: 8, fontSize: 13 }}>Loading system metrics...</p>
      </div>
    );
  }

  const { metrics, system } = data;

  return (
    <div>
      <div className="row">
        <div className="col-md-3 col-sm-6 col-xs-12">
          <div className="small-box" style={{ background: '#1a1a1a', borderRadius: 6, padding: 16 }}>
            <DonutChart value={metrics.cpu} label="CPU Usage" unit="%" />
          </div>
        </div>
        <div className="col-md-3 col-sm-6 col-xs-12">
          <div className="small-box" style={{ background: '#1a1a1a', borderRadius: 6, padding: 16 }}>
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#eee' }}>{formatUptime(metrics.uptime)}</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Uptime</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 col-xs-12">
          <div className="small-box" style={{ background: '#1a1a1a', borderRadius: 6, padding: 16 }}>
            <UsageBar used={metrics.memory.used} total={metrics.memory.total} label="Memory" />
          </div>
        </div>
        <div className="col-md-3 col-sm-6 col-xs-12">
          <div className="small-box" style={{ background: '#1a1a1a', borderRadius: 6, padding: 16 }}>
            <UsageBar used={metrics.disk.used} total={metrics.disk.total} label="Disk" />
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="box" style={{ borderTop: '3px solid #52A9FF' }}>
            <div className="box-header with-border"><h3 className="box-title">System Info</h3></div>
            <div className="box-body">
              <table style={{ width: '100%', fontSize: 13 }}>
                <tbody>
                  {[
                    ['Hostname', system.hostname],
                    ['OS', system.os],
                    ['PHP Version', system.php_version],
                    ['CPU Cores', navigator.hardwareConcurrency?.toString() || 'N/A'],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ color: '#999', padding: '6px 0', width: 120 }}>{k}</td>
                      <td style={{ color: '#eee' }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="box" style={{ borderTop: '3px solid #52A9FF' }}>
            <div className="box-header with-border"><h3 className="box-title">Load Average</h3></div>
            <div className="box-body">
              <LoadGraph loads={system.load_average} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById('admin-dashboard');
if (container) {
  const root = createRoot(container);
  root.render(<AdminDashboard />);
}
