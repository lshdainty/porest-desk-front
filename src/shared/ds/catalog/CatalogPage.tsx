import type { ReactNode } from "react";
import { DS_FAMILIES, DS_ROLE_SWATCHES } from "./registry";

/**
 * 컴포넌트 라이브러리 카탈로그 — 개발 전용(/dev/ds). 운영 빌드에는 들어가지 않는다(app/router).
 *
 * 먼저 다 만들고 화면은 나중에 옮기므로(2026-10-06 결정), 새 컴포넌트를 쓰는 화면이 아직 없다.
 * 만든 것을 볼 자리가 여기다 — 스펙의 변형 · 크기 · 상태를 라이트 · 다크 판에 나란히 그린다.
 * 다크 판은 하위 요소에 .dark 를 단다 — porest-tokens.css 의 다크 블록이 그 아래 역할 색을 다크 값으로 바꾼다.
 * 개발 도구라 글은 i18n 을 거치지 않는다.
 */

const specIndex = import.meta.glob<{
  design: { file: string; sha256: string };
}>("../spec/index.json", { eager: true, import: "default" });
const design = Object.values(specIndex)[0]?.design;

const builtCount = DS_FAMILIES.flatMap((f) => f.entries).filter(
  (e) => e.demo,
).length;
const totalCount = DS_FAMILIES.flatMap((f) => f.entries).length;

/** 라이트 · 다크 판 — 같은 내용을 두 모드로 */
const ModePanels = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-1 gap-x3 lg:grid-cols-2">
    <div className="rounded-r3 border border-stroke-neutral-subtle bg-bg-layer-default p-x5 text-fg-neutral">
      <p className="mb-x3 text-t2 text-fg-neutral-subtle">라이트</p>
      {children}
    </div>
    <div
      className="dark rounded-r3 border border-stroke-neutral-subtle bg-bg-layer-default p-x5 text-fg-neutral"
      data-theme="dark"
    >
      <p className="mb-x3 text-t2 text-fg-neutral-subtle">다크</p>
      {children}
    </div>
  </div>
);

const RoleSwatches = () => (
  <div className="flex flex-col gap-x4">
    {DS_ROLE_SWATCHES.map((group) => (
      <div key={group.group} className="flex flex-col gap-x2">
        <p className="text-t3 font-bold text-fg-neutral-muted">{group.group}</p>
        <div className="grid grid-cols-2 gap-x2 md:grid-cols-3">
          {group.names.map((name) => (
            <div key={name} className="flex items-center gap-x2 min-w-0">
              <span
                className="size-6 shrink-0 rounded-r1_5 border border-stroke-neutral-weak"
                style={{ background: `var(--color-${name})` }}
              />
              <span className="truncate text-t2 text-fg-neutral-muted">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const CatalogPage = () => (
  <div className="min-h-screen bg-bg-layer-basement text-fg-neutral">
    <header className="flex flex-col gap-x1_5 border-b border-stroke-neutral-subtle px-x6 py-x6">
      <p className="text-t3 text-fg-neutral-subtle">
        개발 전용 — 운영 빌드에는 들어가지 않는다
      </p>
      <h1 className="text-t9 font-bold">Desk 컴포넌트 라이브러리</h1>
      <p className="text-t4 text-fg-neutral-muted">
        확정 스펙 {totalCount}개 중 {builtCount}개를 만들었다 · 스펙 값{" "}
        {design ? `${design.file} · ${design.sha256}` : "없음"} (npm run
        design:sync)
      </p>
    </header>
    <div className="flex">
      <nav
        aria-label="묶음"
        className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col gap-x1 overflow-y-auto border-r border-stroke-neutral-subtle px-x3 py-x5 md:flex"
      >
        <a
          href="#tokens"
          className="rounded-r2 px-x3 py-x1_5 text-t4 text-fg-neutral-muted hover:bg-bg-layer-default-pressed"
        >
          역할 색
        </a>
        {DS_FAMILIES.map((family) => (
          <a
            key={family.id}
            href={`#${family.id}`}
            className="rounded-r2 px-x3 py-x1_5 text-t4 text-fg-neutral-muted hover:bg-bg-layer-default-pressed"
          >
            {family.title}
          </a>
        ))}
      </nav>
      <main className="flex min-w-0 flex-1 flex-col gap-x12 px-x6 py-x8">
        <section id="tokens" className="flex flex-col gap-x4">
          <h2 className="text-t7 font-bold">역할 색</h2>
          <ModePanels>
            <RoleSwatches />
          </ModePanels>
        </section>
        {DS_FAMILIES.map((family) => (
          <section
            key={family.id}
            id={family.id}
            className="flex flex-col gap-x4"
          >
            <h2 className="text-t7 font-bold">{family.title}</h2>
            {family.entries.map((entry) => (
              <article key={entry.spec} className="flex flex-col gap-x3">
                <h3 className="text-t5 font-bold">{entry.name}</h3>
                {entry.demo ? (
                  <ModePanels>
                    <entry.demo />
                  </ModePanels>
                ) : (
                  <p className="text-t4 text-fg-neutral-subtle">
                    아직 만들지 않았다 — 스펙 specs/components/{entry.spec}.md
                  </p>
                )}
              </article>
            ))}
          </section>
        ))}
      </main>
    </div>
  </div>
);
