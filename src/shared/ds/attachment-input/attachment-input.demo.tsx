import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { Field } from "@/shared/ds/field";

import {
  AttachmentInput,
  type AttachmentEntry,
  type AttachmentRejection,
} from "./attachment-input";

type Kind = "image" | "file";
type Status = AttachmentEntry["status"];
type State =
  | "enabled"
  | "hovered"
  | "pressed"
  | "focused"
  | "dragOver"
  | "readonly"
  | "disabled";

const KINDS: Kind[] = ["image", "file"];
const STATUSES: Status[] = ["pending", "uploading", "success", "error"];
const MB = 1024 * 1024;

// 사진 썸네일 — 색이 다른 그림(데이터 주소). 흰 그림은 덮개 · 대표 띠의 글이 읽히는지 본다(가장 나쁜 값)
const photo = (fill: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="${fill}"/><circle cx="110" cy="50" r="22" fill="#fff" fill-opacity=".7"/><path d="M0 160 L60 80 L110 130 L130 110 L160 150 V160Z" fill="#000" fill-opacity=".25"/></svg>`,
  )}`;
const PHOTOS = [
  "#3B82F6",
  "#F59E0B",
  "#10B981",
  "#EC4899",
  "#FFFFFF",
  "#8B5CF6",
];

let seq = 0;
const make = (
  kind: Kind,
  status: Status,
  over: Partial<AttachmentEntry> = {},
): AttachmentEntry => {
  seq += 1;
  const image = kind === "image";
  return {
    id: `demo-${seq}`,
    name: image ? `영수증_${seq}.jpg` : `카드명세서_${seq}.pdf`,
    size: image ? 2.4 * MB : 9.8 * MB,
    type: image ? "image/jpeg" : "application/pdf",
    previewUrl: image
      ? photo(PHOTOS[seq % PHOTOS.length] ?? "#3B82F6")
      : undefined,
    status,
    ...over,
  };
};

// 검사기는 견본의 첫 요소(틀) 가운데를 올리고 · 누르고 · 초점을 준다. 컨트롤 가운데에는 시험할 부품이 없어, 틀의 안쪽 여백을 맞춰
// 틀의 가운데가 시험 부품(첨부 타일 · × · 다시 시도)의 가운데가 되게 하고 그 부품에 data-probe 를 단다(attachment-input.measure.mjs 머리).
// 틀은 초점을 받아 시험 부품으로 넘긴다
const Probe = ({
  target,
  children,
}: {
  target: string;
  children: ReactNode;
}) => {
  const frame = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const outer = frame.current;
    const inner = outer?.firstElementChild;
    const el = inner?.querySelector<HTMLElement>(target);
    if (!outer || !inner || !el) return;
    el.dataset.probe = "";
    const a = inner.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    const dx = a.width - 2 * (b.left - a.left + b.width / 2);
    const dy = a.height - 2 * (b.top - a.top + b.height / 2);
    outer.style.paddingLeft = `${Math.max(0, dx)}px`;
    outer.style.paddingRight = `${Math.max(0, -dx)}px`;
    outer.style.paddingTop = `${Math.max(0, dy)}px`;
    outer.style.paddingBottom = `${Math.max(0, -dy)}px`;
  }, [target]);
  return (
    <div
      ref={frame}
      tabIndex={-1}
      className="w-fit shrink-0"
      onFocus={(e) => {
        if (e.target === e.currentTarget)
          e.currentTarget
            .querySelector<HTMLElement>("[data-probe]")
            ?.focus({ preventScroll: true });
      }}
    >
      <div className="w-[360px]">{children}</div>
    </div>
  );
};

// 드롭존에 진짜 dragenter 를 보내 끌어 들어온 모습을 만든다(파일을 끌고 들어온 것과 같다)
const DragOver = ({ children }: { children: ReactNode }) => {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const zone = box.current?.querySelector(
      "[data-slot=attachment-input-dropzone]",
    );
    if (!zone) return;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(
      new File(["x"], "가져오기.csv", { type: "text/csv" }),
    );
    zone.dispatchEvent(
      new DragEvent("dragenter", {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      }),
    );
  }, []);
  return (
    <div ref={box} className="w-[360px]">
      {children}
    </div>
  );
};

const TARGET = {
  trigger: "[data-slot=attachment-input-trigger]",
  remove: "[data-slot=attachment-input-remove]",
  retry: "[data-slot=attachment-input-retry]",
} as const;

const noop = () => {};

