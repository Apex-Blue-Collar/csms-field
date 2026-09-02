import { Button } from "@/components/ui/button";
import { FIELD_COMMANDS, NOISY_HINT } from "@/lib/commands";
import { useAppStore } from "@/lib/store";
import { speak, speechSupported, startPushToTalk } from "@/lib/voice";
import { Mic } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useRef, useState } from "react";

export function FieldCommand() {
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [typed, setTyped] = useState("");
  const [banner, setBanner] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const ignoreRec = useRef(false);
  const taskFromRoute = path.match(/^\/tasks\/([^/]+)/)?.[1];

  const run = (text: string) => {
    ignoreRec.current = true;
    stopRef.current?.();
    stopRef.current = null;
    const s = useAppStore.getState();
    const action = s.runVoice(text, taskFromRoute ?? s.activeTaskId);
    const spoken = action.type === "read-back" ? s.readBack(action.taskId) : action.speak;
    speak(spoken);
    setBanner(spoken);
    setTimeout(() => setBanner(null), 3200);
    switch (action.type) {
      case "navigate":
        void nav({ to: action.to });
        break;
      case "brief":
        void nav({ to: "/briefs" });
        break;
      case "open-asset":
        void nav({ to: "/assets/$id", params: { id: action.assetId } });
        break;
      case "open-task":
        s.setActiveTask(action.taskId);
        void nav({ to: "/tasks/$id", params: { id: action.taskId } });
        break;
      case "open-fault":
        void nav({ to: "/faults/$id", params: { id: action.faultId } });
        break;
      case "start-task":
        s.startTask(action.taskId);
        void nav({ to: "/tasks/$id", params: { id: action.taskId } });
        break;
      case "next-step":
        s.nextChecklistStep(action.taskId);
        void nav({ to: "/tasks/$id", params: { id: action.taskId } });
        break;
      case "photo":
        s.addEvidence(action.taskId, "photo");
        void nav({ to: "/tasks/$id", params: { id: action.taskId } });
        break;
      case "voice-note":
        if (action.note) s.addEvidence(action.taskId, "voice", action.note);
        void nav({ to: "/tasks/$id", params: { id: action.taskId } });
        break;
      case "read-back":
        s.setActiveTask(action.taskId);
        void nav({ to: "/tasks/$id", params: { id: action.taskId } });
        break;
      case "flag":
        s.flagIssue(action.note || text);
        void nav({ to: "/faults" });
        break;
      case "work-order":
        s.createWorkOrder({ fromTaskId: action.taskId, fromFaultId: action.faultId });
        void nav({ to: "/work-orders" });
        break;
      case "copilot":
        s.askCopilot(action.question);
        void nav({ to: "/copilot" });
        break;
      case "airplane":
        s.setAirplane(action.on);
        break;
      case "sync":
        s.syncNow();
        void nav({ to: "/settings" });
        break;
      default:
        break;
    }
    setListening(false);
    setTyped("");
  };

  const down = () => {
    setListening(true);
    setHeard("");
    setTyped("");
    ignoreRec.current = false;
    if (!speechSupported()) return;
    stopRef.current = startPushToTalk((t) => { setHeard(t); if (!ignoreRec.current && t.trim()) run(t.trim()); }, (m) => setBanner(m));
  };
  const up = () => {
    stopRef.current?.();
    stopRef.current = null;
  };

  return (
    <>
      {listening && (
        <div className="absolute inset-0 z-20 flex flex-col justify-end bg-background/90 p-4 pb-24">
          <p className="mb-3 text-center text-base font-medium leading-snug">{heard || NOISY_HINT}</p>
          <div className="mb-3 flex flex-wrap justify-center gap-2">
            {FIELD_COMMANDS.map((c) => (
              <button
                key={c.phrase}
                type="button"
                onClick={() => run(c.phrase)}
                className="press min-h-11 rounded-full bg-card px-3 text-xs font-medium shadow-[var(--shadow-border)]"
              >
                {c.phrase}
              </button>
            ))}
          </div>
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type if the plant is loud"
            className="h-12 w-full rounded-xl bg-card px-3 text-sm outline-none shadow-[var(--shadow-border)]"
            onKeyDown={(e) => { if (e.key === "Enter" && typed.trim()) run(typed.trim()); }}
          />
          <Button variant="quiet" className="mt-2 w-full" onClick={() => { up(); setListening(false); }}>Cancel</Button>
        </div>
      )}
      {banner && !listening && (
        <div className="absolute top-3 left-4 right-4 z-20 rounded-xl bg-card-2 px-3 py-2 text-center text-xs text-muted shadow-[var(--shadow-border)]">{banner}</div>
      )}
      <div className="flex shrink-0 justify-end px-4 pb-2 pt-1">
        <button type="button" aria-label="Hold to talk field commands" onPointerDown={down} onPointerUp={up} onPointerLeave={() => listening && up()}
          className={`relative z-30 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground ${listening ? "listen-pulse" : ""}`}>
          <Mic className="size-5" />
        </button>
      </div>
    </>
  );
}
