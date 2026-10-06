import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { SnackbarProvider, SnackbarView } from "./snackbar";
import { useSnackbar } from "./snackbar-context";

const TONES = ["neutral", "positive", "critical"] as const;

// 톤마다 글 · 액션 — snackbar.md 의 글 규칙(무엇이 됐는지 먼저 · 마침표 · 액션은 동작 이름)
const COPY = {
  neutral: { message: "거래를 삭제했어요.", action: "되돌리기" },
  positive: { message: "목표 금액을 모두 모았어요.", action: "목표 보기" },
  critical: {
    message: "관심 종목에 넣지 못했어요. 다시 눌러 주세요.",
    action: "다시 넣기",
  },
};

const ignore = () => {};

// 실제로 띄우기 — 이 판의 SnackbarProvider 가 body 끝 자리에 띄운다
function LiveTriggers() {
  const snackbar = useSnackbar();
  return (
    <div className="flex flex-wrap gap-x2">
      <Button
        variant="neutralWeak"
        size="small"
        onClick={() => snackbar.show({ message: "거래를 저장했어요." })}
      >
        결과 — 4초
      </Button>
      <Button
        variant="neutralWeak"
        size="small"
        onClick={() =>
          snackbar.show({
            message: "거래를 삭제했어요.",
            action: {
              label: "되돌리기",
              onClick: () =>
                snackbar.show({
                  tone: "positive",
                  message: "거래를 되돌렸어요.",
                }),
            },
          })
        }
      >
        되돌리기 — 6초
      </Button>
      <Button
        variant="neutralWeak"
        size="small"
        onClick={() =>
          snackbar.show({ tone: "critical", message: COPY.critical.message })
        }
      >
        가벼운 실패
      </Button>
      <Button variant="ghost" size="small" onClick={() => snackbar.dismiss()}>
        닫기
      </Button>
    </div>
  );
}

/** 카탈로그(/dev/ds) — 톤 × 액션 있음 · 없음, 키보드 포커스, 실제로 띄우기 */
export const SnackbarDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="톤 — neutral 은 아이콘 없음 · positive 체크 · critical 느낌표. 띠를 제자리에 그렸다(닫히지 않는다)">
      {TONES.map((tone) => (
        <DemoRow key={tone} label={tone}>
          <Specimen spec="snackbar" combo={{ tone }}>
            <SnackbarView tone={tone} message={COPY[tone].message} />
          </Specimen>
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="액션 — 하나 · 동작 이름(있으면 6초). 긴 글은 줄을 바꾸고 자르지 않는다">
      {TONES.map((tone) => (
        <DemoRow key={tone} label={tone}>
          <Specimen spec="snackbar" combo={{ tone }}>
            <SnackbarView
              tone={tone}
              message={COPY[tone].message}
              action={{ label: COPY[tone].action, onClick: ignore }}
            />
          </Specimen>
        </DemoRow>
      ))}
      <DemoRow label="긴 글">
        <Specimen spec="snackbar" combo={{ tone: "neutral" }}>
          <SnackbarView
            message="1,204건을 가져왔어요. 건너뛴 줄 3건은 가져오기 기록에서 다시 볼 수 있어요."
            action={{ label: "기록 보기", onClick: ignore }}
          />
        </Specimen>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="상태 — 키보드 포커스는 띠 글자색 링 · 띠는 안쪽 4(검사기는 띠에 초점을 준다). 액션 누름 · 액션 · 닫기의 초점은 Tab 으로 직접 해 본다">
      {TONES.map((tone) => (
        <DemoRow key={tone} label={tone}>
          <Specimen spec="snackbar" combo={{ tone }} state="focused">
            <SnackbarView
              tone={tone}
              message={COPY[tone].message}
              action={{ label: COPY[tone].action, onClick: ignore }}
            />
          </Specimen>
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="실제로 띄우기 — 화면 아래 가운데(body 끝 자리 · z 400). 4초(액션 6초) · 올리거나 누르고 있거나 초점이 있으면 멈춤 · 한 번에 하나. 이 판의 라이트 · 다크가 아니라 문서의 모드를 따른다">
      <SnackbarProvider>
        <LiveTriggers />
      </SnackbarProvider>
    </DemoBlock>
  </div>
);
