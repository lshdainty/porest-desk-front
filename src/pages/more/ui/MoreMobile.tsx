import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, SearchX } from "lucide-react";
import { Input } from "@/shared/ds/input";
import { ListHeader } from "@/shared/ds/list";
import { ResultSection } from "@/shared/ds/result-section";
import { useMoreGroups } from "../model/use-more-groups";

/**
 * 폰 전체 메뉴 — 흰 면 하나(I-12 2-B). 메뉴 검색(밑줄) → 묶음(목록 제목 + 2열 칸) → 탭 바 자리.
 * 검색은 화면 전체를 거르는 줄이라 첫 묶음과 한 덩어리(틈 0, 목록 제목 위 8). 검색칸은 목록과 함께 흐른다(Q2-B).
 */
export const MoreMobile = () => {
  const { t } = useTranslation("more");
  const [query, setQuery] = useState("");
  const filtered = useMoreGroups(query);

  return (
    <div className="flex flex-1 flex-col bg-bg-layer-default">
      <div className="px-global-gutter pt-x1">
        <Input
          variant="underline"
          size="large"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
          prefixIcon={<Search />}
          clearable
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col">
          <ResultSection
            size="medium"
            icon={<SearchX />}
            title={t("noResults")}
          />
        </div>
      ) : (
        filtered.map((group, gi) => {
          const headId = `more-group-${group.labelKey}`;
          return (
            <section key={group.labelKey}>
              <ListHeader
                id={headId}
                variant="boldSolid"
                className={gi === 0 ? "mt-x2" : "mt-x4"}
              >
                {t(group.labelKey)}
              </ListHeader>
              <ul
                aria-labelledby={headId}
                className="m-0 grid list-none grid-cols-2 p-0 px-x3"
              >
                {group.items.map((item) => (
                  <li key={item.path} className="flex min-w-0">
                    <Link
                      to={item.path}
                      className="group relative flex min-w-0 flex-1 outline-none [--press-basis:46]"
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-r2_5 [transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing)] group-focus-visible:outline-2 group-focus-visible:-outline-offset-2 group-focus-visible:outline-stroke-focus-ring group-active:bg-bg-layer-default-pressed [@media(hover:hover)]:group-hover:bg-bg-layer-default-pressed"
                      />
                      <span className="relative min-w-0 flex-1 px-x3 py-x3 font-sans text-t5 font-normal text-fg-neutral [overflow-wrap:anywhere] [transition:scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)] group-active:[scale:calc(1-2/var(--press-basis))] motion-reduce:group-active:[scale:1]">
                        {t(item.labelKey)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
};
