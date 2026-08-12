# 브라우저 검증

실제 브라우저로 앱을 돌려보는 스위트다. 여기 있는 것들이 실제로 잡아낸 버그가
여럿이라(공유 링크로 들어온 사람에게 '다시 하기'가 뜨던 것, 깨진 링크 안내가
안 지워지던 것, 문항 자동 전진과 방향키 충돌), 문구·데이터·화면을 고쳤으면
돌려보는 게 좋다.

## 돌리는 법

playwright 가 필요하다. 앱 자체는 의존성이 없어서 리포에 package.json 을
두지 않았고, 검증할 때만 따로 깐다.

```bash
npm i playwright            # 또는 이미 깔린 곳을 NODE_PATH 로 가리킨다

python3 -m http.server 8765 &        # 리포 루트에서
node scripts/e2e/e2e.js              # 아이비 — 두 모드 완주·공유 왕복·이미지·file://
node scripts/e2e/korea-e2e.js        # 한국 대학 — 30곳·20문항·모드별 화면
node scripts/e2e/tap-test.js         # 자동 전진 — 마지막 문항·방향키·되돌아가기
node scripts/e2e/bar-test.js         # 결과 고정 공유 바 — 노출 조건·가림·동작
node scripts/e2e/switch-test.js      # 테스트 선택 — 표시·링크·실제 이동
```

측정용:

```bash
node scripts/e2e/audit.js            # 전송량·요청 수·FCP·문항 넘김 시간
node scripts/e2e/cls.js              # 느린 회선에서 FCP 와 레이아웃 이동(CLS)
node scripts/e2e/clssrc.js           # 무엇이 밀리는지 요소 단위로
node scripts/e2e/net.js              # 폰트 로딩 방식에 따른 FCP 비교
```

`CHROME_PATH` 로 크로미움 경로를 바꿀 수 있다. 스크린샷은 `SHOT_DIR` 에 남는다.

## 주의

문항 흐름을 바꾸면 이 파일들도 같이 고쳐야 한다. 자동 전진을 넣었을 때
`e2e.js` 가 "고르고 다음 누르기"를 그대로 하고 있어서 깨졌는데, 그건 앱이
아니라 테스트가 낡은 것이었다. 실패가 뜨면 어느 쪽이 낡았는지부터 보라.
