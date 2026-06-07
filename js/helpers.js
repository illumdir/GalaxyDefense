/**
 * helpers.js — Fonctions utilitaires pour le Galaxy Defense ARK Builder
 * Chargé comme <script> global, expose window.GDHelpers
 */
window.GDHelpers = (function() {

  function getCardImage(turretId, cardName) {
    const slug = cardName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
    return 'images/cards/' + turretId + '/' + slug + '.png';
  }

  function initTurretPicks() {
    return {
      1: { green: [], purple: null },
      2: { green: [], purple: null },
      3: { green: [], purple: null }
    };
  }

  function normalCardPickCount(turretId, cardName, cardPicks) {
    const picks = cardPicks[turretId];
    if (!picks) return 0;
    let count = 0;
    for (const tier of [1, 2, 3]) {
      if (picks[tier]) {
        count += picks[tier].green.filter(n => n === cardName).length;
      }
    }
    return count;
  }

  function getAllPickedNames(tierPicks) {
    if (!tierPicks) return [];
    const names = [];
    for (const tier of [1, 2, 3]) {
      if (tierPicks[tier]) {
        names.push(...tierPicks[tier].green);
        if (tierPicks[tier].purple) names.push(tierPicks[tier].purple);
      }
    }
    return names;
  }

  function isChainPrereqMet(card, turretId, cardPicks) {
    if (!card.requires_chain) return true;
    const prereqs = Array.isArray(card.requires_chain) ? card.requires_chain : [card.requires_chain];
    const pickedNames = getAllPickedNames(cardPicks[turretId]);
    return prereqs.some(function(p) { return pickedNames.includes(p); });
  }

  function cascadeRemoveChainDependents(deselectedCardName, turretId, cardPicks, turretChainCards) {
    const dependents = turretChainCards.filter(function(c) {
      if (!c.requires_chain) return false;
      const prereqs = Array.isArray(c.requires_chain) ? c.requires_chain : [c.requires_chain];
      return prereqs.includes(deselectedCardName);
    });
    for (const dep of dependents) {
      for (const tier of [1, 2, 3]) {
        const tierPicks = cardPicks[turretId] && cardPicks[turretId][tier];
        if (!tierPicks) continue;
        const idx = tierPicks.green.indexOf(dep.name);
        if (idx >= 0) {
          tierPicks.green.splice(idx, 1);
          cascadeRemoveChainDependents(dep.name, turretId, cardPicks, turretChainCards);
        }
      }
    }
  }

  // ── Encodage v2 : indices compacts ──────────────────────────────
  // Format : [gIdx, [tIdx,...], [[tier1,tier2,tier3], ...par tourelle]]
  // tier    : null  |  [[greenEnc...], purpleIdx]
  // greenEnc: tableau d'indices  OU  [idx, -count] si toutes identiques (count > 1)
  // Rétrocompatibilité : payload tableau → v2, payload objet → v1 (legacy)

  function _cardList(turretId) {
    var t = window.TURRETS.find(function(x) { return x.id === turretId; });
    if (!t) return [];
    var list = [];
    ['normal','chain','combo','breakthrough'].forEach(function(type) {
      (t.cards[type] || []).forEach(function(c) { list.push(c.name); });
    });
    return list;
  }

  function _encodeGreen(names, toIdx) {
    if (!names || names.length === 0) return [];
    var idxs = names.map(function(n) { return toIdx[n] !== undefined ? toIdx[n] : -1; });
    if (idxs.length > 1 && idxs.every(function(x) { return x === idxs[0]; })) {
      return [idxs[0], -idxs.length]; // RLE : [idx, -count]
    }
    return idxs;
  }

  function _decodeGreen(enc, fromIdx) {
    if (!Array.isArray(enc) || enc.length === 0) return [];
    if (enc.length === 2 && typeof enc[1] === 'number' && enc[1] < 0) {
      var name = fromIdx[enc[0]];
      return name ? Array(-enc[1]).fill(name) : [];
    }
    return enc.map(function(i) { return fromIdx[i] || null; }).filter(Boolean);
  }

  function encodeState(state) {
    var turrets     = window.TURRETS;
    var allGuardians = window.getAllGuardians ? window.getAllGuardians() : [];
    var gIdx = state.selectedGuardianId
      ? allGuardians.findIndex(function(g) { return g.id === state.selectedGuardianId; })
      : -1;

    var tIdxs = state.selectedTurretIds.map(function(id) {
      return turrets.findIndex(function(t) { return t.id === id; });
    });

    var picks = state.selectedTurretIds.map(function(turretId) {
      var tiers = state.cardPicks[turretId];
      if (!tiers) return null;
      var cards  = _cardList(turretId);
      var toIdx  = {};
      cards.forEach(function(name, i) { toIdx[name] = i; });
      return [1, 2, 3].map(function(tier) {
        var t = tiers[tier];
        if (!t || (t.green.length === 0 && t.purple === null)) return null;
        var gEnc = _encodeGreen(t.green, toIdx);
        var pIdx = t.purple !== null
          ? (toIdx[t.purple] !== undefined ? toIdx[t.purple] : -1)
          : -1;
        return [gEnc, pIdx];
      });
    });

    return btoa(JSON.stringify([gIdx, tIdxs, picks]));
  }

  function _decodeStateV2(payload) {
    var gIdx    = payload[0];
    var tIdxs   = payload[1];
    var allPicks = payload[2];
    var turrets     = window.TURRETS;
    var allGuardians = window.getAllGuardians ? window.getAllGuardians() : [];

    var selectedGuardianId = (gIdx >= 0 && allGuardians[gIdx])
      ? allGuardians[gIdx].id : null;
    var selectedTurretIds = (tIdxs || [])
      .map(function(i) { return turrets[i] ? turrets[i].id : null; })
      .filter(Boolean);

    var cardPicks = {};
    selectedTurretIds.forEach(function(turretId, ti) {
      cardPicks[turretId] = initTurretPicks();
      var tierArr = allPicks && allPicks[ti];
      if (!tierArr) return;
      var fromIdx = _cardList(turretId);
      [1, 2, 3].forEach(function(tier, ti2) {
        var tp = tierArr[ti2];
        if (!tp) return;
        cardPicks[turretId][tier] = {
          green:  _decodeGreen(tp[0], fromIdx),
          purple: (tp[1] >= 0 && fromIdx[tp[1]]) ? fromIdx[tp[1]] : null
        };
      });
    });

    return { selectedGuardianId: selectedGuardianId, selectedTurretIds: selectedTurretIds, cardPicks: cardPicks };
  }

  function _decodeStateV1(payload) {
    var cardPicks = {};
    if (payload.p && typeof payload.p === 'object') {
      for (var turretId of Object.keys(payload.p)) {
        var tiers = payload.p[turretId];
        cardPicks[turretId] = initTurretPicks();
        for (var tier of [1, 2, 3]) {
          var tk = String(tier);
          if (tiers[tk]) {
            cardPicks[turretId][tier] = {
              green:  Array.isArray(tiers[tk].g) ? tiers[tk].g : [],
              purple: typeof tiers[tk].p === 'string' ? tiers[tk].p : null
            };
          }
        }
      }
    }
    var selectedTurretIds = Array.isArray(payload.t) ? payload.t : [];
    for (var tid of selectedTurretIds) {
      if (!cardPicks[tid]) cardPicks[tid] = initTurretPicks();
    }
    return {
      selectedGuardianId: typeof payload.g === 'string' ? payload.g : null,
      selectedTurretIds:  selectedTurretIds,
      cardPicks:          cardPicks
    };
  }

  function decodeState(hash) {
    try {
      var cleanHash = hash.replace(/^#/, '');
      if (!cleanHash) return null;
      var payload = JSON.parse(atob(cleanHash));
      return Array.isArray(payload) ? _decodeStateV2(payload) : _decodeStateV1(payload);
    } catch(e) {
      console.warn('Impossible de décoder le hash URL:', e);
      return null;
    }
  }

  return {
    getCardImage: getCardImage,
    initTurretPicks: initTurretPicks,
    normalCardPickCount: normalCardPickCount,
    getAllPickedNames: getAllPickedNames,
    isChainPrereqMet: isChainPrereqMet,
    cascadeRemoveChainDependents: cascadeRemoveChainDependents,
    encodeState: encodeState,
    decodeState: decodeState
  };
})();
