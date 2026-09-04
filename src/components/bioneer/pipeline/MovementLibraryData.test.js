import { describe, it, expect } from 'vitest';
import { MOVEMENT_LIBRARY } from './MovementLibraryData.jsx';
import { validateMovementProfile } from './validateMovementProfile.jsx';

// Every profile in the library must pass the universal contract validator —
// a failing profile is silently excluded from runtime resolution (see
// filterValidProfiles), so a shape mistake here fails invisibly at runtime
// unless it's caught here.
describe('MOVEMENT_LIBRARY profiles', () => {
  it('has no duplicate ids', () => {
    const ids = MOVEMENT_LIBRARY.map(m => m.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  for (const profile of MOVEMENT_LIBRARY) {
    it(`"${profile.id}" passes validateMovementProfile`, () => {
      const { valid, errors } = validateMovementProfile(profile);
      expect(errors).toEqual([]);
      expect(valid).toBe(true);
    });
  }
});
