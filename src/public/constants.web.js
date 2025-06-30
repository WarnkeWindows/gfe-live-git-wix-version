/**
 * System Constants
 * Backend: /backend/utils/constants.js
 */

const WINDOW_TYPES = {
    CASEMENT: 'Casement',
    DOUBLE_HUNG: 'Double-Hung',
    SLIDING: 'Sliding',
    AWNING: 'Awning',
    PICTURE: 'Picture',
    BAY: 'Bay',
    BOW: 'Bow'
};

const MATERIALS = {
    VINYL: 'Vinyl',
    WOOD: 'Wood',
    FIBERGLASS: 'Fiberglass',
    ALUMINUM: 'Aluminum',
    COMPOSITE: 'Composite'
};

const CONFIDENCE_THRESHOLDS = {
    HIGH: 80,
    MEDIUM: 60,
    LOW: 40
};

module.exports = {
    WINDOW_TYPES,
    MATERIALS,
    CONFIDENCE_THRESHOLDS
};