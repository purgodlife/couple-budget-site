# 부부가계결산 - 맞벌이 부부 월 결산 계산기

맞벌이 부부가 각자 소득·지출을 입력하면, 증여세·자금출처 이슈 없이 각자 명의 계좌에
얼마씩 저축·투자해야 하는지 계산해주는 무료 계산기와 관련 세금 정보 콘텐츠를 제공하는
정적 사이트입니다. 순수 HTML/CSS/JS로 작성되어 별도 빌드 과정이 없습니다.

## 폴더 구조

```
.
├── index.html                     # 메인 생활비 계산기
├── gift-tax-calculator.html       # 배우자 증여세 간이 계산기
├── disclaimer.html                # 면책 고지
├── sitemap.xml
├── robots.txt
├── ads.txt                        # 애드센스 ads.txt (퍼블리셔 ID 발급 후 채울 것)
├── css/
│   └── style.css
├── js/
│   ├── common.js                  # 헤더/푸터, 숫자 포맷, 탭 툴팁, 카운트업 공통 유틸
│   ├── calculator.js               # 메인 계산기 로직
│   └── gift-tax.js                 # 증여세 계산기 로직
└── guide/
    ├── index.html                  # 가이드 목록
    ├── couple-transfer-vs-gift.html
    ├── fund-source-investigation.html
    ├── spouse-gift-tax-deduction.html
    └── separate-account-management.html
```

## 로컬에서 실행하기

빌드 도구가 없으므로 정적 파일을 서빙할 수 있는 간단한 로컬 서버만 있으면 됩니다.

```bash
# Python 3가 설치되어 있다면
python3 -m http.server 8000

# 또는 Node.js가 설치되어 있다면 (npx 사용)
npx serve .
```

브라우저에서 `http://localhost:8000` 접속 후 `index.html`을 확인합니다.
(파일을 그냥 더블클릭해서 `file://`로 열어도 대부분 동작하지만, 일부 브라우저의
보안 정책으로 인해 로컬 서버 실행을 권장합니다.)

## 콘텐츠/기능 수정 시 참고사항

- 계산 로직은 `js/calculator.js`(생활비), `js/gift-tax.js`(증여세)에 있습니다.
- 헤더/푸터는 `js/common.js`의 `renderHeader()`, `renderFooter()`에서 공통 관리합니다.
  네비게이션 메뉴를 바꾸려면 이 파일의 `NAV_ITEMS` 배열만 수정하면 모든 페이지에 반영됩니다.
- 정보 툴팁(`i` 아이콘)은 탭(클릭) 시 열리고 바깥을 클릭하면 닫히도록 구현되어 있습니다.
  (모바일에서는 hover가 동작하지 않기 때문입니다.)
- 애드센스 코드는 각 페이지의 `<div class="ad-slot">` 안에 발급받은 코드를 넣으면 됩니다.
  퍼블리셔 ID 발급 후 `ads.txt` 파일도 안내된 형식으로 채워주세요.
- `sitemap.xml`, 각 페이지의 `og:url`/`canonical` 등에 사용된 `https://example.com`은
  실제 배포 도메인으로 일괄 치환해야 합니다.

## 깃허브 페이지(GitHub Pages)로 배포하기

1. GitHub에 새 저장소를 만들고, 이 프로젝트를 푸시합니다.

   ```bash
   git remote add origin <저장소 URL>
   git branch -M main
   git push -u origin main
   ```

2. 저장소의 **Settings → Pages**로 이동합니다.
3. **Source**를 `Deploy from a branch`로 설정하고, 브랜치는 `main`, 폴더는 `/ (root)`를 선택합니다.
4. 저장하면 잠시 후 `https://<사용자명>.github.io/<저장소명>/` 주소로 사이트가 배포됩니다.
5. 커스텀 도메인을 연결하려면 저장소 루트에 `CNAME` 파일을 추가하고, Pages 설정에서
   도메인을 입력한 뒤 DNS에 안내된 레코드를 등록합니다.
6. 배포 도메인이 확정되면 `sitemap.xml`과 각 HTML 파일의 `canonical`/`og:url`에 있는
   `https://example.com`을 실제 도메인으로 바꿔주세요.

## 주의사항

이 사이트의 계산기와 콘텐츠는 일반적인 정보 제공 목적이며 세무·법률 자문을 대체하지
않습니다. 자세한 내용은 `disclaimer.html`을 참고하세요.
