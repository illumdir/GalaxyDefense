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

  function encodeState(state) {
    const payload = {
      g: state.selectedGuardianId,
      t: Array.from(state.selectedTurretIds),
      p: serializeCardPicks(state.cardPicks)
    };
    return btoa(JSON.stringify(payload));
  }

  function serializeCardPicks(cardPicks) {
    const result = {};
    for (const turretId of Object.keys(cardPicks)) {
      const tiers = cardPicks[turretId];
      const turretData = {};
      let hasData = false;
      for (const tier of [1, 2, 3]) {
        if (tiers[tier]) {
          const g = tiers[tier].green;
          const p = tiers[tier].purple;
          if (g.length > 0 || p !== null) {
            turretData[tier] = {};
            if (g.length > 0) turretData[tier].g = g;
            if (p !== null) turretData[tier].p = p;
            hasData = true;
          }
        }
      }
      if (hasData) result[turretId] = turretData;
    }
    return result;
  }

  function decodeState(hash) {
    try {
      const cleanHash = hash.replace(/^#/, '');
      if (!cleanHash) return null;
      const payload = JSON.parse(atob(cleanHash));
      const cardPicks = {};
      if (payload.p && typeof payload.p === 'object') {
        for (const turretId of Object.keys(payload.p)) {
          const tiers = payload.p[turretId];
          cardPicks[turretId] = initTurretPicks();
          for (const tier of [1, 2, 3]) {
            const tk = String(tier);
            if (tiers[tk]) {
              cardPicks[turretId][tier] = {
                green: Array.isArray(tiers[tk].g) ? tiers[tk].g : [],
                purple: typeof tiers[tk].p === 'string' ? tiers[tk].p : null
              };
            }
          }
        }
      }
      const selectedTurretIds = Array.isArray(payload.t) ? payload.t : [];
      for (const turretId of selectedTurretIds) {
        if (!cardPicks[turretId]) cardPicks[turretId] = initTurretPicks();
      }
      return {
        selectedGuardianId: typeof payload.g === 'string' ? payload.g : null,
        selectedTurretIds: selectedTurretIds,
        cardPicks: cardPicks
      };
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
