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

#include "rodent.h"

int *POS::GenerateCaptures(int *list) const {

    U64 bb_pieces, bb_moves;
    int from, to;

    eColor sd = mSide;
    eColor op = ~sd;

    if (sd == WC) {
        bb_moves = ((Pawns(WC) & ~FILE_A_BB & RANK_7_BB) << 7) & mClBb[BC];
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (Q_PROM << 12) | (to << 6) | (to - 7);
            *list++ = (R_PROM << 12) | (to << 6) | (to - 7);
            *list++ = (B_PROM << 12) | (to << 6) | (to - 7);
            *list++ = (N_PROM << 12) | (to << 6) | (to - 7);
        }

        bb_moves = ((Pawns(WC) & ~FILE_H_BB & RANK_7_BB) << 9) & mClBb[BC];
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (Q_PROM << 12) | (to << 6) | (to - 9);
            *list++ = (R_PROM << 12) | (to << 6) | (to - 9);
            *list++ = (B_PROM << 12) | (to << 6) | (to - 9);
            *list++ = (N_PROM << 12) | (to << 6) | (to - 9);
        }

        bb_moves = ((Pawns(WC) & RANK_7_BB) << 8) & UnoccBb();
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (Q_PROM << 12) | (to << 6) | (to - 8);
            *list++ = (R_PROM << 12) | (to << 6) | (to - 8);
            *list++ = (B_PROM << 12) | (to << 6) | (to - 8);
            *list++ = (N_PROM << 12) | (to << 6) | (to - 8);
        }

        bb_moves = ((Pawns(WC) & ~FILE_A_BB & ~RANK_7_BB) << 7) & mClBb[BC];
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | (to - 7);
        }

        bb_moves = ((Pawns(WC) & ~FILE_H_BB & ~RANK_7_BB) << 9) & mClBb[BC];
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | (to - 9);
        }

        if ((to = mEpSq) != NO_SQ) {
            if (((Pawns(WC) & ~FILE_A_BB) << 7) & SqBb(to))
                *list++ = (EP_CAP << 12) | (to << 6) | (to - 7);
            if (((Pawns(WC) & ~FILE_H_BB) << 9) & SqBb(to))
                *list++ = (EP_CAP << 12) | (to << 6) | (to - 9);
        }
    } else {
        bb_moves = ((Pawns(BC) & ~FILE_A_BB & RANK_2_BB) >> 9) & mClBb[WC];
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (Q_PROM << 12) | (to << 6) | (to + 9);
            *list++ = (R_PROM << 12) | (to << 6) | (to + 9);
            *list++ = (B_PROM << 12) | (to << 6) | (to + 9);
            *list++ = (N_PROM << 12) | (to << 6) | (to + 9);
        }

        bb_moves = ((Pawns(BC) & ~FILE_H_BB & RANK_2_BB) >> 7) & mClBb[WC];
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (Q_PROM << 12) | (to << 6) | (to + 7);
            *list++ = (R_PROM << 12) | (to << 6) | (to + 7);
            *list++ = (B_PROM << 12) | (to << 6) | (to + 7);
            *list++ = (N_PROM << 12) | (to << 6) | (to + 7);
        }

        bb_moves = ((Pawns(BC) & RANK_2_BB) >> 8) & UnoccBb();
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (Q_PROM << 12) | (to << 6) | (to + 8);
            *list++ = (R_PROM << 12) | (to << 6) | (to + 8);
            *list++ = (B_PROM << 12) | (to << 6) | (to + 8);
            *list++ = (N_PROM << 12) | (to << 6) | (to + 8);
        }

        bb_moves = ((Pawns(BC) & ~FILE_A_BB & ~RANK_2_BB) >> 9) & mClBb[WC];
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | (to + 9);
        }

        bb_moves = ((Pawns(BC) & ~FILE_H_BB & ~RANK_2_BB) >> 7) & mClBb[WC];
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | (to + 7);
        }

        if ((to = mEpSq) != NO_SQ) {
            if (((Pawns(BC) & ~FILE_A_BB) >> 9) & SqBb(to))
                *list++ = (EP_CAP << 12) | (to << 6) | (to + 9);
            if (((Pawns(BC) & ~FILE_H_BB) >> 7) & SqBb(to))
                *list++ = (EP_CAP << 12) | (to << 6) | (to + 7);
        }
    }

    // KNIGHT

    bb_pieces = Knights(sd);
    while (bb_pieces) {
        from = BB.PopFirstBit(&bb_pieces);
        bb_moves = BB.KnightAttacks(from) & mClBb[~sd];
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | from;
        }
    }

    // BISHOP

    bb_pieces = Bishops(sd);
    while (bb_pieces) {
        from = BB.PopFirstBit(&bb_pieces);
        bb_moves = BB.BishAttacks(OccBb(), from) & mClBb[op];
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | from;
        }
    }

    // ROOK

    bb_pieces = Rooks(sd);
    while (bb_pieces) {
        from = BB.PopFirstBit(&bb_pieces);
        bb_moves = BB.RookAttacks(OccBb(), from) & mClBb[op];
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | from;
        }
    }

    // QUEEN

    bb_pieces = Queens(sd);
    while (bb_pieces) {
        from = BB.PopFirstBit(&bb_pieces);
        bb_moves = BB.QueenAttacks(OccBb(), from) & mClBb[op];
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | from;
        }
    }

    // KING

    bb_moves = BB.KingAttacks(KingSq(sd)) & mClBb[op];
    while (bb_moves) {
        to = BB.PopFirstBit(&bb_moves);
        *list++ = (to << 6) | KingSq(sd);
    }
    return list;
}

