import { describe, it, expect } from 'vitest';
import { calculateDeleteAction, calculateUndoDeletions } from '../electron/lib/gameLogic.js';

describe('gameLogic', () => {
  describe('calculateDeleteAction', () => {
    it('returns delete_file for manual imported games', () => {
      const data = { source: 'imported' };
      const gameId = 'imported_123';
      const result = calculateDeleteAction(data, gameId);
      expect(result.action).toBe('delete_file');
    });

    it('returns mark_removed for steam games to prevent auto-scan re-add', () => {
      const data = { source: 'steam' };
      const gameId = 'steam_456';
      const result = calculateDeleteAction(data, gameId);
      expect(result.action).toBe('mark_removed');
      expect(result.game.removed).toBe(true);
    });

    it('returns mark_removed for gog games', () => {
      const data = { source: 'gog' };
      const gameId = 'gog_789';
      const result = calculateDeleteAction(data, gameId);
      expect(result.action).toBe('mark_removed');
      expect(result.game.removed).toBe(true);
    });
  });

  describe('calculateUndoDeletions', () => {
    it('identifies games that were added during import and should be deleted', () => {
      const existingIds = ['game1', 'game2', 'new_game3'];
      const restoreIds = ['game1', 'game2'];
      const result = calculateUndoDeletions(existingIds, restoreIds);
      expect(result).toEqual(['new_game3']);
    });

    it('returns empty array if no new games were added', () => {
      const existingIds = ['game1', 'game2'];
      const restoreIds = ['game1', 'game2'];
      const result = calculateUndoDeletions(existingIds, restoreIds);
      expect(result).toEqual([]);
    });
  });
});
