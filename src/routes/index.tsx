import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Droplets, Sun, Power, PowerOff, Wifi, WifiOff, Leaf, CloudSun, Info } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IrrigaBot — Irrigação Inteligente" },
      { name: "description", content: "Monitoramento e controle de irrigação automática com ESP32." },
    ],
  }),
  component: IrrigaBot,
});

type Status = {
  solo: number;
  luz: number;
  bomba: boolean;
  auto: boolean;
  limiteMin: number;
  limiteMax: number;
  online: boolean;
  simulated: boolean;
};

const perfis = {
  temperos: { nome: "Temperos", min: 45, max: 70 },
  suculentas: { nome: "Suculentas", min: 15, max: 35 },
  flores: { nome: "Flores", min: 40, max: 65 },
  hortalicas: { nome: "Hortaliças", min: 55, max: 80 },
  arbustos: { nome: "Arbustos", min: 35, max: 60 },
} as const;

type PerfilKey = keyof typeof perfis;

function formatDur(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${sec}s`;
  return `${sec}s`;
}

function IrrigaBot() {
  const [status, setStatus] = useState<Status | null>(null);
  const [perfil, setPerfil] = useState<PerfilKey>("flores");
  const [log, setLog] = useState<{ t: string; msg: string }[]>([]);
  const [luzMin, setLuzMin] = useState(50);
  const [lowSince, setLowSince] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const lastBomba = useRef<boolean | null>(null);
  const lastOnline = useRef<boolean | null>(null);

  function addLog(msg: string) {
    const t = new Date().toLocaleTimeString("pt-BR");
    setLog((l) => [{ t, msg }, ...l].slice(0, 50));
  }

  async function fetchStatus() {
    try {
      const r = await fetch("/api/status");
      const data: Status = await r.json();
      setStatus(data);
      setLowSince((prev) => {
        if (data.luz < luzMin) return prev ?? Date.now();
        return null;
      });
      if (lastBomba.current !== null && lastBomba.current !== data.bomba) {
        addLog(data.bomba ? "💧 Bomba ligada" : "⏹ Bomba desligada");
      }
      if (lastOnline.current !== null && lastOnline.current !== data.online) {
        addLog(data.online ? "🟢 ESP32 conectado" : "🔴 ESP32 desconectado");
      }
      lastBomba.current = data.bomba;
      lastOnline.current = data.online;
    } catch {
      addLog("⚠️ Falha ao consultar status");
    }
  }

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 5000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(id);
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [luzMin]);

  async function acionar(state: boolean) {
    await fetch(`/api/pump?state=${state ? 1 : 0}`, { method: "POST" });
    addLog(state ? "👆 Comando manual: ligar bomba" : "👆 Comando manual: desligar bomba");
    fetchStatus();
  }

  async function salvarConfig(min: number, max: number, auto: boolean) {
    await fetch(`/api/config?min=${min}&max=${max}&auto=${auto ? 1 : 0}`, { method: "POST" });
    addLog(`⚙️ Config: ${min}%–${max}%, auto=${auto ? "on" : "off"}`);
    fetchStatus();
  }

  function aplicarPerfil(k: PerfilKey) {
    setPerfil(k);
    const p = perfis[k];
    salvarConfig(p.min, p.max, status?.auto ?? true);
    addLog(`🌱 Perfil aplicado: ${p.nome}`);
  }

  const s = status;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">IrrigaBot</h1>
          </div>
          {s && (
            <Badge variant={s.online ? "default" : "destructive"} className="gap-1">
              {s.online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {s.online ? "Online" : "Offline"}
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {s && !s.online && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm">
            ESP32 offline — exibindo dados simulados. Configure o secret <code>ESP_IP</code> para conectar.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Droplets className="h-4 w-4 text-primary" /> Umidade do solo
            </div>
            <div className="text-3xl font-bold">{s ? Math.round(s.solo) : "—"}%</div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${s?.solo ?? 0}%` }} />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Sun className="h-4 w-4 text-accent-foreground" /> Luminosidade
            </div>
            <div className="text-3xl font-bold">{s ? Math.round(s.luz) : "—"}%</div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-yellow-500 transition-all" style={{ width: `${s?.luz ?? 0}%` }} />
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-muted-foreground">Bomba d'água</div>
              <div className="text-xl font-semibold">{s?.bomba ? "Ligada" : "Desligada"}</div>
            </div>
            <div className={`h-3 w-3 rounded-full ${s?.bomba ? "bg-primary animate-pulse" : "bg-muted"}`} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => acionar(true)} disabled={s?.bomba}>
              <Power className="h-4 w-4 mr-1" /> Acionar
            </Button>
            <Button variant="outline" onClick={() => acionar(false)} disabled={!s?.bomba}>
              <PowerOff className="h-4 w-4 mr-1" /> Desligar
            </Button>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="font-semibold">Perfil de planta</div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(perfis) as PerfilKey[]).map((k) => (
              <Button
                key={k}
                size="sm"
                variant={perfil === k ? "default" : "outline"}
                onClick={() => aplicarPerfil(k)}
              >
                {perfis[k].nome}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto">Modo automático</Label>
            <Switch
              id="auto"
              checked={s?.auto ?? false}
              onCheckedChange={(v) => s && salvarConfig(s.limiteMin, s.limiteMax, v)}
            />
          </div>
          {s && (
            <>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Limite mínimo</span>
                  <span className="font-mono">{s.limiteMin}%</span>
                </div>
                <Slider
                  value={[s.limiteMin]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([v]) => setStatus({ ...s, limiteMin: v })}
                  onValueCommit={([v]) => salvarConfig(v, s.limiteMax, s.auto)}
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Limite máximo</span>
                  <span className="font-mono">{s.limiteMax}%</span>
                </div>
                <Slider
                  value={[s.limiteMax]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([v]) => setStatus({ ...s, limiteMax: v })}
                  onValueCommit={([v]) => salvarConfig(s.limiteMin, v, s.auto)}
                />
              </div>
            </>
          )}
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-2 border-b bg-muted/50 font-semibold text-sm">Log de atividades</div>
          <div className="bg-zinc-950 text-green-400 font-mono text-xs p-3 h-64 overflow-auto">
            {log.length === 0 ? (
              <div className="text-zinc-600">Aguardando eventos...</div>
            ) : (
              log.map((l, i) => (
                <div key={i}>
                  <span className="text-zinc-500">[{l.t}]</span> {l.msg}
                </div>
              ))
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
