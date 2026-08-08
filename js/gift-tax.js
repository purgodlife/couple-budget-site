/* ==========================================================================
   배우자 증여세 간이 계산기 로직
   ========================================================================== */

(function () {
  var STORAGE_KEY = 'giftTaxCalc.v1';
  var DEDUCTION = 600000000; // 배우자 증여재산공제 6억원

  var BRACKETS = [
    { limit: 100000000, rate: 0.10, deduction: 0 },
    { limit: 500000000, rate: 0.20, deduction: 10000000 },
    { limit: 1000000000, rate: 0.30, deduction: 60000000 },
    { limit: 3000000000, rate: 0.40, deduction: 160000000 },
    { limit: Infinity, rate: 0.50, deduction: 460000000 }
  ];

  function el(id) { return document.getElementById(id); }
  function comma(n) { return window.SiteCommon.comma(n); }
  function num(v) { return window.SiteCommon.toNumber(v); }

  function getBracket(taxBase) {
    for (var i = 0; i < BRACKETS.length; i++) {
      if (taxBase <= BRACKETS[i].limit) return BRACKETS[i];
    }
    return BRACKETS[BRACKETS.length - 1];
  }

  function calculate() {
    var cumulative = num(el('cumulativeGift').value);
    var taxBase = Math.max(0, cumulative - DEDUCTION);
    var bracket = getBracket(taxBase);
    var calculatedTax = Math.max(0, Math.round(taxBase * bracket.rate - bracket.deduction));
    var reportCredit = Math.round(calculatedTax * 0.03);
    var finalTax = calculatedTax - reportCredit;

    return {
      taxBase: taxBase,
      rate: bracket.rate,
      deduction: bracket.deduction,
      calculatedTax: calculatedTax,
      reportCredit: reportCredit,
      finalTax: finalTax
    };
  }

  function render(r) {
    el('giftResultPanel').classList.remove('hidden');
    window.SiteCommon.countUp(el('taxBaseAmount'), r.taxBase);
    el('rateInfo').textContent = (r.rate * 100) + '%  /  누진공제 ' + comma(r.deduction) + '원';
    window.SiteCommon.countUp(el('calculatedTaxAmount'), r.calculatedTax);
    window.SiteCommon.countUp(el('reportCreditAmount'), r.reportCredit);
    window.SiteCommon.countUp(el('finalTaxAmount'), r.finalTax);
    el('giftResultPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cumulativeGift: el('cumulativeGift').value }));
    } catch (e) {}
  }

  function load() {
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
    if (!raw) return;
    try {
      var data = JSON.parse(raw);
      el('cumulativeGift').value = data.cumulativeGift || '';
    } catch (e) {}
  }

  el('calcGiftBtn').addEventListener('click', function () {
    save();
    render(calculate());
  });

  el('cumulativeGift').addEventListener('input', save);

  el('resetGiftBtn').addEventListener('click', function () {
    if (!confirm('입력하신 정보를 초기화할까요?')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    el('cumulativeGift').value = '';
    el('giftResultPanel').classList.add('hidden');
  });

  document.addEventListener('DOMContentLoaded', function () {
    load();
    window.SiteCommon.autoBindMoneyInputs(document);
  });
})();