int *POS::GenerateQuiet(int *list) const {

    U64 bb_pieces, bb_moves;
	eColor sd;
    int from, to;

    sd = mSide;
    if (sd == WC) {
        if ((mCFlags & W_KS) && !(OccBb() & (U64)0x0000000000000060))
            if (!Attacked(E1, BC) && !Attacked(F1, BC))
                *list++ = (CASTLE << 12) | (G1 << 6) | E1;
        if ((mCFlags & W_QS) && !(OccBb() & (U64)0x000000000000000E))
            if (!Attacked(E1, BC) && !Attacked(D1, BC))
                *list++ = (CASTLE << 12) | (C1 << 6) | E1;

        bb_moves = ((((Pawns(WC) & RANK_2_BB) << 8) & UnoccBb()) << 8) & UnoccBb();
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (EP_SET << 12) | (to << 6) | (to - 16);
        }

        bb_moves = ((Pawns(WC) & ~RANK_7_BB) << 8) & UnoccBb();
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | (to - 8);
        }
    } else {
        if ((mCFlags & B_KS) && !(OccBb() & (U64)0x6000000000000000))
            if (!Attacked(E8, WC) && !Attacked(F8, WC))
                *list++ = (CASTLE << 12) | (G8 << 6) | E8;
        if ((mCFlags & B_QS) && !(OccBb() & (U64)0x0E00000000000000))
            if (!Attacked(E8, WC) && !Attacked(D8, WC))
                *list++ = (CASTLE << 12) | (C8 << 6) | E8;

        bb_moves = ((((Pawns(BC) & RANK_7_BB) >> 8) & UnoccBb()) >> 8) & UnoccBb();
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (EP_SET << 12) | (to << 6) | (to + 16);
        }

        bb_moves = ((Pawns(BC) & ~RANK_2_BB) >> 8) & UnoccBb();
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | (to + 8);
        }
    }

    // KNIGHT

    bb_pieces = Knights(sd);
    while (bb_pieces) {
        from = BB.PopFirstBit(&bb_pieces);
        bb_moves = BB.KnightAttacks(from) & UnoccBb();
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | from;
        }
    }

    // BISHOP

    bb_pieces = Bishops(sd);
    while (bb_pieces) {
        from = BB.PopFirstBit(&bb_pieces);
        bb_moves = BB.BishAttacks(OccBb(), from) & UnoccBb();
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | from;
        }
    }

    // ROOK

    bb_pieces = Rooks(sd);
    while (bb_pieces) {
        from = BB.PopFirstBit(&bb_pieces);
        bb_moves = BB.RookAttacks(OccBb(), from) & UnoccBb();
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | from;
        }
    }

    // QUEEN

    bb_pieces = Queens(sd);
    while (bb_pieces) {
        from = BB.PopFirstBit(&bb_pieces);
        bb_moves = BB.QueenAttacks(OccBb(), from) & UnoccBb();
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | from;
        }
    }

    // KING

    bb_moves = BB.KingAttacks(KingSq(sd)) & UnoccBb();
    while (bb_moves) {
        to = BB.PopFirstBit(&bb_moves);
        *list++ = (to << 6) | KingSq(sd);
    }
    return list;
}

