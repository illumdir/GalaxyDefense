/**
 * CardBuilder.js — Vue unifiée : résumé des slots + pool de toutes les cartes
 * Chargé comme <script> global, expose window.CardBuilder
 * TierRow.js n'est plus utilisé mais reste chargé sans impact.
 */
window.CardBuilder = {
  name: 'CardBuilder',
  inject: ['state'],

  computed: {
    turrets() {
      return this.state.selectedTurretIds
        .map(function(id) { return window.TURRETS.find(function(t) { return t.id === id; }); })
        .filter(Boolean);
    },
    activeTurretId() {
      return this.state.selectedTurretIds[this.state.activeCardTurretIndex] || null;
    },
    activeTurret() {
      var id = this.activeTurretId;
      return id ? window.TURRETS.find(function(t) { return t.id === id; }) : null;
    },
    activePicks() {
      return this.activeTurretId ? this.state.cardPicks[this.activeTurretId] : null;
    },

    turretProgress() {
      var self = this;
      return this.turrets.map(function(turret) {
        var picks = self.state.cardPicks[turret.id];
        if (!picks) return { green: 0, purple: 0, complete: false };
        var green = 0, purple = 0;
        for (var t of [1, 2, 3]) {
          green  += (picks[t] && picks[t].green) ? picks[t].green.length : 0;
          if (picks[t] && picks[t].purple) purple++;
        }
        return { green: green, purple: purple, complete: green === 9 && purple === 3 };
      });
    },

    // Résumé des 3 paliers : quelles cartes sont dans chaque slot
    tierRows() {
      if (!this.activePicks) return [];
      var self = this;
      return [1, 2, 3].map(function(tier) {
        var tp = self.activePicks[tier] || { green: [], purple: null };
        return {
          tier: tier,
          greenSlots: [0, 1, 2].map(function(i) { return tp.green[i] || null; }),
          purple: tp.purple,
          greenCount: tp.green.length,
          greenFull: tp.green.length >= 3,
          hasPurple: tp.purple !== null
        };
      });
    },

    // Cartes combo disponibles selon les tourelles sélectionnées
    // .slice() force Vue 3 à tracker chaque élément (plus fiable que Array.from)
    availableCombos() {
      if (!this.activeTurretId) return [];
      return window.getAvailableComboCards(
        this.activeTurretId,
        this.state.selectedTurretIds.slice()
      );
    },

    // Pool unifié : toutes les cartes vertes (Normal + Chain + Combo) de tous les paliers
    unifiedGreenPool() {
      var turret = this.activeTurret;
      if (!turret || !this.activePicks) return [];
      var cards  = [];
      var h      = window.GDHelpers;
      var picks  = this.activePicks;
      var cardPicks = this.state.cardPicks;
      var turretId  = this.activeTurretId;
      var comboMap  = {};
      this.availableCombos.forEach(function(c) { comboMap[c.name] = c; });

      // ── Normal (aucun palier fixe, vont dans le premier palier disponible) ─
      for (var card of turret.cards.normal) {
        var maxCopies  = (card.max_copies != null) ? card.max_copies : 3;
        var totalCount = h.normalCardPickCount(turretId, card.name, cardPicks);
        var firstFree  = [1, 2, 3].find(function(t) {
          return (picks[t] && picks[t].green.length < 3);
        });
        var canAdd = (firstFree !== undefined) && (totalCount < maxCopies);
        cards.push(Object.assign({}, card, {
          cardType:   'normal',
          maxCopies:  maxCopies,
          totalCount: totalCount,
          selected:   totalCount > 0,
          unavailable: false,
          dimmed:     !canAdd && totalCount === 0,
          tierBadge:  null,
          dimReason:  (!canAdd && totalCount === 0)
            ? ('Utilisée ' + maxCopies + '\u00D7 au total')
            : null
        }));
      }

      // ── Chain (palier minimum — peut aller dans tout slot >= tier) ────────
      for (var card of turret.cards.chain) {
        var minTier     = card.tier;
        var eligible    = [1,2,3].filter(function(t) { return t >= minTier; });
        var prereqMet   = h.isChainPrereqMet(card, turretId, cardPicks);
        var prereqNames = card.requires_chain
          ? (Array.isArray(card.requires_chain) ? card.requires_chain : [card.requires_chain])
          : [];
        // Sélectionnée si présente dans le vert d'un palier éligible
        var selTier     = eligible.find(function(t) { return picks[t] && picks[t].green.includes(card.name); });
        var selected    = selTier !== undefined;
        // Grisée si tous les slots éligibles sont pleins ET pas sélectionnée
        var allFull     = eligible.every(function(t) { return picks[t] && picks[t].green.length >= 3; });
        cards.push(Object.assign({}, card, {
          cardType:    'chain',
          totalCount:  selected ? 1 : 0,
          selected:    selected,
          unavailable: !prereqMet,
          dimmed:      prereqMet && allFull && !selected,
          tierBadge:   minTier,
          dimReason:   !prereqMet
            ? ('N\u00E9cessite\u00A0: ' + prereqNames.join(' ou '))
            : null
        }));
      }

      // ── Combo (palier minimum, seulement si tourelle requise présente) ───
      // Double vérification via .includes() sur le tableau réactif directement
      var selectedIds = this.state.selectedTurretIds;
      for (var card of turret.cards.combo) {
        if (card.requires_turret && !selectedIds.includes(card.requires_turret)) continue;
        var minTier  = card.tier;
        var eligible = [1,2,3].filter(function(t) { return t >= minTier; });
        var selTier  = eligible.find(function(t) { return picks[t] && picks[t].green.includes(card.name); });
        var selected = selTier !== undefined;
        var allFull  = eligible.every(function(t) { return picks[t] && picks[t].green.length >= 3; });
        var reqTurret = window.TURRETS.find(function(t) { return t.id === card.requires_turret; });
        cards.push(Object.assign({}, card, {
          cardType:        'combo',
          totalCount:      selected ? 1 : 0,
          selected:        selected,
          unavailable:     false,
          dimmed:          allFull && !selected,
          tierBadge:       minTier,
          dimReason:       null,
          comboTurretName: reqTurret ? reqTurret.name : card.requires_turret
        }));
      }

      return cards;
    },

    // Pool unifié : toutes les cartes Breakthrough (violettes)
    // Une carte de tier N peut aller dans n'importe quel slot violet >= N
    unifiedPurplePool() {
      var turret = this.activeTurret;
      if (!turret || !this.activePicks) return [];
      var picks = this.activePicks;
      return turret.cards.breakthrough.map(function(card) {
        var minTier      = card.tier;
        var eligible     = [1,2,3].filter(function(t) { return t >= minTier; });
        // Sélectionnée si elle est dans le slot violet d'un palier éligible
        var selTier      = eligible.find(function(t) { return picks[t] && picks[t].purple === card.name; });
        var selected     = selTier !== undefined;
        // Grisée seulement si TOUS les slots éligibles sont pris par d'autres cartes
        var allTaken     = eligible.every(function(t) { return picks[t] && picks[t].purple !== null && picks[t].purple !== card.name; });
        return Object.assign({}, card, {
          cardType:    'breakthrough',
          selected:    selected,
          unavailable: false,
          dimmed:      allTaken && !selected,
          tierBadge:   minTier,
          dimReason:   allTaken && !selected ? 'Tous les slots disponibles (P' + eligible.join('/P') + ') sont pris' : null
        });
      });
    }
  },

  methods: {
    setActiveTab: function(idx) {
      this.state.activeCardTurretIndex = idx;
    },
    cardImage: function(cardName) {
      if (!this.activeTurretId) return '';
      return window.GDHelpers.getCardImage(this.activeTurretId, cardName);
    },
    onImageError: function(e) {
      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23132038'/%3E%3Ctext x='40' y='50' text-anchor='middle' font-size='24' fill='%232a4a6f'%3E%3F%3C/text%3E%3C/svg%3E";
    },

    toggleGreen: function(card) {
      if (card.unavailable) return;
      var picks     = this.activePicks;
      var turretId  = this.activeTurretId;
      var cardPicks = this.state.cardPicks;
      var h         = window.GDHelpers;
      if (!picks) return;

      if (card.cardType === 'normal') {
        var maxCopies  = card.maxCopies != null ? card.maxCopies : (card.max_copies != null ? card.max_copies : 3);
        var totalCount = h.normalCardPickCount(turretId, card.name, cardPicks);
        var firstFree  = [1, 2, 3].find(function(t) { return picks[t] && picks[t].green.length < 3; });
        var canAdd     = (firstFree !== undefined) && (totalCount < maxCopies);
        if (canAdd) {
          picks[firstFree].green.push(card.name);
        } else if (totalCount > 0) {
          // Retire toutes les copies de tous les paliers
          for (var t of [1, 2, 3]) {
            if (picks[t]) {
              for (var i = picks[t].green.length - 1; i >= 0; i--) {
                if (picks[t].green[i] === card.name) picks[t].green.splice(i, 1);
              }
            }
          }
        }
      } else {
        // Chain / Combo — palier MINIMUM, peut aller dans tout slot >= card.tier
        var minTier  = card.tier;
        var eligible = [1,2,3].filter(function(t) { return t >= minTier; });

        // Chercher dans quel palier éligible la carte est déjà placée
        var selTier = eligible.find(function(t) { return picks[t] && picks[t].green.includes(card.name); });

        if (selTier !== undefined) {
          // Retirer
          var idx = picks[selTier].green.indexOf(card.name);
          picks[selTier].green.splice(idx, 1);
          if (card.cardType === 'chain' && this.activeTurret) {
            h.cascadeRemoveChainDependents(
              card.name, turretId, cardPicks, this.activeTurret.cards.chain
            );
          }
        } else {
          // Ajouter au premier slot éligible disponible
          var firstFree = eligible.find(function(t) { return picks[t] && picks[t].green.length < 3; });
          if (firstFree !== undefined) {
            picks[firstFree].green.push(card.name);
          }
        }
      }
    },

    togglePurple: function(card) {
      var picks = this.activePicks;
      if (!picks) return;
      var minTier  = card.tier;
      var eligible = [1,2,3].filter(function(t) { return t >= minTier; });

      // Chercher dans quel palier éligible la carte est déjà placée
      var selTier = eligible.find(function(t) { return picks[t] && picks[t].purple === card.name; });

      if (selTier !== undefined) {
        // Retirer
        picks[selTier].purple = null;
      } else {
        // Ajouter au premier slot éligible vide
        var firstFree = eligible.find(function(t) { return picks[t] && picks[t].purple === null; });
        if (firstFree !== undefined) {
          picks[firstFree].purple = card.name;
        }
      }
    }
  },

  template: `
    <div class="content-area card-builder">
      <div class="section-header">
        <h2 class="section-title">Cartes</h2>
        <p class="section-subtitle">Sélectionne jusqu'à 3 cartes vertes et 1 carte violette par palier.</p>
      </div>

      <!-- Onglets tourelles -->
      <div class="turret-tabs">
        <button
          v-for="(turret, idx) in turrets"
          :key="turret.id"
          class="turret-tab"
          :class="{
            active: state.activeCardTurretIndex === idx,
            complete: turretProgress[idx] && turretProgress[idx].complete
          }"
          @click="setActiveTab(idx)"
        >
          <img :src="turret.image" :alt="turret.name" @error="$event.target.style.display='none'" />
          {{ turret.name }}
          <span class="turret-tab-progress">{{ turretProgress[idx] ? turretProgress[idx].green : 0 }}/9</span>
        </button>
      </div>

      <div v-if="activeTurret">
        <!-- ══ RÉSUMÉ DES SLOTS (loadout) ═══════════════════════════════ -->
        <div class="loadout-summary">
          <div class="loadout-header">Deck</div>
          <div v-for="row in tierRows" :key="row.tier" class="loadout-tier-row">
            <div class="loadout-tier-label" :class="{ complete: row.greenFull && row.hasPurple }">
              T{{ row.tier }}
            </div>

            <!-- 3 slots verts -->
            <div class="loadout-green-slots">
              <div
                v-for="(slotCard, si) in row.greenSlots"
                :key="si"
                class="loadout-slot green"
                :class="{ filled: slotCard !== null }"
                :title="slotCard || ''"
              >
                <img v-if="slotCard" :src="cardImage(slotCard)" :alt="slotCard" @error="onImageError" />
              </div>
            </div>

            <!-- 1 slot violet -->
            <div class="loadout-purple-slot">
              <div
                class="loadout-slot purple"
                :class="{ filled: row.purple !== null }"
                :title="row.purple || ''"
              >
                <img v-if="row.purple" :src="cardImage(row.purple)" :alt="row.purple" @error="onImageError" />
              </div>
            </div>

            <!-- Compteur -->
            <div class="loadout-tier-count">
              <span :class="{ done: row.greenFull }">{{ row.greenCount }}/3</span>
              <span class="sep">·</span>
              <span :class="{ done: row.hasPurple }">{{ row.hasPurple ? 1 : 0 }}/1</span>
            </div>
          </div>
        </div>

        <!-- ══ POOL UNIFIÉ ════════════════════════════════════════════════ -->
        <div class="unified-pool">

          <!-- Cartes vertes (toutes, triées par palier) -->
          <div class="pool-section-header green">
            <span class="pool-section-dot green"></span>
            Cartes vertes
          </div>
          <div class="card-pool unified">
            <div
              v-for="card in unifiedGreenPool"
              :key="card.cardType + '-' + card.name"
              class="card-item green"
              :class="{
                selected:    card.selected,
                unavailable: card.unavailable,
                dimmed:      (card.dimmed || (card.unavailable)) && !card.selected
              }"
              @click="toggleGreen(card)"
            >
              <div class="card-img-wrap">
                <img :src="cardImage(card.name)" :alt="card.name" @error="onImageError" />
                <!-- Badge palier (Chain/Combo uniquement) -->
                <div v-if="card.tierBadge" class="card-tier-badge">{{ card.tierBadge }}</div>
                <!-- Badge ×N pour Normal multi-copies -->
                <div v-if="card.cardType === 'normal' && card.totalCount > 1" class="card-count-badge">
                  ×{{ card.totalCount }}
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
                  Normal · max {{ card.maxCopies }}× · {{ card.totalCount }} placée(s)
                </div>
                <div v-if="card.cardType === 'chain' && card.tierBadge" class="tooltip-prereq">
                  Chaîne · Palier {{ card.tierBadge }}
                </div>
                <div v-if="card.cardType === 'combo'" class="tooltip-prereq">
                  Combo avec : {{ card.comboTurretName }}
                </div>
                <div v-if="card.dimReason" class="tooltip-prereq dim-reason">{{ card.dimReason }}</div>
              </div>
            </div>
          </div>

          <!-- Cartes Breakthrough (violettes, triées par palier) -->
          <div class="pool-section-header purple" style="margin-top:20px;">
            <span class="pool-section-dot purple"></span>
            Breakthrough
          </div>
          <div class="card-pool unified">
            <div
              v-for="card in unifiedPurplePool"
              :key="'bt-' + card.name"
              class="card-item purple"
              :class="{
                selected: card.selected,
                dimmed:   card.dimmed && !card.selected
              }"
              @click="togglePurple(card)"
            >
              <div class="card-img-wrap">
                <img :src="cardImage(card.name)" :alt="card.name" @error="onImageError" />
                <div class="card-tier-badge purple">{{ card.tierBadge }}</div>
              </div>
              <div class="card-footer">
                <div class="card-name">{{ card.name }}</div>
                <div class="card-type-dot breakthrough"></div>
              </div>
              <div class="tooltip">
                <div class="tooltip-name">{{ card.name }}</div>
                <div>{{ card.effect }}</div>
                <div class="tooltip-prereq">Breakthrough · Palier {{ card.tier }}</div>
                <div v-if="card.dimReason" class="tooltip-prereq dim-reason">{{ card.dimReason }}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
};
