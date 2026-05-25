/**
 * CompositionSummary.js — Récapitulatif + sélection du gardien + partage URL
 * Chargé comme <script> global, expose window.CompositionSummary
 */
window.CompositionSummary = {
  name: 'CompositionSummary',
  inject: ['state', 'selectGuardian'],
  data: function() {
    return {
      copyFeedback: '',
      shareUrl: '',
      guardianPickerOpen: false,
      hoveredCard: null   // { turretId, cardName, x, y }
    };
  },
  computed: {
    guardian: function() {
      if (!this.state.selectedGuardianId) return null;
      return window.getAllGuardians().find(function(g) { return g.id === this.state.selectedGuardianId; }, this);
    },
    selectedTurrets: function() {
      return this.state.selectedTurretIds
        .map(function(id) { return window.TURRETS.find(function(t) { return t.id === id; }); })
        .filter(Boolean);
    },
    guardianSections: function() {
      const G = window.GUARDIANS;
      if (!G) return [];
      return [
        { key: 'default',   label: 'Défaut',    cls: 'default',   items: G.default   || [] },
        { key: 'legendary', label: 'Légendaire', cls: 'legendary', items: G.legendary || [] },
        { key: 'supreme',   label: 'Suprême',    cls: 'supreme',   items: G.supreme   || [] },
        { key: 'ultimate',  label: 'Ultime',     cls: 'ultimate',  items: G.ultimate  || [] }
      ].filter(function(s) { return s.items.length > 0; });
    }
  },
  methods: {
    getTierCards: function(turretId, tier) {
      const picks = this.state.cardPicks[turretId];
      if (!picks || !picks[tier]) return { green: [], purple: null };
      return picks[tier];
    },
    cardImage: function(turretId, cardName) {
      return window.GDHelpers.getCardImage(turretId, cardName);
    },
    onImgError: function(e) {
      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='20' height='20' fill='%23132038'/%3E%3C/svg%3E";
    },
    rarityColor: function(rarity) {
      const map = { 'Default': 'var(--rarity-default)', 'Legendary': 'var(--rarity-legendary)', 'Supreme': 'var(--rarity-supreme)', 'Ultimate': 'var(--rarity-ultimate)' };
      return map[rarity] || 'var(--rarity-default)';
    },
    tierHasCards: function(turretId, tier) {
      const picks = this.getTierCards(turretId, tier);
      return picks.green.length > 0 || picks.purple !== null;
    },
    damageClass: function(type) {
      const map = { 'Fire': 'damage-fire', 'Energy': 'damage-energy', 'Force-field': 'damage-forcefield', 'Physical': 'damage-physical', 'Electric': 'damage-electric' };
      return map[type] || '';
    },
    isPairedInCompo: function(pairedTurretId) {
      return pairedTurretId && this.state.selectedTurretIds.includes(pairedTurretId);
    },
    getPairedTurretName: function(pairedTurretId) {
      if (!pairedTurretId) return null;
      const t = window.TURRETS.find(function(t) { return t.id === pairedTurretId; });
      return t ? t.name : null;
    },
    pickGuardian: function(id) {
      this.selectGuardian(id);
      this.guardianPickerOpen = false;
    },
    showTooltip: function(event, turretId, cardName) {
      var rect = event.currentTarget.getBoundingClientRect();
      var x = rect.left;
      var y = rect.bottom + 6;
      var tipW = 150, tipH = 240;
      if (x + tipW > window.innerWidth) x = window.innerWidth - tipW - 8;
      if (y + tipH > window.innerHeight) y = rect.top - tipH - 6;
      this.hoveredCard = { turretId: turretId, cardName: cardName, x: x, y: y };
    },
    hideTooltip: function() {
      this.hoveredCard = null;
    },
    shareComposition: async function() {
      const encoded = window.GDHelpers.encodeState(this.state);
      const base = window.location.href.split('#')[0];
      const url = base + '#' + encoded;
      this.shareUrl = url;
      history.replaceState(null, '', '#' + encoded);
      try {
        await navigator.clipboard.writeText(url);
        this.copyFeedback = 'copied';
        const self = this;
        setTimeout(function() { self.copyFeedback = ''; }, 2500);
      } catch(e) {
        this.copyFeedback = 'manual';
      }
    }
  },
  template: `
    <div class="content-area">
      <div class="section-header">
        <h2 class="section-title">Composition finale</h2>
        <p class="section-subtitle">Sélectionnez votre gardien et partagez votre build ARK.</p>
      </div>

      <div class="summary-grid">

        <!-- Panneau Gardien (sélection intégrée) -->
        <div class="summary-guardian-panel">
          <!-- Gardien sélectionné -->
          <template v-if="guardian && !guardianPickerOpen">
            <img :src="guardian.image" :alt="guardian.name" @error="onImgError" />
            <div class="summary-guardian-name">{{ guardian.name }}</div>
            <div class="summary-guardian-rarity" :style="{ color: rarityColor(guardian.rarity) }">
              {{ guardian.rarity }}
            </div>
            <button class="btn btn-ghost" style="margin-top:10px;font-size:0.75rem;padding:6px 14px;" @click="guardianPickerOpen = true">
              Changer
            </button>
          </template>

          <!-- Aucun gardien / picker fermé -->
          <template v-else-if="!guardianPickerOpen">
            <div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">&#9651;</div>
            <div style="color:var(--color-text-muted);font-size:0.82rem;text-align:center;margin-bottom:10px;">
              Aucun gardien
            </div>
            <button class="btn btn-ghost" style="font-size:0.75rem;padding:6px 14px;" @click="guardianPickerOpen = true">
              Choisir
            </button>
          </template>

          <!-- Picker ouvert : liste compacte des gardiens -->
          <template v-else>
            <div style="width:100%;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <span style="font-size:0.75rem;font-weight:700;color:var(--color-accent);letter-spacing:0.05em;text-transform:uppercase;">Choisir un gardien</span>
                <button class="btn btn-ghost" style="padding:3px 8px;font-size:0.7rem;" @click="guardianPickerOpen = false">✕</button>
              </div>
              <div v-for="section in guardianSections" :key="section.key" style="margin-bottom:10px;">
                <div class="rarity-label" :class="section.cls" style="font-size:0.62rem;margin-bottom:6px;display:block;">
                  {{ section.label }}
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                  <div
                    v-for="g in section.items"
                    :key="g.id"
                    style="display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:4px;border-radius:8px;border:2px solid transparent;transition:all 0.15s;width:52px;"
                    :style="{ borderColor: state.selectedGuardianId === g.id ? 'var(--color-accent)' : 'transparent', background: state.selectedGuardianId === g.id ? 'var(--color-accent-glow)' : 'transparent' }"
                    @click="pickGuardian(g.id)"
                  >
                    <img :src="g.image" :alt="g.name"
                      style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid var(--color-border);"
                      @error="$event.target.style.opacity='0.3'" />
                    <span style="font-size:0.56rem;font-weight:600;color:var(--color-text);text-align:center;line-height:1.1;">{{ g.name }}</span>
                    <span v-if="g.pairedTurret && isPairedInCompo(g.pairedTurret)"
                      style="font-size:0.5rem;color:var(--color-green);">
                      ✓ {{ getPairedTurretName(g.pairedTurret) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Tourelles + Cartes -->
        <div class="summary-turrets">
          <div v-for="turret in selectedTurrets" :key="turret.id" class="summary-turret-block">
            <div class="summary-turret-header">
              <img :src="turret.image" :alt="turret.name" @error="$event.target.style.display='none'" />
              <div class="summary-turret-name">{{ turret.name }}</div>
              <div class="turret-badge" style="margin-left:auto;" :class="damageClass(turret.damageType)">
                {{ turret.damageType }}
              </div>
            </div>
            <div class="summary-turret-body">
              <div v-for="tier in [1,2,3]" :key="tier" class="summary-tier">
                <div class="summary-tier-label">Palier {{ tier }}</div>
                <div class="summary-cards">
                  <template v-if="tierHasCards(turret.id, tier)">
                    <div v-for="cardName in getTierCards(turret.id, tier).green" :key="cardName" class="summary-card green"
                      @mouseenter="showTooltip($event, turret.id, cardName)"
                      @mouseleave="hideTooltip()">
                      <img :src="cardImage(turret.id, cardName)" :alt="cardName" @error="onImgError" />
                      <span class="summary-card-name">{{ cardName }}</span>
                    </div>
                    <div v-if="getTierCards(turret.id, tier).purple" class="summary-card purple"
                      @mouseenter="showTooltip($event, turret.id, getTierCards(turret.id, tier).purple)"
                      @mouseleave="hideTooltip()">
                      <img :src="cardImage(turret.id, getTierCards(turret.id, tier).purple)" :alt="getTierCards(turret.id, tier).purple" @error="onImgError" />
                      <span class="summary-card-name">{{ getTierCards(turret.id, tier).purple }}</span>
                    </div>
                  </template>
                  <template v-else>
                    <span class="summary-empty-tier">Aucune carte</span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tooltip global (Teleport hors overflow) -->
      <Teleport to="body">
        <div v-if="hoveredCard" class="summary-tooltip-global"
          :style="{ left: hoveredCard.x + 'px', top: hoveredCard.y + 'px' }">
          <img :src="cardImage(hoveredCard.turretId, hoveredCard.cardName)"
               :alt="hoveredCard.cardName" @error="onImgError" />
          <div class="summary-tooltip-global-name">{{ hoveredCard.cardName }}</div>
        </div>
      </Teleport>

      <!-- Partage -->
      <div class="share-section">
        <div class="share-info">
          <div class="share-title">Partager cette composition</div>
          <div class="share-desc">
            Générez un lien unique contenant toute votre composition (gardien, tourelles, cartes).
            Toute personne ouvrant ce lien verra exactement votre build.
          </div>
          <div v-if="shareUrl" class="share-url-box">{{ shareUrl }}</div>
          <div v-if="copyFeedback === 'manual'" style="margin-top:8px;font-size:0.8rem;color:var(--color-text-muted);">
            Copiez l'URL depuis la barre d'adresse ou le champ ci-dessus.
          </div>
        </div>
        <button class="btn-share" :class="{ copied: copyFeedback === 'copied' }" @click="shareComposition">
          <span v-if="copyFeedback === 'copied'">✓ Copié !</span>
          <span v-else>Partager le lien</span>
        </button>
      </div>
    </div>
  `
};
