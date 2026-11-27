# Deep Work architecture

The parts added so far: weekly slot signup (step 1), and the session room with its AI host and screen share (step 2). Screen checks (step 3) and the Slack bot (step 4) come later.

![Deep Work system diagram](deep-work-architecture.svg)

## Diagram (Mermaid)

```mermaid
flowchart LR
  subgraph Browser
    Account["Account page<br/>DeepWorkScheduler: pick 2 slots"]
    Card["Overview tab<br/>DeepWorkCard: next session, Join"]
    Room["Session room<br/>/deep-work/[sessionId]<br/>screen preview + AI chat"]
  end

  subgraph API["Next.js API routes (app/api/deep-work)"]
    Schedule["GET/PUT /schedule"]
    Join["POST /sessions/join"]
    Get["GET /sessions/[id]"]
    Token["POST /sessions/[id]/token<br/>signs a LiveKit JWT locally"]
    Messages["POST /sessions/[id]/messages"]
    End["POST /sessions/[id]/end"]
  end

  subgraph Services["Data and services"]
    DB[("Postgres via Prisma<br/>DeepWorkSlotSignup<br/>DeepWorkSession<br/>DeepWorkMessage")]
    Claude["Claude API<br/>ai-host.ts"]
    LiveKit["LiveKit Cloud<br/>room dw-[sessionId]"]
  end

  Account --> Schedule
  Card --> Schedule
  Card --> Join
  Room --> Get
  Room --> Token
  Room --> Messages
  Room --> End

  Schedule --> DB
  Join --> DB
  Get --> DB
  Messages --> DB
  End --> DB
  Messages -- "reply, plan, summary (JSON)" --> Claude
  Room -- "screen share (WebRTC) with the token" --> LiveKit
```

## Key workflows

Each walkthrough follows the diagram from left to right. **Browser** boxes are blue, **API route** boxes are teal, and **Data and services** boxes are purple (Postgres), amber (Claude) and pink (LiveKit).

### 1. Picking weekly slots

*Diagram: Account page → `GET/PUT /schedule` → Postgres (`DeepWorkSlotSignup`)*

1. The student opens **Account page** (`/account#deep-work`). `DeepWorkScheduler` (`components/deep-work-scheduler.tsx`) calls `GET /api/deep-work/schedule` to load their current picks.
2. The route (`app/api/deep-work/schedule/route.ts`) reads the student's `DeepWorkSlotSignup` rows from Postgres. It returns them in weekly order, along with the next upcoming session. That calculation, `nextDeepWorkSession` in `app/lib/deep-work/slots.ts`, handles daylight saving.
3. The student picks exactly 2 of the 6 fixed slots and clicks Save, which sends `PUT /schedule` with `{ slotKeys: ["mon-19", "thu-18"] }`.
4. The route checks the pick (`validateSlotSelection`: exactly 2 distinct slots that exist). In one transaction it deletes the old rows and inserts the new ones. Picks repeat every week until the student changes them.

The slot list itself lives in code, not in Postgres, so adding or moving a slot is a one-line edit to `DEEP_WORK_SLOTS`.

### 2. Seeing the next session and joining

*Diagram: Overview tab → `GET/PUT /schedule`; Overview tab → `POST /sessions/join` → Postgres (`DeepWorkSession`, `DeepWorkMessage`)*

1. **Overview tab** renders `DeepWorkCard` (`components/deep-work-card.tsx`), which calls `GET /schedule`, the same route as workflow 1. It shows the student's slots and next session, or the amber "pick your sessions" prompt if they have none.
2. Every 30 seconds the card checks `canJoinNow`: whether the time is between `joinOpensIso` (10 minutes before the start) and the session's end. Once it is, the button changes from "Change sessions" to **Join session**.
3. Clicking Join sends `POST /api/deep-work/sessions/join`. The route (`app/api/deep-work/sessions/join/route.ts`) recomputes the open session from the student's slots, so the server never trusts the browser's clock. Outside a window it answers 409.
4. It looks up the `DeepWorkSession` row for this student and this occurrence, which is unique on `userId` and `scheduledStart`:
   - **No row yet:** it creates one with status `ACTIVE`, a LiveKit room name `dw-<sessionId>`, and the host's opening `DeepWorkMessage`.
   - **A row exists** (a refresh or a second tab): it reuses it, so a student has one session per slot per week.
5. The route returns `{ sessionId }`, and the browser navigates to **Session room** (`/deep-work/<sessionId>`).

