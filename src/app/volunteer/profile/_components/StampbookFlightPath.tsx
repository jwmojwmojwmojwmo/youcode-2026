import { cn } from "@/lib/utils";

type StampbookFlightPathProps = {
  completedEvents: number;
  completedHours: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pointOnCurve(t: number) {
  const start = { x: 12, y: 58 };
  const control = { x: 56, y: 14 };
  const end = { x: 108, y: 58 };
  const eased = clamp(t, 0, 1);

  const oneMinusT = 1 - eased;
  const x = oneMinusT * oneMinusT * start.x + 2 * oneMinusT * eased * control.x + eased * eased * end.x;
  const y = oneMinusT * oneMinusT * start.y + 2 * oneMinusT * eased * control.y + eased * eased * end.y;

  return { x, y };
}

function milestonePoint(progress: number) {
  return pointOnCurve(progress);
}

export default function StampbookFlightPath({ completedEvents, completedHours }: StampbookFlightPathProps) {
  const routeProgress = clamp(completedEvents / 5, 0, 1);
  const plane = pointOnCurve(routeProgress);
  const firstStamp = milestonePoint(0.2);
  const secondStamp = milestonePoint(1);
  const firstUnlocked = completedEvents >= 1;
  const secondUnlocked = completedEvents >= 5;
  const hourProgress = clamp(completedHours / 500, 0, 1);

  return (
    <section className="paper-panel-strong rounded-[1.75rem] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="kicker">Page 3</p>
          <h2 className="display-font mt-1 text-2xl font-semibold text-slate-900">Flight path</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            The first event stamp is inked in when you complete one event. The route stretches toward the next destination,
            and the plane shows how close you are to the five-event milestone.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700">
          {completedEvents} events completed
        </div>
      </div>

      <div className="stampbook-route mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 p-4">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          <span>Route 01</span>
          <span>Route 05</span>
        </div>

        <svg viewBox="0 0 120 92" className="mt-3 h-64 w-full" role="img" aria-label="Volunteer flight path progress">
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0b5d66" />
              <stop offset="100%" stopColor="#c45c2d" />
            </linearGradient>
          </defs>

          <path
            d="M 12 58 C 28 18, 52 14, 60 34 S 92 82, 108 58"
            fill="none"
            stroke="rgba(20, 33, 46, 0.12)"
            strokeWidth="1.8"
            strokeDasharray="4 6"
            strokeLinecap="round"
          />

          <path
            d="M 12 58 C 28 18, 52 14, 60 34 S 92 82, 108 58"
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth={Math.max(2, Math.round(routeProgress * 4))}
            strokeDasharray="4 6"
            strokeLinecap="round"
            strokeDashoffset={-12}
            opacity={0.28 + routeProgress * 0.35}
          />

          <g transform={`translate(${firstStamp.x}, ${firstStamp.y})`}>
            <circle r="7" fill={firstUnlocked ? "#0b5d66" : "#f2ebe0"} stroke={firstUnlocked ? "#08444c" : "#c7cdd1"} strokeWidth="1.5" />
            <circle r="3.4" fill={firstUnlocked ? "#ffffff" : "#c7cdd1"} />
          </g>

          <g transform={`translate(${secondStamp.x}, ${secondStamp.y})`}>
            <circle r="7" fill={secondUnlocked ? "#c45c2d" : "#f2ebe0"} stroke={secondUnlocked ? "#a4461f" : "#c7cdd1"} strokeWidth="1.5" />
            <circle r="3.4" fill={secondUnlocked ? "#ffffff" : "#c7cdd1"} />
          </g>

          <g transform={`translate(${plane.x}, ${plane.y}) rotate(${routeProgress * 18 - 9})`}>
            <path
              d="M -5 1 L 8 -2 L 0 6 L -1 1 L -5 1 Z"
              fill="#14212e"
              opacity="0.92"
            />
          </g>

          <text x="12" y="74" fill="#5f6b76" fontSize="4.6" fontWeight="700">
            1 event
          </text>
          <text x="97" y="74" fill="#5f6b76" fontSize="4.6" fontWeight="700" textAnchor="middle">
            5 events
          </text>
        </svg>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className={cn("rounded-[1.25rem] border p-4", firstUnlocked ? "border-slate-900 bg-white" : "border-slate-200 bg-white/70")}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">First destination</p>
            <p className="mt-2 display-font text-lg font-semibold text-slate-900">1 event completed</p>
            <p className="mt-1 text-sm text-slate-600">
              {firstUnlocked ? "Stamped and ready." : "Not yet stamped."}
            </p>
          </div>

          <div className={cn("rounded-[1.25rem] border p-4", secondUnlocked ? "border-slate-900 bg-white" : "border-slate-200 bg-white/70")}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Next destination</p>
            <p className="mt-2 display-font text-lg font-semibold text-slate-900">5 events completed</p>
            <p className="mt-1 text-sm text-slate-600">
              {secondUnlocked ? "Unlocked." : `${Math.max(5 - completedEvents, 0)} more event${completedEvents === 4 ? "" : "s"} to go.`}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-white/75 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hours route</p>
              <p className="mt-1 text-sm text-slate-600">A second track keeps long-term mileage visible without overwhelming the page.</p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              {completedHours} hours logged
            </div>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#0b5d66,#c45c2d)]"
              style={{ width: `${Math.max(6, Math.round(hourProgress * 100))}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}