// 견본 하나 — 항목 하나(상태 · 종류)를 그린다. 올림 · 누름 · 초점은 target 부품이 받는다
const Sample = ({
  kind,
  status = "pending",
  state = "enabled",
  target,
  full = false,
  caption,
}: {
  kind: Kind;
  status?: Status;
  state?: State;
  target?: keyof typeof TARGET;
  full?: boolean;
  caption: string;
}) => {
  const [entries, setEntries] = useState<AttachmentEntry[]>(() =>
    full
      ? [make(kind, status), make(kind, status), make(kind, status)]
      : [make(kind, status)],
  );
  const input = (
    <AttachmentInput
      accept={kind === "image" ? "image/*" : "application/pdf"}
      maxFiles={full ? entries.length : 10}
      badgeLabel={kind === "image" ? "대표" : undefined}
      entries={entries}
      readOnly={state === "readonly"}
      disabled={state === "disabled"}
      aria-label="영수증"
      onFilesAccept={noop}
      onRemove={(id) => setEntries((list) => list.filter((e) => e.id !== id))}
      onRetry={noop}
    />
  );
  return (
    <div className="flex flex-col gap-x1">
      <Specimen
        spec="attachment-input"
        combo={{
          layout: "tile",
          kind,
          status,
          capacity: full ? "full" : "open",
        }}
        state={state}
      >
        {target ? (
          <Probe target={TARGET[target]}>{input}</Probe>
        ) : (
          <div className="w-[360px]">{input}</div>
        )}
      </Specimen>
      <span className="px-x0_5 text-t2 text-fg-neutral-subtle">{caption}</span>
    </div>
  );
};

const DropzoneSample = ({
  state = "enabled",
  full = false,
  caption,
}: {
  state?: State;
  full?: boolean;
  caption: string;
}) => {
  const entries = full ? [make("file", "success")] : [];
  const zone = (
    <AttachmentInput
      layout="dropzone"
      accept=".csv,.xlsx,.xls"
      maxFiles={1}
      entries={entries}
      disabled={state === "disabled"}
      aria-label="파일 업로드"
      onFilesAccept={noop}
      onRemove={noop}
    />
  );
  return (
    <div className="flex flex-col gap-x1">
      <Specimen
        spec="attachment-input"
        combo={{
          layout: "dropzone",
          kind: "file",
          status: "success",
          capacity: full ? "full" : "open",
          screen: "wide",
        }}
        state={state}
      >
        {state === "dragOver" ? (
          <DragOver>{zone}</DragOver>
        ) : (
          <div className="w-[360px]">{zone}</div>
        )}
      </Specimen>
      <span className="px-x0_5 text-t2 text-fg-neutral-subtle">{caption}</span>
    </div>
  );
};

const REJECT_TEXT = {
  FILE_TOO_LARGE: "10MB 넘는 파일은 올릴 수 없어요.",
  INVALID_TYPE: "사진 · PDF 만 올릴 수 있어요.",
  TOO_MANY_FILES: "20개까지 올릴 수 있어요.",
} as const;

