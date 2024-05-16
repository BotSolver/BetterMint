/*
Rodent, a UCI chess playing engine derived from Sungorus 1.4
Copyright (C) 2009-2011 Pablo Vazquez (Sungorus author)
Copyright (C) 2011-2017 Pawel Koziol

Rodent is free software: you can redistribute it and/or modify it under the terms of the GNU
General Public License as published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

Rodent is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.
If not, see <http://www.gnu.org/licenses/>.
*/

/*
Endgames that possibly might be added:

- KQKP
- KRKP
- KBPKP fortress draws with stronger side pawn blocked on 6th line by weaker side pawn
- KBPPB blockade draws
- KRPPKRP scaling
- KBNNKR scaling
- KNPK draw with stronger king blocking edge pawn on 7th rank (depends on the color of a square knight is on)

*/

#include "rodent.h"

static const U64 bbKingBlockH[2] = { SqBb(H8) | SqBb(H7) | SqBb(G8) | SqBb(G7),
                                     SqBb(H1) | SqBb(H2) | SqBb(G1) | SqBb(G2)
                                   };

static const U64 bbKingBlockA[2] = { SqBb(A8) | SqBb(A7) | SqBb(B8) | SqBb(B7),
                                     SqBb(A1) | SqBb(A2) | SqBb(B1) | SqBb(B2)
                                   };

static const int BN_wb[64] = {
    0,    0,  15,  30,  45,  60,  85, 100,
    0,   15,  30,  45,  60,  85, 100,  85,
    15,  30,  45,  60,  85, 100,  85,  60,
    30,  45,  60,  85, 100,  85,  60,  45,
    45,  60,  85, 100,  85,  60,  45,  30,
    60,  85, 100,  85,  60,  45,  30,  15,
    85, 100,  85,  60,  45,  30,  15,   0,
   100,  85,  60,  45,  30,  15,   0,   0
};

static const int BN_bb[64] = {
    100, 85,  60,  45,  30,  15,   0,   0,
    85, 100,  85,  60,  45,  30,  15,   0,
    60,  85, 100,  85,  60,  45,  30,  15,
    45,  60,  85, 100,  85,  60,  45,  30,
    30,  45,  60,  85, 100,  85,  60,  45,
    15,  30,  45,  60,  85, 100,  85,  60,
    0,   15,  30,  45,  60,  85, 100,  85,
    0,   0,   15,  30,  45,  60,  85, 100
};

