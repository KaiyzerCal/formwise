/**
 * PhaseClassifier — maps RepDetector state → named phase from movement profile
 * For strength: state machine phases
 * For rotational/sports: angle + velocity heuristic phases
 */

export class PhaseClassifier {
  constructor(profile) {
    this.profile    = profile;
    this.repStartMs = null;
    this.lastPhase  = null;
  }

  setRepStart(tMs) {
    this.repStartMs = tMs;
  }

  classify(smoothedJoints, tMs, repState) {
    const phase = this._map(repState, smoothedJoints, tMs);
    if (phase !== this.lastPhase) {
      this.lastPhase = phase;
    }
    return phase ? { id: phase } : null;
  }

  _map(repState, j, tMs) {
    const cat = this.profile.category;

    if (cat === 'strength') {
      return this._strengthPhase(repState, j);
    }
    if (cat === 'rotational') {
      return this._rotationalPhase(repState, j);
    }
    if (cat === 'locomotion') {
      return this._locomotionPhase(repState, j);
    }
    if (cat === 'athletic') {
      return this._athleticPhase(repState, j);
    }

    return this.profile.phases[0] ?? null;
  }

  _strengthPhase(repState, j) {
    const map = {
      LOCKOUT: this.profile.phases.find(p => ['lockout','top','plank','setup','start'].includes(p)) ?? this.profile.phases[0],
      DESCENT: this.profile.phases.find(p => ['descent','lowering','lower','pull'].includes(p)) ?? this.profile.phases[1],
      BOTTOM:  this.profile.phases.find(p => ['bottom'].includes(p)) ?? this.profile.phases[2],
      ASCENT:  this.profile.phases.find(p => ['ascent','press','push'].includes(p)) ?? this.profile.phases[3],
    };
    return map[repState] ?? this.profile.phases[0];
  }

  _rotationalPhase(repState, j) {
    const map = {
      LOCKOUT: this.profile.phases[0],
      DESCENT: this.profile.phases[1],
      BOTTOM:  this.profile.phases[2] ?? this.profile.phases[1],
      ASCENT:  this.profile.phases[this.profile.phases.length - 1],
    };
    return map[repState] ?? this.profile.phases[0];
  }

  _locomotionPhase(repState, j) {
    const map = {
      LOCKOUT: 'drive',
      DESCENT: 'transition',
      BOTTOM:  'maxvel',
      ASCENT:  'float',
    };
    return map[repState] ?? 'drive';
  }

  _athleticPhase(repState, j) {
    const map = {
      LOCKOUT: 'flight',
      DESCENT: 'contact',
      BOTTOM:  'absorption',
      ASCENT:  'stabilize',
    };
    return map[repState] ?? 'flight';
  }

  reset() {
    this.repStartMs = null;
    this.lastPhase  = null;
  }
}