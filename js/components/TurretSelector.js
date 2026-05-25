/**
 * TurretSelector.js — Grille de sélection des 11 tourelles (choisir 4)
 * Chargé comme <script> global, expose window.TurretSelector
 */
window.TurretSelector = {
  name: 'TurretSelector',
  inject: ['state', 'toggleTurret'],
  computed: {
    turrets() { return window.TURRETS; },
    count() { return this.state.selectedTurretIds.length; },
    isFull() { return this.count >= 4; }
  },
  methods: {
    isSelected(id) { return this.state.selectedTurretIds.includes(id); },
    position(id) { return this.state.selectedTurretIds.indexOf(id) + 1; },
    damageClass(type) {
      const map = {
        'Fire': 'damage-fire',
        'Energy': 'damage-energy',
        'Force-field': 'damage-forcefield',
        'Physical': 'damage-physical',
        'Electric': 'damage-electric'
      };
      return map[type] || '';
    },
    handleClick(id) {
      if (!this.isSelected(id) && this.isFull) return;
      this.toggleTurret(id);
    }
  },
  template: `
    <div class="content-area">
      <div class="section-header">
        <h2 class="section-title">
          Tourelles de combat
          <span class="selection-count" :class="{ full: isFull }">
            {{ count }} / 4 sélectionnées
          </span>
        </h2>
        <p class="section-subtitle">Choisissez exactement 4 tourelles pour votre composition ARK.</p>
      </div>
      <div class="turret-grid">
        <div
          v-for="turret in turrets"
          :key="turret.id"
          class="turret-card"
          :class="{
            selected: isSelected(turret.id),
            maxed: isFull && !isSelected(turret.id)
          }"
          @click="handleClick(turret.id)"
        >
          <div v-if="isSelected(turret.id)" class="position-badge">{{ position(turret.id) }}</div>
          <img :src="turret.image" :alt="turret.name" @error="$event.target.style.opacity='0.3'" />
          <div class="turret-name">{{ turret.name }}</div>
          <div class="turret-badge" :class="damageClass(turret.damageType)">{{ turret.damageType }}</div>
        </div>
      </div>
    </div>
  `
};
