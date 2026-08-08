/* ==========================================================================
   공통 스크립트: 헤더/푸터 렌더링, 숫자 포맷팅, 툴팁, localStorage 유틸
   ========================================================================== */

(function () {
  // 현재 페이지가 /guide/ 하위인지에 따라 루트 기준 경로를 계산
  var inGuide = /\/guide\//.test(location.pathname);
  var base = inGuide ? '..' : '.';

  var NAV_ITEMS = [
    { href: base + '/index.html', label: '생활비 계산기' },
    { href: base + '/gift-tax-calculator.html', label: '증여세 계산기' },
    { href: base + '/guide/index.html', label: '세금 가이드' },
    { href: base + '/disclaimer.html', label: '면책 고지' }
  ];

  function isActive(href) {
    var target = href.replace(/^\.+\//, '').replace(/^\.\.\//, '');
    var current = location.pathname.replace(/^\//, '');
    if (target === 'index.html') {
      return current === '' || current === 'index.html';
    }
    return current.indexOf(target) !== -1;
  }

  function renderHeader() {
    var el = document.getElementById('site-header');
    if (!el) return;
    var navHtml = NAV_ITEMS.map(function (item) {
      var cls = isActive(item.href) ? ' class="active"' : '';
      return '<a href="' + item.href + '"' + cls + '>' + item.label + '</a>';
    }).join('');

    el.innerHTML =
      '<div class="wrap">' +
        '<a class="brand" href="' + base + '/index.html">부부<span>가계</span>결산</a>' +
        '<nav class="main-nav">' + navHtml + '</nav>' +
      '</div>';
  }

  function renderFooter() {
    var el = document.getElementById('site-footer');
    if (!el) return;
    var year = '2026';
    el.innerHTML =
      '<div class="wrap">' +
        '<nav>' +
          '<a href="' + base + '/index.html">생활비 계산기</a>' +
          '<a href="' + base + '/gift-tax-calculator.html">증여세 계산기</a>' +
          '<a href="' + base + '/guide/index.html">세금 가이드</a>' +
          '<a href="' + base + '/disclaimer.html">면책 고지</a>' +
        '</nav>' +
        '<p>본 사이트의 계산 결과는 일반적인 정보 제공을 목적으로 하며, 법률·세무 자문을 대체하지 않습니다.</p>' +
        '<p>&copy; ' + year + ' 부부가계결산. All rights reserved.</p>' +
      '</div>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderHeader();
    renderFooter();
    initTooltips();
  });

  /* ---------------- 숫자 포맷 유틸 ---------------- */
  function toNumber(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    var n = parseFloat(String(str).replace(/[^0-9.-]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  function comma(num) {
    var n = Math.round(toNumber(num));
    return n.toLocaleString('ko-KR');
  }

  // 입력창에 자동 콤마 포맷팅을 적용
  function bindMoneyInput(input) {
    input.setAttribute('inputmode', 'numeric');
    input.addEventListener('input', function () {
      var raw = toNumber(input.value);
      var caretFromEnd = input.value.length - input.selectionEnd;
      input.value = raw === 0 ? '' : comma(raw);
      var pos = input.value.length - caretFromEnd;
      input.setSelectionRange(pos, pos);
    });
  }

  function autoBindMoneyInputs(root) {
    (root || document).querySelectorAll('input[data-money]').forEach(bindMoneyInput);
  }

  /* ---------------- 카운트업 애니메이션 ---------------- */
  function countUp(el, to, duration) {
    duration = duration || 600;
    var from = 0;
    var start = null;
    to = Math.round(to);
    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(from + (to - from) * eased);
      el.textContent = current.toLocaleString('ko-KR');
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = to.toLocaleString('ko-KR');
      }
    }
    requestAnimationFrame(step);
  }

  /* ---------------- 탭 기반 툴팁 ---------------- */
  function initTooltips() {
    document.addEventListener('click', function (e) {
      var icon = e.target.closest ? e.target.closest('.tip-icon') : null;
      var openTips = document.querySelectorAll('.tip.open');

      if (icon) {
        var tip = icon.closest('.tip');
        var wasOpen = tip.classList.contains('open');
        openTips.forEach(function (t) { t.classList.remove('open'); });
        if (!wasOpen) tip.classList.add('open');
        e.stopPropagation();
        return;
      }

      var insideBubble = e.target.closest ? e.target.closest('.tip-bubble') : null;
      if (!insideBubble) {
        openTips.forEach(function (t) { t.classList.remove('open'); });
      }
    });
  }

  /* ---------------- 전역 노출 ---------------- */
  window.SiteCommon = {
    toNumber: toNumber,
    comma: comma,
    bindMoneyInput: bindMoneyInput,
    autoBindMoneyInputs: autoBindMoneyInputs,
    countUp: countUp,
    basePath: base
  };
})();
