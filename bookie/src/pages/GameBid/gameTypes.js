import SingleDigitBid from './bids/SingleDigitBid';
import JodiBulkBid from './bids/JodiBulkBid';
import SinglePanaBulkBid from './bids/SinglePanaBulkBid';
import DoublePanaBulkBid from './bids/DoublePanaBulkBid';
import TriplePanaBid from './bids/TriplePanaBid';
import FullSangamBid from './bids/FullSangamBid';
import HalfSangamABid from './bids/HalfSangamABid';

export const GAME_TYPE_ORDER = [
    'single-digit',
    'jodi',
    'single-pana-bulk',
    'double-pana-bulk',
    'triple-pana',
    'full-sangam',
    'half-sangam',
];

export const BID_COMPONENTS = {
    'single-digit': { component: SingleDigitBid, title: 'Single Digit', betType: 'single' },
    'jodi': { component: JodiBulkBid, title: 'Jodi Bulk', betType: 'jodi' },
    'single-pana-bulk': { component: SinglePanaBulkBid, title: 'Single Pana Bulk', betType: 'panna' },
    'double-pana-bulk': { component: DoublePanaBulkBid, title: 'Double Pana Bulk', betType: 'panna' },
    'triple-pana': { component: TriplePanaBid, title: 'Triple Pana', betType: 'panna' },
    'full-sangam': { component: FullSangamBid, title: 'Full Sangam', betType: 'full-sangam' },
    'half-sangam': { component: HalfSangamABid, title: 'Half Sangam (O)', betType: 'half-sangam' },
};