// 영수증 — 진짜로 고르고 · 끌어 놓고 · 올리는 척 한다(진행 · 실패 · 다시 시도 · 거절 글). 가장 나쁜 값: 개수 20 · 긴 이름 · 10MB 넘는 파일 · 형식이 다른 파일
const Receipt = () => {
  const [entries, setEntries] = useState<AttachmentEntry[]>(() => [
    make("file", "success", {
      name: "2026년_10월_카드명세서_최종_수정본_v3_진짜최종_거래내역_전체.xlsx",
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 4.2 * MB,
    }),
    make("image", "uploading"),
    make("image", "error"),
    make("file", "success", { name: "영수증.pdf", size: 84 * 1024 }),
  ]);
  const [error, setError] = useState<string | null>(null);
  const update = (id: string, patch: Partial<AttachmentEntry>) =>
    setEntries((list) =>
      list.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  const start = (id: string) => {
    update(id, { status: "uploading", progress: 0 });
    let p = 0;
    const tick = window.setInterval(() => {
      p += 0.25;
      if (p >= 1) {
        window.clearInterval(tick);
        update(id, { status: "success", progress: 1 });
      } else update(id, { progress: p });
    }, 400);
  };
  return (
    <div className="w-[360px]">
      <Field
        label="영수증"
        description="사진 · PDF 를 10MB 까지 올려요. 20개까지."
        invalid={error !== null}
        errorMessage={error}
      >
        <AttachmentInput
          accept="image/*,application/pdf"
          maxFiles={20}
          maxFileSize={10 * MB}
          entries={entries}
          onFilesAccept={(added) => {
            setError(null);
            setEntries((list) => [...list, ...added]);
            added.forEach((e) => start(e.id));
          }}
          onFilesReject={(rejections: AttachmentRejection[]) =>
            setError(
              [...new Set(rejections.flatMap((r) => r.codes))]
                .map((c) => REJECT_TEXT[c])
                .join(" "),
            )
          }
          onRemove={(id) =>
            setEntries((list) => list.filter((e) => e.id !== id))
          }
          onRetry={(id) => start(id)}
        />
      </Field>
    </div>
  );
};

// 사진 순서 · 대표 — 끌기 · 키보드 · 항목 메뉴
const Reorder = () => {
  const [photos, setPhotos] = useState<AttachmentEntry[]>(() =>
    ["#3B82F6", "#F59E0B", "#10B981", "#FFFFFF"].map((fill, i) =>
      make("image", "success", {
        name: `사진_${i + 1}.jpg`,
        previewUrl: photo(fill),
      }),
    ),
  );
  return (
    <div className="w-[360px]">
      <Field
        label="사진"
        description="사진을 10장까지 올려요. 첫 사진이 대표예요."
      >
        <AttachmentInput
          accept="image/*"
          maxFiles={10}
          badgeLabel="대표"
          entries={photos}
          onFilesAccept={(added) => setPhotos((list) => [...list, ...added])}
          onRemove={(id) =>
            setPhotos((list) => list.filter((p) => p.id !== id))
          }
          onReorder={setPhotos}
          onPreview={noop}
        />
      </Field>
    </div>
  );
};

// 파일 하나 가져오기 — 1280 이상 드롭존, 미만은 파일 선택 버튼(창 폭을 줄여 본다)
const Import = () => {
  const [entries, setEntries] = useState<AttachmentEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="w-[360px]">
      <Field
        label="파일 업로드"
        description="CSV(.csv) 또는 Excel(.xlsx, .xls) 파일을 올려주세요. 최대 10MB."
        invalid={error !== null}
        errorMessage={error}
      >
        <AttachmentInput
          layout="dropzone"
          accept=".csv,.xlsx,.xls"
          maxFiles={1}
          maxFileSize={10 * MB}
          entries={entries}
          onFilesAccept={(added) => {
            setError(null);
            setEntries(added.map((e) => ({ ...e, status: "uploading" })));
            window.setTimeout(
              () => setEntries(added.map((e) => ({ ...e, status: "success" }))),
              1200,
            );
          }}
          onFilesReject={() =>
            setError("CSV · Excel 파일을 10MB 까지 올릴 수 있어요.")
          }
          onRemove={() => setEntries([])}
        />
      </Field>
    </div>
  );
};

// 열 장이 다 찬 10/10 · 최대 없음(개수를 그리지 않는다) · Field 안 읽기 전용 · 막힘
const Full = () => {
  const [base] = useState<AttachmentEntry[]>(() =>
    Array.from({ length: 10 }, (_, i) =>
      i === 8
        ? make("image", "uploading")
        : i === 9
          ? make("image", "error")
          : make(i % 3 === 0 ? "file" : "image", "success"),
    ),
  );
  // 진행이 10초 동안 멈추면 실패로 보인다 — 견본은 올리는 척 진행을 계속 움직인다
  const [progress, setProgress] = useState(0.3);
  useEffect(() => {
    const tick = window.setInterval(
      () => setProgress((p) => (p >= 0.9 ? 0.1 : p + 0.1)),
      1500,
    );
    return () => window.clearInterval(tick);
  }, []);
  const entries = base.map((e) =>
    e.status === "uploading" ? { ...e, progress } : e,
  );
  return (
    <div className="w-[360px]">
      <Field label="영수증" description="10개까지 올려요.">
        <AttachmentInput
          accept="image/*,application/pdf"
          maxFiles={10}
          entries={entries}
          onFilesAccept={noop}
          onRemove={noop}
          onRetry={noop}
        />
      </Field>
    </div>
  );
};

const Unlimited = () => (
  <div className="w-[360px]">
    <Field label="메모 첨부">
      <AttachmentInput
        maxFiles={Infinity}
        entries={[make("image", "success"), make("file", "success")]}
        onFilesAccept={noop}
        onRemove={noop}
      />
    </Field>
  </div>
);

const Locked = ({ mode }: { mode: "readOnly" | "disabled" }) => (
  <div className="w-[360px]">
    <Field label="영수증" {...{ [mode]: true }}>
      <AttachmentInput
        accept="image/*,application/pdf"
        maxFiles={10}
        entries={[make("image", "success"), make("file", "success")]}
        onFilesAccept={noop}
        onRemove={noop}
        onPreview={noop}
        name="receipts"
      />
    </Field>
  </div>
);