int cEngine::GetDrawFactor(POS *p, eColor sd) {  // refactoring may be needed

    eColor op = ~sd; // weaker side

    if (p->mPhase < 2) {
        if (p->Pawns(sd) == 0) return 0;                                                                   // KK, KmK, KmKp, KmKpp
    }

    if (p->mPhase == 0) return ScalePawnsOnly(p, sd, op);

    if (p->mPhase == 1) {
        if (p->mCnt[sd][B] == 1) return ScaleKBPK(p, sd, op);                                              // KBPK, see below
        if (p->mCnt[sd][N] == 1) return ScaleKNPK(p, sd, op);                                              // KBPK, see below
    }

    if (p->mPhase == 2) {

        if (p->mCnt[sd][N] == 2 && p->mCnt[sd][P] == 0) {
            if (p->mCnt[op][P] == 0) return 0;                                                             // KNNK(m)
            else return 8;                                                                                 // KNNK(m)(p)
        }

        if (p->mCnt[sd][B] == 2 && p->mCnt[sd][P] == 0) {                                                  // KBBK, same coloured bishops
            if (MoreThanOne(p->Bishops(sd) & bbWhiteSq)
            ||  MoreThanOne(p->Bishops(sd) & bbBlackSq)) return 0;
        }

        if (p->mCnt[sd][B] == 1                                                                            // KBPKm, king blocks
        && p->mCnt[op][B] + p->mCnt[op][N] == 1
        && p->mCnt[sd][P] == 1
        && p->mCnt[op][P] == 0
        && (SqBb(p->mKingSq[op]) & BB.GetFrontSpan(p->Pawns(sd), sd))
        && NotOnBishColor(p, sd, p->mKingSq[op]))
            return 0;

        if (p->mCnt[sd][B] == 1 && p->mCnt[op][B] == 1
        && DifferentBishops(p)) {
            if (Mask.home[sd] & p->Pawns(sd)
            &&  p->mCnt[sd][P] == 1 && p->mCnt[op][P] == 0) return 8;                                      // KBPKB, BOC, pawn on own half

            return 32;                                                                                     // BOC, any number of pawns
        }
    }

    if (p->mPhase == 3 && p->mCnt[sd][P] == 0) {
        if (p->mCnt[sd][R] == 1 && p->mCnt[op][B] + p->mCnt[op][N] == 1) return 16;                        // KRKm(p)
        if (p->mCnt[sd][B] + p->mCnt[sd][N] == 2 && p->mCnt[op][B] == 1) return 8;                         // KmmKB(p)
        if (p->mCnt[sd][B] == 1 && p->mCnt[sd][N] == 1 && p->mCnt[op][B] + p->mCnt[op][N] == 1) return 8;  // KBNKm(p)
    }

    if (p->mPhase == 4 && p->mCnt[sd][R] == 1 && p->mCnt[op][R] == 1) {

        if (p->mCnt[sd][P] == 0 && p->mCnt[op][P] == 0) return 8;                                          // KRKR
        if (p->mCnt[sd][P] == 1 && p->mCnt[op][P] == 0) return ScaleKRPKR(p, sd, op);                      // KRPKR, see below
    }

    if (p->mPhase == 5 && p->mCnt[sd][P] == 0) {
        if (p->mCnt[sd][R] == 1 && p->mCnt[sd][B] + p->mCnt[sd][N] == 1 && p->mCnt[op][R] == 1) return 16; // KRMKR(p)
    }

    if (p->mPhase == 6 && p->mCnt[sd][Q] == 1 && p->mCnt[op][R] == 1 && p->mCnt[sd][P] == 0)
        return ScaleKQKRP(p, sd, op);

    if (p->mPhase == 7 && p->mCnt[sd][P] == 0) {
        if (p->mCnt[sd][R] == 2 && p->mCnt[op][B] + p->mCnt[op][N] == 1 && p->mCnt[op][R] == 1) return 16; // KRRKRm(p)
    }

    if (p->mPhase == 9 && p->mCnt[sd][P] == 0) {
        if (p->mCnt[sd][R] == 2 && p->mCnt[sd][B] + p->mCnt[sd][N] == 1 && p->mCnt[op][R] == 2) return 16; // KRRMKRR(p)
        if (p->mCnt[sd][Q] == 1 && p->mCnt[sd][B] + p->mCnt[sd][N] == 1 && p->mCnt[op][Q] == 1) return 16; // KQmKQ(p)
    }

    return 64;
}

int cEngine::ScalePawnsOnly(POS *p, eColor sd, eColor op) {

    if (p->mCnt[op][P] == 0) {  // TODO: accept pawns for a weaker side

        if ((p->Pawns(sd) == (p->Pawns(sd) & FILE_H_BB)) // all pawns on the h file
        &&  p->Kings(op) & bbKingBlockH[sd]) return 0;

        if ((p->Pawns(sd) == (p->Pawns(sd) & FILE_A_BB)) // all pawns on the a file
        &&  p->Kings(op) & bbKingBlockA[sd]) return 0;
    }

    return 64; // default
}

int cEngine::ScaleKNPK(POS *p, eColor sd, eColor op) {

    // rare KNPK draw rule: king blocking an edge pawn on 7th rank draws

    if (p->mCnt[sd][N] == 1
    &&  p->mCnt[sd][P] == 1
    &&  p->mCnt[op][P] == 0) {

        if ((RelSqBb(A7, sd) & p->PcBb(sd, P))
        && (RelSqBb(A8, sd) & p->PcBb(op, K))) return 0; // dead draw

        if ((RelSqBb(H7, sd) & p->PcBb(sd, P))
        && (RelSqBb(H8, sd) & p->PcBb(op, K))) return 0; // dead draw
    }

    return 64; // default
}

