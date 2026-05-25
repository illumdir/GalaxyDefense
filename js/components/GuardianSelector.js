/**
 * GuardianSelector.js — Sélection du gardien (1 parmi 20)
 * Chargé comme <script> global, expose window.GuardianSelector
 */
window.GuardianSelector = {
  name: 'GuardianSelector',
  inject: ['state', 'selectGuardian'],
  computed: {
    sections() {
      const G = window.GUARDIANS;
      if (!G) return [];
      return [
        { key: 'default',   label: 'Défaut',    cls: 'default',   items: G.default   || [] },
        { key: 'legendary', label: 'Légendaire', cls: 'legendary', items: G.legendary || [] },
        { key: 'supreme',   label: 'Suprême',    cls: 'supreme',   items: G.supreme   || [] },
        { key: 'ultimate',  label: 'Ultime',     cls: 'ultimate',  items: G.ultimate  || [] }
      ].filter(s => s.items.length > 0);
    }
  },
  methods: {
    isSelected(id) { return this.state.selectedGuardianId === id; },
    getPairedTurretName(pairedTurretId) {
      if (!pairedTurretId) return null;
      const t = window.TURRETS.find(t => t.id === pairedTurretId);
      return t ? t.name : null;
    },
    isPairedInCompo(pairedTurretId) {
      return pairedTurretId && this.state.selectedTurretIds.includes(pairedTurretId);
    }
  },
  template: `
    <div class="content-area">
      <div class="section-header">
        <h2 class="section-title">Gardien</h2>
        <p class="section-subtitle">
          Choisissez votre gardien. Les gardiens Légendaires sont liés à une tourelle spécifique (bonus passifs).
        </p>
      </div>

      <div v-for="section in sections" :key="section.key" class="rarity-section">
        <div class="rarity-header">
          <span class="rarity-label" :class="section.cls">{{ section.label }}</span>
          <span class="rarity-count">{{ section.items.length }} gardien{{ section.items.length > 1 ? 's' : '' }}</span>
        </div>
        <div class="guardian-grid">
          <div
            v-for="guardian in section.items"
            :key="guardian.id"
            class="guardian-card"
            :class="[section.cls, { selected: isSelected(guardian.id) }]"
            @click="selectGuardian(guardian.id)"
          >
            <img :src="guardian.image" :alt="guardian.name" @error="$event.target.style.opacity='0.3'" />
            <div class="guardian-name">{{ guardian.name }}</div>
            <div v-if="guardian.pairedTurret" class="guardian-turret-badge">
              <span v-if="isPairedInCompo(guardian.pairedTurret)" style="color: var(--color-green)">
                ✓ {{ getPairedTurretName(guardian.pairedTurret) }}
              </span>
              <span v-else>
                {{ getPairedTurretName(guardian.pairedTurret) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