With `DEEP_WORK_PRACTICE_MODE=true` (outside production only), the card also offers "Start practice session". It sends `POST /join` with `{ practice: true }`, which creates a 2-hour session starting now.

### 3. Planning, working and chatting with the AI host

*Diagram: Session room → `GET /sessions/[id]`, `POST /sessions/[id]/messages` → Claude API, and → Postgres*

1. **Session room** (`components/deep-work-room.tsx`) loads the session and its chat through `GET /api/deep-work/sessions/[id]`. Every session route first checks that the session belongs to the signed-in student (`findOwnSession` in `app/lib/deep-work/session-store.ts`), and refuses the instructor `?userId=` parameter.
2. The student types a message, which sends `POST /sessions/[id]/messages`. The route (`app/api/deep-work/sessions/[id]/messages/route.ts`) saves the message as a `STUDENT` row, then reads the whole chat back from Postgres.
3. It works out the session's **phase** from the row (`sessionPhase` in `app/lib/deep-work/sessions.ts`):
   - **planning:** `ACTIVE` with no plan yet;
   - **working:** `ACTIVE` with a plan;
   - **summary:** `WRAPPING_UP`;
   - **done:** `COMPLETED`.
4. It makes **one Claude API call** (`runHostTurn` in `app/lib/deep-work/ai-host.ts`). The request has a fixed system prompt, the full chat, and a system note at the end with the phase rules, the student's name, the time left and the saved plan. Claude must answer in JSON: `{ reply, plan, summary }`.
   - **planning:** if the student gave a concrete plan, Claude returns it in `plan`. If not, Claude asks one clarifying question.
   - **working:** Claude answers briefly and fills `plan` only if the student changes it.
5. The route saves the reply as an `AI` message, saves the plan to `DeepWorkSession.plan` if one was captured, and returns the updated session and chat. The page pins the plan at the top of the chat.

If the Claude call fails, the student's message stays saved, and the route answers 502 so the page can show an error. If Claude declines a message, the server-side fallback retries it on another model. Anything still unusable gets a safe fallback reply.

No AI process sits in the LiveKit room. The host is stateless: each turn is rebuilt from the database.

### 4. Sharing the screen

*Diagram: Session room → `POST /sessions/[id]/token`; Session room → LiveKit Cloud (the arrow along the bottom)*

1. The student clicks **Share screen**, which sends `POST /sessions/[id]/token`.
2. The route (`app/api/deep-work/sessions/[id]/token/route.ts`) checks that the session is the student's and hasn't ended. It then signs a LiveKit access token on our server (`createRoomToken` in `app/lib/deep-work/livekit.ts`), using `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`. This makes no network call to LiveKit. The token:
   - lets the student into room `dw-<sessionId>` only;
   - lets them publish **only a screen share** (no camera or mic);
   - expires 30 minutes after the session's scheduled end.
3. The browser uses `livekit-client` to connect to **LiveKit Cloud** with that token, and publishes the screen over WebRTC. The video goes straight from the browser to LiveKit, never through our server, and nothing is recorded. The page shows a local preview.
4. If the student cancels the picker or uses the browser's own "Stop sharing" bar, the page leaves the room. Without the `LIVEKIT_*` env vars the token route answers 503 and the room runs chat-only.

Step 3 (screen checks) will add a still frame from this track every 30 minutes.

### 5. Ending a session and capturing the summary

*Diagram: Session room → `POST /sessions/[id]/end` → Postgres; then Session room → `POST /sessions/[id]/messages` → Claude API → Postgres*

1. A session starts to end in one of two ways:
   - the student clicks **End session**;
   - the page's timer reaches the scheduled end and calls the same route on its own.

   Either way the page sends `POST /sessions/[id]/end`.
2. The route (`app/api/deep-work/sessions/[id]/end/route.ts`) switches the session from `ACTIVE` to `WRAPPING_UP` and sets `wrapUpAt`. It uses a conditional update, so if two tabs press End only one of them posts the host's wrap-up question. That question (`wrapUpMessage`) quotes the saved plan and asks what got done.
3. The student answers in the chat, which goes through `POST /messages` exactly as in workflow 3, now in the **summary** phase. When Claude returns a `summary`, the route saves it and marks the session `COMPLETED` with `endedAt`.
4. The page shows the summary under the plan, disconnects any screen share, and closes the chat with a "Back to dashboard" link. Later messages to the session get a 409.

A session nobody wraps up stays `WRAPPING_UP`. Step 4 (the Slack bot) will nudge students who haven't sent a summary.
