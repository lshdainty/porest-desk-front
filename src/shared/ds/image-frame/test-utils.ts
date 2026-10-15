// Image Frame · Card Art 테스트가 같이 쓰는 도우미 — 이미지 요소의 크기 · 완료 상태를 흉내 낸다(jsdom 은 그림을 받지 않는다)
export function fakeImage(
  img: HTMLImageElement,
  size: { width: number; height: number },
) {
  Object.defineProperty(img, "naturalWidth", { value: size.width });
  Object.defineProperty(img, "naturalHeight", { value: size.height });
}
