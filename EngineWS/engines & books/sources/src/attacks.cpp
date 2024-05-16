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

U64 POS::AttacksFrom(int sq) const {

    switch (TpOnSq(sq)) {
        case P:
            return BB.PawnAttacks((eColor)Cl(mPc[sq]), sq);
        case N:
            return BB.KnightAttacks(sq);
        case B:
            return BB.BishAttacks(OccBb(), sq);
        case R:
            return BB.RookAttacks(OccBb(), sq);
        case Q:
            return BB.QueenAttacks(OccBb(), sq);
        case K:
            return BB.KingAttacks(sq);
    }
    return 0;
}

U64 POS::AttacksTo(int sq) const {

    return (Pawns(WC) & BB.PawnAttacks(BC, sq)) |
           (Pawns(BC) & BB.PawnAttacks(WC, sq)) |
           (mTpBb[N] & BB.KnightAttacks(sq)) |
           ((mTpBb[B] | mTpBb[Q]) & BB.BishAttacks(OccBb(), sq)) |
           ((mTpBb[R] | mTpBb[Q]) & BB.RookAttacks(OccBb(), sq)) |
           (mTpBb[K] & BB.KingAttacks(sq));
}

bool POS::Attacked(int sq, eColor sd) const {

    return (Pawns(sd) & BB.PawnAttacks(~sd, sq)) ||
           (Knights(sd) & BB.KnightAttacks(sq)) ||
           (DiagMovers(sd) & BB.BishAttacks(OccBb(), sq)) ||
           (StraightMovers(sd)) & BB.RookAttacks(OccBb(), sq) ||
           (Kings(sd) & BB.KingAttacks(sq));
}
