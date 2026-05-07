import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onRecorded: (blob: Blob, durationSec: number) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onRecorded, disabled }: Props) {
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
        stream.getTracks().forEach((t) => t.stop());
        onRecorded(blob, duration);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      startedAtRef.current = Date.now();
      setElapsed(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000));
      }, 500);
    } catch (e: any) {
      toast({ title: "Microphone unavailable", description: e?.message || "Permission denied", variant: "destructive" });
    }
  };

  const stop = (cancel = false) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRecording(false);
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (cancel) {
      mr.ondataavailable = null as any;
      mr.onstop = null as any;
      mr.stream.getTracks().forEach((t) => t.stop());
    } else {
      mr.stop();
    }
    mediaRecorderRef.current = null;
  };

  if (!recording) {
    return (
      <Button type="button" size="icon" variant="ghost" onClick={start} disabled={disabled} title="Record voice note">
        <Mic className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 rounded-md bg-destructive/10">
      <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
      <span className="text-xs tabular-nums w-10">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span>
      <Button type="button" size="icon" variant="ghost" onClick={() => stop(true)} title="Cancel"><Trash2 className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant="default" onClick={() => stop(false)} title="Send"><Square className="h-4 w-4" /></Button>
    </div>
  );
}

export function VoicePlayer({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);
  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 className="h-3 w-3 animate-spin" />}
      <audio
        src={url}
        controls
        preload="metadata"
        onLoadedMetadata={() => setLoading(false)}
        className="h-8 max-w-[220px]"
      />
    </div>
  );
}