int cEngine::ScaleKBPK(POS *p, eColor sd, eColor op) {

    if ((p->Pawns(sd) == (p->Pawns(sd) & FILE_H_BB))
    && NotOnBishColor(p, sd, REL_SQ(H8, sd))
    && p->Kings(op)  & bbKingBlockH[sd]) return 0;

    if ((p->Pawns(sd) == (p->Pawns(sd) & FILE_A_BB))
    && NotOnBishColor(p, sd, REL_SQ(A8, sd))
    && p->Kings(op)  & bbKingBlockA[sd]) return 0;

    return 64; // default
}

int cEngine::ScaleKRPKR(POS *p, eColor sd, eColor op) {

    if ((RelSqBb(A7, sd) & p->Pawns(sd))
    && (RelSqBb(A8, sd) & p->Rooks(sd))
    && (FILE_A_BB & p->Rooks(op))
    && ((RelSqBb(H7, sd) & p->Kings(op)) || (RelSqBb(G7, sd) & p->Kings(op)))
       ) return 0; // dead draw

    if ((RelSqBb(H7, sd) & p->Pawns(sd))
    && (RelSqBb(H8, sd) & p->Rooks(sd))
    && (FILE_H_BB & p->Rooks(op))
    && ((RelSqBb(A7, sd) & p->Kings(op)) || (RelSqBb(B7, sd) & p->Kings(op)))
       ) return 0; // dead draw

    U64 bb_span = BB.GetFrontSpan(p->Pawns(sd), sd);
    int prom_sq = FirstOne(bb_rel_rank[sd][RANK_8] & bb_span);
    int strong_king = p->mKingSq[sd];
    int weak_king = p->mKingSq[op];
    int strong_pawn = FirstOne(p->Pawns(sd));
    int weak_rook = FirstOne(p->Rooks(op));
    int tempo = (p->mSide == sd);
    U64 bb_safe_zone = Mask.home[sd] ^ bb_rel_rank[sd][RANK_5];

    if (p->Pawns(sd) & bb_safe_zone) {

        // king of the weaker side blocks pawn

        if (BB.ShiftFwd(p->Pawns(sd), sd) & p->Kings(op)
        && Dist.metric[strong_king][strong_pawn] - tempo >= 2
        && Dist.metric[strong_king][weak_rook] - tempo >= 2)
            return 0;

        // third rank defence

        if (Dist.metric[weak_king][prom_sq] <= 1
        && strong_king <= H5
        && (p->Rooks(op) & bb_rel_rank[sd][RANK_6]))
            return 0;

    } else { // advanced enemy pawn

        // Continuation of third rank defence:
        // pawn on the 6th rank, but weaker side defends promotion square
        // and can check from behind

        if (p->Pawns(sd) & bb_rel_rank[sd][RANK_6]
        && Dist.metric[weak_king][prom_sq] <= 1
        && ((p->Kings(sd) & bb_safe_zone) || (!tempo && p->Kings(sd) & bb_rel_rank[sd][RANK_6]))
        && (p->Rooks(op) & bb_rel_rank[sd][RANK_1]))
            return 0;

    }

    // catch-all bonus for well-positioned defending king

    if (p->Kings(op) & bb_span)
        return 32; // defending king on pawn's path: 1/2

    return 64;   // default: no scaling
}

int cEngine::ScaleKQKRP(POS *p, eColor sd, eColor op) {

    U64 bb_defended = p->Pawns(op) & bb_rel_rank[sd][RANK_7];
    bb_defended &= BB.KingAttacks(p->mKingSq[op]);

    // fortress: rook defended by a pawn on the third rank, pawn defended by the king

    if (p->Rooks(op) & BB.GetPawnControl(bb_defended, op))
        return 8;

    return 64;   // default: no scaling
}

