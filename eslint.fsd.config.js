import { defineConfig, globalIgnores } from "eslint/config";
import { fsdConfig } from "./eslint.fsd.js";

/**
 * CI 게이트 전용 — 계층 규칙만 돌린다(`npm run lint:fsd`).
 *
 * 전체 `npm run lint` 를 CI 에 걸지 못하는 건 정리 중인 에러가 아직 남아서다.
 * 그걸 기다리면 그 사이에 계층이 다시 샌다 — 다 끝난 규칙부터 잠근다.
 *
 * `--no-inline-config` 로 돈다(package.json). 두 가지를 동시에 해결한다 —
 * 여기 없는 플러그인(react-hooks 등)을 가리키는 기존 `eslint-disable` 주석이
 * "rule not found" 로 죽는 걸 막고, 계층 위반을 주석 한 줄로 덮지 못하게 한다.
 * 예외가 필요하면 주석이 아니라 `eslint.fsd.js` 에 적는다 — 거기라야 리뷰에 걸린다.
 */
export default defineConfig([globalIgnores(["dist"]), ...fsdConfig]);