/** 카탈로그(/dev/ds) — 항목(종류 × 상태), 첨부 타일 · × · 다시 시도의 상태, 드롭존, 직접 고르는 칸 */
export const AttachmentInputDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="항목 — 사진 80 · 파일 카드 160 × 80, 고른 직후 · 올리는 중(값 있는 원 24) · 올림 · 실패(덮개 + 다시 시도). 사진은 흰 그림도 있다">
      {KINDS.map((kind) => (
        <DemoRow key={kind} label={kind}>
          {STATUSES.map((status) => (
            <Sample key={status} kind={kind} status={status} caption={status} />
          ))}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="첨부 타일 — 올림 · 누름 · 키보드 포커스는 직접 해 본다(검사기는 타일을 실제로 올리고 누르고 탭한다). 가득 참은 타일이 막힌다(aria-disabled)">
      {KINDS.map((kind) => (
        <DemoRow key={kind} label={`${kind} 3/10`}>
          {(
            [
              "enabled",
              "hovered",
              "pressed",
              "focused",
              "readonly",
              "disabled",
            ] as const
          ).map((state) => (
            <Sample
              key={state}
              kind={kind}
              status="success"
              state={state}
              target="trigger"
              caption={state}
            />
          ))}
        </DemoRow>
      ))}
      {KINDS.map((kind) => (
        <DemoRow key={kind} label={`${kind} 가득`}>
          {(["enabled", "hovered", "pressed", "focused"] as const).map(
            (state) => (
              <Sample
                key={state}
                kind={kind}
                status="success"
                state={state}
                target="trigger"
                full
                caption={state}
              />
            ),
          )}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="지우기 × — 20 원이 모서리 밖으로 위 4 · 오른쪽 4, 누르는 자리 44. 읽기 전용 · 막힘은 막힌 모습">
      {KINDS.map((kind) => (
        <DemoRow key={kind} label={kind}>
          {(
            [
              "enabled",
              "hovered",
              "pressed",
              "focused",
              "readonly",
              "disabled",
            ] as const
          ).map((state) => (
            <Sample
              key={state}
              kind={kind}
              status="success"
              state={state}
              target="remove"
              caption={state}
            />
          ))}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="다시 시도 — 실패한 항목 위에 겹친 단추(사진은 덮개 위 흰 글, 파일 카드는 카드 안 한 단추)">
      {KINDS.map((kind) => (
        <DemoRow key={kind} label={kind}>
          {(["enabled", "pressed", "focused"] as const).map((state) => (
            <Sample
              key={state}
              kind={kind}
              status="error"
              state={state}
              target="retry"
              caption={state}
            />
          ))}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="드롭존 — 1280 이상 웹(높이 120 · 1px 실선). 끌어 들어옴은 테두리 + 바탕, 다 참 · 막힘은 옅은 테두리">
      <DemoRow label="비어 있음">
        {(["enabled", "dragOver", "disabled"] as const).map((state) => (
          <DropzoneSample key={state} state={state} caption={state} />
        ))}
      </DemoRow>
      <DemoRow label="다 참(1/1)">
        {(["enabled", "dragOver"] as const).map((state) => (
          <DropzoneSample key={state} state={state} full caption={state} />
        ))}
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="직접 해 보기 — 영수증(고르기 · 끌어 놓기 · 올리는 중 · 실패 · 거절 글) · 가장 나쁜 값: 긴 이름, 10MB 넘는 파일, 사진 · PDF 가 아닌 파일, 20개">
      <DemoRow label="영수증">
        <Receipt />
      </DemoRow>
      <DemoRow label="파일 하나(창 폭 1280 미만이면 버튼)">
        <Import />
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="대표 · 순서 바꾸기 — 항목을 누르면 메뉴, 끌기(마우스 8px · 터치 250ms), 키보드 Space → ← → → Space">
      <DemoRow label="사진 넷">
        <Reorder />
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="10/10 한 줄(밀어서 본다 — 올리는 중 · 실패가 끝에 있다) · 최대 없음 · 읽기 전용 · 막힘">
      <DemoRow label="10/10">
        <Full />
      </DemoRow>
      <DemoRow label="최대 없음">
        <Unlimited />
      </DemoRow>
      <DemoRow label="읽기 전용">
        <Locked mode="readOnly" />
      </DemoRow>
      <DemoRow label="막힘">
        <Locked mode="disabled" />
      </DemoRow>
    </DemoBlock>
  </div>
);
