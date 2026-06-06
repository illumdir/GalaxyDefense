/**
 * GalleryView.js — Vue galerie : toutes les cartes avec image + nom + effet
 * Permet de vérifier visuellement quelles images sont des placeholders.
 */
window.GalleryView = (function() {
  const { ref, computed } = Vue;
  const h = window.GDHelpers;

  function buildSections(turret) {
    const sections = [];

    if ((turret.cards.normal || []).length) {
      sections.push({ label: 'Normal', cards: turret.cards.normal });
    }
    for (const tier of [1, 2, 3]) {
      const group = (turret.cards.chain || []).filter(c => c.tier === tier);
      if (group.length) sections.push({ label: 'Chain T' + tier, cards: group });
    }
    if ((turret.cards.combo || []).length) {
      sections.push({ label: 'Combo', cards: turret.cards.combo });
    }
    for (const tier of [1, 2, 3]) {
      const group = (turret.cards.breakthrough || []).filter(c => c.tier === tier);
      if (group.length) sections.push({ label: 'Breakthrough T' + tier, cards: group });
    }

    return sections;
  }

  return {
    name: 'GalleryView',

    setup() {
      const allTurrets    = window.TURRETS;
      const activeTurretId = ref(null);

      const visibleTurrets = computed(() =>
        activeTurretId.value
          ? allTurrets.filter(t => t.id === activeTurretId.value)
          : allTurrets
      );

      const totalCards = computed(() =>
        allTurrets.reduce((sum, t) =>
          sum +
          (t.cards.normal       || []).length +
          (t.cards.chain        || []).length +
          (t.cards.combo        || []).length +
          (t.cards.breakthrough || []).length
        , 0)
      );

      function onImgError(e) {
        e.target.classList.add('img-broken');
      }

      return {
        allTurrets,
        activeTurretId,
        visibleTurrets,
        totalCards,
        buildSections,
        getCardImage: h.getCardImage,
        onImgError
      };
    },

    template: `
      <div class="content-area gallery-view">

        <div class="gallery-header">
          <h2 class="gallery-title">Galerie des cartes</h2>
          <span class="gallery-subtitle">{{ totalCards }} cartes · 11 tourelles · bordure orange = placeholder</span>
        </div>

        <div class="gallery-filter">
          <button
            class="gallery-filter-btn"
            :class="{ active: activeTurretId === null }"
            @click="activeTurretId = null"
          >Toutes</button>
          <button
            v-for="t in allTurrets"
            :key="t.id"
            class="gallery-filter-btn"
            :class="{ active: activeTurretId === t.id }"
            @click="activeTurretId = (activeTurretId === t.id ? null : t.id)"
          >{{ t.name }}</button>
        </div>

        <div v-for="turret in visibleTurrets" :key="turret.id" class="gallery-turret">

          <div class="gallery-turret-header">
            <span class="gallery-turret-name">{{ turret.name }}</span>
            <span class="gallery-turret-dmg" :class="'gallery-dmg-' + turret.damageType.toLowerCase().replace('-','')">
              {{ turret.damageType }}
            </span>
          </div>

          <div v-for="section in buildSections(turret)" :key="section.label" class="gallery-section">
            <div class="gallery-section-label">{{ section.label }}</div>
            <div class="gallery-grid">
              <div v-for="card in section.cards" :key="card.name" class="gallery-card">
                <div class="gallery-card-img-wrap">
                  <img
                    :src="getCardImage(turret.id, card.name)"
                    :alt="card.name"
                    loading="lazy"
                    @error="onImgError"
                  />
                </div>
                <div class="gallery-card-name" :class="{ 'is-purple': card.color === 'purple' }">
                  {{ card.name }}
                </div>
                <div class="gallery-card-effect">{{ card.effect }}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `
  };
})();
