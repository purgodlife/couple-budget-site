/* ==========================================================================
   맞벌이 부부 생활비 계산기 - 메인 로직
   ========================================================================== */

(function () {
  var STORAGE_KEY = 'coupleBudgetCalc.v1';

  var DEFAULT_FIXED_COSTS = [
    { id: 'fc1', name: '주택담보대출/전세대출', amount: 0 },
    { id: 'fc2', name: '카드값', amount: 0 },
    { id: 'fc3', name: '비상금', amount: 0 }
  ];

  var state = {
    husbandIncome: 0,
    wifeIncome: 0,
    fixedCosts: JSON.parse(JSON.stringify(DEFAULT_FIXED_COSTS)),
    husbandAllowance: 0,
    wifeAllowance: 0,
    stockRatio: 50,
    stockOwner: 'husband'
  };

  var rowSeq = 0;

  function el(id) { return document.getElementById(id); }
  function comma(n) { return window.SiteCommon.comma(n); }
  function num(v) { return window.SiteCommon.toNumber(v); }

  /* ---------------- 고정비 목록 렌더링 ---------------- */
  function renderFixedCosts() {
    var list = el('fixedCostList');
    list.innerHTML = '';
    state.fixedCosts.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'fixed-cost-row';
      row.dataset.id = item.id;
      row.innerHTML =
        '<input type="text" class="fc-name" value="' + escapeHtml(item.name) + '" placeholder="항목명">' +
        '<div class="input-money"><input type="text" class="fc-amount" data-money inputmode="numeric" value="' + (item.amount ? comma(item.amount) : '') + '" placeholder="0"></div>' +
        '<button type="button" class="remove-row-btn" aria-label="항목 삭제">&times;</button>';
      list.appendChild(row);
    });
    updateFixedCostTotal();
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function updateFixedCostTotal() {
    var total = state.fixedCosts.reduce(function (sum, i) { return sum + num(i.amount); }, 0);
    el('fixedCostTotal').textContent = comma(total) + '원';
  }

  function syncFixedCostsFromDOM() {
    var rows = document.querySelectorAll('#fixedCostList .fixed-cost-row');
    state.fixedCosts = Array.prototype.map.call(rows, function (row) {
      return {
        id: row.dataset.id,
        name: row.querySelector('.fc-name').value,
        amount: num(row.querySelector('.fc-amount').value)
      };
    });
    updateFixedCostTotal();
  }

  el('addFixedCostBtn').addEventListener('click', function () {
    syncFixedCostsFromDOM();
    rowSeq += 1;
    state.fixedCosts.push({ id: 'fc-new-' + rowSeq, name: '', amount: 0 });
    renderFixedCosts();
    save();
  });

  el('fixedCostList').addEventListener('click', function (e) {
    var btn = e.target.closest('.remove-row-btn');
    if (!btn) return;
    var row = btn.closest('.fixed-cost-row');
    syncFixedCostsFromDOM();
    state.fixedCosts = state.fixedCosts.filter(function (i) { return i.id !== row.dataset.id; });
    renderFixedCosts();
    save();
  });

  el('fixedCostList').addEventListener('input', function (e) {
    if (e.target.classList.contains('fc-amount')) {
      window.SiteCommon.bindMoneyInput(e.target);
    }
    syncFixedCostsFromDOM();
    save();
  });

  /* ---------------- 비율 슬라이더 ---------------- */
  var ratioSlider = el('ratioSlider');
  ratioSlider.addEventListener('input', function () {
    state.stockRatio = parseInt(ratioSlider.value, 10);
    updateRatioLabels();
    save();
  });

  function updateRatioLabels() {
    el('stockRatioLabel').textContent = state.stockRatio;
    el('savingsRatioLabel').textContent = 100 - state.stockRatio;
    ratioSlider.value = state.stockRatio;
    var hint = el('ratioHint');
    if (state.stockRatio !== 50) {
      hint.classList.remove('hidden');
    } else {
      hint.classList.add('hidden');
    }
  }

  /* ---------------- 계좌 명의자 ---------------- */
  var ownerRadios = document.querySelectorAll('input[name="stockOwner"]');
  ownerRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      state.stockOwner = radio.value;
      updateOwnerUI();
      save();
    });
  });

  function updateOwnerUI() {
    ownerRadios.forEach(function (radio) {
      radio.checked = radio.value === state.stockOwner;
      var label = radio.closest('label');
      if (radio.checked) label.classList.add('checked');
      else label.classList.remove('checked');
    });
    el('savingsOwnerText').textContent = state.stockOwner === 'husband' ? '아내' : '남편';
  }

  /* ---------------- 계산 ---------------- */
  function calculate() {
    var husbandIncome = num(el('husbandIncome').value);
    var wifeIncome = num(el('wifeIncome').value);
    var husbandAllowance = num(el('husbandAllowance').value);
    var wifeAllowance = num(el('wifeAllowance').value);
    var totalFixed = state.fixedCosts.reduce(function (s, i) { return s + num(i.amount); }, 0);

    var totalIncome = husbandIncome + wifeIncome;
    var totalAllowance = husbandAllowance + wifeAllowance;
    var totalRemaining = totalIncome - totalFixed - totalAllowance;

    var stockAmount = Math.round(totalRemaining * (state.stockRatio / 100));
    var savingsAmount = totalRemaining - stockAmount;

    var husbandTarget = state.stockOwner === 'husband' ? stockAmount : savingsAmount;
    var wifeTarget = state.stockOwner === 'husband' ? savingsAmount : stockAmount;

    var husbandAvailable = husbandIncome - husbandAllowance;
    var wifeAvailable = wifeIncome - wifeAllowance;

    var husbandShare = husbandAvailable - husbandTarget;
    var wifeShare = wifeAvailable - wifeTarget;

    // 반올림 오차 보정: 두 분담액의 합이 총공동고정비와 정확히 일치하도록 남편 쪽에 몰아서 보정
    var diff = totalFixed - (husbandShare + wifeShare);
    if (diff !== 0) husbandShare += diff;

    var warnings = [];
    if (husbandShare < 0 || wifeShare < 0) {
      warnings.push('소득 대비 지출 구조를 다시 확인해보세요. (한쪽의 생활비 분담액이 마이너스입니다)');
    }
    if (husbandIncome > 0 && husbandShare > husbandIncome * 0.9) {
      warnings.push('소득 대비 지출 구조를 다시 확인해보세요. (남편의 생활비 분담액이 소득의 90%를 초과합니다)');
    }
    if (wifeIncome > 0 && wifeShare > wifeIncome * 0.9) {
      warnings.push('소득 대비 지출 구조를 다시 확인해보세요. (아내의 생활비 분담액이 소득의 90%를 초과합니다)');
    }

    return {
      husbandShare: husbandShare,
      wifeShare: wifeShare,
      husbandAllowance: husbandAllowance,
      wifeAllowance: wifeAllowance,
      husbandTarget: husbandTarget,
      wifeTarget: wifeTarget,
      warnings: warnings
    };
  }

  function renderResult(r) {
    el('resultPanel').classList.remove('hidden');

    var husbandAccountType = state.stockOwner === 'husband' ? '주식' : '예적금';
    var wifeAccountType = state.stockOwner === 'husband' ? '예적금' : '주식';
    el('husbandTargetLabel').textContent = '본인 명의 ' + husbandAccountType + '계좌 저축·투자액';
    el('wifeTargetLabel').textContent = '본인 명의 ' + wifeAccountType + '계좌 저축·투자액';

    window.SiteCommon.countUp(el('husbandShareAmount'), r.husbandShare);
    window.SiteCommon.countUp(el('husbandAllowanceAmount'), r.husbandAllowance);
    window.SiteCommon.countUp(el('husbandTargetAmount'), r.husbandTarget);
    window.SiteCommon.countUp(el('wifeShareAmount'), r.wifeShare);
    window.SiteCommon.countUp(el('wifeAllowanceAmount'), r.wifeAllowance);
    window.SiteCommon.countUp(el('wifeTargetAmount'), r.wifeTarget);

    var alertBox = el('validationAlert');
    if (r.warnings.length) {
      alertBox.innerHTML = '<div class="alert alert-danger">' + r.warnings.join('<br>') + '</div>';
      el('resultSummary').classList.add('hidden');
    } else {
      alertBox.innerHTML = '';
      el('resultSummary').classList.remove('hidden');
    }

    el('resultPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  el('calcBtn').addEventListener('click', function () {
    syncFixedCostsFromDOM();
    save();
    var result = calculate();
    renderResult(result);
  });

  /* ---------------- localStorage ---------------- */
  function save() {
    var data = {
      husbandIncome: el('husbandIncome').value,
      wifeIncome: el('wifeIncome').value,
      husbandAllowance: el('husbandAllowance').value,
      wifeAllowance: el('wifeAllowance').value,
      fixedCosts: state.fixedCosts,
      stockRatio: state.stockRatio,
      stockOwner: state.stockOwner
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* localStorage 사용 불가 환경은 무시 */ }
  }

  function load() {
    var raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      raw = null;
    }
    if (!raw) return;
    try {
      var data = JSON.parse(raw);
      el('husbandIncome').value = data.husbandIncome || '';
      el('wifeIncome').value = data.wifeIncome || '';
      el('husbandAllowance').value = data.husbandAllowance || '';
      el('wifeAllowance').value = data.wifeAllowance || '';
      if (Array.isArray(data.fixedCosts) && data.fixedCosts.length) {
        state.fixedCosts = data.fixedCosts;
      }
      if (typeof data.stockRatio === 'number') state.stockRatio = data.stockRatio;
      if (data.stockOwner === 'husband' || data.stockOwner === 'wife') state.stockOwner = data.stockOwner;
    } catch (e) { /* 손상된 데이터 무시 */ }
  }

  el('resetBtn').addEventListener('click', function () {
    if (!confirm('입력하신 모든 정보를 초기화할까요?')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    el('husbandIncome').value = '';
    el('wifeIncome').value = '';
    el('husbandAllowance').value = '';
    el('wifeAllowance').value = '';
    state.fixedCosts = JSON.parse(JSON.stringify(DEFAULT_FIXED_COSTS));
    state.stockRatio = 50;
    state.stockOwner = 'husband';
    renderFixedCosts();
    updateRatioLabels();
    updateOwnerUI();
    el('resultPanel').classList.add('hidden');
  });

  /* ---------------- 초기화 ---------------- */
  function init() {
    load();
    renderFixedCosts();
    updateRatioLabels();
    updateOwnerUI();
    window.SiteCommon.autoBindMoneyInputs(document);

    ['husbandIncome', 'wifeIncome', 'husbandAllowance', 'wifeAllowance'].forEach(function (id) {
      el(id).addEventListener('input', save);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