bool cEngine::NotOnBishColor(POS *p, eColor bish_side, int sq) {

    if (((bbWhiteSq & p->Bishops(bish_side)) == 0)
    && (SqBb(sq) & bbWhiteSq)) return true;

    if (((bbBlackSq & p->Bishops(bish_side)) == 0)
    && (SqBb(sq) & bbBlackSq)) return true;

    return false;
}

bool cEngine::DifferentBishops(POS *p) {

    if ((bbWhiteSq & p->Bishops(WC)) && (bbBlackSq & p->Bishops(BC))) return true;
    if ((bbBlackSq & p->Bishops(WC)) && (bbWhiteSq & p->Bishops(BC))) return true;
    return false;
}

int cEngine::CheckmateHelper(POS *p) {

    int result = 0;

    // KQ vs Kx: drive enemy king towards the edge

    if (p->mCnt[WC][Q] > 0 && p->mCnt[WC][P] == 0) {
        if (p->mCnt[BC][Q] == 0 && p->mCnt[BC][P] == 0 && p->mCnt[BC][R] + p->mCnt[BC][B] + p->mCnt[BC][N] <= 1) {

            result += 200;
            result += 10 * Dist.bonus[p->mKingSq[WC]][p->mKingSq[BC]];
            result -= Par.eg_pst[BC][K][p->mKingSq[BC]];
            return result;
        }
    }

    if (p->mCnt[BC][Q] > 0 && p->mCnt[BC][P] == 0) {
        if (p->mCnt[WC][Q] == 0 && p->mCnt[WC][P] == 0 && p->mCnt[WC][R] + p->mCnt[WC][B] + p->mCnt[WC][N] <= 1) {

            result -= 200;
            result -= 10 * Dist.bonus[p->mKingSq[WC]][p->mKingSq[BC]];
            result += Par.eg_pst[BC][K][p->mKingSq[BC]];
            return result;
        }
    }

    // Weaker side has bare king (KQK, KRK, KBBK + bigger advantage

    if (p->mCnt[BC][P] + p->mCnt[BC][N] + p->mCnt[BC][B] + p->mCnt[BC][R] + p->mCnt[BC][Q] == 0) {
        if ((p->mCnt[WC][Q] + p->mCnt[WC][R] > 0) || p->mCnt[WC][B] > 1) {
            result += 200;
            result += 10 * Dist.bonus[p->mKingSq[WC]][p->mKingSq[BC]];
            result -= Par.eg_pst[BC][K][p->mKingSq[BC]];
        }
    }

    if (p->mCnt[WC][P] + p->mCnt[WC][N] + p->mCnt[WC][B] + p->mCnt[WC][R] + p->mCnt[WC][Q] == 0) {
        if ((p->mCnt[BC][Q] + p->mCnt[BC][R] > 0) || p->mCnt[BC][B] > 1) {
            result -= 200;
            result -= 10 * Dist.bonus[p->mKingSq[WC]][p->mKingSq[BC]];
            result += Par.eg_pst[BC][K][p->mKingSq[BC]];
        }
    }

    // KBN vs K specialized code

    if (p->mCnt[WC][P] == 0
    &&  p->mCnt[BC][P] == 0
    &&  p->mPhase == 2) {

        if (p->mCnt[WC][B] == 1 && p->mCnt[WC][N] == 1) {  // mate with black bishop and knight
            if (p->Bishops(WC) & bbWhiteSq) result -= 2 * BN_bb[p->mKingSq[BC]];
            if (p->Bishops(WC) & bbBlackSq) result -= 2 * BN_wb[p->mKingSq[BC]];
        }

        if (p->mCnt[BC][B] == 1 && p->mCnt[BC][N] == 1) {  // mate with white bishop and knight
            if (p->Bishops(BC) & bbWhiteSq) result += 2 * BN_bb[p->mKingSq[WC]];
            if (p->Bishops(BC) & bbBlackSq) result += 2 * BN_wb[p->mKingSq[WC]];
        }
    }

    return result;
}
