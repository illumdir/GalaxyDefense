/**
 * TierRow.js — Un palier de cartes pour une tourelle
 * Props: turretId (string), tier (number 1|2|3)
 * Chargé comme <script> global, expose window.TierRow
 */
window.TierRow = {
  name: 'TierRow',
  inject: ['state'],
  props: {
    turretId: { type: String, required: true },
    tier:     { type: Number, required: true }
  },
  computed: {
    turret() {
      return window.TURRETS.find(function(t) { return t.id === this.turretId; }, this);
    },
    tierPicks() {
      const picks = this.state.cardPicks[this.turretId];
      if (!picks || !picks[this.tier]) return { green: [], purple: null };
      return picks[this.tier];
    },
    greenCount() { return this.tierPicks.green.length; },
    hasFullGreen() { return this.greenCount >= 3; },
    hasPurple() { return this.tierPicks.purple !== null; },

    // Array.from() force Vue à lire chaque élément → réactivité correcte
    availableCombos() {
      return window.getAvailableComboCards(
        this.turretId,
        Array.from(this.state.selectedTurretIds)
      );
    },

    greenPool() {
      const turret = this.turret;
      if (!turret) return [];
      const cards = [];
      const h = window.GDHelpers;
      const tier = this.tier;
      const turretId = this.turretId;
      const cardPicks = this.state.cardPicks;
      const hasFullGreen = this.hasFullGreen;
      const tierGreen = this.tierPicks.green;

      // ── Cartes Normal ─────────────────────────────────────────────────────
      // max_copies: 3 → une même carte peut occuper jusqu'à 3 slots au total
      // (répartis sur plusieurs paliers, ou plusieurs fois dans le même palier)
      for (const card of turret.cards.normal) {
        const maxCopies  = (card.max_copies !== undefined && card.max_copies !== null) ? card.max_copies : 3;
        const countHere  = tierGreen.filter(function(n) { return n === card.name; }).length;
        const totalCount = h.normalCardPickCount(turretId, card.name, cardPicks);
        const canAdd     = !hasFullGreen && totalCount < maxCopies;
        cards.push(Object.assign({}, card, {
          cardType:  'normal',
          maxCopies: maxCopies,
          countHere: countHere,
          selected:  countHere > 0,
          unavailable: false,
          // grisée seulement si elle ne peut pas être ajoutée ET n'est pas déjà là
          slotFull: !canAdd && countHere === 0,
          dimReason: (totalCount >= maxCopies && countHere === 0)
            ? ('Utilisée ' + maxCopies + '\u00D7 au total')
            : null
        }));
      }

      // ── Cartes Chain ──────────────────────────────────────────────────────
      for (const card of turret.cards.chain.filter(function(c) { return c.tier === tier; })) {
        const prereqMet  = h.isChainPrereqMet(card, turretId, cardPicks);
        const selectedHere = tierGreen.includes(card.name);
        const prereqNames = card.requires_chain
          ? (Array.isArray(card.requires_chain) ? card.requires_chain : [card.requires_chain])
          : [];
        cards.push(Object.assign({}, card, {
          cardType:    'chain',
          countHere:   selectedHere ? 1 : 0,
          selected:    selectedHere,
          unavailable: !prereqMet,
          slotFull:    prereqMet && hasFullGreen && !selectedHere,
          dimReason:   !prereqMet ? ('N\u00E9cessite\u00A0: ' + prereqNames.join(' ou ')) : null
        }));
      }

      // ── Cartes Combo ──────────────────────────────────────────────────────
      // availableCombos est déjà filtré : ne contient que les combos dont
      // la tourelle requise est présente dans la composition
      for (const card of this.availableCombos.filter(function(c) { return c.tier === tier; })) {
        const selectedHere = tierGreen.includes(card.name);
        const reqTurret = window.TURRETS.find(function(t) { return t.id === card.requires_turret; });
        cards.push(Object.assign({}, card, {
          cardType:  'combo',
          countHere: selectedHere ? 1 : 0,
          selected:  selectedHere,
          unavailable: false,
          slotFull:  hasFullGreen && !selectedHere,
          dimReason: null,
          comboTurretName: reqTurret ? reqTurret.name : null
        }));
      }

      return cards;
    },

    purplePool() {
      const turret = this.turret;
      if (!turret) return [];
      const tier = this.tier;
      const purpleName = this.tierPicks.purple;
      return turret.cards.breakthrough
        .filter(function(c) { return c.tier === tier; })
        .map(function(card) {
          return Object.assign({}, card, {
            cardType:    'breakthrough',
            selected:    purpleName === card.name,
            unavailable: false,
            slotFull:    purpleName !== null && purpleName !== card.name,
            dimReason:   null
          });
        });
    },

    greenSlotDots() {
      const count = this.greenCount;
      return [0, 1, 2].map(function(i) { return { filled: i < count }; });
    }
  },
  methods: {
    cardImage: function(cardName) {
      return window.GDHelpers.getCardImage(this.turretId, cardName);
    },
    onImageError: function(e) {
      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Crect width='90' height='90' fill='%23132038'/%3E%3Ctext x='45' y='55' text-anchor='middle' font-size='28' fill='%232a4a6f'%3E%3F%3C/text%3E%3C/svg%3E";
    },

    toggleGreen: function(card) {
      if (card.unavailable) return;
      const picks = this.state.cardPicks[this.turretId][this.tier];

      if (card.cardType === 'normal') {
        // Cartes Normal : multi-copies possible (jusqu'à max_copies au total)
        // Clic = ajoute une copie si possible ; sinon retire toutes les copies de ce palier
        const maxCopies  = card.maxCopies !== undefined ? card.maxCopies : 3;
        const countHere  = picks.green.filter(function(n) { return n === card.name; }).length;
        const totalCount = window.GDHelpers.normalCardPickCount(
          this.turretId, card.name, this.state.cardPicks
        );
        const canAdd = !this.hasFullGreen && totalCount < maxCopies;
        if (canAdd) {
          picks.green.push(card.name);
        } else if (countHere > 0) {
          // Retire toutes les copies de cette carte dans ce palier
          for (let i = picks.green.length - 1; i >= 0; i--) {
            if (picks.green[i] === card.name) picks.green.splice(i, 1);
          }
        }

      } else {
        // Chain / Combo : une seule copie, bascule classique
        const idx = picks.green.indexOf(card.name);
        if (idx >= 0) {
          picks.green.splice(idx, 1);
          if (card.cardType === 'chain' && this.turret) {
            window.GDHelpers.cascadeRemoveChainDependents(
              card.name, this.turretId, this.state.cardPicks, this.turret.cards.chain
            );
          }
        } else if (!this.hasFullGreen) {
          picks.green.push(card.name);
        }
      }
    },

    togglePurple: function(card) {
      if (card.unavailable) return;
      const picks = this.state.cardPicks[this.turretId][this.tier];
      picks.purple = (picks.purple === card.name) ? null : card.name;
    },

    prereqText: function(card) {
      if (!card.requires_chain) return '';
      const names = Array.isArray(card.requires_chain) ? card.requires_chain : [card.requires_chain];
      return names.join(' ou ');
    }
  },
  template: `
    <div class="tier-row">
      <div class="tier-header">
        <span class="tier-label">Palier {{ tier }}</span>
        <span class="tier-progress">
          <span :class="{ done: greenCount === 3 }">{{ greenCount }}/3</span>
          cartes vertes ·
          <span :class="{ done: hasPurple }">{{ hasPurple ? 1 : 0 }}/1</span>
          carte violette
        </span>
      </div>

      <div class="tier-body">
        <div class="tier-green-section">
          <div class="tier-section-label green">Cartes vertes ({{ greenCount }}/3)</div>
          <div class="card-pool">
            <div
              v-for="card in greenPool"
              :key="card.name"
              class="card-item green"
              :class="{
                selected: card.selected,
                unavailable: card.unavailable,
                'slot-full': card.slotFull && !card.unavailable
              }"
              @click="toggleGreen(card)"
            >
              <div class="card-img-wrap">
                <img :src="cardImage(card.name)" :alt="card.name" @error="onImageError" />
                <!-- Badge ×N pour les cartes Normal avec plusieurs copies -->
                <div v-if="card.cardType === 'normal' && card.countHere > 1" class="card-count-badge">
                  ×{{ card.countHere }}
                </div>
              </div>
              <div class="card-footer">
                <div class="card-name">{{ card.name }}</div>
                <div class="card-type-dot" :class="card.cardType"></div>
              </div>
              <div class="tooltip">
                <div class="tooltip-name">{{ card.name }}</div>
                <div>{{ card.effect }}</div>
                <div v-if="card.cardType === 'normal'" class="tooltip-prereq">
                  Normal · max {{ card.maxCopies }}×
                  <span v-if="card.countHere > 0"> · {{ card.countHere }} ici</span>
                </div>
                <div v-if="card.cardType === 'chain' && card.requires_chain" class="tooltip-prereq">
                  Requiert : {{ prereqText(card) }}
                </div>
                <div v-if="card.cardType === 'combo' && card.requires_turret" class="tooltip-prereq">
                  Combo avec : {{ card.comboTurretName || card.requires_turret }}
                </div>
                <div v-if="card.dimReason" class="tooltip-prereq" style="color:#f87171;">{{ card.dimReason }}</div>
              </div>
            </div>
          </div>
          <div class="slot-indicator">
            <div v-for="(dot, i) in greenSlotDots" :key="i" class="slot-dot green" :class="{ filled: dot.filled }"></div>
          </div>
        </div>

        <div class="tier-purple-section">
          <div class="tier-section-label purple">Breakthrough ({{ hasPurple ? 1 : 0 }}/1)</div>
          <div class="card-pool">
            <div
              v-for="card in purplePool"
              :key="card.name"
              class="card-item purple"
              :class="{
                selected: card.selected,
                unavailable: card.unavailable,
                'slot-full': card.slotFull
              }"
              @click="togglePurple(card)"
            >
              <div class="card-img-wrap">
                <img :src="cardImage(card.name)" :alt="card.name" @error="onImageError" />
              </div>
              <div class="card-footer">
                <div class="card-name">{{ card.name }}</div>
                <div class="card-type-dot breakthrough"></div>
              </div>
              <div class="tooltip">
                <div class="tooltip-name">{{ card.name }}</div>
                <div>{{ card.effect }}</div>
                <div class="tooltip-prereq">Breakthrough · Palier {{ card.tier }}</div>
              </div>
            </div>
          </div>
          <div class="slot-indicator" style="margin-top:10px;">
            <div class="slot-dot purple" :class="{ filled: hasPurple }"></div>
          </div>
        </div>
      </div>
    </div>
  `
};