int *POS::GenerateSpecial(int *list) const {

    U64 bb_pieces, bb_moves;
    int from, to;
    eColor sd = mSide;
    eColor op = ~sd;

    // squares from which normal (non-discovered) checks are possible

    int king_sq = KingSq(op);
    U64 n_check = BB.KnightAttacks(king_sq);
    U64 r_check = BB.RookAttacks(OccBb(), king_sq);
    U64 b_check = BB.BishAttacks(OccBb(), king_sq);
    U64 p_check = BB.ShiftFwd(BB.ShiftSideways(SqBb(king_sq)), op);

    // TODO: discovered checks by a pawn

    if (sd == WC) {

        bb_moves = ((((Pawns(WC) & RANK_2_BB) << 8) & UnoccBb()) << 8) & UnoccBb();
        bb_moves = bb_moves & p_check;
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (EP_SET << 12) | (to << 6) | (to - 16);
        }

        bb_moves = ((Pawns(WC) & ~RANK_7_BB) << 8) & UnoccBb();
        bb_moves = bb_moves & p_check;
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | (to - 8);
        }
    } else {
        bb_moves = ((((Pawns(BC) & RANK_7_BB) >> 8) & UnoccBb()) >> 8) & UnoccBb();
        bb_moves = bb_moves & p_check;
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (EP_SET << 12) | (to << 6) | (to + 16);
        }

        bb_moves = ((Pawns(BC) & ~RANK_2_BB) >> 8) & UnoccBb();
        bb_moves = bb_moves & p_check;
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | (to + 8);
        }
    }

    // KNIGHT

    bb_pieces = Knights(sd);
    while (bb_pieces) {
        from = BB.PopFirstBit(&bb_pieces);

        // are discovered checks possible?

        U64 bb_checkers = Queens(sd) | Rooks(sd) | Bishops(sd);
        bool knight_discovers = CanDiscoverCheck(bb_checkers, op, from);

        bb_moves = BB.KnightAttacks(from) & UnoccBb();
        if (!knight_discovers) bb_moves = bb_moves & n_check;
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | from;
        }
    }

    // BISHOP

    bb_pieces = Bishops(sd);
    while (bb_pieces) {
        from = BB.PopFirstBit(&bb_pieces);

        // are straight discovered checks possible?

        bool bish_discovers = CanDiscoverCheck(StraightMovers(sd), op, from);

        bb_moves = BB.BishAttacks(OccBb(), from) & UnoccBb();
        if (!bish_discovers) bb_moves = bb_moves & b_check;
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | from;
        }
    }

    // ROOK

    bb_pieces = Rooks(sd);
    while (bb_pieces) {
        from = BB.PopFirstBit(&bb_pieces);

        // are diagonal discovered checks possible?

        bool rook_discovers = CanDiscoverCheck(DiagMovers(sd), op, from);

        bb_moves = BB.RookAttacks(OccBb(), from) & UnoccBb();
        if (!rook_discovers) bb_moves = bb_moves & r_check;
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | from;
        }
    }

    // QUEEN

    bb_pieces = Queens(sd);
    while (bb_pieces) {
        from = BB.PopFirstBit(&bb_pieces);
        bb_moves = BB.QueenAttacks(OccBb(), from) & UnoccBb();
        bb_moves = bb_moves & (r_check | b_check);
        while (bb_moves) {
            to = BB.PopFirstBit(&bb_moves);
            *list++ = (to << 6) | from;
        }
    }

    /*

    // TODO: discovered checks by a king

    moves = k_attacks[KingSq(sd)] & UnoccBb();
    while (moves) {
      to = BB.PopFirstBit(&moves);
      *list++ = (to << 6) | KingSq(sd);
    }
    */
    return list;
}

bool POS::CanDiscoverCheck(U64 bb_checkers, eColor op, int from) const {

    while (bb_checkers) {
        int checker = BB.PopFirstBit(&bb_checkers);
        U64 bb_ray = BB.bbBetween[checker][mKingSq[op]];

        if (SqBb(from) & bb_ray) {
            if (BB.PopCnt(bb_ray & OccBb()) == 1)
                return true;
        }
    }

    return false;
}
