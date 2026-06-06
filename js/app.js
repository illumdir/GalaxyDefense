/**
 * app.js — Point d'entrée principal du Galaxy Defense ARK Builder
 * Chargé comme <script> régulier (non-module) après tous les composants.
 * Dépendances globales : Vue, TURRETS, GUARDIANS, getAvailableComboCards,
 *   getAllGuardians, GDHelpers, TurretSelector, GuardianSelector,
 *   CardBuilder (qui référence TierRow), CompositionSummary
 */
(function() {
  const { createApp, reactive, computed, watch, provide } = Vue;
  const h = window.GDHelpers;

  // =====================================================
  // ÉTAT GLOBAL RÉACTIF
  // =====================================================
  const state = reactive({
    selectedTurretIds:     [],
    selectedGuardianId:    null,
    cardPicks:             {},
    activeStep:            'turrets',
    activeCardTurretIndex: 0
  });

  // =====================================================
  // ACTIONS
  // =====================================================
  function toggleTurret(turretId) {
    const idx = state.selectedTurretIds.indexOf(turretId);
    if (idx >= 0) {
      state.selectedTurretIds.splice(idx, 1);
      delete state.cardPicks[turretId];
      if (state.activeCardTurretIndex >= state.selectedTurretIds.length) {
        state.activeCardTurretIndex = Math.max(0, state.selectedTurretIds.length - 1);
      }
    } else if (state.selectedTurretIds.length < 4) {
      state.selectedTurretIds.push(turretId);
      state.cardPicks[turretId] = h.initTurretPicks();
    }
  }

  function selectGuardian(guardianId) {
    state.selectedGuardianId = (state.selectedGuardianId === guardianId) ? null : guardianId;
  }

  // =====================================================
  // NETTOYAGE DES PICKS COMBO INVALIDES
  // =====================================================
  watch(
    function() { return state.selectedTurretIds.slice(); },
    function(newIds) {
      for (const turretId of Object.keys(state.cardPicks)) {
        const turret = window.TURRETS.find(function(t) { return t.id === turretId; });
        if (!turret) continue;
        for (const tier of [1, 2, 3]) {
          const tierPicks = state.cardPicks[turretId] && state.cardPicks[turretId][tier];
          if (!tierPicks) continue;
          tierPicks.green = tierPicks.green.filter(function(cardName) {
            const comboCard = turret.cards.combo.find(function(c) { return c.name === cardName; });
            if (!comboCard) return true;
            return comboCard.requires_turret === null || newIds.includes(comboCard.requires_turret);
          });
        }
      }
    }
  );

  // =====================================================
  // SYNCHRONISATION URL
  // =====================================================
  function restoreFromHash() {
    const hash = window.location.hash;
    if (!hash || hash === '#') return;
    const restored = h.decodeState(hash);
    if (!restored) return;
    state.selectedTurretIds  = restored.selectedTurretIds;
    state.selectedGuardianId = restored.selectedGuardianId;
    state.cardPicks          = restored.cardPicks;
    if (state.selectedTurretIds.length === 4) {
      state.activeStep = 'summary';
    }
  }

  let hashTimer = null;
  watch(
    state,
    function() {
      if (hashTimer) clearTimeout(hashTimer);
      hashTimer = setTimeout(function() {
        const encoded = h.encodeState(state);
        history.replaceState(null, '', '#' + encoded);
      }, 300);
    },
    { deep: true }
  );

  // =====================================================
  // COMPOSANT RACINE
  // =====================================================
  const STEPS = ['turrets', 'cards', 'summary'];
  const STEP_LABELS = ['Tourelles', 'Cartes', 'Résumé'];

  const App = {
    name: 'App',
    components: {
      TurretSelector:     window.TurretSelector,
      CardBuilder:        window.CardBuilder,
      CompositionSummary: window.CompositionSummary,
      GalleryView:        window.GalleryView
    },

    setup: function() {
      provide('state', state);
      provide('toggleTurret', toggleTurret);
      provide('selectGuardian', selectGuardian);

      restoreFromHash();

      const canProceed = computed(function() {
        if (state.activeStep === 'turrets') return state.selectedTurretIds.length === 4;
        return true;
      });

      function stepIndex() { return STEPS.indexOf(state.activeStep); }

      function goToStep(step) {
        const targetIdx = STEPS.indexOf(step);
        const currentIdx = stepIndex();
        if (targetIdx > currentIdx && !canProceed.value) return;
        state.activeStep = step;
      }

      function nextStep() {
        const idx = stepIndex();
        if (idx < STEPS.length - 1 && canProceed.value) {
          state.activeStep = STEPS[idx + 1];
        }
      }

      function prevStep() {
        const idx = stepIndex();
        if (idx > 0) state.activeStep = STEPS[idx - 1];
      }

      function isDone(stepKey) {
        const stepIdx = STEPS.indexOf(stepKey);
        const currentIdx = STEPS.indexOf(state.activeStep);
        if (stepIdx >= currentIdx) return false;
        if (stepKey === 'turrets') return state.selectedTurretIds.length === 4;
        return stepIdx < currentIdx;
      }

      return { state, canProceed, goToStep, nextStep, prevStep, isDone, STEPS, STEP_LABELS };
    },

    template: `
      <div class="app">
        <header class="app-header">
          <div class="header-inner">
            <div class="logo">
              &#x2B21; Galaxy Defense <span class="accent">ARK</span>
              <span class="mode-badge">BUILDER</span>
              <span class="version-tag">v0.15.4</span>
            </div>
            <nav class="step-tabs">
              <button
                v-for="(step, i) in STEPS"
                :key="step"
                class="step-tab"
                :class="{
                  active: state.activeStep === step,
                  done: isDone(step)
                }"
                @click="goToStep(step)"
              >
                <span class="tab-num">
                  <span v-if="isDone(step)">&#10003;</span>
                  <span v-else>{{ i + 1 }}</span>
                </span>
                <span class="tab-label">{{ STEP_LABELS[i] }}</span>
              </button>
              <div class="step-tab-sep"></div>
              <button
                class="step-tab gallery-tab-btn"
                :class="{ active: state.activeStep === 'gallery' }"
                @click="state.activeStep = 'gallery'"
              >
                <span class="tab-label">&#9638; Galerie</span>
              </button>
            </nav>
          </div>
        </header>

        <main class="app-main">
          <TurretSelector     v-show="state.activeStep === 'turrets'" />
          <CardBuilder        v-show="state.activeStep === 'cards'" />
          <CompositionSummary v-show="state.activeStep === 'summary'" />
          <GalleryView        v-show="state.activeStep === 'gallery'" />
        </main>

        <footer class="app-footer" v-if="state.activeStep !== 'gallery'">
          <button
            class="btn btn-secondary"
            :disabled="state.activeStep === 'turrets'"
            @click="prevStep"
          >
            &#8592; Retour
          </button>
          <div class="footer-center">
            &#xC9;tape {{ STEPS.indexOf(state.activeStep) + 1 }} / {{ STEPS.length }}
            <span v-if="state.activeStep === 'turrets'">
              &middot; {{ state.selectedTurretIds.length }}/4 tourelles
            </span>
          </div>
          <button
            v-if="state.activeStep !== 'summary'"
            class="btn btn-primary"
            :disabled="!canProceed"
            @click="nextStep"
          >
            Suivant &#8594;
          </button>
          <div v-else style="width:120px;"></div>
        </footer>
      </div>
    `
  };

  createApp(App).mount('#app');
})();
